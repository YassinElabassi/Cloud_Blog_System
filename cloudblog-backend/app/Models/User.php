<?php

namespace App\Models;


use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Les attributs qui peuvent être remplis en masse.
     * Note: 'password' est souvent géré via un mutateur ou géré explicitement.
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'cognito_id',
        'role',
        'status',
        'designation',
        'image',
        'derniere_connexion',
    ];
    
    /**
     * Les attributs qui doivent être masqués lors de la sérialisation.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Les attributs qui doivent être castés.
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        // Eloquent gère automatiquement les colonnes 'timestamp' de la migration
    ];

    // ... (suite du fichier)
    
    // Définir la relation avec les articles (Optional mais bonne pratique)
    public function articles()
    {
        return $this->hasMany(Article::class);
    }
    
    // Définir la relation avec les commentaires (Optional mais bonne pratique)
    public function comments()
    {
        return $this->hasMany(Comment::class);
    }
    
    // Si vous voulez renommer les attributs pour correspondre au frontend (comme dans votre dummy data)
    protected function casts(): array
    {
        return [
            // ... autres casts
            'created_at' => 'datetime',
            'derniere_connexion' => 'datetime',
        ];
    }
    
    // Mutateur pour formater created_at en 'dateInscription' (Optional)
    protected function dateInscription(): Attribute
    {
        return Attribute::make(
            get: fn ($value, $attributes) => $attributes['created_at'],
        );
    }
    
    // Accesseur pour formater derniere_connexion (Optional)
    protected function derniereConnexion(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value ? Carbon::parse($value)->format('Y-m-d') : 'Never',
        );
    }
}