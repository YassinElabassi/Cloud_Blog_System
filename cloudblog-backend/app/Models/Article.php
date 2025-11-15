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
     * Ils correspondent aux colonnes de la table `articles`.
     */
    protected $fillable = [
        'user_id', // Clé étrangère
        'title',
        'paragraph', 
        'image',       // URL S3 (UC7)
        'tags',
        'status',      // 'Published' ou 'Archived'
        'publish_date',
    ];
    
    /**
     * Convertit le champ 'tags' en tableau pour faciliter le travail en PHP.
     * C'est utile si les tags sont stockés en JSON dans la BDD.
     */
    protected $casts = [
        'tags' => 'array',
        'publish_date' => 'datetime',
    ];

    /**
     * Relation "plusieurs-à-un" : Un article appartient à un seul auteur (User).
     */
    public function user(): BelongsTo
    {
        // Récupère l'auteur de l'article
        return $this->belongsTo(User::class);
    }

    /**
     * Relation "un-à-plusieurs" : Un article peut avoir plusieurs commentaires.
     */
    public function comments(): HasMany
    {
        // Récupère tous les commentaires d'un article
        return $this->hasMany(Comment::class);
    }
}