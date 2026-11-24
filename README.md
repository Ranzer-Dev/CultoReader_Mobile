# Culto Reader & Compreensão — Mobile App

[![React Native](https://img.shields.io/badge/React_Native-0.76.7-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK_52-000020?style=flat-square&logo=expo&logoColor=white)](https://expo.dev/)
[![SQLite](https://img.shields.io/badge/Database-SQLite_(expo--sqlite)-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://docs.expo.dev/versions/latest/sdk/sqlite/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Status](https://img.shields.io/badge/Status-Produção_v1.0.26-success?style=flat-square)]()
[![Model](https://img.shields.io/badge/Architecture-C4_Model-blueviolet?style=flat-square)](#-arquitetura-em-modelo-c4)

---

## 📖 1. Visão Geral do Produto

### O que é o aplicativo?
O **Culto Reader & Compreensão** é um aplicativo mobile *offline-first* desenvolvido em **React Native com Expo** e banco de dados relacional **SQLite local**. O sistema foi concebido como uma central de transcrição contínua, análise léxica bíblica e gestão corporativa de cultos e mensagens cristãs, operando sem nenhuma dependência de servidores em nuvem ou internet durante as reuniões.

### Para que serve o aplicativo?
O aplicativo atende a três frentes principais de impacto prático:

1. **Gestão e Preservação de Mensagens (CRUD Completo com Paginação):**
   Permite cadastrar, consultar, atualizar e excluir registros de cultos de forma paginada e instantânea, armazenando pregações, pregadores, datas, resumos, tags temáticas e transcrições integrais diretamente no chip de armazenamento do smartphone.
2. **Acessibilidade Universal e Inclusão Sensorial:**
   * **Pessoas com deficiência auditiva:** Acompanham a pregação lendo a transcrição em tempo real na tela.
   * **Pessoas com deficiência visual ou baixa visão:** O aplicativo sintetiza em voz alta (TTS) com entonação bíblica humana natural e vozes neurais brasileiras, além de controle de escala de fonte (100% a 200%).
   * **Pessoas com daltonismo:** Modos de alto contraste e filtros específicos para Protanopia, Deuteranopia e Tritanopia.
3. **Tradução Simultânea para Estrangeiros (On-Device):**
   Permite que visitantes estrangeiros ou turistas acompanhem cultos ministrados em Português lendo a tradução em Inglês, Espanhol ou Francês ou ouvindo cada frase traduzida diretamente em seus fones de ouvido (**Tradução Simultânea Audível estilo ONU**), com inteligência artificial rodando 100% no chip do celular (Google ML Kit).
4. **Detecção Bíblica Inteligente:**
   Analisa o áudio captado pelo microfone e identifica passagens bíblicas citadas pelo orador (ex: *João 3:16*, *Romanos 8:28*, *Salmo 23*), gerando links interativos para leitura da Bíblia offline no texto oficial (Almeida Revista e Atualizada).

---

## 🏛️ 2. Arquitetura em Modelo C4

Para documentar a estrutura com rigor de engenharia de software, o projeto adota o **Modelo C4** (Contexto, Contêineres, Componentes e Código).

---

### Nível 1: Diagrama de Contexto de Sistema (Context)
Descreve os usuários atendidos e as fronteiras físicas do dispositivo onde o aplicativo opera:

```mermaid
flowchart TD
    subgraph Usuarios["Atores & Usuários"]
        Membro["Membro / Ouvinte da Comunidade"]
        Estrangeiro["Visitante Estrangeiro / Turista"]
        Deficiente["Pessoa com Deficiência (Visual/Auditiva)"]
        Lider["Pastor / Pregador / Secretário"]
    end

    subgraph Sistema["Culto Reader & Compreensão (Mobile App)"]
        App["Aplicativo Móvel React Native / Expo\n(Opera 100% On-Device no Smartphone)"]
    end

    subgraph Hardware["Sub-sistemas Físicos do Smartphone"]
        Mic["Microfone do Aparelho / Fone Bluetooth"]
        Speaker["Alto-falante / Fone de Ouvido"]
        Storage["Armazenamento Interno (Flash / SQLite)"]
    end

    Lider -->|"Ministra pregação por voz"| Mic
    Mic -->|"Stream de áudio contínuo"| App
    App -->|"Grava e consulta cultos e Bíblias"| Storage
    App -->|"Exibe transcrição, versículos e CRUD paginado"| Membro
    App -->|"Lê mensagem em voz alta (TTS)"| Speaker
    Speaker -->|"Áudio acessível e tradução no fone"| Deficiente
    Speaker -->|"Tradução simultânea no fone"| Estrangeiro
    App -->|"Gerencia cultos (Criar, Editar, Excluir)"| Lider
```

---

### Nível 2: Diagrama de Contêineres (Containers)
Evidencia os subsistemas de runtime e as tecnologias empregadas no celular:

```mermaid
flowchart TD
    subgraph Device["Ambiente do Smartphone Android"]
        subgraph Runtime["Contêiner 1: Mobile Client (React Native + Hermes)"]
            JS["Camada de Interface & Lógica de Negócio\n(React Native 0.76.7, Expo 52, TypeScript)"]
        end

        subgraph NativeLayer["Contêiner 2: Android Native Runtime"]
            SR["Android SpeechRecognizer API\n(expo-speech-recognition)"]
            TTS["Android TextToSpeech Engine\n(expo-speech)"]
            MLKit["Google ML Kit On-Device Translation\n(Modelos Neurais Locais NPU/CPU)"]
        end

        subgraph Database["Contêiner 3: Banco de Dados Relacional"]
            SQLite["SQLite Engine (expo-sqlite 15.1.4)\nArquivo: culto_reader.db\n(Migrations, Seeds, Índices)"]
        end
    end

    JS -->|"Reconhecimento contínuo de voz"| SR
    JS -->|"Síntese fonética bíblica"| TTS
    JS -->|"Tradução simultânea sem internet"| MLKit
    JS -->|"Queries parametrizadas, CRUD e Paginação"| SQLite
```

---

### Nível 3: Diagrama de Componentes (Components)
Detalhamento interno dos componentes da aplicação móvel:

```mermaid
flowchart TD
    subgraph Presentation["Camada de Apresentação (Screens & Modals)"]
        IndexScreen["CultosCrudScreen\n(CRUD Paginado, Busca, Cards)"]
        LiveScreen["LiveTranscriptionScreen\n(Painel Ao Vivo, Palavras Clicáveis)"]
        WorshipFormScreen["WorshipFormScreen\n(Formulário de Cadastro/Edição)"]
        CalendarScreen["CalendarScreen\n(Histórico Temporal de Cultos)"]
        BibleScreen["BookBibleScreen\n(Leitor Bíblico Offline)"]
    end

    subgraph Controllers["Camada de Hooks & Controladores"]
        useLiveSession["useLiveSession\n(Gestão de Sessão, Auto-Save 30s)"]
        useSimultaneousTranslation["useSimultaneousTranslation\n(Streaming e Tradução no Fone)"]
        useWorshipForm["useWorshipForm\n(Validação e Mutação do Culto)"]
        useAccessibility["useAccessibility\n(Temas, Daltonismo e TTS)"]
    end

    subgraph CoreServices["Camada de Serviços Especializados"]
        TranscriptionService["TranscriptionService\n(Loop Contínuo, Anti-duplicação)"]
        BibleReferenceDetector["BibleReferenceDetector\n(Análise Léxica de Versículos)"]
        TranslationService["TranslationService\n(Bridge ML Kit On-Device)"]
        TTSService["TTSService\n(Normalizador Fonético e Vozes Neurais)"]
        BibleManager["BibleManager\n(Catálogo Canônico Multilíngue)"]
    end

    subgraph DataRepositories["Camada de Acesso a Dados (Repositories)"]
        WorshipRepository["WorshipRepository\n(create, findPaginated, update, delete)"]
        BibleRepository["BibleRepository\n(busca de versículos ARA e NVI)"]
        NotesRepository["NotesRepository\n(anotações pessoais de estudo)"]
        DBConnection["DatabaseConnection & Migrations\n(Inicialização e Seeds)"]
    end

    Presentation --> Controllers
    Controllers --> CoreServices
    Controllers --> DataRepositories
    CoreServices --> DataRepositories
    DataRepositories --> DBConnection
```

---

### Nível 4: Diagrama de Código e Modelo Relacional (Code / Schema)
Estrutura física das tabelas relacionais mantidas no SQLite:

```mermaid
erDiagram
    WORSHIP_SERVICES ||--o{ NOTES : "possui anotações"
    BIBLE_VERSIONS ||--o{ BIBLE_VERSES : "contém versículos"

    WORSHIP_SERVICES {
        INTEGER id PK "Autoincrement"
        TEXT title "Título ou tema do culto"
        TEXT preacher "Nome do pastor / pregador"
        TEXT service_date "Data do culto (YYYY-MM-DD)"
        TEXT summary "Resumo da pregação"
        TEXT full_transcript "Transcrição textual completa"
        TEXT tags "Tags temáticas separadas por vírgula"
        TEXT created_at "Timestamp de criação"
        TEXT updated_at "Timestamp de atualização"
    }

    NOTES {
        INTEGER id PK "Autoincrement"
        INTEGER worship_id FK "Vínculo com culto"
        TEXT selected_text "Palavra ou trecho selecionado"
        TEXT note_text "Anotação ou reflexão pessoal"
        TEXT color_tag "Etiqueta de cor (marca-texto)"
        TEXT created_at "Timestamp de criação"
    }

    BIBLE_VERSIONS {
        TEXT code PK "Código da versão (ARA, NVI)"
        TEXT name "Nome por extenso da versão"
        TEXT language "Locale do idioma (pt-BR)"
        INTEGER is_default "Flag de versão padrão (0 ou 1)"
    }

    BIBLE_VERSES {
        INTEGER id PK "Autoincrement"
        TEXT version_code FK "Referência à versão"
        TEXT book "Nome do livro bíblico"
        INTEGER chapter "Número do capítulo"
        INTEGER verse "Número do versículo"
        TEXT text "Texto sagrado canônico"
    }
```

---

## 🎯 3. Matriz de Atendimento às Exigências Acadêmicas

| Requisito do Projeto | Implementação Técnica no Código | Localização no Repositório |
| :--- | :--- | :--- |
| **Tecnologia: React Native + Expo + SQLite** | React Native 0.76.7, Expo 52 e `expo-sqlite` 15.1.4 assíncrono. | `package.json`, `src/database/connection.ts` |
| **CRUD: CREATE (Cadastrar)** | Cadastro estruturado via formulário dedicado e auto-geração a partir do rascunho da Tela Ao Vivo. | `app/worship/form.tsx`, `WorshipRepository.create()` |
| **CRUD: READ (Consultar)** | Listagem paginada no SQLite (`LIMIT ? OFFSET ?`), busca em tempo real com `LIKE %term%` e filtro por data. | `app/(tabs)/index.tsx`, `WorshipRepository.findPaginated()` |
| **CRUD: UPDATE (Editar)** | Edição completa de todos os campos com preenchimento reativo do registro existente. | `app/worship/form.tsx`, `WorshipRepository.update()` |
| **CRUD: DELETE (Excluir)** | Exclusão com confirmação nativa (`Alert.alert`) e remoção física no banco. | `app/(tabs)/index.tsx`, `WorshipRepository.delete()` |
| **Pelo menos 10 registros** | População automática (*seeding*) de **11 cultos completos** com metadados e versículos citados na primeira abertura. | `src/database/seeds.ts` |
| **Paginação na listagem** | Controle de paginação com navegação fluida de páginas, indicação de total de registros e páginas. | `src/components/PaginationControls.tsx` |
| **Persistência garantida** | Arquivo SQLite mantido no disco flash do Android, preservando dados após fechar ou reiniciar o aparelho. | `src/database/migrations.ts` |

---

## 💻 4. Como Executar o Projeto

### Pré-requisitos
* [Node.js](https://nodejs.org/) (v18 ou superior)
* [Android Studio](https://developer.android.com/studio) & SDK Android (API 34/35)
* [JDK 17](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html)

### Instalação e Execução

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/Ranzer-Dev/CultoReader_Mobile.git
   cd CultoReader_Mobile
   ```

2. **Instalar as dependências do ecossistema Expo:**
   ```bash
   npm install
   ```

3. **Executar em modo desenvolvimento no emulador ou dispositivo físico:**
   ```bash
   npx expo run:android
   ```

4. **Gerar pacote APK Release standalone (100% autônomo):**
   ```bash
   cd android
   .\gradlew assembleRelease
   ```
   *O executável otimizado estará disponível em `android/app/build/outputs/apk/release/`.*

---

## 📄 Licença

Projeto desenvolvido para fins acadêmicos e de acessibilidade comunitária sob a licença [MIT](LICENSE).
