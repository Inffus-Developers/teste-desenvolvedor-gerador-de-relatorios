# Equivalência financeira PHP / MySQL — validação final

Diagnóstico reproduzido sobre `930d161` e correção mínima validada em 25/09/2026. A seção de reprodução preserva os resultados anteriores à correção.

## Implementação atual

| Elemento | Local e significado |
| --- | --- |
| Cálculo PHP | `backend/app/Services/InterestCalculator.php::calculate()`, linhas 14–20; usado ao pagar |
| Expressão SQL | `InterestCalculator::sql()`, linhas 23–30; usada por `BillingReport::query()` |
| Resposta individual | `ChargeController::show()` usa a mesma consulta SQL do relatório; não é outra implementação PHP de apresentação |
| Totalizadores | `BillingReport::totals()` agrega no MySQL os valores já arredondados por linha |
| Taxa | Percentual mensal: `2.0000` significa 2%; não é fração `0.02` |
| Fórmula | Juros simples = original × taxa percentual × dias de atraso / 3000 |
| Arredondamento | PHP: BigDecimal, duas casas, HalfUp. SQL: `ROUND(..., 2)` sobre expressão decimal |
| Dias | PHP: datas civis `Y-m-d` reconstruídas à meia-noite UTC, `diffInDays` e mínimo zero. SQL: `GREATEST(0, DATEDIFF(...))` |
| Pendente | Não paga, vencimento igual ou posterior à referência; juros zero |
| Vencida | Não paga, vencimento anterior à referência; juros calculados até a referência |
| Paga | Juros vêm de `paid_interest`, congelados na data informada do pagamento |
| Atualizado | Original + juros, inclusive após pagamento com desconto/acréscimo |
| Recebido | `paid_amount`; independente do atualizado. NULL é apresentado como zero |
| Pendente total | Soma do atualizado apenas das cobranças ainda não pagas |

Tipos confirmados por `information_schema.columns`:

| Coluna | MySQL | Limite superior da API |
| --- | --- | --- |
| original_amount | DECIMAL(12,2) | 99.999.999,99 |
| monthly_interest_rate | DECIMAL(7,4) | 100% |
| paid_amount | DECIMAL(14,2) | 999.999.999.999,99 |
| paid_interest | DECIMAL(14,2) | Calculado pelo backend |

A coluna de original comporta 9.999.999.999,99, acima do limite da API.
Esses extremos foram inseridos diretamente como fixtures para testar a leitura
e o cálculo SQL, sem afirmar que a API os aceita. Não se testou pagamento nem
exportação desses originais fora do domínio permitido pela API.

## Método e cobertura

Ambiente: PHP 8.4.25, MySQL 8.4.11 em `127.0.0.1:3310`, banco isolado
`clara_test`, InnoDB, `REPEATABLE-READ`, usuário `clara_test_runner` restrito.
`div_precision_increment=4`; SQL mode inclui `STRICT_TRANS_TABLES`.

O oráculo usa **inteiros arbitrários**: centavos do original × taxa em unidades
de 0,0001% × dias; soma metade do divisor e faz divisão inteira por 30.000.000.
As datas civis são comparadas em UTC no oráculo para não repetir a interpretação
de horas locais do código sob teste. A correção produtiva reconstrói as duas datas civis com `createFromFormat("!Y-m-d", ..., "UTC")`; não converte os mesmos instantes para outro fuso.
Não há tolerância monetária nem conversão de dinheiro para float. Normalizar em
centavos exige resultado inteiro exato; uma fração de centavo não é truncada.

- **1.144 combinações de limites:** 11 originais × 8 taxas × 13 atrasos.
- Originais: 0,01; 0,05; 0,14; 0,15; 0,16; 1,00; 99,99; 1.000,00;
  4.224,10; 99.999.999,99; 9.999.999.999,99.
- Taxas: 0; 0,0001; 0,0123; 1,2345; 2; 5; 99,9999; 100%.
- Atrasos: -30, -1, 0, 1, 2, 29, 30, 31, 59, 60, 61, 365 e 9.760 dias.
  Valores negativos representam cobranças ainda não vencidas.
- **1.000 casos gerados**, Mt19937 com seed `20260925`; 250 pagamentos passam
  pelo endpoint real, com datas retroativas e valores recebidos variados.
- **31 fixtures adicionais:** 8 fronteiras de calendário, 3 meios centavos,
  10 pagamentos com comparação posterior, 7 linhas de conjunto misto, 1 fixture
  repetida sob 3 locales e 2 reproduções mínimas de horário de verão.
- Total: **2.175 cobranças de teste**, distribuídas em 8 métodos. Comparações
  repetidas por locale e após congelamento não são contadas como novas cobranças.
- Relógio principal: 21/09/2026; testes de calendário e DST usam suas próprias
  datas fixas. Congelamento também é verificado em 01/03/2028.

Para cada caso sem divergência, são comparados PHP, consulta SQL, resposta HTTP
individual e totalizadores de uma linha. Conjuntos sem divergência comparam a
soma exata das linhas com os agregados. O conjunto misto também verifica o
endpoint do relatório com página de uma linha e totais das sete cobranças.

O corpus gerado continua após uma assertion financeira falhar, registra índice,
entradas, referência, valores PHP/SQL e resultado esperado, e falha ao final.
Isso não converte falhas em sucesso. Após a correção, todas as linhas e o agregado completo desse corpus passaram, assim como os agregados da matriz de limites, meios centavos, pagamentos e conjunto misto.

## Resultados anteriores à correção e menor reprodução

- Matriz de limites: 1.144/1.144 passaram.
- Corpus gerado: 1.000 percorridos; 995 passaram, 5 divergiram.
- Métodos financeiros novos: **5 passaram e 3 falharam**, 37.981 assertions.
- Testes financeiros/pagamento/relatório preexistentes selecionados:
  **11 testes / 29 assertions passaram**.
- Suíte backend preexistente em MySQL: **28 testes / 142 assertions passaram**.
- Locales efetivamente verificados: C (ponto), Portuguese_Brazil.1252 e
  German_Germany.1252 (vírgula). Resultados monetários idênticos nesses locales.

Reprodução mínima em `America/Sao_Paulo`:

| Entrada | Valor |
| --- | --- |
| Original | 0,15 |
| Taxa | 100% |
| Vencimento | 16/10/2016 |
| Referência | 17/10/2016 |
| PHP | **0,00** de juros |
| MySQL / dias civis | **0,01** de juros |

Com original 1.000,00 e taxa 2%, nas mesmas datas, PHP congela **0,00** no
pagamento, enquanto o juro por um dia civil é **0,67**.

O runtime mostrou:

```text
due      = 2016-10-16T01:00:00-02:00
as_of    = 2016-10-17T00:00:00-02:00
diffInDays = 0.9583333333333334
(int) diffInDays = 0
MySQL DATEDIFF('2016-10-17', '2016-10-16') = 1
```

Na transição histórica, meia-noite não existiu. Carbon normaliza a data para
01:00, e a conversão do intervalo fracionário para inteiro perde um dia.
**A diferença ocorre antes da aritmética monetária**: não é erro de DECIMAL,
divisão monetária, locale ou HalfUp. O float envolvido é o número de dias.

Casos gerados com falha (juros em reais, ponto como separador decimal):

| Índice | Vencimento | Situação | PHP / histórico salvo | Dias civis esperados |
| --- | --- | --- | --- | --- |
| 404 | 2006-11-05 | Paga | 8836558074.99 | 8837775567.14 |
| 527 | 2016-10-16 | Em aberto | 260923536.84 | 260995495.90 |
| 612 | 2004-11-02 | Paga | 5010175802.83 | 5010803329.86 |
| 736 | 2017-10-15 | Paga | 2509809387.12 | 2510579503.53 |
| 823 | 2017-10-15 | Em aberto | 2558223399.70 | 2559007649.66 |

Nas linhas em aberto o SQL retorna o esperado. Nas pagas, o SQL retorna o
histórico gravado pelo PHP: igualdade PHP/SQL, sozinha, não detectaria o erro.
O oráculo independente e o teste do pagamento detectam esse congelamento errado.

## Correção mínima aplicada e validada

As datas `dueAt` e `asOf` são reconstruídas como `Y-m-d` à meia-noite UTC somente na contagem de dias de `InterestCalculator::calculate()`. Não há conversão de instantes locais. Permanecem o timezone público da aplicação, a fórmula simples, BigDecimal, HalfUp, limites e transações.

Resultado final: **12 testes MySQL passaram, 38.233 assertions** (8 financeiros e 4 concorrentes). Os 1.144 casos de limites e os 1.000 casos gerados passaram sem divergências, incluindo os cinco casos anteriormente falhos. A suíte backend existente passou com **28 testes e 142 assertions**. Pint passou. Nenhuma outra regra financeira foi alterada.

Juros de cobranças já pagas não são regravados automaticamente: permanecem imutáveis. Uma eventual revisão de dados históricos exige decisão separada.

## Reexecução

Usar a instância exclusiva e os grants descritos em `CONCORRENCIA.md`. A suíte
financeira exige seu próprio opt-in e recusa driver/banco incorretos antes de
`migrate:fresh`. Não executar em paralelo com outra suíte que use `clara_test`.

```powershell
cd backend
$env:DB_CONNECTION='mysql'; $env:DB_DATABASE='clara_test'
$env:DB_HOST='127.0.0.1'; $env:DB_PORT='3310'
$env:DB_USERNAME='clara_test_runner'
$env:DB_PASSWORD=Read-Host 'Senha exclusiva de testes' -MaskInput
$env:DB_URL=''; $env:MYSQL_FINANCIAL_TESTS='1'
& ../.tools/php/php.exe vendor/bin/phpunit -c phpunit.mysql.xml --filter FinancialEquivalenceTest
& ../.tools/php/php.exe artisan test --compact --filter 'InterestCalculatorTest|test_sql_and_php_interest|test_payment|test_report_totals'
& ../.tools/php/php.exe artisan test --compact
& ../.tools/php/php.exe vendor/bin/pint --dirty --format agent
git diff --check
```

```bash
cd backend
export DB_CONNECTION=mysql DB_DATABASE=clara_test DB_HOST=127.0.0.1 DB_PORT=3310
export DB_USERNAME=clara_test_runner DB_URL='' MYSQL_FINANCIAL_TESTS=1
read -r -s -p 'Senha exclusiva de testes: ' DB_PASSWORD; printf '\n'
export DB_PASSWORD
php vendor/bin/phpunit -c phpunit.mysql.xml --filter FinancialEquivalenceTest
php artisan test --compact
```

Para executar também os testes de concorrência com essa configuração, definir
`MYSQL_CONCURRENCY_TESTS=1` e remover o filtro. O comando sem filtro inclui as
duas classes; a configuração normal `phpunit.xml` não inclui `tests/MySql`.

Limitações: conjunto finito; não é teste de performance, exportação, Docker ou
reparo de dados históricos. O resultado é específico das versões e configurações
registradas. Logs locais em `artifacts/financial-matrix.log` não são versionados.
