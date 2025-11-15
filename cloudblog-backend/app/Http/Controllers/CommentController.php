<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Article;
use App\Models\Comment;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\Builder;

class CommentController extends Controller
{
    /**
     * ADMIN: Affiche une liste de TOUS les commentaires pour le tableau de bord de modération.
     */
    public function indexAdmin(Request $request)
    {
        if ($request->user()->role !== 'Admin') {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $query = Comment::query()
                ->whereHas('user')
                ->whereHas('article')
                ->with(['user:id,name', 'article:id,title'])
                ->latest();
            
            if ($request->filled('status')) {
                if ($request->status === 'Reported') {
                    // Montre TOUS les commentaires signalés, peu importe leur statut (Pending, Approved, etc)
                    $query->where('is_reported', true);
                } elseif (in_array($request->status, ['Pending', 'Approved', 'Rejected'])) {
                    $query->where('status', $request->status);
                }
            }

            if ($request->filled('article_id') && $request->article_id !== 'all') {
                $query->where('article_id', $request->article_id);
            }

            // --- LOGIQUE DE RECHERCHE AVANCÉE (Multi-critères et Case-insensitive) ---
            if ($request->filled('search')) {
                $lowerSearch = strtolower($request->search);
                
                $query->where(function ($q) use ($lowerSearch) {
                    
                    // 1. Recherche dans le contenu du commentaire (Assumons la colonne 'content')
                    $q->whereRaw('LOWER(content) LIKE ?', ["%{$lowerSearch}%"]);

                    // 2. Recherche par Nom de l'utilisateur
                    $q->orWhereHas('user', function (Builder $userQuery) use ($lowerSearch) {
                        $userQuery->whereRaw('LOWER(name) LIKE ?', ["%{$lowerSearch}%"]);
                    });

                    // 3. Recherche par Titre de l'article
                    $q->orWhereHas('article', function (Builder $articleQuery) use ($lowerSearch) {
                        $articleQuery->whereRaw('LOWER(title) LIKE ?', ["%{$lowerSearch}%"]);
                    });
                });
            }
            
            $comments = $query->get();

            // Les statistiques sont toujours calculées sur l'ensemble de la DB
            $stats = [
                'total' => Comment::count(),
                'pending' => Comment::where('status', 'Pending')->count(),
                // Compte tous les commentaires signalés, pas seulement ceux en attente.
                'reported' => Comment::where('is_reported', true)->count(),
            ];

            return response()->json([
                'comments' => $comments,
                'stats' => $stats,
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur chargement dashboard commentaires admin', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['message' => 'Erreur serveur. Consultez les logs.'], 500);
        }
    }

    /**
     * Affiche les commentaires pour un article (vue publique).
     */
    public function index(Article $article, Request $request)
    {
        $user = $request->user();
        $comments = Comment::where('article_id', $article->id)
            ->with('user:id,name,role')
            ->where(function (Builder $query) use ($user) {
                $query->whereIn('status', ['Approved', 'Pending']);
                if ($user) {
                    $query->orWhere(function (Builder $subQuery) use ($user) {
                         $subQuery->where('user_id', $user->id)->where('status', 'Rejected');
                    });
                }
                if ($user && $user->role === 'Admin') {
                    $query->orWhereNotNull('status'); 
                }
            })
            ->latest()
            ->get();
        return response()->json($comments);
    }

    /**
     * Crée un nouveau commentaire.
     */
    public function store(Request $request, Article $article)
    {
        if (!$request->user()) {
            return response()->json(['error' => 'Authentication required.'], 401);
        }
        try {
            $validated = $request->validate(['content' => 'required|string|max:1000']);
            $comment = $article->comments()->create([
                'user_id' => $request->user()->id,
                'content' => $validated['content'],
                'article_id' => $article->id,
                'is_reported' => false,
                'status' => 'Pending',
            ]);
            return response()->json(['message' => 'Comment posted.', 'comment' => $comment], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Server error.'], 500);
        }
    }

    /**
     * Met à jour un commentaire.
     */
    public function update(Request $request, Comment $comment)
    {
        if ($request->user()->id !== $comment->user_id) {
            return response()->json(['error' => 'Unauthorized.'], 403);
        }
        try {
            $validated = $request->validate(['content' => 'required|string|max:1000']);
            $comment->update(['content' => $validated['content'], 'status' => 'Pending']);
            return response()->json(['message' => 'Comment updated.', 'comment' => $comment]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Server error.'], 500);
        }
    }

    /**
     * Supprime un commentaire.
     */
    public function destroy(Request $request, Comment $comment)
    {
        $user = $request->user();
        if ($user->id !== $comment->user_id && $user->role !== 'Admin') {
            return response()->json(['error' => 'Unauthorized.'], 403);
        }
        try {
            $comment->delete();
            return response()->json(['message' => 'Comment deleted.'], 204); // Utiliser 204 pour "No Content"
        } catch (\Exception $e) {
            return response()->json(['error' => 'Server error.'], 500);
        }
    }
    
    /**
     * Signale un commentaire (action d'un utilisateur).
     */
    public function report(Request $request, Comment $comment)
    {
        if (!$request->user()) { return response()->json(['error' => 'Authentication required.'], 401); }
        if ($request->user()->id === $comment->user_id) { return response()->json(['error' => 'You cannot report your own comment.'], 403); }
        try {
            if ($comment->is_reported) { return response()->json(['message' => 'Comment is already reported.'], 200); }
            $comment->update(['is_reported' => true]);
            return response()->json(['message' => 'Comment reported.', 'comment' => $comment]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Server error.'], 500);
        }
    }
    
    /**
     * Modère un commentaire (Approuver/Rejeter).
     */
    public function moderate(Request $request, Comment $comment)
    {
        if ($request->user()->role !== 'Admin') { return response()->json(['error' => 'Unauthorized.'], 403); }
        try {
            $validated = $request->validate(['status' => 'required|in:Approved,Rejected']);
            $comment->update(['status' => $validated['status']]);
            return response()->json(['message' => "Comment marked as {$validated['status']}.", 'comment' => $comment]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Server error.'], 500);
        }
    }
    
    /**
     * Résout un signalement (action d'un admin).
     */
    public function toggleReport(Request $request, Comment $comment)
    {
        if ($request->user()->role !== 'Admin') { return response()->json(['error' => 'Unauthorized.'], 403); }
        try {
            // Un modérateur qui "résout" met toujours is_reported à false.
            $comment->update(['is_reported' => false]);
            return response()->json(['message' => "Report has been resolved.", 'comment' => $comment]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Server error.'], 500);
        }
    }
}