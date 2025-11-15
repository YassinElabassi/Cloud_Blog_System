<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void
{
    Schema::create('users', function (Blueprint $table) {
        $table->id();
        // Le `cognito_id` doit être unique pour relier l'utilisateur Cognito
        $table->string('cognito_id')->unique()->nullable(); 
        $table->string('name');
        $table->string('email')->unique();
        $table->string('password')->nullable(); // Le mot de passe peut être null si authentifié uniquement par Cognito
        $table->enum('role', ['User', 'Admin'])->default('User');
        $table->enum('status', ['Active', 'Inactive'])->default('Active');
        $table->string('designation')->nullable();
        $table->string('image')->nullable();
        $table->timestamp('derniere_connexion')->nullable();
        $table->rememberToken();
        $table->timestamps(); // Correspond à `dateInscription`
    });
}

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('users');
    }
};
