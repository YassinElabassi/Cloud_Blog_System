"use client";

import { useState, useEffect } from "react";
import SectionTitle from "../Common/SectionTitle";
import SingleBlog from "./SingleBlog";
import { Blog as BlogType } from "@/types/blog";

const Blog = () => {
  const [blogs, setBlogs] = useState<BlogType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestBlogs();
  }, []);

  const fetchLatestBlogs = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/articles");
      if (response.ok) {
        const data = await response.json();
        const articlesData = data.data || data;

        // Convert API articles to blog format and get latest 6
        const latestBlogs = Array.isArray(articlesData)
          ? articlesData.slice(0, 6).map((article: any) => {
              // Parse tags - handle both string and already-parsed arrays
              let tagsArray = [];
              if (article.tags) {
                if (Array.isArray(article.tags)) {
                  tagsArray = article.tags;
                } else if (typeof article.tags === "string") {
                  // First try to parse as JSON
                  try {
                    const parsed = JSON.parse(article.tags);
                    tagsArray = Array.isArray(parsed) ? parsed : [];
                  } catch {
                    // If JSON parse fails, treat as comma-separated string
                    tagsArray = article.tags
                      .split(",")
                      .map((tag: string) => tag.trim())
                      .filter((tag: string) => tag);
                  }
                }
              }

              return {
                id: article.id,
                title: article.title,
                paragraph: article.paragraph,
                image: article.image || "/images/blog/blog-01.jpg",
                author: {
                  name: article.user?.name || "Anonymous",
                  image: article.user?.image || "/images/blog/author-01.png",
                  designation: article.user?.designation || "Content Writer",
                },
                tags: tagsArray,
                publishDate: article.publish_date || new Date().toISOString(),
              };
            })
          : [];

        setBlogs(latestBlogs);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="blog"
      className="bg-gray-light dark:bg-bg-color-dark py-16 md:py-20 lg:py-28"
    >
      <div className="container">
        <SectionTitle
          title="Our Latest Blogs"
          paragraph="Discover the latest articles from our community of writers sharing knowledge and insights."
          center
        />

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="border-primary inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-r-transparent"></div>
          </div>
        ) : blogs.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-body-color dark:text-body-color-dark text-lg">
              No articles available yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 md:gap-x-6 lg:gap-x-8 xl:grid-cols-3">
            {blogs.map((blog) => (
              <div key={blog.id} className="w-full">
                <SingleBlog blog={blog} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Blog;
