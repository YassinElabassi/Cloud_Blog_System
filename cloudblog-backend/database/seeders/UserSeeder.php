<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Create Admin user
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@cloudblog.com',
            'password' => Hash::make('password123'),
            'role' => 'Admin',
            'status' => 'Active',
            'designation' => 'System Administrator',
            'image' => 'https://i.pravatar.cc/150?img=33',
        ]);

        // Create regular users
        $users = [
            [
                'name' => 'John Doe',
                'email' => 'john@example.com',
                'password' => Hash::make('password123'),
                'role' => 'User',
                'status' => 'Active',
                'designation' => 'Software Developer',
                'image' => 'https://i.pravatar.cc/150?img=12',
            ],
            [
                'name' => 'Jane Smith',
                'email' => 'jane@example.com',
                'password' => Hash::make('password123'),
                'role' => 'User',
                'status' => 'Active',
                'designation' => 'DevOps Engineer',
                'image' => 'https://i.pravatar.cc/150?img=45',
            ],
            [
                'name' => 'Alice Johnson',
                'email' => 'alice@example.com',
                'password' => Hash::make('password123'),
                'role' => 'User',
                'status' => 'Active',
                'designation' => 'Cloud Architect',
                'image' => 'https://i.pravatar.cc/150?img=47',
            ],
            [
                'name' => 'Bob Wilson',
                'email' => 'bob@example.com',
                'password' => Hash::make('password123'),
                'role' => 'User',
                'status' => 'Active',
                'designation' => 'Full Stack Developer',
                'image' => 'https://i.pravatar.cc/150?img=68',
            ],
        ];

        foreach ($users as $userData) {
            User::create($userData);
        }

        $this->command->info('Users seeded successfully!');
    }
}
