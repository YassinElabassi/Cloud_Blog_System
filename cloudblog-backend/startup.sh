#!/bin/bash

echo "=========================================="
echo "  CloudBlog Post-Deployment Script"
echo "=========================================="
echo ""

cd /home/site/wwwroot

# 0. CONFIGURE NGINX
echo "0️⃣  Configuring Nginx..."
cat > /etc/nginx/sites-available/default << 'NGINXCONF'
server {
    listen 8080 default_server;
    listen [::]:8080 default_server;
    
    root /home/site/wwwroot/public;
    index index.php index.html index.htm;
    
    server_name _;
    
    # Logs
    error_log /var/log/nginx/error.log;
    access_log /var/log/nginx/access.log;
    
    # Main location
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    # PHP-FPM
    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param PATH_INFO $fastcgi_path_info;
    }
    
    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
}
NGINXCONF

# Reload Nginx
nginx -s reload
echo "   ✅ Nginx configured and reloaded"
echo ""

# 1. PERMISSIONS
echo "1️⃣  Setting permissions..."
chmod -R 755 .
chmod -R 775 storage bootstrap/cache
chown -R nobody:nogroup .
echo "   ✅ Permissions configured"
echo ""

# 2. CLEAR CACHES
echo "2️⃣  Clearing caches..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
echo "   ✅ Caches cleared"
echo ""

# 3. OPTIMIZE
echo "3️⃣  Optimizing application..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
echo "   ✅ Application optimized"
echo ""

# 4. MIGRATIONS
echo "4️⃣  Running database migrations..."
php artisan migrate --force
echo "   ✅ Migrations completed"
echo ""

# 5. STORAGE LINK (si nécessaire)
if [ ! -L /home/site/wwwroot/public/storage ]; then
    echo "5️⃣  Creating storage link..."
    php artisan storage:link
    echo "   ✅ Storage linked"
    echo ""
fi

# 6. VERIFICATION
echo "6️⃣  Verification..."
echo "   📂 Document Root: $(nginx -T 2>/dev/null | grep 'root' | head -1)"
echo "   🐘 PHP Version: $(php -v | head -1)"
echo "   🚀 Laravel Version: $(php artisan --version)"
echo ""

echo "=========================================="
echo "  ✅ Deployment Completed Successfully!"
echo "=========================================="