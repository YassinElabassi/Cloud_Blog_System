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
        Schema::table('comments', function (Blueprint $table) {
            $table->dropColumn(['toxicity_score', 'sentiment']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->float('toxicity_score', 3, 2)->default(0.00);
            $table->enum('sentiment', ['Positive', 'Neutral', 'Negative'])->default('Neutral');
        });
    }
};
