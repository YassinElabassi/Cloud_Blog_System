<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Article extends Model
{
    use HasFactory;
    
    // Mappe l'entité Blog (du Front-end) à la table 'articles' du Back-end
    protected $table = 'articles';

    /**
     * Les attributs qui peuvent être assignés en masse.
     */
    protected $fillable = [
        'user_id', 
        'title',
        'paragraph', 
        'image',       // Stockera seulement le nom du fichier (ex: "123_photo.jpg")
        'tags',
        'status',      
        'publish_date',
    ];
    
    protected $casts = [
        'tags' => 'array',
        'publish_date' => 'datetime',
    ];

    /**
     * --- AJOUT POUR AZURE BLOB STORAGE ---
     * Accessor magique pour l'attribut 'image'.
     * Dès que vous appelez $article->image, cette fonction s'exécute.
     */
    public function getImageAttribute($value)
    {
        if ($value) {
            // 1. Si c'est déjà une URL complète (ex: anciennes images ou lien externe), on la garde
            if (str_starts_with($value, 'http')) {
                return $value;
            }

            // 2. Sinon, on construit l'URL Azure complète
            // Résultat : https://cloudblogstorage.../articles-images/mon_image.jpg
            $azureUrl = config('filesystems.disks.azure.url');
            
            // Sécurité : on s'assure qu'il n'y a pas de double slash //
            return rtrim($azureUrl, '/') . '/' . ltrim($value, '/');
        }
        
        return null;
    }

    /**
     * Relation "plusieurs-à-un" : Un article appartient à un seul auteur (User).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relation "un-à-plusieurs" : Un article peut avoir plusieurs commentaires.
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }
}