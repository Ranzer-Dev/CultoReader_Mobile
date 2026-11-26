import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition/build/ExpoSpeechRecognitionModule';
import { SmartPunctuation } from '../utils/smartPunctuation';
import { selectBestTranscript } from '../utils/speechSanitizer';

interface UseVoiceDictationProps {
  onTextAppend: (chunk: string) => void;
  lang?: string;
}

export function useVoiceDictation({ onTextAppend, lang = 'pt-BR' }: UseVoiceDictationProps) {
  const [isDictating, setIsDictating] = useState(false);
  const onTextAppendRef = useRef(onTextAppend);
  onTextAppendRef.current = onTextAppend;
  const langRef = useRef(lang);
  langRef.current = lang;

  useEffect(() => {
    const subResult = ExpoSpeechRecognitionModule.addListener('result', (event) => {
      const rawFallback = event.results?.[0]?.transcript?.trim() || '';
      let chunk = rawFallback;
      try {
        chunk = selectBestTranscript(event.results, langRef.current) || rawFallback;
      } catch {
        chunk = rawFallback;
      }
      if (chunk && event.isFinal) {
        const punctuated = SmartPunctuation.punctuateUtterance(chunk, langRef.current);
        if (punctuated) {
          onTextAppendRef.current(punctuated);
        }
      }
    });

    const subEnd = ExpoSpeechRecognitionModule.addListener('end', () => {
      setIsDictating(false);
    });

    const subError = ExpoSpeechRecognitionModule.addListener('error', () => {
      setIsDictating(false);
    });

    return () => {
      subResult.remove();
      subEnd.remove();
      subError.remove();
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {}
    };
  }, []);

  const toggleDictation = useCallback(async () => {
    if (isDictating) {
      await ExpoSpeechRecognitionModule.stop();
      setIsDictating(false);
    } else {
      try {
        const perms = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!perms.granted) {
          Alert.alert('Permissão', 'Permita o acesso ao microfone nas configurações para usar o ditado por voz.');
          return;
        }
        setIsDictating(true);
        const activeLocale = langRef.current || 'pt-BR';
        await ExpoSpeechRecognitionModule.start({
          lang: activeLocale,
          interimResults: true,
          continuous: true,
          maxAlternatives: 5,
          addsPunctuation: true
        });
      } catch (err: any) {
        Alert.alert('Erro ao iniciar microfone', err?.message || 'Falha ao ativar ditado.');
        setIsDictating(false);
      }
    }
  }, [isDictating]);

  return {
    isDictating,
    toggleDictation
  };
}
