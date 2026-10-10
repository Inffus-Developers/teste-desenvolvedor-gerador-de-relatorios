# TDGR — Sistema de Gestão Financeira e Relatórios

Sistema full-stack desenvolvido para controle e emissão de cobranças, apuração automatizada de juros compostos diários sobre títulos em atraso e consolidação analítica com exportação em relatórios CSV e PDF.

---

## 🛠️ Stack Tecnológica

- **Backend:** PHP 8.4+, Laravel 11/12, Laravel Sanctum, MySQL 8.0, `barryvdh/laravel-dompdf`
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Lucide / Inline SVG
- **Infraestrutura Local:** Docker & Docker Compose, Nginx

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- [Docker](https://www.docker.com/) e Docker Compose instalados
- [Node.js](https://nodejs.org/) v18+ (opcional, para execução local do frontend)

#### Comandos docker compose

# Subir os containers da aplicação
docker compose up -d --build

# Instalar dependências PHP e gerar a chave da aplicação
docker compose exec app composer install
docker compose exec app php artisan key:generate

# Executar migrações e popular o banco de dados
docker compose exec app php artisan migrate --seed

# Limpar caches de configuração e rotas
docker compose exec app php artisan config:clear
docker compose exec app php artisan route:clear

---

## 🗄️ Estrutura de Banco de Dados, Performance e Escalabilidade

### 1. Quais índices foram criados

Na tabela `billings`:
- `INDEX idx_billings_due_date (due_date)`
- `INDEX idx_billings_status (status)`
- `INDEX idx_billings_customer_id (customer_id)`
- `INDEX idx_billings_status_due_date (status, due_date)` *(Índice Composto)*
- `INDEX idx_billings_customer_status (customer_id, status)` *(Índice Composto)*

Na tabela `customers`:
- `INDEX idx_customers_status (status)`
- `UNIQUE INDEX idx_customers_document (document)`

---

### 2. Por que esses índices foram escolhidos

- **`due_date` e `status`:**  
  A listagem e os relatórios aplicam ordenação cronológica decrescente (`ORDER BY due_date DESC`) e filtros frequentes pelo estado da cobrança (`WHERE status = ?`). A presença desses índices previne operações custosas de *filesort* em disco e acelera a recuperação das linhas.

- **Índice Composto `(status, due_date)`:**  
  As análises de inadimplência e projeções financeiras buscam cobranças filtrando simultaneamente o status e um intervalo temporal (`WHERE status = 'pending' AND due_date BETWEEN ? AND ?`). O índice composto permite que o mecanismo B-Tree resolva ambas as condições diretamente no nó do índice, eliminando a leitura desnecessária de blocos da tabela primária.

- **`customer_id` e `(customer_id, status)`:**  
  Otimiza as junções e o carregamento adiantado (`with('customer')`), além de garantir resposta em tempo constante ao inspecionar o histórico ou pendências de um cliente específico sem realizar *Full Table Scan*.

- **`document` (Único):**  
  Assegura consistência e integridade cadastral para CPF/CNPJ diretamente no nível do banco de dados, viabilizando buscas pontuais por documento com complexidade $O(1)$.

---

### 3. Como o relatório se comportaria com milhões de registros

- **Listagem Paginada (`LIMIT / OFFSET`):**  
  Com milhões de registros, páginas profundas (como `OFFSET 500000 LIMIT 15`) apresentam lentidão no MySQL tradicional, pois o banco precisa ler e descartar todos os registros anteriores antes de entregar o conjunto final. Embora os índices compostos mantenham as primeiras páginas com latência abaixo de **20ms**, consultas com offsets elevados sofreriam degradação progressiva.

- **Cálculo de Agregações em Tempo Real (`SUM` e `COUNT`):**  
  Calcular o sumário executivo (Volume Total, Total Pago, Pendente e Inadimplência) em tempo real requer a varredura de milhões de entradas no índice. Sob tráfego concorrente elevado, essa operação aumentaria o consumo de I/O e CPU do servidor de banco de dados.

---

### 4. Como a exportação em PDF e CSV se comportaria com grandes volumes

- **Exportação em CSV:**  
  **Alta escalabilidade e baixo consumo de memória.**  
  Implementada via `Symfony\Component\HttpFoundation\StreamedResponse` combinada com leitura em lotes (`chunk` ou `cursor`), a exportação transmite os dados diretamente pelo socket HTTP conforme são lidos. O consumo de memória RAM do PHP permanece estável e baixo (geralmente inferior a **20MB**), comportando volumes expressivos sem sobrecarregar o container.

- **Exportação em PDF:**  
  **Gargalo severo de memória e CPU com DomPDF.**  
  Bibliotecas que realizam parsing de HTML para PDF (como o DomPDF) carregam a árvore DOM completa em memória para calcular paginação, quebras de linha e fluxo do documento.  
  - Tentar gerar um único PDF síncrono com mais de **2.000 a 3.000 registros** resultará inevitavelmente em estouro de memória (`Allowed memory size exhausted`) ou encerramento por tempo limite (`504 Gateway Timeout` ou `Maximum execution time exceeded`).
  - *Mitigações aplicadas:* Conversão dos dados para arrays leves (liberando modelos Eloquent com `unset`), desativação de requisições de rede remotas (`isRemoteEnabled => false`) e aplicação de teto máximo de registros por arquivo síncrono para garantir a estabilidade do serviço.

---

### 5. Quais melhorias adicionais poderiam ser aplicadas em produção

1. **Processamento Assíncrono com Filas:**  
   Desacoplar a geração de relatórios pesados da requisição HTTP síncrona. A API deve retornar `202 Accepted` de imediato e processar o trabalho em background via **Laravel Horizon / Redis**. O relatório finalizado é enviado para um storage compatível com S3 (AWS S3, Cloudflare R2 ou MinIO) com notificação enviada por e-mail, Webhook ou WebSocket.

2. **Mecanismo Dedicado para Compilação de PDF:**  
   Substituir renderizadores PHP puros por motores de alta performance executados em microsserviços dedicados (como **Gotenberg**, **Puppeteer Headless** ou binários Go/Rust), projetados para gerenciar concorrência e memória de maneira muito mais eficiente.

3. **Cache de Métricas Agregadas e Tabelas Consolidadas:**  
   Armazenar métricas do sumário executivo em cache com **Redis** ou criar tabelas agregadas alimentadas periodicamente por rotinas agendadas (*scheduled jobs*), dispensando a execução de `SUM()` em milhões de linhas a cada requisição de tela.

4. **Paginação Baseada em Cursor (Keyset Pagination):**  
   Substituir a paginação numérica tradicional por cursor (`WHERE id < ? ORDER BY id DESC LIMIT 15`). Essa abordagem garante busca em tempo constante $O(1)$, independentemente da quantidade de milhões de linhas presentes na base.

5. **Réplicas de Leitura (Read Replicas):**  
   Configurar separação de leitura e escrita (`read/write connection`) no Laravel, direcionando todas as consultas pesadas de listagem e exportação para réplicas de leitura, preservando a instância primária contra sobrecarga em horários de pico.

---

### 6. Requisitos não cumpridos:

- Exportação de PDF não roda com muitos registros (Garantir que a exportação dos relatórios seja preparada para grandes volumes)
- Testes automatizados, só inclui alguns cenários.