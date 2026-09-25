# Backend Laravel

Siga as instruções de ../AGENTS.md e as convenções geradas em CLAUDE.md.

O bootstrap do Laravel Boost foi concluído. Não reinstale ferramentas globais.
A instalação e a execução reproduzíveis estão no README da raiz, via Docker.

- PHP 8.4, Laravel 13, Sanctum 4, Dompdf 3 e PHPUnit 12.
- Execute php artisan test para testes; em Docker use o serviço test (MySQL isolado).
- Execute vendor/bin/pint para formatar PHP.
- Não execute testes destrutivos contra o banco clara; use clara_test.
