# Roadmap

Histórico de fases e o que vem a seguir.

## Fase 1 — MVP (concluída)

- Criador de ficha completo com balanceamento automático.
- Oráculo da Entropia (gratuito, determinístico).
- Mesa com rolagem ao vivo e painel do mestre.
- Motor de regras do Solando 4.0.

## Fase 2 — Contas, IA e identidade (concluída)

- Supabase: auth (Google/senha), Postgres com RLS, storage de avatares.
- Aba **Arquimago** e suite de IA (personagem, contramestre, nomes/lore, explicar ficha).
- Conteúdo customizado (raças/classes) com compartilhamento público.
- Toques visuais de mangá e assinatura do desenvolvedor.

## Fase 3 — Polimento e expansão (atual)

- Perfis estilo Netflix (Jogador × Mestre na mesma conta).
- Efeitos de crítico: som sintetizado + animações.
- Comunidade: vitrine e adoção de raças/classes públicas.
- Exportação da ficha como card de anime (PNG).
- Splash de abertura, transições de página e loader global.
- Guia ilustrado para pessoas leigas.
- Infra e qualidade: rate-limit nas rotas de IA, cache do manual, testes Playwright, documentação.

## Futuro (ideias)

- Sincronizar perfis entre dispositivos (tabela dedicada no Supabase).
- Curtidas e comentários na comunidade (requer migração de banco).
- Realtime na mesa (Supabase Realtime) para rolagens compartilhadas instantâneas.
- Prints reais no guia via captura automatizada.
- Métricas de uso da IA e limites por conta.
