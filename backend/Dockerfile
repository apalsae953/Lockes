# 1. Usamos la imagen oficial de PHP 8.4 con Apache (Debian Bookworm)
FROM php:8.4-apache

# 2. Instalamos las dependencias del sistema y extensiones de PHP necesarias
# Incluimos libpq-dev para PostgreSQL (Supabase) y librerías para imágenes y zip
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

# 3. Activamos el módulo rewrite de Apache (Vital para que funcionen las rutas de Laravel)
RUN a2enmod rewrite

# 4. Instalamos Composer desde la imagen oficial
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 5. Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /var/www/html

# 6. Copiamos todo el contenido de la carpeta backend al contenedor
COPY . .

# 7. Instalamos las dependencias de Laravel optimizando para producción
RUN composer install --no-interaction --optimize-autoloader --no-dev

# 8. Ajustamos permisos para que Apache pueda escribir en storage y cache
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# 9. Configuramos el DocumentRoot de Apache para que apunte a /public
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# 10. CLAVE PARA EL 404: Permitimos que el archivo .htaccess de Laravel gestione las rutas
RUN echo '<Directory /var/www/html/public/>\n\
    Options Indexes FollowSymLinks\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' > /etc/apache2/conf-available/laravel.conf \
    && a2enconf laravel

# 11. Exponemos el puerto 80 para el tráfico web
EXPOSE 80

# 12. COMANDO DE ARRANQUE: Ejecuta migraciones y enciende el servidor
# Al ponerlo aquí, no necesitas poner nada en el panel de Render
CMD sh -c "php artisan route:clear && php artisan config:clear && php artisan migrate --force && apache2-foreground"