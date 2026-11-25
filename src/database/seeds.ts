import { SQLiteDatabase } from 'expo-sqlite';

export async function runSeeds(db: SQLiteDatabase): Promise<void> {
  // Fast-path na 2ª abertura em diante: se já existem versículos e cultos cadastrados, não faz nenhuma escrita!
  const [versesCount, worshipsCount] = await Promise.all([
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM bible_verses;'),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM worship_services;')
  ]);
  if ((versesCount?.count || 0) > 0 && (worshipsCount?.count || 0) > 0) {
    return;
  }

  // 1. Cadastrar versão da Bíblia (Almeida Revista e Atualizada - ARA e NVI)
  await db.runAsync(`
    INSERT OR IGNORE INTO bible_versions (code, name, language, is_default)
    VALUES 
      ('ARA', 'Almeida Revista e Atualizada', 'pt-BR', 1),
      ('NVI', 'Nova Versão Internacional', 'pt-BR', 0);
  `);

  // 2. Cadastrar versículos bíblicos de referência offline
  const versesData = [
    { code: 'ARA', book: 'João', chapter: 3, verse: 16, text: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.' },
    { code: 'ARA', book: 'Romanos', chapter: 8, verse: 28, text: 'Sabemos que todas as coisas cooperam para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.' },
    { code: 'ARA', book: 'Filipenses', chapter: 4, verse: 8, text: 'Finalmente, irmãos, tudo o que é verdadeiro, tudo o que é respeitável, tudo o que é justo, tudo o que é puro, tudo o que é amável, tudo o que é de boa fama, se alguma virtude há e se algum louvor existe, seja isso o que ocupe o vosso pensamento.' },
    { code: 'ARA', book: 'Filipenses', chapter: 4, verse: 9, text: 'O que também aprendestes, e recebestes, e ouvistes, e vistes em mim, isso praticai; e o Deus da paz será convosco.' },
    { code: 'ARA', book: 'Filipenses', chapter: 4, verse: 13, text: 'Tudo posso naquele que me fortalece.' },
    { code: 'ARA', book: 'Salmos', chapter: 3, verse: 1, text: 'SENHOR, como tem crescido o número dos meus adversários! São numerosos os que se levantam contra mim.' },
    { code: 'ARA', book: 'Salmos', chapter: 3, verse: 2, text: 'Muitos dizem da minha alma: Não há em Deus salvação para ele.' },
    { code: 'ARA', book: 'Salmos', chapter: 3, verse: 3, text: 'Porém tu, SENHOR, és o meu escudo, és a minha glória e o que exaltas a minha cabeça.' },
    { code: 'ARA', book: 'Salmos', chapter: 3, verse: 4, text: 'Com a minha voz clamo ao SENHOR, e ele, do seu santo monte, me responde.' },
    { code: 'ARA', book: 'Salmos', chapter: 3, verse: 5, text: 'Deito-me e pego no sono; acordo, porque o SENHOR me sustenta.' },
    { code: 'ARA', book: 'Salmos', chapter: 3, verse: 6, text: 'Não terei medo de dez milhares de pessoas que se puseram contra mim ao meu redor.' },
    { code: 'ARA', book: 'Salmos', chapter: 3, verse: 7, text: 'Levanta-te, SENHOR! Salva-me, Deus meu, pois feres nos queixos a todos os meus inimigos e aos ímpios quebras os dentes.' },
    { code: 'ARA', book: 'Salmos', chapter: 3, verse: 8, text: 'Do SENHOR é a salvação, e sobre o teu povo, a tua bênção.' },
    { code: 'ARA', book: 'Salmos', chapter: 23, verse: 1, text: 'O Senhor é o meu pastor; nada me faltará.' },
    { code: 'ARA', book: 'Salmos', chapter: 23, verse: 2, text: 'Ele me faz repousar em pastos verdejantes. Leva-me para junto das águas de descanso;' },
    { code: 'ARA', book: 'Salmos', chapter: 23, verse: 3, text: 'Refrigera-me a alma. Guia-me pelas veredas da justiça por amor do seu nome.' },
    { code: 'ARA', book: 'Salmos', chapter: 23, verse: 4, text: 'Ainda que eu ande pelo vale da sombra da morte, não temerei mal nenhum, porque tu estás comigo; o teu bordão e o teu cajado me consolam.' },
    { code: 'ARA', book: 'Salmos', chapter: 23, verse: 5, text: 'Preparas-me uma mesa na presença dos meus adversários, unges-me a cabeça com óleo; o meu cálice transborda.' },
    { code: 'ARA', book: 'Salmos', chapter: 23, verse: 6, text: 'Bondade e misericórdia certamente me seguirão todos os dias da minha vida; e habitarei na Casa do SENHOR para todo o sempre.' },
    { code: 'ARA', book: 'Isaías', chapter: 40, verse: 31, text: 'Mas os que esperam no Senhor renovam as suas forças, sobem com asas como águias, correm e não se cansam, caminham e não se fatigam.' },
    { code: 'ARA', book: 'Provérbios', chapter: 3, verse: 5, text: 'Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.' },
    { code: 'ARA', book: 'Jeremias', chapter: 29, verse: 11, text: 'Eu é que sei que pensamentos tenho a vosso respeito, diz o Senhor; pensamentos de paz e não de mal, para vos dar o fim que desejais.' },
    { code: 'ARA', book: 'Mateus', chapter: 6, verse: 33, text: 'Buscai, pois, em primeiro lugar, o seu reino e a sua justiça, e todas estas coisas vos serão acrescentadas.' },
    { code: 'ARA', book: 'Gálatas', chapter: 5, verse: 22, text: 'Mas o fruto do Espírito é: amor, alegria, paz, longanimidade, benignidade, bondade, fidelidade,' },
    { code: 'ARA', book: '2 Coríntios', chapter: 5, verse: 17, text: 'E, assim, se alguém está em Cristo, é nova criatura; as coisas antigas já passaram; eis que se fizeram novas.' },
    { code: 'ARA', book: 'Hebreus', chapter: 11, verse: 1, text: 'Ora, a fé é a certeza de coisas que se esperam, a convicção de fatos que se não veem.' }
  ];

  for (const v of versesData) {
    await db.runAsync(
      `INSERT OR IGNORE INTO bible_verses (version_code, book, chapter, verse, text) VALUES (?, ?, ?, ?, ?);`,
      [v.code, v.book, v.chapter, v.verse, v.text]
    );
  }

  // Verifica se já existem cultos cadastrados para não duplicar
  const countResult = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM worship_services;'
  );

  if (countResult && countResult.count > 0) {
    return; // Já populado
  }

  // 3. Cadastrar pelo menos 10 registros de cultos (requisito da faculdade)
  const initialCultos = [
    {
      title: 'O Poder da Fé em Tempos Difíceis',
      preacher: 'Pr. Lucas Ferreira',
      service_date: '2026-11-01',
      summary: 'Uma mensagem encorajadora sobre manter os olhos fixos na promessa mesmo em meio à tempestade.',
      full_transcript: 'Boa noite a todos os irmãos. Hoje nós vamos meditar em Hebreus 11:1. A fé não é a ausência de dúvidas passageiras, mas a firme convicção de que Deus cuida de cada detalhe. Quando olhamos para a história dos heróis da fé, percebemos que a perseverança gera esperança. Confie no Senhor mesmo quando o caminho parecer incerto.',
      tags: 'Fé, Esperança, Perseverança'
    },
    {
      title: 'O Amor Incondicional do Pai',
      preacher: 'Pra. Mariana Souza',
      service_date: '2026-11-03',
      summary: 'Reflexão sobre a dimensão do amor divino expresso na entrega do Filho unigênito.',
      full_transcript: 'A graça de Deus nos alcançou não pelas nossas obras, mas pelo Seu amor imensurável. Como lemos em João 3:16, Ele amou o mundo de tal maneira que entregou tudo por nós. Esse amor dissipa o medo e restaura qualquer coração que se achega com sinceridade.',
      tags: 'Graça, Amor, Salvação'
    },
    {
      title: 'Descanso nas Águas Tranquilas',
      preacher: 'Pr. André Silveira',
      service_date: '2026-11-05',
      summary: 'Como encontrar paz interior e descanso mental na correria do dia a dia.',
      full_transcript: 'Vivemos em um mundo hiperconectado e muitas vezes exausto. O Salmos 23:1 nos lembra: O Senhor é o meu pastor e nada me faltará. Ele nos conduz a águas calmas para refrigério da alma. Pare hoje por alguns minutos e entregue suas ansiedades diante Dele.',
      tags: 'Paz, Salmos, Descanso'
    },
    {
      title: 'Todas as Coisas Cooperam',
      preacher: 'Pr. Lucas Ferreira',
      service_date: '2026-11-08',
      summary: 'Compreendendo o propósito de Deus por trás dos momentos de dor e aprendizado.',
      full_transcript: 'Em Romanos 8:28 temos uma das declarações mais consoladoras das Escrituras. Todas as coisas, inclusive os dias nublados e as despedidas, cooperam para o bem de quem ama a Deus. Não desanime com o capítulo de hoje, pois a história ainda não terminou.',
      tags: 'Propósito, Romanos, Vitória'
    },
    {
      title: 'Renovação de Forças e Ânimo',
      preacher: 'Pr. Marcos Albuquerque',
      service_date: '2026-11-10',
      summary: 'Superando o cansaço espiritual através da comunhão e da oração constante.',
      full_transcript: 'Quantas vezes sentimos que nossas energias se esgotaram? O profeta Isaías no capítulo 40 versículo 31 declara que os que esperam no Senhor sobem com asas como águias. A força Dele se aperfeiçoa na nossa fraqueza.',
      tags: 'Força, Isaías, Oração'
    },
    {
      title: 'Prioridades do Reino',
      preacher: 'Pra. Mariana Souza',
      service_date: '2026-11-12',
      summary: 'Alinhando nossa rotina, desejos e finanças com os valores eternos do Evangelho.',
      full_transcript: 'Em Mateus 6:33 Jesus nos convida a reordenar a vida: buscai em primeiro lugar o Reino de Deus e a sua justiça. Quando colocamos Deus no centro, as preocupações secundárias encontram o seu devido lugar.',
      tags: 'Reino, Mateus, Prioridades'
    },
    {
      title: 'O Fruto do Espírito na Prática',
      preacher: 'Pr. André Silveira',
      service_date: '2026-11-14',
      summary: 'Manifestando amor, alegria e paciência nas relações familiares e de trabalho.',
      full_transcript: 'O apóstolo Paulo escreve em Gálatas 5:22 sobre o fruto do Espírito. Não se trata de esforço puramente humano, mas de um caráter moldado diariamente pelo Espírito Santo com mansidão e domínio próprio.',
      tags: 'Fruto do Espírito, Relacionamento, Caráter'
    },
    {
      title: 'Nova Criatura em Cristo',
      preacher: 'Pr. Lucas Ferreira',
      service_date: '2026-11-17',
      summary: 'O recomeço que o perdão proporciona: deixando o passado para trás.',
      full_transcript: 'Se alguém está em Cristo, as coisas velhas já passaram! Como está em 2 Coríntios 5:17, tudo se faz novo. Não permita que culpas antigas aprisionem o seu futuro. Você foi perdoado e reconciliado com o Pai.',
      tags: 'Recomeço, Perdão, Graça'
    },
    {
      title: 'Confiança Inabalável',
      preacher: 'Pr. Marcos Albuquerque',
      service_date: '2026-11-19',
      summary: 'Aprendendo a depender do conselho de Deus em decisões cruciais da vida.',
      full_transcript: 'Provérbios 3:5 adverte com sabedoria: confia no Senhor de todo o coração e não dependa exclusivamente do próprio entendimento. Muitas vezes nossa visão é limitada, mas os caminhos de Deus são perfeitos.',
      tags: 'Sabedoria, Provérbios, Confiança'
    },
    {
      title: 'Planos de Paz e Esperança',
      preacher: 'Pra. Mariana Souza',
      service_date: '2026-11-21',
      summary: 'Uma mensagem profética sobre o cuidado de Deus com o futuro da nossa comunidade.',
      full_transcript: 'Deus diz em Jeremias 29:11 que os pensamentos que Ele tem a nosso respeito são de paz e não de mal. Você não está sozinho nem desamparado. O Senhor prepara um futuro repleto de esperança e propósito.',
      tags: 'Futuro, Jeremias, Paz'
    },
    {
      title: 'Fortalecidos para Vencer',
      preacher: 'Pr. Lucas Ferreira',
      service_date: '2026-11-23',
      summary: 'A suficiência de Cristo em qualquer circunstância e estado de espírito.',
      full_transcript: 'O apóstolo Paulo preso declarou em Filipenses 4:13: tudo posso naquele que me fortalece. Essa declaração não é sobre conquistar riquezas materiais, mas sobre ter contentamento e paz em qualquer estação da vida.',
      tags: 'Vitória, Filipenses, Contentamento'
    }
  ];

  for (const c of initialCultos) {
    const res = await db.runAsync(
      `INSERT INTO worship_services (title, preacher, service_date, summary, full_transcript, tags)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [c.title, c.preacher, c.service_date, c.summary, c.full_transcript, c.tags]
    );

    // Inserir uma anotação de exemplo em cada culto demonstrativo
    if (res.lastInsertRowId) {
      await db.runAsync(
        `INSERT INTO worship_notes (worship_id, selected_text, note_text, start_offset, end_offset, color_tag)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [res.lastInsertRowId, 'Deus cuida de cada detalhe', 'Lembrar de compartilhar este trecho com o grupo de estudos.', 0, 30, '#4CC9F0']
      );
    }
  }
}

