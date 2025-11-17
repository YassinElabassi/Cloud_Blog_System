<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        // Run seeders in the correct order
        // 1. Users first (required for articles and comments)
        $this->call(UserSeeder::class);
        
        // 2. Articles second (required for comments)
        $this->call(ArticleSeeder::class);
        
        // 3. Comments last (depends on users and articles)
        $this->call(CommentSeeder::class);

        $this->command->info('All seeders completed successfully!');
    }
}
