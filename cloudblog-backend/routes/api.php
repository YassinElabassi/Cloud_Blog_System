<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ArticleController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AuthController; // NOUVEAU : Inclure le contrôleur d'Auth

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Les routes sont chargées par le RouteServiceProvider.
|
*/

// =========================================================================
// 1. ROUTES D'AUTHENTIFICATION (PUBLIQUES)
// Ces routes n'ont pas besoin d'être protégées par 'auth:sanctum'
// =========================================================================

Route::post('login', [AuthController::class, 'login']);
Route::post('register', [AuthController::class, 'register']);

// =========================================================================
// 2. ROUTES PROTÉGÉES (Nécessitent le jeton Sanctum)
// Toutes les routes dans ce groupe exigeront un header 'Authorization: Bearer <token>'
// =========================================================================

Route::middleware('auth:sanctum')->group(function () {

    // Route de test ou d'information utilisateur authentifié
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Déconnexion
    Route::post('logout', [AuthController::class, 'logout']);

    // Update authenticated user's profile
    Route::put('/user/profile', [UserController::class, 'updateProfile']);

    // --- USER MANAGEMENT (UserController) ---
    Route::apiResource('users', UserController::class);
    Route::put('users/{user}/status', [UserController::class, 'toggleStatus']);

    // --- ARTICLE ROUTES ---
    Route::controller(ArticleController::class)->group(function () {

        Route::get('/admin/articles', 'indexAdmin'); 
        Route::get('/articles/stats', [ArticleController::class, 'getAdminStats']);
        
        // User's own articles (both Published and Archived)
        Route::get('/user/articles', 'myArticles');
        
        // CRUD: Create (UC1/UC7)
        Route::post('/articles', 'store'); 
        
        // CRUD: Update (UC3) 
        Route::put('/articles/{article}', 'update');
        
        // CRUD: Delete (UC3) 
        Route::delete('/articles/{article}', 'destroy');

        // Admin Action: Archive Article 
        Route::put('/articles/{article}/archive', 'archive');
        // Admin Action: Publish Article
        Route::put('articles/{article}/publish', [ArticleController::class, 'publish']);
    });

    // --- COMMENT ROUTES (Actions nécessitant l'authentification) ---
    Route::controller(CommentController::class)->group(function () {

         Route::get('/admin/comments', 'indexAdmin');
         
        // UC4: POST /api/articles/{article}/comments (Création de commentaire)
        Route::post('/articles/{article}/comments', 'store');
        
        // UC6: PUT /api/comments/{comment} (Mise à jour)
        Route::put('/comments/{comment}', 'update');
        
        // UC6 / UC9: DELETE /api/comments/{comment} (Suppression)
        Route::delete('/comments/{comment}', 'destroy');

        // NEW USER ACTION: PUT /api/comments/{comment}/report
        Route::put('/comments/{comment}/report', 'report');

        // ADMIN/MODERATION ACTIONS
        Route::put('/comments/{comment}/moderate', 'moderate');
        Route::put('/comments/{comment}/report-toggle', 'toggleReport');
    });
});

// =========================================================================
// 3. ROUTES PUBLIQUES (Ne nécessitent PAS de jeton)
// =========================================================================

// Article Read (UC2) - Déplacées hors du middleware
Route::controller(ArticleController::class)->group(function () {
    Route::get('/articles', 'index');
    Route::get('/articles/{article}', 'show'); 
});

// Comment Read (UC5) - Déplacées hors du middleware
Route::get('/articles/{article}/comments', [CommentController::class, 'index']);