<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Article;
use App\Models\User;

class ArticleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Get users for assigning articles
        $users = User::where('role', 'User')->get();

        if ($users->isEmpty()) {
            $this->command->warn('No regular users found. Skipping article seeding.');
            return;
        }

        $articles = [
            [
                'user_id' => $users[0]->id,
                'title' => 'Getting Started with AWS Cloud Computing',
                'paragraph' => "Cloud computing has revolutionized the way we build and deploy applications. Amazon Web Services (AWS) offers a comprehensive suite of cloud services that enable developers to build scalable, reliable, and cost-effective solutions.\n\nIn this guide, we'll explore the fundamental concepts of AWS cloud computing, including EC2 instances, S3 storage, and Lambda functions. Whether you're a beginner or an experienced developer, understanding these core services is essential for modern application development.\n\nWe'll cover best practices for security, cost optimization, and performance tuning to help you make the most of AWS cloud services.",
                'image' => 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
                'tags' => json_encode(['AWS', 'Cloud Computing', 'Tutorial']),
                'status' => 'Published',
                'publish_date' => now()->subDays(10),
            ],
            [
                'user_id' => $users[0]->id,
                'title' => 'Serverless Architecture: The Future of Application Development',
                'paragraph' => "Serverless architecture represents a paradigm shift in how we think about infrastructure and application design. By abstracting away server management, developers can focus entirely on writing code and delivering business value.\n\nAWS Lambda, API Gateway, and DynamoDB form a powerful serverless stack that can handle millions of requests with automatic scaling and pay-per-use pricing. This approach reduces operational overhead and allows teams to iterate faster.\n\nIn this article, we'll explore real-world serverless patterns, common pitfalls to avoid, and strategies for monitoring and debugging serverless applications in production.",
                'image' => 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
                'tags' => json_encode(['Serverless', 'AWS Lambda', 'Architecture']),
                'status' => 'Published',
                'publish_date' => now()->subDays(7),
            ],
            [
                'user_id' => $users[1]->id,
                'title' => 'Docker and Kubernetes: Container Orchestration Made Easy',
                'paragraph' => "Containerization has become the de facto standard for packaging and deploying modern applications. Docker provides a lightweight, portable way to package applications with their dependencies, while Kubernetes offers powerful orchestration capabilities.\n\nIn this comprehensive guide, we'll walk through creating Docker images, writing Dockerfiles, and deploying containerized applications to Kubernetes clusters. We'll also cover advanced topics like service mesh, ingress controllers, and horizontal pod autoscaling.\n\nBy the end of this tutorial, you'll have the knowledge to deploy production-ready containerized applications with confidence.",
                'image' => 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&q=80',
                'tags' => json_encode(['Docker', 'Kubernetes', 'DevOps', 'Containers']),
                'status' => 'Published',
                'publish_date' => now()->subDays(5),
            ],
            [
                'user_id' => $users[2]->id,
                'title' => 'Building Scalable APIs with Laravel and AWS',
                'paragraph' => "Laravel is a powerful PHP framework that makes building web applications a joy. When combined with AWS services, you can create highly scalable and resilient APIs that serve millions of users.\n\nThis article explores how to leverage Laravel's elegant syntax with AWS services like RDS, ElastiCache, and CloudFront to build performant APIs. We'll discuss caching strategies, database optimization, and CDN integration.\n\nYou'll learn how to implement authentication with AWS Cognito, store files in S3, and monitor your application with CloudWatch. These patterns are battle-tested in production environments serving real users.",
                'image' => 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
                'tags' => json_encode(['Laravel', 'PHP', 'API', 'AWS']),
                'status' => 'Published',
                'publish_date' => now()->subDays(3),
            ],
            [
                'user_id' => $users[3]->id,
                'title' => 'Next.js and React: Modern Frontend Development',
                'paragraph' => "Next.js has emerged as the go-to framework for building production-ready React applications. With features like server-side rendering, static site generation, and API routes, Next.js provides everything you need for modern web development.\n\nIn this tutorial, we'll build a full-featured blog application using Next.js 15, exploring the latest features like the App Router, Server Components, and improved image optimization. We'll also integrate with a Laravel backend API.\n\nYou'll learn best practices for state management, routing, authentication, and deployment to cloud platforms. This hands-on guide will give you the skills to build fast, SEO-friendly web applications.",
                'image' => 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
                'tags' => json_encode(['Next.js', 'React', 'Frontend', 'JavaScript']),
                'status' => 'Published',
                'publish_date' => now()->subDays(1),
            ],
            [
                'user_id' => $users[0]->id,
                'title' => 'CI/CD Best Practices for Cloud Applications',
                'paragraph' => "Continuous Integration and Continuous Deployment (CI/CD) are essential practices for modern software development. Automating your build, test, and deployment processes reduces errors and accelerates delivery.\n\nWe'll explore setting up CI/CD pipelines using GitHub Actions, AWS CodePipeline, and other popular tools. You'll learn how to implement automated testing, security scanning, and blue-green deployments.\n\nThis guide covers everything from basic pipeline setup to advanced strategies like canary deployments and feature flags. Transform your development workflow and ship code with confidence.",
                'image' => 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&q=80',
                'tags' => json_encode(['CI/CD', 'DevOps', 'Automation', 'GitHub Actions']),
                'status' => 'Published',
                'publish_date' => now(),
            ],
            [
                'user_id' => $users[1]->id,
                'title' => 'Database Design Patterns for Scalable Applications',
                'paragraph' => "Choosing the right database architecture is crucial for application performance and scalability. This article explores various database design patterns including normalization, denormalization, and polyglot persistence.\n\nWe'll compare SQL vs NoSQL databases, discuss when to use each, and explore AWS database services like RDS, DynamoDB, and Aurora. You'll learn about indexing strategies, query optimization, and caching techniques.\n\nWhether you're building a new application or optimizing an existing one, these database patterns will help you make informed architectural decisions.",
                'image' => 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&q=80',
                'tags' => json_encode(['Database', 'MySQL', 'DynamoDB', 'Architecture']),
                'status' => 'Archived',
                'publish_date' => now()->subDays(30),
            ],
            [
                'user_id' => $users[2]->id,
                'title' => 'Security Best Practices for Cloud Applications',
                'paragraph' => "Security should be a top priority when building cloud applications. This comprehensive guide covers essential security practices including encryption, authentication, authorization, and network security.\n\nWe'll explore AWS security services like IAM, KMS, WAF, and Security Hub. You'll learn how to implement least privilege access, secure your APIs, and protect against common vulnerabilities.\n\nThis article provides actionable security recommendations that you can implement immediately to protect your applications and data in the cloud.",
                'image' => 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80',
                'tags' => json_encode(['Security', 'AWS', 'Best Practices', 'IAM']),
                'status' => 'Published',
                'publish_date' => now()->subHours(12),
            ],
        ];

        foreach ($articles as $articleData) {
            Article::create($articleData);
        }

        $this->command->info('Articles seeded successfully!');
    }
}
