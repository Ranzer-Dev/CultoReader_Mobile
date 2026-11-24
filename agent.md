# AGENT RULES & QUALITY GUIDELINES (agent.md)

Este documento estabelece as regras mandatórias de engenharia de software e padrões de desenvolvimento para este repositório. Todo e qualquer agente, assistente ou desenvolvedor que atuar neste código DEVE seguir rigorosamente estas diretrizes.

---

## 0. REGRA DE OURO INVIOLÁVEL: ARQUITETURA 100% OFFLINE / ON-DEVICE (ZERO NUVEM / ZERO APIS EXTERNAS)
- **OFFLINE-FIRST ABSOLUTO**: O aplicativo inteiro foi concebido para funcionar sem conexão com a internet. Sob NENHUMA hipótese ou circunstância deve ser introduzida qualquer chamada HTTP/REST para APIs de tradução, IA na nuvem, reconhecimento de voz na nuvem ou serviços web externos.
- **Tudo no Dispositivo (On-Device)**:
  - **Transcrição de Voz**: 100% processada pelo motor local do Android (`SpeechRecognizer`).
  - **Tradução Simultânea**: 100% processada no hardware local do smartphone via **Google ML Kit On-Device Translation** (`com.google.mlkit:translate`), baixando modelos locais se necessário, sem limites de caracteres e sem conexões web durante a pregação.
  - **Bíblias Sagradas**: 100% armazenadas localmente em arquivos JSON/SQLite dentro do aplicativo.
  - **Síntese de Voz (TTS)**: 100% gerada pelo motor TTS nativo do sistema operacional do aparelho.
  - **Banco de Dados**: 100% persistido em SQLite local (`expo-sqlite`).
  - **Interface & i18n**: 100% resolvido localmente em tempo de execução.
- **Proibição Estrita de APIs com Limites (ex: MyMemory, Google Cloud API, LibreTranslate Web, OpenAI Web, etc.)**: Nenhuma requisição `fetch()` para servidores de tradução online pode ser adicionada ao código. Se não puder rodar no dispositivo sem internet, NÃO deve ser implementado.

---

## 1. Princípios Fundamentais de Design & SOLID
- **DRY (Don't Repeat Yourself)**: Nenhuma lógica de negócio, query SQL ou formatação deve ser duplicada. Centralize regras em serviços, hooks e utilitários compartilhados.
- **Clean Code**: Código legível, nomes de variáveis e funções expressivos e autoexplicativos em português/inglês consistente, métodos curtos e focados em uma única responsabilidade.
- **SOLID na Prática**:
  - *Single Responsibility Principle (SRP)*: Cada componente, repositório, hook ou serviço tem um único motivo para mudar. Telas orquestram; subcomponentes exibem; hooks gerenciam ciclo de vida; repositórios tratam persistência.
  - *Open/Closed Principle (OCP)*: Módulos abertos para extensão (ex: novos idiomas, novos temas, novas versões bíblicas) e fechados para modificação direta.
  - *Liskov Substitution Principle (LSP)*: Subtipos, contratos e adaptadores devem ser intercambiáveis sem quebrar o cliente.
  - *Interface Segregation Principle (ISP)*: Interfaces e props enxutas. Um componente visual só recebe as props que efetivamente renderiza.
  - *Dependency Inversion Principle (DIP)*: Componentes de interface dependem de abstrações (hooks, contratos de serviços e repositórios), nunca de implementações concretas de baixo nível (como chamadas diretas a `NativeModules` ou SQL cru).

---

## 2. Padrão Arquitetural: Clean Architecture Adaptada para Mobile
Para garantir o desacoplamento e a sustentabilidade do código, a estrutura do projeto deve seguir rigorosamente a separação em camadas:

1. **Camada de Apresentação (`app/` e `src/components/`)**:
   - Telas de rotas (`app/(tabs)/*`, `app/worship/*`) atuam apenas como **orquestradoras enxutas**, conectando os Custom Hooks aos subcomponentes visuais.
   - Componentes visuais devem ser "presentacionais" / puros sempre que possível, recebendo dados e callbacks via `props`.
   - **Proibição de I/O em Componentes**: É expressamente proibido executar comandos SQL diretos (`db.runAsync()`, `db.getAllAsync()`) ou acessar APIs nativas de hardware (`NativeModules`) dentro do corpo de componentes de interface. Toda essa comunicação deve passar por Repositórios ou Hooks.

2. **Camada de Aplicação (`src/hooks/`)**:
   - Centraliza Casos de Uso e orquestração de fluxo reativo (ex: `useLiveTranscription`, `useAccessibilitySettings`, `useWorshipDraft`).
   - Gerencia estados do React (`useState`, `useEffect`, `useCallback`, `useRef`) e orquestra a comunicação entre múltiplos serviços e repositórios.

3. **Camada de Domínio (`src/types/`, `src/utils/`, regras puras)**:
   - Contratos de tipos, entidades de negócio e algoritmos puros (ex: identificador de versículos bíblicos, merge de blocos de transcrição monotônicos).
   - Zero dependência de React ou Android. Devem ser testáveis de forma 100% isolada.

4. **Camada de Infraestrutura (`src/database/`, `src/services/`, módulos nativos)**:
   - Implementação de Repositórios SQLite (`WorshipRepository.ts`, `NotesRepository.ts`).
   - Adaptadores de Hardware nativo (`MlKitTranslateModule`, `SpeechRecognizer`, `expo-speech`).

---

## 3. Diretrizes de Coesão, Tamanho de Arquivos e Componentização
- **Heurística de Alerta de Linhas (~250-300 linhas)**: O tamanho de arquivo não é um dogma absoluto, mas arquivos de interface ou hooks que ultrapassem **250 a 300 linhas** disparam um sinal claro de acúmulo excessivo de responsabilidades (*Code Smell*). O desenvolvedor/IA DEVE obrigatoriamente avaliar e fatiar o arquivo em subcomponentes ou hooks especializados.
- **Componentização por Blocos Visuais Lógicos**:
  - Telas complexas com múltiplos cards, seções ou modais devem ter cada seção extraída para sua própria pasta dedicada em `src/components/<feature>/` (ex: `src/components/accessibility/`, `src/components/live/`, `src/components/worship/`).
- **Desacoplamento de Estilos**: Evitar declarar blocos de `StyleSheet` monolíticos de 300 linhas dentro do arquivo da tela principal; os estilos devem residir junto aos respectivos subcomponentes ou em arquivos de tema compartilhados.

---

## 4. Protocolo Mandatório YAGNI (You Aren't Gonna Need It)
- **Aplicação Contínua**: O princípio YAGNI deve ser avaliado e aplicado **sempre** que qualquer alteração ocorrer no código, mesmo que seja a modificação ou adição de **uma única linha**.
- **Proibido Código Especulativo**: Não adicione parâmetros, abstrações prematuras, campos de banco ou funções que não tenham utilidade comprovada e imediata para a funcionalidade atual.
- **Simplicidade Primeira**: Resolva a necessidade presente com a solução mais simples, modular e elegante possível.

---

## 5. Protocolo de Verificação de Efeitos Colaterais e Regressão
- **Checagem de Arquivos Conectados**: Sempre que um arquivo for alterado ou criado, todos os arquivos diretamente ou indiretamente vinculados a ele (importações, contratos de tipos, chamadas de métodos, tabelas de banco) devem ser inspecionados.
- **Prevenção de Erros**:
  - Verificar se a alteração introduziu inconsistências de tipagem (`npx tsc --noEmit`).
  - Verificar se a lógica de negócio dos componentes consumidores foi alterada inadvertidamente.
  - Garantir que a execução e renderização continuem sem exceções ou quebras de contrato.

---

## 6. Gestão de Ambiguidades e Bifurcações
- Caso surja qualquer ambiguidade de requisitos ou uma bifurcação arquitetural/técnica com duas ou mais opções válidas de implementação, **interrompa a suposição e consulte o usuário imediatamente** para esclarecer o caminho a ser seguido.

---

## 7. Requisitos de Acessibilidade e Usabilidade
- **Acessibilidade por Padrão Desativada**: Modos especiais (daltonismo, alto contraste, suporte tátil/Libras, comunicação assistida) vêm desligados por padrão, mas devem estar 100% disponíveis nas configurações.
- **Thumb Zone**: Elementos de ação primária e controles de gravação/anotação devem priorizar o terço inferior da tela para facilitar o manuseio com apenas uma mão.
- **Continuidade da Transcrição**: Nenhuma interação do usuário (abrir modal, anotar frase, consultar versículo) pode pausar ou interromper a captura contínua de áudio.
