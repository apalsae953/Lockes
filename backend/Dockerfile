FROM php:8.4-apache

# 1. Instalación de extensiones de sistema y PHP
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

# 2. Configuración de Apache
RUN a2enmod rewrite

# Forzamos el DocumentRoot a la carpeta /public de Laravel para evitar el 404
RUN sed -i 's|/var/www/html|/var/www/html/public|g' /etc/apache2/sites-available/000-default.conf
RUN sed -i 's|/var/www/html|/var/www/html/public|g' /etc/apache2/apache2.conf

# Permitimos que el archivo .htaccess de Laravel tome el control de las rutas
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# 3. Instalación de Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 4. Preparación del código
WORKDIR /var/www/html
COPY . .

# Instalación de dependencias de PHP
RUN composer install --no-interaction --optimize-autoloader --no-dev

# 5. Permisos para que Laravel pueda escribir (Sesiones, Logs y Cache)
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
RUN chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80

# 6. Comandos de arranque: Limpieza de rutas y ejecución del servidor
# Esto asegura que Render lea las rutas nuevas que has escrito en web.php
CMD sh -c "php artisan route:clear && php artisan config:clear && php artisan migrate --force && apache2-foreground"