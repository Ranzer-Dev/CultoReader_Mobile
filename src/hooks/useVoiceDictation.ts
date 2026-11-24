import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition/build/ExpoSpeechRecognitionModule';

interface UseVoiceDictationProps {
  onTextAppend: (chunk: string) => void;
  lang?: string;
}

export function useVoiceDictation({ onTextAppend, lang = 'pt-BR' }: UseVoiceDictationProps) {
  const [isDictating, setIsDictating] = useState(false);

  useEffect(() => {
    const subResult = ExpoSpeechRecognitionModule.addListener('result', (event) => {
      const chunk = event.results?.[0]?.transcript || '';
      if (chunk.trim() && event.isFinal) {
        onTextAppend(chunk.trim());
      }
    });

    const subEnd = ExpoSpeechRecognitionModule.addListener('end', () => {
      setIsDictating(false);
    });

    const subError = () => {
      setIsDictating(false);
    };
    ExpoSpeechRecognitionModule.addListener('error', subError);

    return () => {
      subResult.remove();
      subEnd.remove();
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {}
    };
  }, [onTextAppend]);

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
        await ExpoSpeechRecognitionModule.start({
          lang,
          interimResults: true,
          continuous: true,
          addsPunctuation: true
        });
      } catch (err: any) {
        Alert.alert('Erro ao iniciar microfone', err?.message || 'Falha ao ativar ditado.');
        setIsDictating(false);
      }
    }
  }, [isDictating, lang]);

  return {
    isDictating,
    toggleDictation
  };
}
