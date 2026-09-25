# Instruções de desenvolvimento

Aplicação de faturamento do teste técnico: Laravel, React/TypeScript, MySQL e Docker.

- Toda regra financeira é aplicada pelo backend. Valores monetários usam DECIMAL; juros simples proporcionais a dias corridos, mês comercial de 30 dias.
- Cobranças pagas são imutáveis. Pagamento exige transação e bloqueio da linha.
- APIs e downloads exigem autenticação. Sessão em cookie HttpOnly e proteção CSRF.
- Filtros e ordenações são validados e executados no banco. Nunca carregar um relatório inteiro em memória.
- Exportações usam filas, leitura em lotes e arquivos privados. PDF tem partes limitadas.
- Não registrar segredos nem adicionar dependências locais, arquivos exportados ou massa de dados ao Git.
- Fazer commits semânticos separados por responsabilidade e testar regras de negócio e integrações.
- Documentar limitações verificadas; nunca afirmar que testes foram executados sem executá-los.

## Escopo autorizado

O usuário solicitou uma primeira versão completa local para revisão. O enunciado exige fork e PR, mas o repositório original ainda não foi fornecido. Não inventar um remoto nem publicar uma entrega em outro repositório.
