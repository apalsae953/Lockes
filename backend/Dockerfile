# Usamos PHP 8.2 con Apache como base
FROM php:8.2-apache

# Instalamos dependencias del sistema y extensiones de PHP necesarias para Laravel
# Se incluye libpq-dev para PostgreSQL (Supabase) y libzip-dev para la extensión zip
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    libpq-dev \
    && docker-php-ext-install pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd filter zip

# Activamos el módulo rewrite de Apache (vital para las rutas de Laravel)
RUN a2enmod rewrite

# Instalamos Composer desde la imagen oficial
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Establecemos el directorio de trabajo
WORKDIR /var/www/html

# Copiamos los archivos del backend al contenedor
COPY . .

# Instalamos las dependencias de Laravel optimizando para producción
RUN composer install --no-interaction --optimize-autoloader --no-dev

# Configuramos los permisos de las carpetas de Laravel para Apache
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Cambiamos el DocumentRoot de Apache para que apunte a la carpeta 'public' de Laravel
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# CONFIGURACIÓN CRÍTICA: Permitir que el archivo .htaccess de Laravel controle las rutas
# Esto evita el error 404 en rutas como /auth/google
RUN echo '<Directory /var/www/html/public/>\n\
    Options Indexes FollowSymLinks\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' > /etc/apache2/conf-available/laravel.conf \
    && a2enconf laravel

# Exponemos el puerto 80
EXPOSE 80

# Comando para arrancar Apache
CMD ["apache2-foreground"]