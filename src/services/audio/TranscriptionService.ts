import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition/build/ExpoSpeechRecognitionModule';
import { SmartPunctuation } from '../../utils/smartPunctuation';
import { sanitizeSpeechChunk, selectBestTranscript } from '../../utils/speechSanitizer';

export interface TranscriptionListener {
  onTextUpdate: (fullText: string, latestChunk: string, isFinal: boolean) => void;
  onStatusChange: (isListening: boolean) => void;
  onError: (error: string) => void;
}

/**
 * Serviço de Transcrição Contínua de Voz para Cultos de Longa Duração (1 a 4 horas).
 * Gerencia ciclo de vida do microfone, reconexão automática e acumulação estável de texto
 * com fusão inteligente de sobreposição para eliminar repetições de versículos e frases.
 */
export class TranscriptionService {
  private static shouldBeListening = false;
  private static isNativeActive = false;
  private static isStarting = false;
  private static restartTimer: any = null;

  // Histórico consolidado em lista imutável de segmentos (nunca é apagado por pausas ou erros)
  private static confirmedSegments: string[] = [];
  // Trecho parcial em streaming da oração que está sendo falada neste instante
  private static currentPartial = '';
  // Última frase comitada (para proteção estrita contra repetições em pausas)
  private static lastCommittedChunk = '';

  private static listeners: TranscriptionListener[] = [];
  private static subscriptions: { remove: () => void }[] = [];
  private static initialized = false;
  private static speechLocale: string = 'pt-BR';

  static async setLocale(locale: string): Promise<void> {
    if (!locale || !locale.trim()) return;
    const clean = locale.trim();
    if (this.speechLocale === clean) return;

    this.speechLocale = clean;

    // Se estiver gravando no momento, reinicia suavemente no novo idioma
    if (this.shouldBeListening && this.isNativeActive) {
      try {
        await ExpoSpeechRecognitionModule.stop();
      } catch {}
      this.scheduleRestart(150);
    }
  }

  static getLocale(): string {
    return this.speechLocale;
  }

  private static setupEvents() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const subStart = ExpoSpeechRecognitionModule.addListener('start', () => {
        if (!this.shouldBeListening) {
          // Se o Android emitiu start sem o usuário ter pedido, encerra imediatamente!
          try {
            ExpoSpeechRecognitionModule.stop();
          } catch {}
          this.isNativeActive = false;
          this.isStarting = false;
          this.notifyStatus(false);
          return;
        }
        this.isNativeActive = true;
        this.isStarting = false;
        this.notifyStatus(true);
      });

      // speechend: pausa física na voz do pregador.
      // Consolida imediatamente o trecho falado no histórico imutável com pontuação automática.
      const subSpeechEnd = ExpoSpeechRecognitionModule.addListener('speechend', () => {
        if (this.currentPartial.trim()) {
          const chunk = this.currentPartial.trim();
          this.currentPartial = '';
          const committed = this.commitText(chunk);
          if (committed) {
            this.notifyText(this.getFullTranscript(), committed, true);
          }
        }
      });

      const subEnd = ExpoSpeechRecognitionModule.addListener('end', () => {
        this.isNativeActive = false;
        this.isStarting = false;

        // Se o microfone deveria estar desligado, garante notificação e aborta
        if (!this.shouldBeListening) {
          this.notifyStatus(false);
          return;
        }

        // Mantém status de gravação visualmente ativo na interface enquanto o loop reinicia
        this.notifyStatus(true);

        // Se a sessão encerrou sem ter emitido isFinal, consolida imediatamente no histórico
        if (this.currentPartial.trim()) {
          const chunk = this.currentPartial.trim();
          this.currentPartial = '';
          const committed = this.commitText(chunk);
          if (committed) {
            this.notifyText(this.getFullTranscript(), committed, true);
          }
        }

        // Reconexão contínua estável (150ms) para dar tempo ao teardown nativo sem perder falas
        this.scheduleRestart(150);
      });

      const subResult = ExpoSpeechRecognitionModule.addListener('result', (event) => {
        if (!this.shouldBeListening) {
          try {
            ExpoSpeechRecognitionModule.stop();
          } catch {}
          return;
        }

        const rawFallback = event.results?.[0]?.transcript?.trim() || '';
        let transcriptChunk = rawFallback;
        try {
          transcriptChunk = selectBestTranscript(event.results, this.speechLocale) || rawFallback;
        } catch {
          transcriptChunk = rawFallback;
        }
        if (!transcriptChunk) return;

        if (event.isFinal) {
          // Sentença finalizada pelo Android: consolida com pontuação natural apenas se for conteúdo novo
          const committed = this.commitText(transcriptChunk);
          this.currentPartial = '';
          if (committed) {
            this.notifyText(this.getFullTranscript(), committed, true);
          } else {
            this.notifyText(this.getFullTranscript(), '', false);
          }
        } else {
          // Streaming parcial em tempo real: exibe já higienizado enquanto o pregador está falando
          this.currentPartial = transcriptChunk;
          this.notifyText(this.getFullTranscript(), transcriptChunk, false);
        }
      });

      const subError = ExpoSpeechRecognitionModule.addListener('error', (event) => {
        // Libera flags nativas para evitar deadlocks de reconexão
        this.isNativeActive = false;
        this.isStarting = false;

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.shouldBeListening = false;
          this.notifyStatus(false);
          this.notifyError('Permissão para uso do microfone não foi concedida.');
          return;
        }

        // CRÍTICO: Em pausas, silêncios (speech-timeout, no-speech) ou reprodução de áudio/alto-falante,
        // NUNCA descarta o que já foi falado! Consolida imediatamente no histórico imutável!
        if (this.currentPartial.trim()) {
          const chunk = this.currentPartial.trim();
          this.currentPartial = '';
          const committed = this.commitText(chunk);
          if (committed) {
            this.notifyText(this.getFullTranscript(), committed, true);
          }
        }

        // Se o usuário quer continuar gravando, reconecta suavemente
        if (this.shouldBeListening) {
          this.notifyStatus(true);
          const delay = event.error === 'audio-capture' || event.error === 'client' || event.error === 'busy' ? 350 : 150;
          this.scheduleRestart(delay);
        } else {
          this.notifyStatus(false);
        }
      });

      this.subscriptions.push(subStart, subSpeechEnd, subEnd, subResult, subError);
    } catch (e: any) {
      console.warn('Erro ao registrar listeners de fala:', e);
    }
  }

  /**
   * Força a interrupção completa e reset do microfone (usado na montagem inicial ou desmontagem da tela).
   */
  static async ensureStopped(): Promise<void> {
    this.shouldBeListening = false;
    this.isNativeActive = false;
    this.isStarting = false;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    try {
      await ExpoSpeechRecognitionModule.stop();
    } catch {}
    this.notifyStatus(false);
  }

  /**
   * Realiza fusão inteligente de sobreposição de palavras entre o histórico acumulado
   * e a nova frase entregue pelo reconhecedor de voz. Elimina repetições de versículos e gagueiras.
   */
  public static mergeOverlapping(base: string, incoming: string): string {
    const cleanBase = (base || '').trim();
    const cleanInc = (incoming || '').trim();
    if (!cleanBase) return cleanInc;
    if (!cleanInc) return cleanBase;

    const normalizeWord = (w: string) => w.toLowerCase().replace(/[^a-z0-9áàâãéèêíïóôõöúçñ]/gi, '');

    const baseWords = cleanBase.split(/\s+/);
    const incWords = cleanInc.split(/\s+/);

    // 1. Procura sobreposição padrão: o final de baseWords é o início de incWords
    const maxCheck = Math.min(baseWords.length, incWords.length, 35);
    for (let len = maxCheck; len >= 1; len--) {
      const baseTail = baseWords.slice(baseWords.length - len).map(normalizeWord).join(' ');
      const incHead = incWords.slice(0, len).map(normalizeWord).join(' ');

      if (baseTail && baseTail === incHead) {
        const nonOverlapping = incWords.slice(len).join(' ');
        return nonOverlapping ? `${cleanBase} ${nonOverlapping}` : cleanBase;
      }
    }

    // 2. Procura sobreposição interna: incWords contém um trecho que já está no final de baseWords
    const incNormList = incWords.map(normalizeWord);
    for (let len = Math.min(baseWords.length, 25); len >= 2; len--) {
      const baseTail = baseWords.slice(baseWords.length - len).map(normalizeWord).join(' ');
      const incStr = incNormList.join(' ');
      const matchIdx = incStr.indexOf(baseTail);
      if (matchIdx !== -1) {
        const wordsBefore = incStr.substring(0, matchIdx).trim().split(/\s+/).filter(Boolean).length;
        const matchedWordCount = baseTail.split(/\s+/).length;
        const nonOverlappingAfter = incWords.slice(wordsBefore + matchedWordCount).join(' ');
        return nonOverlappingAfter ? `${cleanBase} ${nonOverlappingAfter}` : cleanBase;
      }
    }

    // 3. Se inc já está totalmente contido no final de base
    const fullIncNorm = incWords.map(normalizeWord).join(' ');
    const tailNorm = baseWords.slice(Math.max(0, baseWords.length - incWords.length - 5)).map(normalizeWord).join(' ');
    if (tailNorm.includes(fullIncNorm)) {
      return cleanBase;
    }

    return `${cleanBase} ${cleanInc}`;
  }

  private static commitText(chunk: string): string | null {
    const clean = sanitizeSpeechChunk(chunk, this.speechLocale);
    if (!clean) return null;

    // Normalização sem pontuação e minúsculas
    const normalize = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9áàâãéèêíïóôõöúçñ]/gi, ' ').trim().replace(/\s+/g, ' ');
    const normChunk = normalize(clean);
    if (!normChunk) return null;

    // Se a frase for idêntica à última frase consolidada, ignora (evita loops de repetição em pausas)
    if (this.lastCommittedChunk && normChunk === normalize(this.lastCommittedChunk)) {
      return null;
    }

    if (this.confirmedSegments.length === 0) {
      const punctuated = SmartPunctuation.punctuateUtterance(clean, this.speechLocale);
      this.confirmedSegments.push(punctuated);
      this.lastCommittedChunk = clean;
      return punctuated;
    }

    const lastIdx = this.confirmedSegments.length - 1;
    const lastSegment = this.confirmedSegments[lastIdx];

    // Remove o ponto final provisório do último segmento antes de testar sobreposição
    // para nunca deixar um ponto perdido no meio da frase quando o Android estende a mesma fala
    const lastWithoutEndPunct = lastSegment.replace(/[.!?]+$/, '').trim();
    const merged = this.mergeOverlapping(lastWithoutEndPunct, clean);

    if (merged === lastWithoutEndPunct) {
      // Já estava contido no final do último segmento
      return null;
    }

    if (merged !== `${lastWithoutEndPunct} ${clean}`) {
      // Houve sobreposição e fusão bem-sucedida: repontua o segmento mesclado limpo
      const punctuatedMerged = SmartPunctuation.punctuateUtterance(merged, this.speechLocale);
      this.confirmedSegments[lastIdx] = punctuatedMerged;
      this.lastCommittedChunk = clean;
      return punctuatedMerged;
    }

    // Caso não haja sobreposição com o último segmento, adiciona como nova frase pontuada
    const punctuatedNew = SmartPunctuation.punctuateUtterance(clean, this.speechLocale);
    this.confirmedSegments.push(punctuatedNew);
    this.lastCommittedChunk = clean;
    return punctuatedNew;
  }

  private static scheduleRestart(delayMs: number): void {
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    if (!this.shouldBeListening) return;

    this.restartTimer = setTimeout(async () => {
      this.restartTimer = null;
      if (this.shouldBeListening) {
        if (this.isNativeActive) {
          try {
            await ExpoSpeechRecognitionModule.stop();
          } catch {}
          this.isNativeActive = false;
        }
        await this.startNativeRecognition();
      }
    }, delayMs);
  }

  private static async startNativeRecognition(): Promise<void> {
    if (this.isStarting || this.isNativeActive) return;
    this.isStarting = true;

    try {
      // NÃO passar androidIntentOptions com extras de API 33+ (ex: EXTRA_ENABLE_FORMATTING,
      // EXTRA_MASK_OFFENSIVE_WORDS) ou EXTRA_SPEECH_INPUT_* pois conflitam com continuous: true
      // e lançam NoSuchFieldException via reflection no ExpoSpeechService.kt em Android <= 12.
      await ExpoSpeechRecognitionModule.start({
        lang: this.speechLocale || 'pt-BR',
        interimResults: true,
        continuous: true,
        maxAlternatives: 5,
        addsPunctuation: true
      });
      this.isNativeActive = true;
    } catch (err) {
      this.isNativeActive = false;
      if (this.shouldBeListening) {
        this.scheduleRestart(400);
      }
    } finally {
      this.isStarting = false;
    }
  }

  static subscribe(listener: TranscriptionListener): () => void {
    this.setupEvents();
    this.listeners.push(listener);
    listener.onStatusChange(this.shouldBeListening);
    const current = this.getFullTranscript();
    if (current) {
      listener.onTextUpdate(current, '', true);
    }

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  static async start(initialText: string = ''): Promise<void> {
    this.setupEvents();

    if (initialText && initialText.trim()) {
      if (this.confirmedSegments.length === 0) {
        this.confirmedSegments = [initialText.trim()];
      }
    }
    this.currentPartial = '';
    this.shouldBeListening = true;
    this.notifyStatus(true);

    try {
      const perms = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perms.granted) {
        this.shouldBeListening = false;
        this.notifyStatus(false);
        this.notifyError('Permissão para uso do microfone não foi concedida. Ative nas configurações do celular.');
        return;
      }

      await this.startNativeRecognition();
    } catch (err: any) {
      this.notifyError(err?.message || 'Não foi possível iniciar o microfone no celular.');
      this.shouldBeListening = false;
      this.isNativeActive = false;
      this.notifyStatus(false);
    }
  }

  static async stop(): Promise<string> {
    this.shouldBeListening = false;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    try {
      if (this.currentPartial.trim()) {
        this.commitText(this.currentPartial.trim());
        this.currentPartial = '';
      }
      await ExpoSpeechRecognitionModule.stop();
    } catch (e: any) {
      console.warn('Erro ao interromper microfone:', e);
    } finally {
      this.isNativeActive = false;
      this.isStarting = false;
      this.notifyStatus(false);
    }
    return this.getFullTranscript();
  }

  static appendChunk(chunk: string): void {
    if (!chunk.trim()) return;
    const committed = this.commitText(chunk.trim());
    const full = this.getFullTranscript();
    this.notifyText(full, committed || chunk.trim(), true);
  }

  static setTranscript(text: string): void {
    const clean = (text || '').trim();
    if (!clean) return;
    this.confirmedSegments = [clean];
    this.currentPartial = '';
    this.notifyText(clean, '', true);
  }

  static clear(): void {
    this.confirmedSegments = [];
    this.currentPartial = '';
    this.lastCommittedChunk = '';
    this.notifyText('', '', true);
  }

  static getFullTranscript(): string {
    const committed = this.confirmedSegments.join(' ');
    const partial = this.currentPartial.trim();
    if (partial) {
      const startsNewSentence = !committed || /[.!?]$/.test(committed);
      const displayPartial = startsNewSentence
        ? partial.charAt(0).toUpperCase() + partial.slice(1)
        : partial;
      return committed ? `${committed} ${displayPartial}` : displayPartial;
    }
    return committed;
  }

  static getIsListening(): boolean {
    return this.shouldBeListening;
  }

  private static notifyStatus(status: boolean): void {
    this.listeners.forEach(l => l.onStatusChange(status));
  }

  private static notifyText(fullText: string, latestChunk: string, isFinal: boolean = true): void {
    this.listeners.forEach(l => l.onTextUpdate(fullText, latestChunk, isFinal));
  }

  private static notifyError(error: string): void {
    this.listeners.forEach(l => l.onError(error));
  }
}
