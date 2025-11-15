<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comment extends Model
{
    use HasFactory;

    protected $table = 'comments'; // Attention à la convention (ici au pluriel si la table est 'comments')

    protected $fillable = [
        'user_id',
        'article_id',
        'content',
        'toxicity_score', // Pour l'analyse de modération
        'sentiment',      // Pour l'analyse de sentiment (UC9)
        'is_reported',    // Pour le signalement par l'utilisateur
        'status',         // 'Pending', 'Approved', 'Rejected'
    ];
    
    // Assurez-vous que le nom de la table soit bien 'comments' dans la migration

    /**
     * Relation "plusieurs-à-un" : Un commentaire appartient à un seul article.
     */
    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    /**
     * Relation "plusieurs-à-un" : Un commentaire appartient à un seul utilisateur (auteur).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}