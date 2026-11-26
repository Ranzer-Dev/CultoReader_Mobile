import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition/build/ExpoSpeechRecognitionModule';
import { SmartPunctuation } from '../../utils/smartPunctuation';
import { sanitizeSpeechChunk } from '../../utils/speechSanitizer';
import { TTSService } from './TTSService';

export interface TranscriptionListener {
  onTextUpdate: (fullText: string, latestChunk: string, isFinal: boolean) => void;
  onStatusChange: (isListening: boolean) => void;
  onError: (error: string) => void;
  onDebugStatus?: (status: string) => void;
}

/**
 * Serviço de Transcrição Contínua de Voz para Cultos de Longa Duração (1 a 4 horas).
 * Gerencia ciclo de vida do microfone, reconexão automática, fallback nativo Android
 * e acumulação estável de texto com limpeza fonética e pontuação offline.
 */
export class TranscriptionService {
  private static shouldBeListening = false;
  private static isNativeActive = false;
  private static isStarting = false;
  private static restartTimer: any = null;
  private static consecutiveErrorCount = 0;
  private static consecutiveSilentCycles = 0;
  private static useContinuousNative = true;

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
        this.notifyDebugStatus(`🎙️ Microfone ativo (${this.speechLocale}) — pode falar`);
      });

      const subSpeechStart = ExpoSpeechRecognitionModule.addListener('speechstart', () => {
        this.consecutiveSilentCycles = 0;
        if (this.shouldBeListening) {
          this.notifyDebugStatus(`🗣️ Ouvindo voz (${this.speechLocale})...`);
        }
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
        if (!rawFallback) return;

        // Recebeu áudio válido: zera contadores de erro e silêncio
        this.consecutiveErrorCount = 0;
        this.consecutiveSilentCycles = 0;

        let transcriptChunk = rawFallback;
        try {
          transcriptChunk = sanitizeSpeechChunk(rawFallback, this.speechLocale) || rawFallback;
        } catch {
          transcriptChunk = rawFallback;
        }

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

        const errCode = event?.error || 'unknown';
        const errMsg = event?.message || '';

        if (errCode === 'not-allowed' || errCode === 'service-not-allowed') {
          this.shouldBeListening = false;
          this.notifyStatus(false);
          const msg = 'Permissão de microfone ou serviço de voz bloqueado no Android.';
          this.notifyDebugStatus(`⚠️ ${msg}`);
          this.notifyError(msg);
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

        // Se ocorrer falha técnica repetida (ex: pipe de áudio continuous no Android 13+ falhando),
        // alterna automaticamente para modo compatível (continuous: false) mantendo o loop contínuo via JS!
        const isTechnicalError =
          errCode === 'audio-capture' ||
          errCode === 'client' ||
          errCode === 'busy' ||
          errCode === 'unknown' ||
          errCode === 'network' ||
          errCode === 'language-not-supported';

        if (isTechnicalError) {
          this.consecutiveErrorCount += 1;
          if (this.consecutiveErrorCount >= 2 && this.useContinuousNative) {
            this.useContinuousNative = false;
            this.notifyDebugStatus(`🔄 Alternando microfone para modo compatível (${errCode})...`);
          } else {
            this.notifyDebugStatus(`⚠️ Mic (${errCode})${errMsg ? `: ${errMsg}` : ''} — reconectando...`);
          }
        } else if (errCode === 'no-speech' || errCode === 'speech-timeout') {
          this.consecutiveSilentCycles += 1;
          if (this.consecutiveSilentCycles >= 2 && this.useContinuousNative) {
            this.useContinuousNative = false;
            this.consecutiveSilentCycles = 0;
            this.notifyDebugStatus(`🔄 Sem áudio no modo contínuo — alternando para modo compatível...`);
          } else {
            this.notifyDebugStatus(`🎙️ Aguardando fala (${this.speechLocale})...`);
          }
        }

        // Se o usuário quer continuar gravando, reconecta suavemente
        if (this.shouldBeListening) {
          this.notifyStatus(true);
          const delay = isTechnicalError ? 400 : 150;
          this.scheduleRestart(delay);
        } else {
          this.notifyStatus(false);
        }
      });

      this.subscriptions.push(subStart, subSpeechStart, subSpeechEnd, subEnd, subResult, subError);
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

  private static safePunctuate(text: string): string {
    try {
      return SmartPunctuation.punctuateUtterance(text, this.speechLocale) || text;
    } catch {
      return text;
    }
  }

  private static commitText(chunk: string): string | null {
    const rawTrimmed = (chunk || '').trim();
    if (!rawTrimmed) return null;

    let clean = rawTrimmed;
    try {
      clean = sanitizeSpeechChunk(rawTrimmed, this.speechLocale) || rawTrimmed;
    } catch {
      clean = rawTrimmed;
    }
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
      const punctuated = this.safePunctuate(clean);
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
      const punctuatedMerged = this.safePunctuate(merged);
      this.confirmedSegments[lastIdx] = punctuatedMerged;
      this.lastCommittedChunk = clean;
      return punctuatedMerged;
    }

    // Caso não haja sobreposição com o último segmento, adiciona como nova frase pontuada
    const punctuatedNew = this.safePunctuate(clean);
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
      // Parâmetros nativos idênticos aos testados e comprovados em todas as versões do Android
      // com fallback automático para continuous: false caso o pipe de áudio do Android 13+ falhe.
      await ExpoSpeechRecognitionModule.start({
        lang: this.speechLocale || 'pt-BR',
        interimResults: true,
        continuous: this.useContinuousNative,
        maxAlternatives: 1,
        addsPunctuation: true
      });
      this.isNativeActive = true;
    } catch (err: any) {
      this.isNativeActive = false;
      this.notifyDebugStatus(`⚠️ Falha ao abrir microfone: ${err?.message || 'erro desconhecido'}`);
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

    // Limpa qualquer estado anterior preso e encerra eventual TTS para liberar foco de áudio do microfone
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    this.isNativeActive = false;
    this.isStarting = false;
    this.consecutiveErrorCount = 0;
    this.consecutiveSilentCycles = 0;
    this.useContinuousNative = true;
    await TTSService.stop().catch(() => {});

    if (initialText && initialText.trim()) {
      if (this.confirmedSegments.length === 0) {
        this.confirmedSegments = [initialText.trim()];
      }
    }
    this.currentPartial = '';
    this.shouldBeListening = true;
    this.notifyStatus(true);
    this.notifyDebugStatus('🎙️ Iniciando microfone...');

    try {
      const perms = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perms.granted) {
        this.shouldBeListening = false;
        this.notifyStatus(false);
        const msg = 'Permissão para uso do microfone não foi concedida. Ative nas configurações do celular.';
        this.notifyDebugStatus(`⚠️ ${msg}`);
        this.notifyError(msg);
        return;
      }

      try {
        if (typeof ExpoSpeechRecognitionModule.isRecognitionAvailable === 'function') {
          const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();
          if (!available) {
            this.shouldBeListening = false;
            this.notifyStatus(false);
            const msg = 'Serviço de reconhecimento de voz do Android indisponível neste aparelho.';
            this.notifyDebugStatus(`⚠️ ${msg}`);
            this.notifyError(msg);
            return;
          }
        }
      } catch {}

      await this.startNativeRecognition();
    } catch (err: any) {
      const msg = err?.message || 'Não foi possível iniciar o microfone no celular.';
      this.notifyDebugStatus(`⚠️ ${msg}`);
      this.notifyError(msg);
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
      if (committed) {
        // Mescla visualmente contra o final já consolidado para evitar repetição temporária
        // quando speechend consolida uma frase incompleta e o Android estende a mesma oração
        const committedWithoutEndPunct = committed.replace(/[.!?]+$/, '').trim();
        const merged = this.mergeOverlapping(committedWithoutEndPunct, partial);
        if (merged !== `${committedWithoutEndPunct} ${partial}`) {
          return merged;
        }
      }
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

  private static notifyDebugStatus(status: string): void {
    this.listeners.forEach(l => l.onDebugStatus?.(status));
  }
}
