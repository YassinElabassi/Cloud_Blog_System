<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Article;
use App\Models\User;
use App\Models\Comment;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;


class ArticleController extends Controller
{

    /**
     * Display a listing of ALL resources (Published and Archived) for the Admin interface.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
/**
     * Display a listing of ALL resources for Admin.
     */
    public function indexAdmin(Request $request)
    {
        try {
            $articles = Article::orderBy('publish_date', 'desc')->with('user')->get(); 

            $formattedArticles = $articles->map(function ($article) {
                $user = $article->user;
                return [
                    'id' => $article->id,
                    'title' => $article->title,
                    'paragraph' => $article->paragraph,
                    
                    // L'accessor dans le Model Article convertira automatiquement ce nom de fichier en URL complète Azure
                    'image' => $article->image, 
                    
                    'tags' => $article->tags ?? [], 
                    'publishDate' => $article->publish_date ? $article->publish_date->format('Y-m-d') : null, 
                    'status' => $article->status,
                    'author' => [
                        'name' => $user ? $user->name : 'Unknown Author', 
                        'image' => $user ? ($user->profile_photo_url ?? '/images/blog/author-default.png') : '/images/blog/author-default.png', 
                        'designation' => $user ? ($user->designation ?? 'Writer') : 'Writer', 
                    ],
                ];
            });

            return response()->json($formattedArticles);
        } catch (\Exception $e) {
            Log::error('ArticleController indexAdmin crashed:', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Server error while fetching admin articles.'], 500);
        }
    }

    
    /**
     * Display a listing of the published resources.
     * (UC2: Consult articles)
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        $articles = Article::where('status', 'Published')
                           ->orderBy('publish_date', 'desc')
                           ->with('user')
                           ->paginate(10);

        return response()->json($articles);
    }


    /**
     * Get all articles for the authenticated user (both Published and Archived).
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function myArticles(Request $request)
    {
        if (!$request->user()) {
            return response()->json(['error' => 'Authentication required.'], 401);
        }

        try {
            $articles = Article::where('user_id', $request->user()->id)
                               ->orderBy('publish_date', 'desc')
                               ->with('user')
                               ->get();

            // Format the response similar to indexAdmin
            $formattedArticles = $articles->map(function ($article) {
                $user = $article->user;

                return [
                    'id' => $article->id,
                    'title' => $article->title,
                    'paragraph' => $article->paragraph,
                    'image' => $article->image,
                    // Tags are automatically casted to array by the Article model
                    'tags' => $article->tags ?? [],
                    'publishDate' => $article->publish_date ? $article->publish_date->format('Y-m-d') : null,
                    'status' => $article->status,
                    'author' => [
                        'name' => $user ? $user->name : 'Unknown Author',
                        'image' => $user ? ($user->profile_photo_url ?? '/images/blog/author-default.png') : '/images/blog/author-default.png',
                        'designation' => $user ? ($user->designation ?? 'Writer') : 'Writer',
                    ],
                ];
            });

           return response()->json($articles); 
        } catch (\Exception $e) {
            Log::error('Error fetching user articles: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch articles.'], 500);
        }
    }


    /**
     * Store a newly created article (UC1) with image upload to S3 (UC7).
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        if (!$request->user()) {
            return response()->json(['error' => 'Authentication required.'], 401);
        }

        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'paragraph' => 'required|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
                'tags' => 'nullable|string', 
            ]);

            $imageFilename = null;

            // --- MODIFICATION AZURE ---
            if ($request->hasFile('image')) {
                $imageFile = $request->file('image');
                
                // Générer un nom unique : timestamp + nom original nettoyé
                $filename = time() . '_' . str_replace(' ', '_', $imageFile->getClientOriginalName());
                
                // Upload vers Azure (à la racine du conteneur défini dans .env)
                // Le paramètre 'public' assure la visibilité
                Storage::disk('azure')->putFileAs('', $imageFile, $filename, 'public');
                
                // On stocke SEULEMENT le nom du fichier (ex: 12345_image.jpg)
                // L'URL complète sera générée par le Modèle Article via l'Accessor
                $imageFilename = $filename;

                Log::info('Image uploaded to Azure', ['filename' => $filename, 'user_id' => $request->user()->id]);
            }
            // --------------------------

            $tagsArray = null;
            if (!empty($validated['tags'])) {
                $tagsArray = array_map('trim', explode(',', $validated['tags']));
            }

            $article = Article::create([
                'user_id' => $request->user()->id,
                'title' => $validated['title'],
                'paragraph' => $validated['paragraph'],
                'image' => $imageFilename, // Stocke le nom du fichier Azure
                'tags' => $tagsArray,
                'status' => 'Published',
                'publish_date' => now(),
            ]);

            return response()->json([
                'message' => 'Article created successfully and image stored on Azure.',
                'article' => $article,
            ], 201);

        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Article creation failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Server error during Azure upload or database save.'], 500);
        }
    }

    /**
     * Display the specified resource.
     * (UC2: Consult a specific article)
     *
     * @param Article $article
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Request $request, Article $article)
    {
        $user = auth('sanctum')->user();
        $isAuthorized = $user && ($article->user_id === $user->id || $user->role === 'Admin');

        if ($article->status !== 'Published' && !$isAuthorized) {
            return response()->json(['error' => 'Article not published or unauthorized access.'], 403);
        }
        
        $article->load(['user', 'comments' => function($query) {
            $query->where('status', 'Approved');
        }]);

        return response()->json($article);
    }


    /**
     * Update the specified resource in storage.
     * (UC3: Modify an article)
     *
     * @param \Illuminate\Http\Request $request
     * @param Article $article
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, Article $article)
    {
        if ($request->user()->id !== $article->user_id) {
            return response()->json(['error' => 'Unauthorized.'], 403);
        }

        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'paragraph' => 'required|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
                'tags' => 'nullable|string', 
                'status' => 'required|in:Published,Archived',
            ]);

            $data = $request->except('image');

            if (isset($data['tags'])) {
                $data['tags'] = !empty($data['tags']) ? array_map('trim', explode(',', $data['tags'])) : null;
            }

            // --- MODIFICATION AZURE UPDATE ---
            if ($request->hasFile('image')) {
                // 1. Supprimer l'ancienne image d'Azure si elle existe
                if ($article->image) {
                    // Si l'ancienne image est une URL complète (legacy), on extrait le nom, sinon on prend tel quel
                    $oldFilename = basename($article->image);
                    if (Storage::disk('azure')->exists($oldFilename)) {
                        Storage::disk('azure')->delete($oldFilename);
                    }
                }

                // 2. Upload la nouvelle image
                $imageFile = $request->file('image');
                $filename = time() . '_' . str_replace(' ', '_', $imageFile->getClientOriginalName());
                
                Storage::disk('azure')->putFileAs('', $imageFile, $filename, 'public');
                
                // Mettre à jour avec le nouveau nom de fichier
                $data['image'] = $filename;
                
                Log::info('Image updated on Azure', ['filename' => $filename]);
            }
            // ---------------------------------
            
            $article->update($data);

            return response()->json([
                'message' => 'Article successfully updated.',
                'article' => $article,
            ]);

        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Article update failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Server error.'], 500);
        }
    }


   /**
     * Remove the specified resource from storage.
     * (UC3: Delete article)
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            $article = Article::findOrFail($id);
            
            // --- MODIFICATION AZURE DELETE ---
            if ($article->image) {
                try {
                    // On récupère juste le nom du fichier (au cas où ce serait une URL complète)
                    $filename = basename($article->image);
                    
                    if (Storage::disk('azure')->exists($filename)) {
                        Storage::disk('azure')->delete($filename);
                        Log::info('Article image deleted from Azure', ['filename' => $filename]);
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to delete Azure image', ['error' => $e->getMessage()]);
                }
            }
            // ---------------------------------

            $article->delete();

            return response()->json(['message' => 'Article successfully deleted.'], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Article not found.'], 404);
        } catch (\Exception $e) {
            Log::error('Article destroy failed:', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Server error.'], 500);
        }
    }
    
    /**
     * Admin function to archive an article (change status to Archived).
     *
     * @param Request $request
     * @param Article $article
     * @return \Illuminate\Http\JsonResponse
     */
    public function archive(Request $request, Article $article)
    {
        // AUTHORIZATION CHECK: Only Admin role can archive articles.
        if ($request->user()->role !== 'Admin') {
            return response()->json(['error' => 'Only Admin users are authorized to archive articles.'], 403);
        }
        
        if ($article->status === 'Archived') {
            return response()->json(['message' => 'Article is already archived.'], 200);
        }

        try {
            $article->update(['status' => 'Archived']);
            
            Log::info('Article archived by Admin', ['article_id' => $article->id, 'admin_id' => $request->user()->id]);

            return response()->json([
                'message' => 'Article successfully archived.',
                'article' => $article,
            ]);

        } catch (\Exception $e) {
            Log::error('Admin archiving failed', ['article_id' => $article->id, 'error' => $e->getMessage()]);
            return response()->json(['error' => 'Server error during archiving process.'], 500);
        }
    }
    

    /**
     * Admin function to publish an article (change status to Published).
     *
     * @param Request $request
     * @param Article $article
     * @return \Illuminate\Http\JsonResponse
     */
    public function publish(Request $request, Article $article)
    {
        // AUTHORIZATION CHECK: Only Admin role can publish articles.
        if ($request->user()->role !== 'Admin') {
            return response()->json(['error' => 'Only Admin users are authorized to publish articles.'], 403);
        }
        
        if ($article->status === 'Published') {
            return response()->json(['message' => 'Article is already published.'], 200);
        }

        try {
            $article->update([
                'status' => 'Published',
                'publish_date' => now() // Mettre à jour la date de publication est une bonne pratique
            ]);
            
            Log::info('Article published by Admin', ['article_id' => $article->id, 'admin_id' => $request->user()->id]);

            return response()->json([
                'message' => 'Article successfully published.',
                'article' => $article,
            ]);

        } catch (\Exception $e) {
            Log::error('Admin publishing failed', ['article_id' => $article->id, 'error' => $e->getMessage()]);
            return response()->json(['error' => 'Server error during publishing process.'], 500);
        }
    }

    /**
     * Récupère toutes les statistiques clés pour le Tableau de Bord Admin.
     * (Comptages d'articles, de commentaires et d'utilisateurs)
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAdminStats(Request $request)
    {
        // 1. VÉRIFICATION D'AUTORISATION : Seul l'Admin peut voir les statistiques du tableau de bord
        if ($request->user()->role !== 'Admin') {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        try {
            // Statistiques des Utilisateurs
            $userStats = [
                'total' => User::count(),
                'active' => User::where('status', 'Active')->count(),
            ];

            // Statistiques des Articles
            $articleStats = [
                'total' => Article::count(),
                'published' => Article::where('status', 'Published')->count(),
                'archived' => Article::where('status', 'Archived')->count(),
            ];

            // Statistiques des Commentaires
            $commentStats = [
                'total' => Comment::count(),
                'pending' => Comment::where('status', 'Pending')->count(),
                'reported' => Comment::where('is_reported', true)->count(),
            ];

            return response()->json([
                'userStats' => $userStats,
                'articleStats' => $articleStats,
                'commentStats' => $commentStats,
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur chargement des statistiques Admin', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['message' => 'Erreur serveur lors du chargement des statistiques.'], 500);
        }
    }

}