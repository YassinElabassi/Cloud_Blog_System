#!/bin/bash

echo "=========================================="
echo "  CloudBlog Post-Deployment Script"
echo "=========================================="
echo ""

cd /home/site/wwwroot

# 1. PERMISSIONS
echo "1️⃣  Setting permissions..."
chmod -R 755 .
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data .
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

# 5. STORAGE LINK
if [ ! -L /home/site/wwwroot/public/storage ]; then
    echo "5️⃣  Creating storage link..."
    php artisan storage:link
    echo "   ✅ Storage linked"
    echo ""
fi

# 6. VERIFICATION
echo "6️⃣  Verification..."
echo "   🐘 PHP Version: $(php -v | head -1)"
echo "   🚀 Laravel Version: $(php artisan --version)"
echo ""

echo "=========================================="
echo "  ✅ Deployment Completed Successfully!"
echo "=========================================="