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
    public function indexAdmin(Request $request)
    {
        // Utiliser un bloc try-catch ici pour renvoyer une trace détaillée en cas de 500
        try {
            $articles = Article::orderBy('publish_date', 'desc')
                               ->with('user') // Le point le plus probable d'un crash si user_id est orphelin
                               ->get(); 

            // Nous devons mapper la relation 'user' à l'objet 'author' attendu par le Front-end
            $formattedArticles = $articles->map(function ($article) {
                
                // Vérification de la relation 'user' pour éviter 'Attempt to read property...' sur un article orphelin.
                $user = $article->user;

                return [
                    'id' => $article->id,
                    'title' => $article->title,
                    'paragraph' => $article->paragraph,
                    'image' => $article->image,
                    // CORRECTION 1: Gérer les tags. Si le modèle les caste en array, on les retourne. Sinon, on explode.
                    // J'assume qu'ils sont castés en array par le modèle.
                    'tags' => is_array($article->tags) ? $article->tags : ($article->tags ? explode(',', $article->tags) : []), 
                    
                    // CORRECTION 2: Gérer les dates NULL
                    'publishDate' => $article->publish_date ? $article->publish_date->format('Y-m-d') : null, 
                    'status' => $article->status,
                    'author' => [
                        // CORRECTION 3: Vérification de l'objet $user (relation)
                        'name' => $user ? $user->name : 'Unknown Author', 
                        'image' => $user ? ($user->profile_photo_url ?? '/images/blog/author-default.png') : '/images/blog/author-default.png', 
                        'designation' => $user ? ($user->designation ?? 'Writer') : 'Writer', 
                    ],
                ];
            });

            return response()->json($formattedArticles);
            
        } catch (\Exception $e) {
            // Loguer l'erreur spécifique pour le débogage CloudWatch (UC11)
            Log::error('ArticleController indexAdmin crashed:', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString() // Fournir la trace complète
            ]);
            
            // Renvoyer l'erreur 500 générique au front-end
            return response()->json(['error' => 'Server error while fetching admin articles. Check backend logs for details.'], 500);
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
        // Retrieve only published articles, sorted by recent publish date
        $articles = Article::where('status', 'Published')
                           ->orderBy('publish_date', 'desc')
                           ->with('user') // Eager load the author (User) for each article
                           ->paginate(10); // Pagination for performance

        return response()->json($articles);
    }

    /**
     * Store a newly created article (UC1) with image upload to S3 (UC7).
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        // User must be logged in to create an article
        if (!$request->user()) {
            return response()->json(['error' => 'Authentication required.'], 401);
        }

        try {
            // 1. Data Validation
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'paragraph' => 'required|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048', // Max 2MB
                'tags' => 'nullable|string', 
            ]);

            $imageUrl = null;

            // 2. Image Upload to AWS S3 (UC7)
            if ($request->hasFile('image')) {
                $imageFile = $request->file('image');
                $path = 'images/articles';
                
                // putFile stores the file with a unique name and returns the S3 path
                $s3Path = Storage::disk('s3')->putFile($path, $imageFile, 'public');
                
                // Get the public URL to store in the database
                $imageUrl = Storage::disk('s3')->url($s3Path);

                // CloudWatch Log (UC11): Log storage action
                Log::info('Image uploaded to S3', ['s3_path' => $s3Path, 'user_id' => $request->user()->id]);
            }

            // 3. Article Creation and Database Save (RDS)
            $article = Article::create([
                'user_id' => $request->user()->id, // ID of the logged-in author
                'title' => $validated['title'],
                'paragraph' => $validated['paragraph'],
                'image' => $imageUrl,
                'tags' => $validated['tags'] ?? null,
                'status' => 'Archived', // Default status is Archived
                'publish_date' => now(), // Creation date for example
            ]);

            return response()->json([
                'message' => 'Article created successfully and image stored on S3.',
                'article' => $article,
            ], 201);

        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            // CloudWatch Log (UC11): Log errors
            Log::error('Article creation failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Server error during S3 upload or database save.'], 500);
        }
    }


    /**
     * Display the specified resource.
     * (UC2: Consult a specific article)
     *
     * @param Article $article
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Article $article)
    {
        // If the article is not published, deny access, unless it's the author or an Admin.
        $user = auth()->user();
        $isAuthorized = $user && ($article->user_id === $user->id || $user->role === 'Admin');

        if ($article->status !== 'Published' && !$isAuthorized) {
            // In production, returning 404 (Not Found) is often better to hide drafts.
            return response()->json(['error' => 'Article not published or unauthorized access.'], 403);
        }
        
        // Eager load the author and approved comments
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
        // AUTHORIZATION CHECK: Only the article's author can modify it.
        if ($request->user()->id !== $article->user_id) {
            return response()->json(['error' => 'You are not authorized to modify this article. Only the author can update it.'], 403);
        }

        try {
            // 1. Data Validation (image is nullable/optional)
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'paragraph' => 'required|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
                'tags' => 'nullable|string', 
                'status' => 'required|in:Published,Archived',
            ]);

            $data = $request->except('image');

            // 2. S3 Upload and Deletion Management
            if ($request->hasFile('image')) {
                // Delete old image if it exists
                if ($article->image) {
                    $oldPath = str_replace(Storage::disk('s3')->url('/'), '', $article->image);
                    Storage::disk('s3')->delete($oldPath);
                }

                // New S3 Upload
                $imageFile = $request->file('image');
                $path = 'images/articles';
                $s3Path = Storage::disk('s3')->putFile($path, $imageFile, 'public');
                $data['image'] = Storage::disk('s3')->url($s3Path);
                
                Log::info('Image updated on S3', ['s3_path' => $s3Path, 'user_id' => $request->user()->id]);
            }
            
            // 3. Update the data
            $article->update($data);

            return response()->json([
                'message' => 'Article successfully updated.',
                'article' => $article,
                'user_id' => $request->user()->id
            ]);

        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Article update failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Server error during the update process.'], 500);
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
            // 1. Trouver l'article par son ID
            $article = Article::findOrFail($id);
            
            // 2. Supprimer l'image associée de S3 (UC7) - CORRECTION APPLIQUÉE
            if ($article->image) {
                try {
                    // Logique pour extraire le chemin S3 de l'URL publique, cohérente avec la méthode update.
                    $oldPath = str_replace(Storage::disk('s3')->url('/'), '', $article->image);
                    
                    if (Storage::disk('s3')->exists($oldPath)) {
                        Storage::disk('s3')->delete($oldPath);
                        Log::info('Article image deleted from S3', ['path' => $oldPath, 'article_id' => $article->id]);
                    }
                } catch (\Exception $e) {
                    // Loguer si la suppression S3 échoue mais ne pas bloquer la suppression de l'article
                    Log::error('Failed to delete S3 image for article', ['article_id' => $id, 'error' => $e->getMessage()]);
                }
            }

            // 3. Supprimer l'article de la base de données
            $article->delete();

            // 4. Réponse de succès
            return response()->json(['message' => 'Article successfully deleted.'], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            // Article non trouvé
            return response()->json(['error' => 'Article not found.'], 404);
            
        } catch (\Exception $e) {
            // Loguer l'erreur pour le débogage
            Log::error('ArticleController destroy failed:', [
                'error' => $e->getMessage(),
                'article_id' => $id,
            ]);
            // Renvoyer une erreur 500
            return response()->json(['error' => 'Server error while deleting the article.'], 500);
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