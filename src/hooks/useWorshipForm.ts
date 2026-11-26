import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { WorshipRepository } from '../database/repositories/WorshipRepository';
import { useLanguage } from '../i18n';

interface UseWorshipFormProps {
  id?: string;
  onSuccess: () => void;
}

export function useWorshipForm({ id, onSuccess }: UseWorshipFormProps) {
  const { t } = useLanguage();
  const isEditing = Boolean(id);

  // Mantém referência estável para callbacks e textos sem disparar re-execução infinita do useEffect
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const errorTitleRef = useRef(t.common.error);
  errorTitleRef.current = t.common.error;

  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [preacher, setPreacher] = useState('');
  const [serviceDate, setServiceDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [summary, setSummary] = useState('');
  const [fullTranscript, setFullTranscript] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    WorshipRepository.findById(Number(id))
      .then((item) => {
        if (cancelled) return;
        if (item) {
          setTitle(item.title);
          setPreacher(item.preacher);
          setServiceDate(item.service_date);
          setSummary(item.summary || '');
          setFullTranscript(item.full_transcript || '');
          setTags(item.tags || '');
        } else {
          Alert.alert(errorTitleRef.current, 'Registro não encontrado.');
          onSuccessRef.current();
        }
      })
      .catch((err) => {
        if (cancelled) return;
        Alert.alert(errorTitleRef.current, 'Falha ao carregar dados do culto: ' + (err?.message || ''));
        onSuccessRef.current();
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const appendTranscriptChunk = useCallback((chunk: string) => {
    if (!chunk.trim()) return;
    setFullTranscript((prev) => (prev ? `${prev.trim()} ${chunk.trim()}` : chunk.trim()));
  }, []);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t.worship.requiredField, t.worship.title);
      return;
    }
    if (!preacher.trim()) {
      Alert.alert(t.worship.requiredField, t.worship.preacher);
      return;
    }
    if (!serviceDate.trim()) {
      Alert.alert(t.worship.requiredField, t.worship.date);
      return;
    }

    setSaving(true);
    try {
      if (isEditing && id) {
        await WorshipRepository.update(Number(id), {
          title,
          preacher,
          service_date: serviceDate,
          summary,
          full_transcript: fullTranscript,
          tags
        });
        Alert.alert(t.common.success, t.worship.updatedSuccess);
      } else {
        await WorshipRepository.create({
          title,
          preacher,
          service_date: serviceDate,
          summary,
          full_transcript: fullTranscript,
          tags
        });
        Alert.alert(t.common.success, t.worship.createdSuccess);
      }
      onSuccess();
    } catch (err: any) {
      Alert.alert(t.common.error, err.message);
    } finally {
      setSaving(false);
    }
  };

  return {
    isEditing,
    loading,
    saving,
    title,
    setTitle,
    preacher,
    setPreacher,
    serviceDate,
    setServiceDate,
    summary,
    setSummary,
    fullTranscript,
    setFullTranscript,
    tags,
    setTags,
    appendTranscriptChunk,
    handleSave
  };
}
