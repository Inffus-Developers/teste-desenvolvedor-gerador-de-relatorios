FROM php:8.4-fpm-alpine

# Instalar dependências de sistema para compilar e rodar as extensões do Laravel
RUN apk add --no-cache \
    bash \
    curl \
    libpng-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    oniguruma-dev \
    icu-dev \
    freetype-dev \
    libjpeg-turbo-dev \
    linux-headers

# Configurar e instalar extensões oficiais do PHP
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        mbstring \
        zip \
        bcmath \
        gd \
        intl \
        opcache

# Instalar o Composer diretamente da imagem oficial mais recente
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Diretório padrão onde o código do Laravel ficará montado
WORKDIR /var/www/html

EXPOSE 9000
CMD ["php-fpm"]