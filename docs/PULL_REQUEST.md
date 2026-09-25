# Aplicação de faturamento com Laravel, React e relatórios assíncronos

Implementa autenticação, gestão de clientes e cobranças, pagamento com juros congelados e relatório por período/cliente/status. CSV é gravado em lotes e PDF é dividido em partes limitadas, usando snapshot no MySQL e processamento em fila.

## Executar

`cp .env.example .env` e `docker compose up --build -d`. Acesso em http://localhost:8080, e-mail `admin@clara.local`, senha `Clara@2026!`.

## Validar

`docker compose --profile test run --build --rm test`. Instruções para build, testes frontend e E2E estão no README. Conferir `docs/VALIDACAO.md` para os testes efetivamente executados.

## Decisões

- Sessão Sanctum + CSRF na mesma origem, sem tokens persistidos pelo frontend.
- Juros simples proporcionais a dias, valores decimais e pagamento transacional com bloqueio de linha.
- Filtros, ordenação, agregação e paginação por cursor no banco; índices por cliente/data e estado de pagamento.
- Exportação assíncrona com snapshot, memória limitada e armazenamento privado por 24h. PDF acima de 250 linhas é entregue como ZIP de PDFs.

README e `docs/PERFORMANCE.md` explicam índices, custos para milhões de registros e melhorias de produção. `AGENTS.md` registra instruções de desenvolvimento assistido por IA.

## Pendências para entrega

Este documento é um modelo. A URL original do teste ainda precisa ser fornecida para criar o fork e abrir o PR exigido. Confirmar a execução completa do Compose em um host com Docker funcional; eventuais limitações locais estão descritas em `docs/VALIDACAO.md`.
