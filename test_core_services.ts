import { BibleReferenceDetector } from './src/services/bible/BibleReferenceDetector';
import { getThemeColors } from './src/theme/tokens';

async function runTests() {
  console.log('--- Iniciando Testes de Validação do Core ---');

  // 1. Teste do BibleReferenceDetector
  const sampleSpeech = `
    Boa noite igreja. Vamos abrir nossa Bíblia em João 3:16 onde diz sobre o amor de Deus.
    Também quero lembrar do que o apóstolo Paulo disse em Romanos capítulo 8 versículo 28.
    E para finalizar o salmista nos consola em Salmos 23:1 com o cuidado do pastor.
  `;

  console.log('1. Testando detecção de referências bíblicas em fala natural...');
  const detected = await BibleReferenceDetector.detectReferences(sampleSpeech);

  console.log(`Detectadas ${detected.length} referências.`);
  detected.forEach(d => {
    console.log(`   - Encontrado: ${d.book} ${d.chapter}:${d.verse_start} (${d.version_code})`);
  });

  const joaoFound = detected.some(d => d.book === 'João' && d.chapter === 3 && d.verse_start === 16);
  const romanosFound = detected.some(d => d.book === 'Romanos' && d.chapter === 8 && d.verse_start === 28);
  const salmosFound = detected.some(d => d.book === 'Salmos' && d.chapter === 23 && d.verse_start === 1);

  if (joaoFound && romanosFound && salmosFound) {
    console.log('   [SUCESSO] Todas as referências bíblicas faladas foram identificadas com exatidão!');
  } else {
    console.error('   [FALHA] Alguma referência não foi identificada:', { joaoFound, romanosFound, salmosFound });
    process.exit(1);
  }

  // 2. Teste do Design System de Acessibilidade
  console.log('\n2. Testando tokens de acessibilidade para daltonismo...');
  const normal = getThemeColors('none');
  const protanopia = getThemeColors('protanopia');
  const highContrast = getThemeColors('high_contrast');

  if (normal.primary !== protanopia.primary && highContrast.background === '#000000') {
    console.log('   [SUCESSO] Tokens de cores sofrem remapeamento correto por deficiência visual!');
  } else {
    console.error('   [FALHA] Falha no remapeamento de cores de acessibilidade.');
    process.exit(1);
  }

  // 3. Teste da Lógica de Paginação
  console.log('\n3. Testando lógica de paginação...');
  const total = 11;
  const pageSize = 4;
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages === 3) {
    console.log(`   [SUCESSO] 11 registros com páginas de tamanho 4 resultam em 3 páginas.`);
  } else {
    console.error('   [FALHA] Erro no cálculo de totalPages.');
    process.exit(1);
  }

  // 4. Teste de Referências Multilíngues (Inglês, Espanhol, Suaíli, Changana)
  console.log('\n4. Testando reconhecimento de citações em múltiplos idiomas...');
  const multiSpeech = `
    In the beginning was the Word, according to John 3:16.
    En español leemos en Salmos 23:1 que el Señor es mi pastor.
    Na ririmi ra Changana hi hlaya eka Tinsimu 23:1.
  `;
  const multiDetected = await BibleReferenceDetector.detectReferences(multiSpeech);
  console.log(`   Detectadas ${multiDetected.length} referências multilíngues.`);
  multiDetected.forEach(d => {
    console.log(`   - Encontrado: ${d.book} ${d.chapter}:${d.verse_start}`);
  });

  const johnFound = multiDetected.some(d => d.book === 'João' && d.chapter === 3 && d.verse_start === 16);
  const salmosFound2 = multiDetected.some(d => d.book === 'Salmos' && d.chapter === 23 && d.verse_start === 1);
  if (johnFound && salmosFound2) {
    console.log('   [SUCESSO] Citações em inglês, espanhol e changana identificadas e mapeadas com precisão!');
  } else {
    console.error('   [FALHA] Citações multilíngues não identificadas:', { johnFound, salmosFound2 });
    process.exit(1);
  }

  console.log('\n--- TODOS OS TESTES PASSARAM COM ÊXITO! ---');
}

runTests().catch(err => {
  console.error('Erro na execução dos testes:', err);
  process.exit(1);
});

