# API

Base: mesma origem do frontend, prefixo `/api`. Envie `Accept: application/json` e `Content-Type: application/json`. Sessão em cookie; antes do login, faça `GET /sanctum/csrf-cookie`. Em POST/PUT envie `X-XSRF-TOKEN` com o cookie `XSRF-TOKEN` decodificado. O navegador envia o cookie HttpOnly de sessão automaticamente.

| Método | Endpoint | Descrição |
| --- | --- | --- |
| POST | `/login` | `{email, password}` → `{user}` |
| POST | `/logout` | Encerra e invalida sessão |
| GET | `/user` | Usuário autenticado |
| GET / POST | `/customers` | Lista com cursor / cadastro |
| GET / PUT | `/customers/{id}` | Visualização / alteração |
| GET / POST | `/charges` | Lista com cursor / cadastro |
| GET / PUT | `/charges/{id}` | Visualização / alteração se em aberto |
| POST | `/charges/{id}/payment` | `{paid_at, paid_amount}`; quitação integral |
| GET | `/reports/billing` | `{rows: {data, next_cursor, prev_cursor, ...}, totals, as_of}` |
| POST | `/exports` | Filtros + `{format: "csv" \| "pdf"}` → exportação HTTP 202 |
| GET | `/exports` | Últimas 20 solicitações do usuário, com status/progresso |
| GET | `/exports/{uuid}/download` | Arquivo concluído, privado e não expirado |

Todos os endpoints de negócio, inclusive downloads, exigem autenticação. Não há exclusão nem cadastro público de usuários.

## Campos de cliente

`name`, `document` (11 ou 14 dígitos, único, aceita máscara na entrada), `email`, `active` (boolean). Lista: `search` por prefixo de nome/documento, `active=0|1`, `sort=id|name|document`, `direction=asc|desc`, `per_page=1..100` e `cursor`.

## Campos de cobrança

`customer_id` (ativo), `description` (até 500 caracteres), `original_amount` (0,01 até 99.999.999,99; até 2 casas), `monthly_interest_rate` (0..100; até 4 casas), `issued_at` e `due_at` (YYYY-MM-DD). Emissão entre 2000-01-01 e hoje; vencimento igual ou posterior à emissão e até 2100-12-31.

`paid_at`, `paid_amount`, juros e status não são aceitos no cadastro/edição. O endpoint de pagamento controla esses valores separadamente. Valores monetários retornados como strings decimais devem ser preservados; o frontend não refaz cálculos financeiros.

## Filtros de cobranças, relatório e exportação

```text
start_date=2026-09-01
end_date=2026-09-30
date_field=due_at             # issued_at | due_at | paid_at
customer_id=1                # opcional
status=overdue               # pending | overdue | paid, opcional
sort=due_at                  # id | issued_at | due_at | original_amount
direction=asc                # asc | desc
per_page=15                  # apenas tela, máximo 100
cursor=...                   # apenas tela, opaco
```

As duas datas devem ser enviadas juntas ou ambas omitidas. Datas são inclusivas. `date_field` padrão da API é `issued_at`; a interface escolhe explicitamente `due_at`. Os mesmos filtros são salvos na exportação; cursor e tamanho de página são descartados para exportar o conjunto completo. Ordenação é preservada nos arquivos.

Totais: `count`, `original_amount`, `interest`, `updated_amount`, `received_amount`, `pending_amount`. `pending_amount` soma o atualizado das cobranças ainda não pagas. O valor recebido não precisa coincidir com o atualizado, pois descontos/acréscimos na quitação são permitidos.

## Respostas de erro

200 consulta/alteração, 201 cadastro, 202 exportação enfileirada; 401 não autenticado; 404 inexistente ou arquivo de outro usuário; 409 cobrança já paga/imutável ou arquivo em processamento; 410 arquivo expirado; 419 sessão/CSRF expirado; 422 validação; 429 limite excedido. Validações retornam `{message, errors: {campo: [mensagens]}}`. Falhas internas não expõem stack traces com `APP_DEBUG=false`.
