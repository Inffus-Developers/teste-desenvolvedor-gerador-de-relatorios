#!/bin/sh
set -eu
mkdir -p storage/app/private storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs
if [ -z "${APP_KEY:-}" ]; then
    if [ ! -f storage/app/application.key ]; then
        php -r 'echo "base64:".base64_encode(random_bytes(32));' > storage/app/application.key
    fi
    export APP_KEY="$(cat storage/app/application.key)"
fi
chown -R www-data:www-data storage bootstrap/cache
exec "$@"
