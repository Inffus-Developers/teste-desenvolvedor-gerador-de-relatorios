FROM php:8.4-apache
RUN apt-get update && apt-get install -y --no-install-recommends \
    git unzip curl libzip-dev libonig-dev libicu-dev libsqlite3-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql pdo_sqlite mbstring zip intl gd pcntl opcache \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/*
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/html
COPY composer.json composer.lock ./
RUN composer install --no-scripts --prefer-dist --no-interaction
COPY . .
RUN composer dump-autoload --optimize --no-interaction \
    && chown -R www-data:www-data storage bootstrap/cache
COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf
COPY docker/php.ini /usr/local/etc/php/conf.d/billing.ini
COPY docker/entrypoint.sh /usr/local/bin/billing-entrypoint
RUN chmod +x /usr/local/bin/billing-entrypoint
ENTRYPOINT ["billing-entrypoint"]
CMD ["apache2-foreground"]
