<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'message' => 'CloudBlog API',
        'version' => '1.0.0',
        'status' => 'running',
        'endpoints' => [
            'articles' => '/api/articles',
            'login' => '/api/login',
            'register' => '/api/register',
            'user' => '/api/user',
        ],
        'timestamp' => now()
    ]);
});

Route::get('/test', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'Laravel fonctionne parfaitement !',
        'php_version' => PHP_VERSION,
        'laravel_version' => app()->version(),
        'environment' => config('app.env'),
        'database' => config('database.default'),
        'timestamp' => now()
    ]);
});

Route::get('/login', function () {
    return view('login');
})->name('login');

Route::post('/login', [\App\Http\Controllers\AuthController::class, 'login'])->name('login.post');

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware('auth')->name('dashboard');