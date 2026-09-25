# Concorrência financeira em MySQL

Validação local em 25/09/2026, sobre o código financeiro existente no commit
`94094f8`. Nenhuma alteração no controlador, cálculo ou regra de pagamento foi
necessária. A revisão final adicionou travas de ambiente e limpeza explícita.

## Ambiente e proteção do banco

- PHP 8.4.25, MySQL Community 8.4.11, Windows.
- Instância exclusiva dos testes: `127.0.0.1:3310`.
- Diretório de dados: `.tools/mysql-concurrency`, ignorado pelo Git.
- Banco: `clara_test`; tabela `charges`: **InnoDB**.
- Isolamento observado nas três conexões: **REPEATABLE-READ**, sem alteração do nível.
- `performance_schema` habilitado. O observador precisa consultar
  `data_lock_waits`, `data_locks` e `threads`.

A suíte exige variáveis de ambiente explícitas e recusa qualquer driver diferente de MySQL e qualquer banco diferente de
`clara_test`. Exige também `MYSQL_CONCURRENCY_TESTS=1` antes de executar
`migrate:fresh`. Não usa `RefreshDatabase`: as fixtures precisam estar commitadas
para serem vistas pelos dois processos. O banco é recriado a cada cenário;
**não executar contra dados que precisem ser preservados**, nem em paralelo com
outra suíte que use esse mesmo banco. A instância de desenvolvimento na porta
3308 e o banco `clara` não foram utilizados.

O XML não força nem substitui um banco informado incorretamente. Host, porta e
usuário devem vir do ambiente; a senha vem de `DB_PASSWORD` (vazia se ausente),
sem reaproveitar senha do `.env` de desenvolvimento. `DB_URL` não vazio é recusado.
A única chave no XML é uma APP_KEY determinística exclusiva de testes, sem uso
em implantação. Não há senha, token real ou caminho pessoal nesses arquivos.

O administrador provisiona uma vez o banco e um usuário restrito; a execução dos
testes **não requer root, PROCESS, SUPER nem privilégios globais administrativos**:

```sql
CREATE USER 'clara_test_runner'@'127.0.0.1' IDENTIFIED BY '<senha_de_teste>';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, ALTER, INDEX, REFERENCES
  ON clara_test.* TO 'clara_test_runner'@'127.0.0.1';
GRANT SELECT ON performance_schema.data_lock_waits TO 'clara_test_runner'@'127.0.0.1';
GRANT SELECT ON performance_schema.data_locks TO 'clara_test_runner'@'127.0.0.1';
GRANT SELECT ON performance_schema.threads TO 'clara_test_runner'@'127.0.0.1';
```

O acesso às três tabelas de instrumentação é verificado antes de recriar tabelas.
Uma falha mostra os grants necessários e o SQLSTATE. Os IDs registrados são
obtidos do banco durante cada execução; nenhum ID é fixado nas assertions.

## Comandos usados

Na raiz do projeto, a instância foi inicializada uma única vez em diretório novo:

```powershell
$mysqlBase = "$PWD/.tools/mysql/mysql-8.4.11-winx64"
$testData = "$PWD/.tools/mysql-concurrency"
# Apenas na primeira execução, antes de o diretório existir:
New-Item -ItemType Directory -Path $testData
& "$mysqlBase/bin/mysqld.exe" --no-defaults --initialize-insecure "--basedir=$mysqlBase" "--datadir=$testData" --console
# Em outro terminal, manter esta instância local de testes ativa:
& "$mysqlBase/bin/mysqld.exe" --no-defaults "--basedir=$mysqlBase" "--datadir=$testData" --port=3310 --bind-address=127.0.0.1 --mysqlx=OFF --console
```

A credencial root sem senha pertence somente a essa instância local descartável.
Com o servidor iniciado:

```powershell
& .tools/mysql/mysql-8.4.11-winx64/bin/mysql.exe -h 127.0.0.1 -P 3310 -u root -e "CREATE DATABASE clara_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
cd backend
$env:DB_CONNECTION = 'mysql'
$env:DB_HOST = '127.0.0.1'
$env:DB_PORT = '3310'
$env:DB_DATABASE = 'clara_test'
$env:DB_USERNAME = 'clara_test_runner'
$env:DB_PASSWORD = Read-Host 'Senha do usuário exclusivo de testes' -MaskInput
$env:DB_URL = ''
$env:MYSQL_CONCURRENCY_TESTS = '1'
& ../.tools/php/php.exe vendor/bin/phpunit -c phpunit.mysql.xml --filter ChargeConcurrencyTest
# Suíte preexistente também executada no mesmo MySQL isolado:
& ../.tools/php/php.exe artisan test --compact
```

É possível usar PHP e MySQL instalados normalmente substituindo os caminhos dos
executáveis. `phpunit.mysql.xml` é separado da configuração padrão para impedir
que a suíte concorrente seja executada acidentalmente em SQLite. As demais
variáveis podem ser adaptadas para outra instância exclusiva de testes MySQL 8;
a identificação do banco e o isolamento são verificados, não presumidos.

Em Linux/macOS, com MySQL já provisionado em instância exclusiva e PHP no PATH:

```bash
cd backend
export DB_CONNECTION=mysql DB_DATABASE=clara_test DB_HOST=127.0.0.1 DB_PORT=3310
export DB_USERNAME=clara_test_runner DB_URL='' MYSQL_CONCURRENCY_TESTS=1
read -r -s -p 'Senha do usuário exclusivo de testes: ' DB_PASSWORD; printf '\n'
export DB_PASSWORD
php vendor/bin/phpunit -c phpunit.mysql.xml --filter ChargeConcurrencyTest
php artisan test --compact
unset DB_PASSWORD MYSQL_CONCURRENCY_TESTS
```

Na revisão, a suíte passou com `clara_test_runner`, limitado aos grants acima
(senha vazia apenas na instância local descartável). Banco incorreto e ausência
de opt-in foram ensaiados: ambos falharam antes de executar migrations.

## Como a disputa é produzida

Cada operação roda em um **processo PHP independente**, inicializa o Laravel e
envia a requisição pelo kernel HTTP real, incluindo route binding, validações e
controlador. O usuário da fixture é autenticado diretamente no guard de teste.
Não há servidor HTTP serial compartilhado entre as operações. A suíte não mede
rede nem revalida o login/CSRF; isso é responsabilidade dos testes de integração
e navegador existentes.

1. A e B carregam o model pelo route binding, com a cobrança ainda não paga.
   Um listener de consultas avisa `bound` e aguarda uma mensagem no stdin.
2. O coordenador libera A. O `SELECT ... FOR UPDATE` produtivo adquire o bloqueio.
   O listener emite `locked`, com nível de transação 1, e segura A antes do UPDATE.
3. O coordenador libera B. O SQL de B fica bloqueado no MySQL, não numa simulação.
4. Uma terceira conexão consulta `performance_schema.data_lock_waits` e confirma
   B esperando por A, sobre um lock `RECORD` de `charges`. Registra IDs das duas
   conexões, das duas transações e modo de bloqueio.
5. Só após essa confirmação o coordenador libera A para atualizar e commitar
   (ou sofrer rollback). B então adquire o bloqueio e pausa no próprio `locked`.
6. O coordenador libera B e verifica respostas, estado persistido e nível de
   transação zero ao término das duas operações.

As barreiras usam pipes, mensagens JSON e confirmação do próprio banco. O loop
de observação faz pausas de 10 ms para não ocupar CPU e tem deadline monotônico
de 15 s; uma pausa não é usada como evidência de concorrência. O tempo de negócio
fica fixo em `2026-09-21 12:00:00 America/Sao_Paulo` em todos os processos.

Na disputa em que pagamento vence uma edição já iniciada, B (edição) chega ao
route binding **antes** de A. Assim o teste comprova que a instância antiga não
substitui a leitura e a nova verificação de estado dentro do bloqueio.

## Cenários e resultados

| Cenário | Respostas | Estado final comprovado |
| --- | --- | --- |
| Dois pagamentos | 200 / 409 | Apenas a primeira data e o primeiro valor persistem: 20/09, 910,00, juros 20,00 |
| Edição iniciou antes, pagamento bloqueou primeiro | 200 pagamento / 409 edição | Campos originais preservados; pagamento não sobrescrito |
| Edição bloqueou primeiro | 200 / 200 | Pagamento relê original 2.000,00, taxa 3%, vencimento 01/09; juros em 21/09 = 40,00 |
| Falha após UPDATE, antes de COMMIT | 500 controlado / 200 | Primeiro pagamento integralmente revertido; segunda operação persiste 21/09, 920,00, juros 20,67 |

O rollback é provocado por um observer `Charge::updated` registrado **somente no
processo de teste**. Quando o evento dispara, o UPDATE já ocorreu e a transação
ainda está aberta. A exceção percorre o código real de rollback. Antes de liberar
B para escrever, o observador compara todos os atributos da cobrança com o
estado original, incluindo os campos nulos de pagamento. Isso verifica ausência
de estado parcial e liberação do bloqueio para uma tentativa válida.

O schema guarda o pagamento na própria cobrança; portanto, “um pagamento” aqui
significa um único conjunto persistido de data, valor recebido e juros, não uma
linha em uma tabela separada de pagamentos.

A suíte passou após a revisão com **4 testes e 147 assertions**. A suíte preexistente passou
separadamente em MySQL com **28 testes e 142 assertions**. O log prefixado por
`MYSQL_CONCURRENCY` registra ambiente, espera física e resultados por cenário.
Exemplo real: observador 82, bloqueador 83 / transação 8421, requerente 84 /
transação 8422, `X,REC_NOT_GAP`, `RECORD`, `charges`, respostas 200/409.

## Sensibilidade a regressões

Foram criadas cópias temporárias do controlador, worker e teste em
`.tools/concurrency-mutations`, sem alterar arquivos produtivos. O worker
temporário carrega explicitamente a cópia do controlador antes do autoload da
classe original. As verificações executadas foram:

```powershell
# No backend, com o mesmo ambiente MySQL acima e as cópias temporárias preparadas:
& ../.tools/php/php.exe vendor/bin/phpunit -c phpunit.mysql.xml ../.tools/concurrency-mutations/no_lock/ChargeConcurrencyTest.php --filter test_only_one_concurrent_payment_is_persisted
& ../.tools/php/php.exe vendor/bin/phpunit -c phpunit.mysql.xml ../.tools/concurrency-mutations/no_paid_guard/ChargeConcurrencyTest.php --filter 'test_only_one_concurrent_payment_is_persisted|test_edit_started_before_payment_cannot_overwrite_the_paid_charge'
```

- Substituir `Charge::lockForUpdate()` por `Charge::query()` fez o teste falhar:
  a operação terminou sem adquirir o bloqueio esperado.
- Remover os dois `abort_if($locked->paid_at !== null, ...)` fez os dois testes
  falharem: receberam 200/200 em vez de 200/409.
- As falhas tiveram exit code 1. Depois, a suíte original foi executada novamente
  e passou. As cópias mutantes não fazem parte da entrega.

As cópias temporárias foram removidas após os ensaios. Não há mecanismo de
mutação nos arquivos versionados: o worker sempre usa o controlador real. Nem
`.tools/` nem `artifacts/concorrencia-mysql.diff` entram no commit.

## Limitações e erros

- Bloqueio de linha serializa decisões sobre a cobrança e obriga a segunda
  operação a revalidar seu estado. Idempotência por chave identifica repetições
  de uma solicitação; não substitui esse bloqueio, especialmente com chaves
  diferentes. Estes testes não adicionam nem dependem de chaves idempotentes.
- Deadlock, timeout de lock, erro de serialização, processo encerrado ou falta
  de instrumentação causam falha explícita, nunca sucesso, skip ou retry oculto.
  O worker registra exceções; os cenários normais exigem ausência delas. Somente
  a RuntimeException injetada no cenário de rollback é aceita.
- Não foi necessário diminuir isolamento, alterar lock timeout ou introduzir
  retry. Não houve deadlock nestes cenários de uma linha com ordem controlada.
  Não se demonstrou uma política de recuperação para disputas multi-linha.
- O teardown tenta encerrar todos os filhos mesmo se uma limpeza individual
  falhar, fecha pipes e desconecta o observador em `finally`. O worker faz
  rollback residual e disconnect em `finally`; em encerramento forçado, o SO
  fecha os descritores e o MySQL reverte a conexão encerrada. Os testes não
  criam arquivos temporários. Não executar simultaneamente outra suíte que
  recrie `clara_test`.
- A prova é local em MySQL 8.4.11. Não substitui validação em Docker, teste de
  carga, teste de falha de rede ou validação da fila de exportações.

Os arquivos separam configuração, coordenação/assertions, execução da requisição
no filho e documentação. Há um único worker parametrizado para pagamento,
edição e rollback; não há três implementações financeiras duplicadas nos testes.
