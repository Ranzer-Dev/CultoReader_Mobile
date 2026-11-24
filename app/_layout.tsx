import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from '../src/i18n';
import { AccessibilityProvider } from '../src/context/AccessibilityContext';
import { initDatabase } from '../src/database';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    async function prepare() {
      try {
        await initDatabase();
        setDbReady(true);
      } catch (err: any) {
        console.error('Erro ao inicializar SQLite:', err);
        setDbError(err?.message || 'Falha ao conectar com o banco de dados local.');
      }
    }
    prepare();
  }, []);

  if (dbError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Erro no Banco de Dados SQLite</Text>
        <Text style={styles.errorDetails}>{dbError}</Text>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Carregando Culto Reader & SQLite...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AccessibilityProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="worship/form"
              options={{
                presentation: 'modal',
                headerShown: false
              }}
            />
          </Stack>
        </AccessibilityProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '500'
  },
  errorTitle: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '700'
  },
  errorDetails: {
    color: '#F8FAFC',
    fontSize: 14,
    textAlign: 'center'
  }
});

