# Clara · Gestão de faturamento

Aplicação do teste técnico fullstack: Laravel 13 / PHP 8.4, React 19 / TypeScript, MySQL 8.4 e Docker Compose. Inclui autenticação por sessão, clientes, cobranças, pagamentos, relatório com totalizadores e exportações assíncronas em CSV e PDF.

## Executar com Docker

Pré-requisito: Docker Desktop **em execução**, com suporte a containers Linux e Docker Compose.

```sh
cp .env.example .env
docker compose up --build -d
```

No PowerShell, use `Copy-Item .env.example .env` no primeiro comando.

Acesse **http://localhost:8080**.

| Acesso de demonstração | Valor |
| --- | --- |
| E-mail | `admin@clara.local` |
| Senha | `Clara@2026!` |

O serviço `init` executa migrations e seeders; cria o usuário, oito clientes e quarenta cobranças fictícias. Executá-lo novamente não duplica a demonstração nem redefine senhas. A chave de criptografia é gerada uma vez e persistida no volume de storage. MySQL e arquivos sobrevivem a `docker compose down`.

```sh
docker compose ps
docker compose logs -f backend worker
docker compose down
```

Para aplicar uma nova versão: `docker compose up --build -d`. Não utilize `down -v` se quiser preservar os dados. As credenciais são exclusivamente de demonstração; o ambiente fica exposto somente em `127.0.0.1`. `APP_PORT` permite mudar a porta. Credenciais alternativas do seeder são configuráveis no `.env`.

## Testes

Backend no **MySQL**, em banco separado `clara_test`:

```sh
docker compose --profile test run --build --rm test
```

Os testes recriam tabelas. Nunca os execute apontando para dados reais. O banco de testes é provisionado na primeira inicialização do volume MySQL. Em volumes antigos, crie `clara_test` e conceda acesso ao usuário `clara` antes de executar a suíte.

Frontend, usando apenas Docker:

```sh
docker run --rm -v "${PWD}/frontend:/app" -w /app node:22-alpine sh -c "corepack enable && corepack prepare pnpm@11.19.0 --activate && pnpm install --frozen-lockfile && pnpm test && pnpm build"
```

Para desenvolvimento fora do Docker: PHP 8.4 com extensões listadas no Dockerfile, Composer, Node 22 e pnpm 11.19.0. Execute `composer install` no backend, configure `.env`, gere a chave e rode `php artisan migrate --seed`. Inicie `php artisan serve` na porta 8000 e `php artisan queue:work --timeout=3600` em outro terminal. No frontend, execute `pnpm install --frozen-lockfile` e `pnpm dev`. O Vite encaminha `/api` e `/sanctum` para o backend.

Com a aplicação e o worker ativos, os testes de navegador são reproduzíveis:

```sh
cd frontend
pnpm exec playwright install chromium
pnpm test:e2e
```

O endereço padrão de E2E é `http://127.0.0.1:5173`. Para testar o Compose, defina `E2E_BASE_URL=http://localhost:8080`. Os testes usam as credenciais de demonstração, criam registros identificados como `Teste E2E` e salvam capturas em `artifacts/`, ignorado pelo Git.

Os testes cobrem autenticação e acesso negado, CRUD, validação, juros e arredondamento, pagamento e imutabilidade, filtros por todas as datas, totalizadores globais, cursores, ausência de N+1, proteção de downloads, exportação PDF/CSV/ZIP, expiração e limite de exportações. O CI executa backend em MySQL, build TypeScript e testes unitários do frontend.

## Regras financeiras

- Taxa mensal expressa em **percentual**: `2.0000` significa **2% ao mês**.
- Juros simples, por dias corridos e mês comercial de 30 dias: `juros = original × taxa_percentual × max(0, dias_atraso) / 3000`.
- Vencimento no dia atual não gera atraso. O fuso da aplicação é `America/Sao_Paulo`.
- Juros são arredondados por cobrança, em duas casas, meio para cima. Totalizadores somam valores já arredondados. Exemplo: R$ 1.000,00, taxa 2%, 30 dias → juros R$ 20,00; atualizado R$ 1.020,00.
- Valores são `DECIMAL` no MySQL; pagamento usa aritmética decimal com Brick Math. O cálculo SQL e o de pagamento possuem testes de equivalência. A apresentação preserva centavos de grandes somas, sem converter as strings decimais para `float`.
- Status é derivado: `paid` se houve pagamento, `overdue` se em aberto com vencimento anterior à data de referência, `pending` nos demais casos. Não existe uma coluna de status que fique desatualizada à meia-noite.
- Pagamento registra data, valor efetivamente recebido e juros na **data do pagamento**, inclusive quando retroativo. Não pode preceder a emissão nem estar no futuro.
- Pagamento quita integralmente a cobrança. Diferenças de valor representam desconto/acréscimo; pagamentos parciais e estornos não fazem parte desta versão. O valor atualizado de uma cobrança paga continua sendo original + juros congelados; o recebido é o valor efetivo e pode ser diferente.
- Uma cobrança paga não pode ser editada nem paga novamente. Transação com `SELECT … FOR UPDATE` protege pagamento e edição concorrentes.
- Clientes inativos permanecem no histórico, mas não podem ser selecionados em novos cadastros/alterações de cobrança. Documento tem validação de formato (11/14 dígitos) e unicidade; não faz consulta à Receita nem verifica dígitos de CPF/CNPJ.
- Esta versão representa **uma empresa compartilhada**: os usuários autenticados acessam os mesmos clientes/cobranças. Arquivos de exportação pertencem exclusivamente a quem os solicitou.

## Arquitetura

```text
Navegador → nginx (React) → Apache/PHP (Laravel) → MySQL
                                  │                 ↑
                                  └── fila no banco ┤
                                         worker ────┘ → storage privado
                                         scheduler → limpeza de arquivos expirados
```

O frontend só formata valores e apresenta resultados. `BillingReport` concentra filtros, ordenação e agregações. `InterestCalculator` define a regra financeira. Controllers e Form Requests controlam autenticação, validação e transações. `GenerateReport` materializa um snapshot consistente e `ReportWriter` grava os arquivos em lotes.

A API fica em `backend/routes/web.php` de propósito: aplica a pilha de sessão e CSRF a todas as mutações. Sanctum identifica a sessão; não há tokens no localStorage. Frontend e backend usam a mesma origem, evitando configuração CORS e cookies entre domínios. Há limites de tentativas de login e de solicitação de exportações. Detalhes dos endpoints: [docs/API.md](docs/API.md).

## Relatórios e grandes volumes

### Consultas e paginação

Os filtros de data/cliente/status e a ordenação são executados no banco. Intervalos de datas são inclusivos e não aplicam funções às colunas filtradas. O join de clientes evita N+1. A página traz no máximo 100 registros, usando cursor com desempate por ID; não há `OFFSET` crescente em páginas profundas. A interface oferece anterior/próxima, sem prometer um número de páginas calculado à força.

Totalizadores são agregações SQL sobre **todos** os registros filtrados, não apenas a página. No MySQL, a transação com isolamento padrão REPEATABLE READ mantém linhas e totais da mesma resposta no mesmo snapshot. Requisições de páginas diferentes refletem o estado atual; não prometem um snapshot de toda a sessão de navegação.

### Índices

| Tabela / índice | Objetivo |
| --- | --- |
| `customers(document)` único | Integridade do documento e busca por prefixo |
| `customers(name, id)` | Busca e ordenação por nome, com cursor estável |
| `customers(active, id)` | Seleção de clientes por situação |
| `charges(issued_at, id)`, `(due_at, id)`, `(paid_at, id)` | Faixas por data e continuidade de páginas |
| `charges(customer_id, <cada data>, id)` | Filtros de um cliente dentro de um período |
| `charges(paid_at, due_at, id)` | Em aberto/vencidas, sem atualizar status diariamente |
| `charges(original_amount, id)` | Ordenação por valor original |
| `report_exports(user_id, created_at)` e `(expires_at)` | Histórico privado e expiração |
| `report_export_rows(export_id, charge_id)` único | Snapshot e paginação por identificador |
| `report_export_rows(export_id, <issued_at/due_at/original_amount>, charge_id)` | Percorrer o snapshot na ordenação solicitada |

Não há um índice para toda combinação possível; índices adicionais também custam escrita e armazenamento. Busca de clientes é por **prefixo**, não `%texto%`. Consulte exemplos de `EXPLAIN` em [docs/PERFORMANCE.md](docs/PERFORMANCE.md).

Com milhões de linhas, a memória PHP de paginação continua limitada. A agregação exata ainda exige ler os registros correspondentes: relatórios irrestritos não se tornam constantes apenas por existirem índices. Períodos seletivos, réplicas, agregações pré-computadas e cache com invalidação são melhorias para produção. Não há benchmark de milhões de registros declarado como realizado.

### Exportações

1. A API valida e salva filtros, formato e data de referência; retorna HTTP 202.
2. O worker cria um snapshot no MySQL por `INSERT … SELECT`. Linhas e valores ficam estáveis mesmo que o cadastro mude durante a geração. O snapshot corresponde ao início do processamento, com juros na data da solicitação.
3. Totais são calculados sobre esse snapshot, e as linhas são percorridas com cursor. CSV usa lotes de 500, escrita incremental, UTF-8 com BOM, separador `;`, aspas e proteção contra fórmulas de planilha.
4. PDF usa Dompdf limitado a 250 cobranças por arquivo. Relatórios maiores produzem um ZIP com PDFs numerados; cada parte inclui filtros e totais globais claramente identificados. Relatórios vazios também geram arquivos válidos.
5. Só o arquivo concluído pode ser baixado; os snapshots são removidos após o término. Arquivos expiram em 24 horas; o scheduler remove arquivos e registros expirados a cada hora.

Memória é proporcional ao lote/parte, mas tempo e espaço em disco são proporcionais ao número de registros. O snapshot evita transação de leitura durante toda a renderização, ao custo de espaço adicional e carga de I/O na cópia inicial. Em milhões de registros o PDF gera muitas partes: o CSV é a opção mais prática para análise. Não se tenta renderizar milhões de linhas em um único documento Dompdf.

Há limite de duas exportações ativas por usuário, três solicitações por minuto, timeout de uma hora e `retry_after` de 3700 segundos, maior que o timeout. Falhas ficam visíveis na interface. Para volumes que excedam uma hora, será necessário particionar os jobs, retomar por checkpoints e ajustar infraestrutura; a configuração atual não garante concluir qualquer volume arbitrário.

### Gerar massa de dados

```sh
docker compose exec backend php artisan billing:generate 100000
docker compose exec backend php artisan billing:generate 1000000
```

São novas cobranças, inseridas em lotes de 1000; clientes carregados em memória são limitados a 1000. O comando não apaga dados existentes. Factories também estão disponíveis para clientes e cobranças.

## Próximos passos de produção

TLS, cookies Secure, credenciais próprias, `APP_ENV=production`, desativar a demonstração, imagens sem dependências de desenvolvimento, backups e política de retenção. Acrescentar perfis de acesso e auditoria de pagamentos, observabilidade de filas/consultas, Redis, storage S3 com downloads autorizados e processamento particionado conforme métricas reais. Os serviços locais são uma base de avaliação, não uma configuração de alta disponibilidade.

## Entrega e uso de IA

As instruções de desenvolvimento estão em [AGENTS.md](AGENTS.md) e `backend/AGENTS.md`; as convenções do Laravel Boost estão em `backend/CLAUDE.md`. O enunciado foi preservado em `docs/ENUNCIADO.md`. O código foi desenvolvido com auxílio de IA e verificação por testes; não foram usados agentes paralelos.

O repositório original é [Inffus-Developers/teste-desenvolvedor-gerador-de-relatorios](https://github.com/Inffus-Developers/teste-desenvolvedor-gerador-de-relatorios), e o fork é [C1ph3rBR/teste-desenvolvedor-gerador-de-relatorios](https://github.com/C1ph3rBR/teste-desenvolvedor-gerador-de-relatorios). A solução permanece local na branch `matheus`, com o histórico anterior preservado em `matheus-local-backup`. A integração dos históricos está preparada para revisão e commit manual; a solução ainda não foi enviada ao fork e nenhum PR foi aberto. O README original de `upstream/main` foi preservado integralmente em [docs/ENUNCIADO.md](docs/ENUNCIADO.md). Modelo de descrição: [docs/PULL_REQUEST.md](docs/PULL_REQUEST.md).

As verificações executadas e limitações do ambiente estão em [docs/VALIDACAO.md](docs/VALIDACAO.md).
