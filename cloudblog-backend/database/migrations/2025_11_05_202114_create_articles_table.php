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
    Schema::create('articles', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        $table->string('title', 255);
        $table->text('paragraph'); // Contenu du blog
        $table->string('image')->nullable(); // URL S3 (UC7)
        $table->json('tags')->nullable(); // Tags (JSON ou string)
        $table->enum('status', ['Published', 'Archived'])->default('Published'); // Statut ajusté
        $table->timestamp('publish_date')->nullable(); 
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('articles');
    }
};
