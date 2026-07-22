# Instruções para agentes de IA

## Objetivo do projeto

Manter uma aplicação de faturamento com autenticação, clientes, cobranças, pagamentos, juros compostos, relatórios paginados e exportações CSV/PDF preparadas para grandes volumes.

## Tecnologias e estrutura

- Backend: PHP 8.3, Laravel 12 e API autenticada com Sanctum em `backend/`.
- Frontend: React 19, TypeScript e Vite em `frontend/`.
- Banco principal: MySQL 8.4.
- Testes backend: PHPUnit com SQLite em memória.
- Ambiente: Docker e Docker Compose.

## Regras de implementação

- Respeitar integralmente os requisitos e decisões documentados no `README.md`.
- Manter cálculos financeiros no backend e valores monetários arredondados em duas casas.
- Aplicar filtros, ordenação, paginação e totalizadores do relatório no banco de dados.
- Evitar N+1 e não materializar resultados completos de grande volume em memória.
- Reutilizar a mesma consulta e os mesmos filtros na tela e nas exportações.
- Preservar autenticação e validação em todos os endpoints protegidos.
- Não adicionar dependências sem necessidade e manter os lockfiles versionados.
- Nunca registrar segredos, tokens ou arquivos `.env` reais no repositório.

## Fluxo de validação

Execute antes de concluir qualquer alteração:

```bash
docker compose config --quiet
docker compose exec backend vendor/bin/pint --test
docker compose exec backend php artisan test
docker compose exec frontend npm run lint
docker compose exec frontend npm run build
```

Quando houver alteração em Dockerfiles ou dependências, reconstrua também a imagem afetada.

## Git e documentação

- Criar uma branch por etapa ou correção relevante, usando o prefixo `jefferson-` neste projeto.
- Usar commits pequenos, semânticos e separados por responsabilidade.
- Não executar commit, push, merge ou abertura de Pull Request sem autorização explícita do responsável pelo repositório.
- Atualizar o README sempre que comandos, configuração, arquitetura ou comportamento do sistema mudarem.
- Não reescrever nem apagar alterações do usuário que não pertençam à tarefa atual.

## Limites de escopo

- Priorizar os requisitos obrigatórios do teste técnico.
- Tratar diferenciais como trabalho opcional e identificá-los claramente.
- Não realizar deploy, alterar permissões externas ou integrar o Pull Request final no repositório avaliador.
