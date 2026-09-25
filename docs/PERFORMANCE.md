# Estratégia de performance

## Planos de execução

Após gerar massa de dados, atualize estatísticas e inspecione faixas representativas no MySQL:

```sql
ANALYZE TABLE charges;

EXPLAIN ANALYZE
SELECT id, customer_id, original_amount, due_at
FROM charges
WHERE customer_id = 1
  AND due_at BETWEEN '2026-01-01' AND '2026-12-31'
ORDER BY due_at, id
LIMIT 16;

EXPLAIN ANALYZE
SELECT id, customer_id, original_amount, due_at
FROM charges
WHERE paid_at IS NULL
  AND due_at < '2026-09-21'
ORDER BY due_at, id
LIMIT 16;
```

Os índices candidatos são `charges_customer_id_due_at_id_index` e `charges_paid_at_due_at_id_index`. O otimizador pode escolher outro plano em tabelas pequenas ou filtros pouco seletivos. Avalie linhas examinadas, custo do sort, distribuição de datas e latência; não use `FORCE INDEX` sem evidência.

## Limites e custos explícitos

- Listagem: no máximo 100 linhas retornadas; join único de clientes. Cursor evita percorrer offsets profundos. Campos ordenáveis são uma lista permitida e têm desempate por ID.
- Totalizadores: agregação exata O(n) no subconjunto filtrado. O PHP recebe uma linha, mas isso não elimina o custo no MySQL.
- Exportação: snapshot no banco em um único `INSERT SELECT`, seguido de leitura por cursor. Durante a cópia pode haver carga de undo/redo e contenção; ela deve ser monitorada. O snapshot fica estável após a cópia, sem manter uma transação aberta durante a renderização.
- Memória PHP: proporcional a 500 linhas para CSV e 250 para PDF, mais o custo fixo do framework/renderizador. ZIP mantém metadados de cada parte e usa disco para os PDFs até finalizar o arquivo.
- Espaço: snapshot + saída + partes temporárias do PDF. A limpeza periódica não substitui métricas de ocupação nem quotas globais.
- Fila: um worker por padrão, até duas solicitações ativas por usuário. Timeout 3600s e reserva 3700s; arquivos muito grandes podem exceder a janela e falhar de forma visível.
- Paginação sob edição concorrente: páginas representam requisições diferentes. Uma cobrança cujo campo de ordenação mude pode se deslocar entre páginas. Exportações têm snapshot próprio para consistência de auditoria.

## Evolução baseada em métricas

Em produção: testar a distribuição real, considerar índices adicionais seletivos, réplica dedicada para relatórios, agregado diário por cliente e status, cache de totais com invalidação por alterações/pagamentos e troca de data, filas separadas por tamanho, snapshots particionados e jobs retomáveis. Para milhões de registros sem filtros, considerar CSV particionado em storage de objetos e limitar a geração de PDFs com base em custo estimado.

O projeto fornece `billing:generate` para reproduzir testes de volume; disponibilizar esse comando não equivale a garantir uma latência específica em milhões de registros.
