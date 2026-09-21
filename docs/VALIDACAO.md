# Validação da primeira versão

Verificações executadas em 21/09/2026, em Windows, com PHP 8.4.25, MySQL Community 8.4.11 e Node 24.19.0 locais. Os runtimes auxiliares ficam em `.tools/`, ignorado pelo Git; não são necessários para executar a solução pelo Docker.

| Verificação | Resultado |
| --- | --- |
| Backend PHPUnit, MySQL isolado | **23 testes, 112 assertions, todos passaram** |
| Frontend Vitest | **4 testes, todos passaram** |
| Playwright, Chromium, desktop e celular | **2 testes ponta a ponta, todos passaram** |
| TypeScript e build Vite de produção | **Passaram** |
| Composer validate | **Manifesto e lockfile válidos** |
| Laravel Pint | **Formatação aplicada** |
| Docker Compose config | **Configuração válida** |
| Gerador de massa | **10.000 cobranças criadas no banco isolado** |
| CSV com 10.000 registros | **10.000 linhas de dados + 7 de cabeçalho/metadados** |
| PDF real baixado pela interface | **Renderizado e inspecionado com Poppler** |

Os testes de navegador executaram login, filtros/listagem, cadastro de cliente, cadastro de cobrança, pagamento com desconto, atualização do status, solicitação de CSV/PDF, download, logout e navegação/formulários em viewport móvel de 390 × 844. Não houve exceções JavaScript no fluxo completo.

Na verificação local com 10.000 registros, agregação + snapshot + CSV + contagem do arquivo levaram aproximadamente **1,5 segundo**, com **30 MiB de pico de memória PHP**. Esses números são uma verificação pontual, sem concorrência e com caches aquecidos; não representam SLA nem projeção para milhões de registros. O gerador usou lotes de 1.000 e a exportação, lotes de 500.

`EXPLAIN` escolheu `charges_customer_id_due_at_id_index` para cliente/período e `charges_paid_at_due_at_id_index` para cobranças em aberto e vencidas. Ambos usaram acesso `range` e `Using index condition` nesta massa.

## Limitação do ambiente

O Docker Desktop está instalado, mas o motor Linux não ficou disponível nesta máquina (`dockerDesktopLinuxEngine`: pipe não encontrado). Por isso **o build e a inicialização completos dos containers não foram executados aqui**. A configuração Compose foi validada; backend, frontend, worker e MySQL foram executados como processos locais para validar a aplicação. A execução integral por Docker deve ser confirmada em um host com o motor funcionando.

Não foram executados testes com milhões de linhas, carga concorrente de múltiplos usuários ou testes de stress de memória do PDF com milhares de partes. Também não há porcentagem de cobertura de código medida. A aplicação fornece gerador, testes e CI para continuar essas verificações.

O fork e o PR permanecem pendentes da URL do repositório original.
