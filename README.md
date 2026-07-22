# Teste Técnico — Gerador de Relatórios (Inffus)

Aplicação fullstack de faturamento com autenticação, gestão de clientes/cobranças e relatório de faturamento preparado para grandes volumes.

## Stack

- **Backend:** PHP 8.3 + Laravel 13 + Sanctum + DomPDF
- **Frontend:** Next.js 15 + TypeScript + Tailwind CSS
- **Banco:** MySQL 8.4
- **Infra:** Docker + Docker Compose

## Como executar

Pré-requisitos: Docker e Docker Compose.

```bash
cp .env.example .env
docker compose up --build
```

Serviços:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api
- MySQL: localhost:3306

Login padrão (seed):

- E-mail: `admin@inffus.test`
- Senha: `password`

Para gerar mais dados de teste:

```bash
docker compose exec backend php artisan db:seed
# ou com volume maior
docker compose exec -e BILLING_SEED_COUNT=50000 backend php artisan db:seed --class=BillingSeeder
```

## Como executar os testes

```bash
docker compose exec backend php artisan test
```

Os testes usam SQLite em memória (`phpunit.xml`).

## Regra de juros (compostos)

Cobranças vencidas e não pagas têm o valor atualizado calculado **em tempo real no backend**:

```text
valor_atualizado = valor_original × (1 + taxa_mensal) ^ (dias_em_atraso / 30)
juros = valor_atualizado - valor_original
```

- Implementação: `backend/app/Services/InterestCalculator.php`
- Cobrança paga **não** continua acumulando juros; no pagamento são persistidos `payment_date`, `paid_amount` e `interest_amount_at_payment`.

## Decisões técnicas

- API REST com Laravel Sanctum (Bearer token) para proteger rotas e endpoints.
- Frontend Next.js consome apenas a API; estado de sessão via `localStorage`.
- Cálculo de juros centralizado no backend para garantir consistência em listagens, detalhe e relatórios.
- Relatórios com filtros/ordenação/paginação no banco; eager load de `customer` para evitar N+1.
- CSV streaming com `lazyById` (não carrega tudo em memória).
- PDF com DomPDF limitado a 2.000 linhas (com aviso); volumes maiores devem usar CSV ou fila assíncrona.

## Estratégia de performance

### Índices criados

**customers**

- `name`, `email`, `status`
- `document` único

**billings**

- `customer_id`, `status`, `issue_date`, `due_date`, `payment_date`
- compostos: `(status, issue_date)`, `(status, due_date)`, `(status, payment_date)`, `(customer_id, status)`, `(customer_id, issue_date)`

### Por que esses índices

Os filtros do relatório combinam status + campo de data e opcionalmente cliente. Os compostos cobrem os caminhos mais comuns do `WHERE`/`ORDER BY` sem full scan em volumes altos.

### Comportamento com milhões de registros

- Listagens e relatório paginam no MySQL.
- Filtros e ordenação ficam na query.
- Totalizadores percorrem o conjunto filtrado com cursor (`cursor()`), sem materializar a lista completa em arrays PHP.
- Em produção, totalizadores podem ser cacheados ou materializados por período.

### Exportações em grande volume

- **CSV:** stream por chunks de 500 IDs; adequado para extratos grandes.
- **PDF:** renderização HTML→PDF em memória; por isso há teto de 2.000 linhas. Acima disso, recomenda-se job assíncrono (fila) + armazenamento do arquivo.

### Melhorias adicionais em produção

- Filas para exportações grandes (S3 + notificação)
- Read replica / particionamento por data
- Cache Redis de totalizadores
- Observabilidade (slow query log, APM)
- CI com testes e análise estática

## Estrutura

```text
backend/     API Laravel
frontend/    Next.js
docker-compose.yml
.env.example
.cursor/     instruções usadas no desenvolvimento assistido por IA
```

## Uso de IA no desenvolvimento

Foi utilizado suporte de agentes de IA durante a implementação. As orientações ficam em `.cursor/rules/`.
