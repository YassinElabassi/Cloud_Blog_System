"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Breadcrumb from "@/components/Common/Breadcrumb";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface Article {
  id: number;
  title: string;
  paragraph: string;
  image: string | null;
  tags: string[];
  publish_date: string;
  user: {
    id: number;
    name: string;
    image: string | null;
  };
}

const BlogPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect Admin to dashboard
    if (!authLoading && user?.role === "Admin") {
      router.push("/dashboard");
      return;
    }
    fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const fetchArticles = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/articles");
      if (response.ok) {
        const data = await response.json();
        // Laravel pagination returns {data: [...], links: {...}, meta: {...}}
        const articlesData = data.data || data;
        // Ensure tags are always arrays
        const normalizedArticles = Array.isArray(articlesData)
          ? articlesData.map((article) => {
              let tags = [];
              if (Array.isArray(article.tags)) {
                tags = article.tags;
              } else if (typeof article.tags === "string") {
                if (article.tags.trim()) {
                  try {
                    // Try parsing as JSON first
                    tags = JSON.parse(article.tags);
                  } catch {
                    // If JSON parse fails, treat as comma-separated string
                    tags = article.tags
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter((tag) => tag);
                  }
                }
              }
              return { ...article, tags };
            })
          : [];
        setArticles(normalizedArticles);
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Don't render anything while checking auth or if Admin (will redirect)
  if (authLoading || user?.role === "Admin") {
    return null;
  }

  return (
    <>
      <Breadcrumb
        pageName="Our Blog"
        description="Explore the latest articles on cloud computing, development, and technology."
      />

      <section className="pt-[120px] pb-[120px]">
        <div className="container">
          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <div className="border-primary inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-r-transparent"></div>
                <p className="text-body-color dark:text-body-color-dark mt-4">
                  Loading articles...
                </p>
              </div>
            </div>
          ) : articles.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-body-color dark:text-body-color-dark text-lg">
                No articles found.
              </p>
            </div>
          ) : (
            <div className="-mx-4 flex flex-wrap justify-center">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="mb-10 w-full px-4 md:w-2/3 lg:w-1/2 xl:w-1/3"
                >
                  <div className="group hover:shadow-two dark:hover:shadow-gray-dark shadow-one dark:bg-dark relative overflow-hidden rounded-sm bg-white transition-all duration-300">
                    <Link
                      href={`/blog/${article.id}`}
                      className="relative block aspect-[37/22] w-full"
                    >
                      {article.image ? (
                        <Image
                          src={article.image}
                          alt={article.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-700">
                          <span className="text-4xl text-gray-400 dark:text-gray-500">
                            📝
                          </span>
                        </div>
                      )}
                    </Link>
                    <div className="p-6 sm:p-8 md:px-6 md:py-8 lg:p-8 xl:px-5 xl:py-8 2xl:p-8">
                      <h3>
                        <Link
                          href={`/blog/${article.id}`}
                          className="text-dark hover:text-primary dark:hover:text-primary mb-4 block text-xl font-bold transition-colors duration-300 sm:text-2xl dark:text-white"
                        >
                          {truncateText(article.title, 60)}
                        </Link>
                      </h3>
                      <p className="text-body-color dark:text-body-color-dark border-body-color/10 mb-6 border-b pb-6 text-base leading-relaxed dark:border-white/10">
                        {truncateText(
                          article.paragraph.replace(/\n/g, " "),
                          120,
                        )}
                      </p>
                      <div className="flex items-center">
                        <div className="border-body-color/10 mr-5 flex items-center border-r pr-5 xl:mr-3 xl:pr-3 2xl:mr-5 2xl:pr-5 dark:border-white/10">
                          <div className="mr-4">
                            <div className="relative h-10 w-10 overflow-hidden rounded-full">
                              {article.user.image ? (
                                <Image
                                  src={article.user.image}
                                  alt={article.user.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="bg-primary flex h-full w-full items-center justify-center font-semibold text-white">
                                  {article.user.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="w-full">
                            <p className="text-dark text-sm font-medium dark:text-white">
                              {article.user.name}
                            </p>
                          </div>
                        </div>
                        <div className="inline-block">
                          <p className="text-body-color dark:text-body-color-dark text-xs font-medium">
                            {formatDate(article.publish_date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default BlogPage;
