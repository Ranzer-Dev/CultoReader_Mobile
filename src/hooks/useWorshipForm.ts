import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { WorshipRepository } from '../database/repositories/WorshipRepository';

interface UseWorshipFormProps {
  id?: string;
  onSuccess: () => void;
}

export function useWorshipForm({ id, onSuccess }: UseWorshipFormProps) {
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
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
    if (id) {
      setLoading(true);
      WorshipRepository.findById(Number(id))
        .then((item) => {
          if (item) {
            setTitle(item.title);
            setPreacher(item.preacher);
            setServiceDate(item.service_date);
            setSummary(item.summary || '');
            setFullTranscript(item.full_transcript || '');
            setTags(item.tags || '');
          } else {
            Alert.alert('Erro', 'Registro não encontrado.');
            onSuccess();
          }
        })
        .catch((err) => {
          Alert.alert('Erro', 'Falha ao carregar dados do culto: ' + err.message);
          onSuccess();
        })
        .finally(() => setLoading(false));
    }
  }, [id, onSuccess]);

  const appendTranscriptChunk = useCallback((chunk: string) => {
    if (!chunk.trim()) return;
    setFullTranscript((prev) => (prev ? `${prev.trim()} ${chunk.trim()}` : chunk.trim()));
  }, []);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Campo Obrigatório', 'Por favor, informe o tema/título do culto.');
      return;
    }
    if (!preacher.trim()) {
      Alert.alert('Campo Obrigatório', 'Por favor, informe o nome do pastor/preletor.');
      return;
    }
    if (!serviceDate.trim()) {
      Alert.alert('Campo Obrigatório', 'Por favor, informe a data do culto (AAAA-MM-DD).');
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
        Alert.alert('Sucesso', 'Culto atualizado com sucesso!');
      } else {
        await WorshipRepository.create({
          title,
          preacher,
          service_date: serviceDate,
          summary,
          full_transcript: fullTranscript,
          tags
        });
        Alert.alert('Sucesso', 'Novo culto cadastrado com sucesso!');
      }
      onSuccess();
    } catch (err: any) {
      Alert.alert('Erro ao Salvar', err.message);
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
