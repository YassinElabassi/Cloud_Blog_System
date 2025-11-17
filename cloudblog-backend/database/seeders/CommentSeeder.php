<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Comment;
use App\Models\Article;
use App\Models\User;

class CommentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Get articles and users
        $articles = Article::all();
        $users = User::where('role', 'User')->get();

        if ($articles->isEmpty() || $users->isEmpty()) {
            $this->command->warn('No articles or users found. Skipping comment seeding.');
            return;
        }

        $commentTemplates = [
            [
                'content' => 'Great article! This helped me understand the concepts much better. Looking forward to more content like this.',
                'is_reported' => false,
                'status' => 'Approved',
            ],
            [
                'content' => 'Very informative and well-written. The examples provided were particularly helpful in understanding the implementation.',
                'is_reported' => false,
                'status' => 'Approved',
            ],
            [
                'content' => 'Thank you for sharing this! I have been looking for a guide exactly like this. The step-by-step approach is excellent.',
                'is_reported' => false,
                'status' => 'Approved',
            ],
            [
                'content' => 'This is spam content promoting unrelated services.',
                'is_reported' => true,
                'status' => 'Pending',
            ],
            [
                'content' => 'Could you elaborate more on the security aspects? I would love to see a follow-up article on that topic.',
                'is_reported' => false,
                'status' => 'Approved',
            ],
            [
                'content' => 'Excellent tutorial! I successfully implemented this in my project. One suggestion: it would be great to include error handling examples.',
                'is_reported' => false,
                'status' => 'Approved',
            ],
            [
                'content' => 'Inappropriate offensive content here.',
                'is_reported' => true,
                'status' => 'Rejected',
            ],
            [
                'content' => 'This article saved me hours of debugging. The troubleshooting section was particularly valuable. Thanks!',
                'is_reported' => false,
                'status' => 'Approved',
            ],
            [
                'content' => 'I am new to this topic and found this guide very beginner-friendly. Appreciate the clear explanations!',
                'is_reported' => false,
                'status' => 'Approved',
            ],
            [
                'content' => 'Check out my website for better content! [spam link]',
                'is_reported' => true,
                'status' => 'Pending',
            ],
            [
                'content' => 'Does this approach work with the latest version? I am using v15 and want to make sure it is compatible.',
                'is_reported' => false,
                'status' => 'Pending',
            ],
            [
                'content' => 'Brilliant write-up! I shared this with my team and we are planning to implement these best practices in our next sprint.',
                'is_reported' => false,
                'status' => 'Approved',
            ],
        ];

        // Create comments for each article
        foreach ($articles as $article) {
            // Randomly assign 2-5 comments per article
            $numComments = rand(2, 5);
            
            for ($i = 0; $i < $numComments; $i++) {
                $template = $commentTemplates[array_rand($commentTemplates)];
                $randomUser = $users->random();

                Comment::create([
                    'user_id' => $randomUser->id,
                    'article_id' => $article->id,
                    'content' => $template['content'],
                    'is_reported' => $template['is_reported'],
                    'status' => $template['status'],
                ]);
            }
        }

        $this->command->info('Comments seeded successfully!');
    }
}
