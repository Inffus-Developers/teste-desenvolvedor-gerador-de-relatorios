# Teste Técnico — Desenvolvedor Fullstack

## Objetivo

Desenvolver uma aplicação simples de faturamento com autenticação e um módulo de relatórios preparado para trabalhar com grandes volumes de dados.

O objetivo do teste é avaliar organização de código, modelagem de banco de dados, performance, domínio de backend e frontend, aplicação de regras de negócio e capacidade de justificar decisões técnicas.

---

## Tecnologias obrigatórias

### Backend

* PHP
* Laravel

### Frontend

* React ou Next.js
* TypeScript

### Banco de dados

* MySQL

### Infraestrutura

* Docker
* Docker Compose

---

## Contexto do projeto

A aplicação será utilizada para registrar cobranças realizadas para clientes.

Cada cobrança deverá possuir informações como:

* Cliente
* Descrição
* Valor original
* Data de emissão
* Data de vencimento
* Data de pagamento
* Status
* Taxa de juros
* Valor final atualizado

O sistema deverá possuir autenticação. Apenas usuários autenticados poderão acessar os registros e os relatórios.

---

## Funcionalidades obrigatórias

### 1. Autenticação

O sistema deverá permitir:

* Login
* Logout
* Proteção das rotas do sistema
* Proteção dos endpoints da API

Não é necessário desenvolver cadastro público de usuários.

---

### 2. Gestão de clientes

O sistema deverá permitir:

* Cadastrar clientes
* Editar clientes
* Listar clientes
* Visualizar os dados de um cliente

Dados mínimos do cliente:

* Nome
* Documento
* E-mail
* Status

---

### 3. Gestão de cobranças

O sistema deverá permitir:

* Cadastrar cobranças
* Editar cobranças
* Listar cobranças
* Visualizar uma cobrança
* Registrar o pagamento de uma cobrança

Dados mínimos da cobrança:

* Cliente
* Descrição
* Valor original
* Data de emissão
* Data de vencimento
* Data de pagamento
* Taxa de juros mensal
* Status

---

## Regra de negócio — cálculo de juros

Quando uma cobrança estiver vencida e ainda não estiver paga, o sistema deverá calcular seu valor atualizado em tempo real.

O cálculo deverá considerar:

* Valor original
* Taxa de juros mensal da cobrança
* Quantidade de dias em atraso
* Data atual

O candidato poderá escolher entre juros simples ou juros compostos, desde que:

* A regra utilizada esteja documentada
* O cálculo seja realizado no backend
* O resultado seja consistente em todas as telas e relatórios
* O valor calculado não precise obrigatoriamente ser salvo no banco de dados

Exemplo utilizando juros compostos:

```text
valor_atualizado = valor_original × (1 + taxa_mensal) ^ (dias_em_atraso / 30)
```

Ao registrar o pagamento, o sistema deverá armazenar:

* Data do pagamento
* Valor efetivamente pago
* Valor dos juros no momento do pagamento

---

## Módulo de relatórios

Desenvolver um relatório de faturamento por período.

O relatório deverá permitir filtros por:

* Data inicial
* Data final
* Cliente
* Status da cobrança

O usuário deverá conseguir escolher se o período será baseado em:

* Data de emissão
* Data de vencimento
* Data de pagamento

O relatório deverá exibir:

* Cliente
* Descrição da cobrança
* Data de emissão
* Data de vencimento
* Status
* Valor original
* Juros calculados
* Valor atualizado
* Valor pago

Também deverão ser exibidos totalizadores:

* Quantidade de cobranças
* Valor original total
* Total de juros
* Valor atualizado total
* Valor total recebido
* Valor total pendente

---

## Exportação dos relatórios

O relatório deverá poder ser exportado nos seguintes formatos:

* PDF
* CSV

As exportações deverão respeitar os filtros aplicados pelo usuário.

O arquivo exportado deverá conter:

* Período selecionado
* Filtros utilizados
* Dados do relatório
* Totalizadores

A solução adotada para geração dos relatórios deverá ser definida pelo candidato.

---

## Requisitos de performance

O módulo de relatórios deverá ser projetado considerando tabelas com milhões de registros.

A aplicação não precisa incluir milhões de registros no repositório, mas deverá possuir uma forma de gerar dados para testes.

Requisitos obrigatórios:

* Paginação realizada no backend
* Filtros realizados no banco de dados
* Ordenação realizada no backend
* Não carregar todos os registros em memória
* Evitar consultas N+1
* Criar índices adequados no banco de dados
* Utilizar migrations
* Disponibilizar factories ou seeders para gerar um volume significativo de dados
* Garantir que a exportação dos relatórios seja preparada para grandes volumes

O candidato deverá explicar no README:

* Quais índices foram criados
* Por que esses índices foram escolhidos
* Como o relatório se comportaria com milhões de registros
* Como a exportação em PDF e CSV se comportaria com grandes volumes
* Quais melhorias adicionais poderiam ser aplicadas em produção

---

## Frontend

O frontend deverá possuir, no mínimo:

* Tela de login
* Listagem de clientes
* Cadastro e edição de clientes
* Listagem de cobranças
* Cadastro e edição de cobranças
* Tela do relatório de faturamento
* Filtros do relatório
* Paginação
* Ordenação
* Exportação em PDF
* Exportação em CSV
* Estados de carregamento
* Tratamento de erros
* Feedback de operações realizadas com sucesso

A interface não precisa possuir um design avançado, mas deverá ser organizada, responsiva e componentizada.

---

## API

A comunicação entre frontend e backend deverá ocorrer por API.

A API deverá possuir:

* Validação das requisições
* Respostas HTTP adequadas
* Tratamento de erros
* Autenticação
* Paginação
* Filtros
* Ordenação
* Geração de relatórios em PDF
* Geração de relatórios em CSV

A estrutura e o padrão dos endpoints ficam a critério do candidato.

---

## Dockerização

O projeto deverá ser completamente executável por Docker.

A estrutura deverá incluir, no mínimo:

* Serviço do backend
* Serviço do frontend
* Serviço do MySQL
* Arquivo `docker-compose.yml`
* Configurações necessárias para comunicação entre os serviços
* Persistência dos dados do banco
* Instruções para subir o ambiente

O projeto deverá poder ser iniciado com poucos comandos, sem necessidade de configurar manualmente PHP, Node.js ou MySQL na máquina local.

---

## Testes automatizados

O projeto deverá possuir testes automatizados no backend.

Cenários mínimos:

* Usuário não autenticado não acessa o relatório
* Usuário não autenticado não exporta relatórios
* Cálculo de juros para cobrança vencida
* Cobrança paga não continua acumulando juros
* Filtros do relatório
* Totalizadores do relatório
* Registro de pagamento
* Exportação do relatório em PDF
* Exportação do relatório em CSV

Testes no frontend serão considerados um diferencial.

---

## Uso de inteligência artificial

O uso de ferramentas de inteligência artificial durante o desenvolvimento é permitido, mas não obrigatório.

Caso sejam utilizadas ferramentas de IA, as configurações, instruções ou arquivos utilizados para orientar os agentes deverão ser mantidos dentro do repositório do projeto.

Também será avaliada a forma como o candidato utiliza e configura agentes de IA no processo de desenvolvimento.

Boas práticas no uso serão consideradas de forma positiva.

---

## Organização dos commits

O desenvolvimento deverá ser realizado com commits pequenos, semânticos e separados por responsabilidade.

Evite concentrar toda a implementação em poucos commits grandes.

Exemplos:

```text
feat: add authentication structure
feat: create customers module
feat: create billing module
feat: add overdue interest calculation
feat: create billing report filters
feat: add csv report export
feat: add pdf report export
test: add billing interest tests
chore: add docker environment
docs: update project instructions
```

Os commits também serão considerados durante a avaliação.

---

## Entrega

O projeto deverá ser desenvolvido a partir do repositório disponibilizado para o teste.

Ao finalizar, o candidato deverá abrir um Pull Request no repositório com a solução completa.

O Pull Request deverá conter:

* Título claro e objetivo
* Resumo da solução desenvolvida
* Instruções para executar o projeto
* Instruções para executar os testes
* Explicação das decisões técnicas
* Explicação da estratégia de performance
* Explicação da geração dos relatórios
* Pontos que não foram concluídos, caso existam

O repositório deverá conter:

* Código do backend
* Código do frontend
* Dockerfiles
* Arquivo `docker-compose.yml`
* Migrations
* Factories e seeders
* Testes automatizados
* Arquivo `.env.example`
* Instruções para executar o projeto
* Instruções para executar os testes
* Explicação das decisões técnicas
* Explicação da estratégia de performance

Não serão aceitas entregas por arquivo compactado, e-mail ou outro repositório externo.

A resposta do teste deverá ser enviada exclusivamente por meio do Pull Request aberto no repositório disponibilizado.

---

## Critérios de avaliação

Serão avaliados:

* Organização e legibilidade do código
* Arquitetura da aplicação
* Modelagem do banco de dados
* Qualidade da API
* Componentização do frontend
* Uso correto do TypeScript
* Aplicação da regra de negócio
* Performance das consultas
* Estratégia de geração dos relatórios
* Segurança e autenticação
* Dockerização do projeto
* Qualidade dos testes automatizados
* Tratamento de erros
* Documentação
* Histórico de commits
* Qualidade e organização do Pull Request
* Configuração e uso de agentes de IA, caso utilizados

---

## Diferenciais

Serão considerados diferenciais:

* Testes no frontend
* Controle de acesso por perfil
* Documentação da API
* Uso de ferramentas de análise de consultas
* Estratégia para geração de relatórios muito grandes
* Cache de relatórios ou totalizadores
* Pipeline de integração contínua
* Monitoramento ou observabilidade
* Cobertura de testes documentada

---

## Prazo sugerido

Prazo de entrega sugerido: até 5 dias corridos.

O teste foi planejado para exigir aproximadamente 8 a 12 horas de desenvolvimento.

Não é necessário implementar funcionalidades além das solicitadas. O foco deve estar na qualidade da solução, nas decisões técnicas e na clareza da implementação.

---

## Implementação

### Estado atual

Etapa 7 — performance: geração configurável de dados em lotes, índices por base de período e testes isolados do banco local.

### Como executar

Requisitos: Docker Desktop com Docker Compose.

1. Copie as variáveis de ambiente da raiz:

   ```bash
   cp .env.example .env
   ```

   No Windows PowerShell, use `Copy-Item .env.example .env`.

2. Construa e inicie todos os serviços:

   ```bash
   docker compose up --build
   ```

3. Acesse:

   * Frontend: http://localhost:5173
   * API/backend: http://localhost:8000

O backend aguarda o MySQL ficar saudável, instala dependências quando necessário e executa as migrations automaticamente. Os dados do MySQL ficam persistidos no volume `mysql_data`.

Para encerrar os serviços:

```bash
docker compose down
```

O comando acima preserva os dados. Para remover os volumes deliberadamente, use `docker compose down --volumes`.

### Como validar a fundação

```bash
docker compose config
docker compose exec backend php artisan test
docker compose exec frontend npm run build
```

### Estrutura

* `backend/`: API Laravel e testes automatizados.
* `frontend/`: aplicação React/TypeScript com Vite.
* `docker-compose.yml`: orquestra backend, frontend e MySQL.

As instruções serão ampliadas ao final de cada etapa funcional.

### Autenticação

Não há cadastro público de usuários. Ao iniciar o ambiente, o seeder cria ou atualiza o administrador definido no `.env` da raiz:

```dotenv
ADMIN_NAME=Administrador
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=password
```

Altere essas credenciais antes de usar o sistema fora do ambiente local. Depois de atualizar um ambiente já iniciado, execute:

```bash
docker compose exec backend php artisan db:seed --force
```

No frontend, acesse http://localhost:5173 e informe as credenciais configuradas. O token de acesso fica no `sessionStorage`, é enviado como Bearer token para a API e é removido ao sair ou quando a sessão deixa de ser válida.

Endpoints disponíveis:

| Método | Endpoint | Autenticação | Finalidade |
| --- | --- | --- | --- |
| `POST` | `/api/login` | Pública, limitada a 5 tentativas por minuto | Autenticar e emitir token |
| `GET` | `/api/user` | Bearer token | Consultar usuário autenticado |
| `POST` | `/api/logout` | Bearer token | Revogar o token atual |

Exemplo de login pela API:

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

Para executar os testes de autenticação:

```bash
docker compose exec backend php artisan test --filter=AuthenticationTest
```

### Gestão de clientes

Após o login, a tela inicial exibe o módulo de clientes. O usuário pode:

* listar clientes com paginação no backend;
* buscar por nome, documento ou e-mail;
* filtrar por status ativo ou inativo;
* ordenar por nome, documento, e-mail ou status;
* cadastrar, visualizar e editar clientes.

Os campos nome, documento, e-mail e status são obrigatórios. Documento e e-mail devem ser únicos.

Endpoints protegidos disponíveis:

| Método | Endpoint | Finalidade |
| --- | --- | --- |
| `GET` | `/api/customers` | Listar, filtrar, ordenar e paginar |
| `POST` | `/api/customers` | Cadastrar cliente |
| `GET` | `/api/customers/{id}` | Visualizar cliente |
| `PUT/PATCH` | `/api/customers/{id}` | Editar cliente |

Parâmetros aceitos na listagem:

* `page` e `per_page` — página e quantidade, limitada a 100 registros;
* `search` — busca em nome, documento e e-mail;
* `status` — `active` ou `inactive`;
* `sort` — `name`, `document`, `email`, `status` ou `created_at`;
* `direction` — `asc` ou `desc`.

Para executar somente os testes de clientes:

```bash
docker compose exec backend php artisan test --filter=CustomerApiTest
```

A tabela `customers` possui índices únicos em documento e e-mail, índice em nome e índice composto em status/nome. Eles atendem à identificação única, à ordenação padrão por nome e à listagem frequente por status seguida de nome.

### Gestão de cobranças

No menu **Cobranças**, o usuário pode cadastrar, editar, listar e visualizar cobranças, além de registrar pagamentos. Cobranças pagas ficam bloqueadas para edição a fim de preservar os dados financeiros históricos.

Cada cobrança contém cliente, descrição, valor original, emissão, vencimento, taxa mensal de juros e status. Ao registrar o pagamento, também são armazenados:

* data do pagamento;
* valor efetivamente pago;
* valor dos juros calculados na data do pagamento.

Endpoints protegidos:

| Método | Endpoint | Finalidade |
| --- | --- | --- |
| `GET` | `/api/billings` | Listar, filtrar, ordenar e paginar |
| `POST` | `/api/billings` | Cadastrar cobrança |
| `GET` | `/api/billings/{id}` | Visualizar cobrança e valores atualizados |
| `PUT/PATCH` | `/api/billings/{id}` | Editar cobrança ainda não paga |
| `POST` | `/api/billings/{id}/payment` | Registrar pagamento |

#### Regra de juros

Foi adotado o cálculo de **juros compostos pro rata por dia**. A taxa mensal é informada e armazenada como percentual — por exemplo, `3` representa 3% ao mês — e o backend aplica:

```text
valor_atualizado = valor_original × (1 + taxa_mensal / 100) ^ (dias_em_atraso / 30)
juros = valor_atualizado - valor_original
```

Os dias em atraso são contados do vencimento até a data atual. Uma cobrança não vencida tem juros iguais a zero. O resultado monetário é arredondado para duas casas decimais.

O valor atualizado de cobranças pendentes é calculado em tempo real e não é persistido. No pagamento, o backend calcula os juros usando a data informada, grava esse valor em `interest_paid` e muda o status para `paid`. Depois disso, a cobrança não acumula novos juros.

#### Índices das cobranças

* `(status, due_date)`: listagens de pendentes, vencidas e pagas por vencimento;
* `(customer_id, issue_date)`: consultas e futuros relatórios de um cliente por emissão;
* `payment_date`: relatórios baseados em recebimento;
* `created_at`: ordenação administrativa e paginação por criação.

Para executar somente os testes desta etapa:

```bash
docker compose exec backend php artisan test --filter=BillingApiTest
```

### Relatório de faturamento

No menu **Relatórios**, selecione a data inicial, data final e a base do período:

* data de emissão;
* data de vencimento;
* data de pagamento.

Também é possível filtrar por cliente e status (`pending`, `overdue` ou `paid`). A tabela exibe cliente, descrição, emissão, vencimento, status, valor original, juros, valor atualizado e valor pago.

O endpoint protegido é:

```text
GET /api/reports/billings
```

Parâmetros obrigatórios:

* `date_from`;
* `date_to`;
* `period_basis`: `issue_date`, `due_date` ou `payment_date`.

Parâmetros opcionais:

* `customer_id`;
* `status`;
* `sort` e `direction`;
* `page` e `per_page`, limitado a 100 registros por página.

Os totalizadores retornados são quantidade de cobranças, valor original total, total de juros, valor atualizado total, valor recebido e valor pendente.

#### Estratégia de consulta e performance

Os filtros e a ordenação são aplicados pelo MySQL antes da paginação. A consulta das linhas usa eager loading do cliente com seleção apenas de `id` e `name`, evitando N+1. Somente a página solicitada é materializada pela aplicação.

Os seis totalizadores são calculados em uma única consulta de agregação no banco. A fórmula dos juros compõe uma subconsulta SQL, portanto nenhuma coleção completa de cobranças é carregada em PHP. Para cobranças pagas, a agregação usa os juros congelados em `interest_paid`; para pendentes vencidas, usa `POWER` e `DATEDIFF` do MySQL com a data atual.

Os índices definidos na tabela de cobranças atendem aos principais caminhos do relatório:

* `(status, due_date)` para status e vencimento;
* `(customer_id, issue_date)` para cliente e emissão;
* `payment_date` para períodos de recebimento;
* `created_at` para ordenação administrativa.

Com milhões de registros, o banco continua filtrando, ordenando e agregando sem transferir todas as linhas para a aplicação. Páginas muito profundas e agregações sobre períodos excessivamente amplos ainda podem ser custosas. Em produção, as próximas otimizações seriam paginação por cursor para navegação sequencial, réplica de leitura, cache de totalizadores por conjunto de filtros, tabelas de resumo por dia/cliente e processamento assíncrono de períodos muito grandes.

Para executar os testes do relatório:

```bash
docker compose exec backend php artisan test --filter=BillingReportTest
```

### Exportação do relatório

Na tela do relatório, use **Exportar CSV** ou **Exportar PDF**. As duas opções reutilizam a mesma validação, consulta, filtros, ordenação, cálculo de juros e totalizadores exibidos na tela.

Endpoints protegidos:

```text
GET /api/reports/billings/export/csv
GET /api/reports/billings/export/pdf
```

Todos os parâmetros aceitos pelo relatório devem ser enviados também à exportação. Os arquivos incluem período, base do período, cliente, status, dados e totalizadores.

#### CSV e grandes volumes

O CSV é enviado como resposta em streaming, com BOM UTF-8 e separador `;`. A consulta usa `lazy` em blocos configuráveis por `REPORT_CSV_CHUNK_SIZE` — padrão de 1.000 registros — e escreve cada linha diretamente em `php://output`. Assim, a memória da aplicação permanece limitada ao bloco atual, mesmo quando o resultado possui muitos registros.

#### PDF e grandes volumes

O PDF possui cabeçalho, filtros, totalizadores, tabela e numeração de páginas em A4 paisagem. Como renderizadores HTML para PDF precisam manter a árvore do documento em memória, o sistema limita a exportação a `REPORT_PDF_MAX_ROWS`, padrão de 2.000 registros. Acima do limite, a API retorna `422` e orienta o uso de CSV.

Em produção, PDFs maiores devem ser gerados de forma assíncrona em filas, divididos em arquivos menores quando necessário e armazenados temporariamente em object storage com link de expiração. O limite síncrono protege workers HTTP contra esgotamento de memória e timeout.

Para executar os testes das exportações:

```bash
docker compose exec backend php artisan test --filter=BillingReportExportTest
```

### Dados para testes de performance

O comando abaixo gera, por padrão, 1.000 clientes e 100.000 cobranças usando as factories do projeto:

```bash
docker compose exec backend php artisan app:generate-performance-data
```

As quantidades e o tamanho dos blocos podem ser informados em cada execução:

```bash
docker compose exec backend php artisan app:generate-performance-data \
  --customers=1000 \
  --billings=10000 \
  --chunk=1000
```

No Windows PowerShell, o mesmo comando pode ser escrito em uma única linha. Também é possível alterar os padrões no `.env` da raiz:

```dotenv
PERFORMANCE_CUSTOMERS=1000
PERFORMANCE_BILLINGS=100000
PERFORMANCE_CHUNK_SIZE=1000
```

O comando é aditivo: cada execução cria um novo conjunto de clientes e cobranças, sem apagar dados existentes. Aproximadamente um terço das cobranças geradas fica pago e o restante pendente, permitindo testar diferentes filtros e totalizadores. Em produção, há confirmação interativa; a opção `--force` deve ser usada apenas de forma deliberada.

O `PerformanceDataSeeder` oferece a mesma geração com os valores do ambiente:

```bash
docker compose exec backend php artisan db:seed --class=PerformanceDataSeeder
```

#### Estratégia de geração

Clientes e cobranças são materializados e inseridos em lotes configuráveis. A aplicação mantém em memória somente o lote atual de modelos e a lista de identificadores dos clientes gerados, evitando acumular todas as cobranças. Inserções em bloco também reduzem viagens ao banco em comparação com um `INSERT` por modelo.

Como referência local, a geração de 1.000 clientes e 10.000 cobranças em blocos de 1.000 levou aproximadamente 5 segundos. Esse valor é apenas indicativo e varia conforme CPU, disco e recursos destinados ao Docker.

#### Índices e consultas em grande volume

Além dos índices compostos `(status, due_date)` e `(customer_id, issue_date)`, a tabela `billings` possui índices individuais em `issue_date`, `due_date` e `payment_date`. Os índices individuais são necessários quando o relatório filtra somente pelo período, sem cliente ou status; os compostos atendem aos filtros combinados mais frequentes.

Os planos `EXPLAIN` foram conferidos no MySQL com 10.000 cobranças. Consultas por emissão e vencimento selecionaram, respectivamente, `billings_issue_date_index` e `billings_due_date_index`, com varredura por intervalo em vez de leitura integral da tabela.

Com milhões de registros, a paginação, os filtros, a ordenação e os totalizadores permanecem no banco. Para produção em escala maior, as evoluções recomendadas são paginação por cursor para páginas profundas, réplicas de leitura, tabelas de resumo, cache de agregações, particionamento por data após análise da distribuição real e geração assíncrona de exportações.

#### Isolamento dos testes

A suíte automatizada usa SQLite em memória. Dessa forma, `php artisan test` não recria nem altera o banco MySQL utilizado pela interface. A imagem Docker inclui `pdo_sqlite` exclusivamente para essa execução isolada.

Para executar somente os testes do gerador e dos índices:

```bash
docker compose exec backend php artisan test --filter=GeneratePerformanceDataTest
```
