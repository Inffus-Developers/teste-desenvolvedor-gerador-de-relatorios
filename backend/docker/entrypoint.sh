#!/bin/sh
set -e

if [ ! -f .env ]; then
    cp .env.example .env
fi

if [ ! -d vendor ]; then
    composer install --no-interaction --prefer-dist
fi

if ! grep -q '^APP_KEY=base64:' .env; then
    php artisan key:generate --force
fi

php artisan migrate --seed --force

exec php -d "memory_limit=${PHP_MEMORY_LIMIT:-512M}" -S 0.0.0.0:8000 -t public
