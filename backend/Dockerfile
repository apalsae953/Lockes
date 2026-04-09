FROM php:8.4-apache

# Instalación de extensiones
RUN apt-get update && apt-get install -y \
    libpng-dev libonig-dev libxml2-dev libzip-dev \
    zip unzip git curl libpq-dev \
    && docker-php-ext-install pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd filter zip

# Activamos rewrite para que el .htaccess funcione
RUN a2enmod rewrite

# Configuramos el DocumentRoot a /public directamente
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Habilitamos AllowOverride All para que el .htaccess de Laravel tome el control
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .

# Instalación de dependencias
RUN composer install --no-interaction --optimize-autoloader --no-dev

# Permisos vitales
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
RUN chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80

# Limpiamos caché de rutas al arrancar para evitar que use rutas viejas
CMD sh -c "php artisan route:clear && php artisan config:clear && php artisan migrate --force && apache2-foreground"