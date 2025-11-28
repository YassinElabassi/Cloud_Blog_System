"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Breadcrumb from "@/components/Common/Breadcrumb";

interface Article {
  id: number;
  title: string;
  paragraph: string;
  image: string | null;
  tags: string[] | string;
  status: string;
  publishDate: string;
  author?: {
    name: string;
    image: string;
    designation: string;
  };
}

const MyArticlesPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect to signin if not authenticated
    if (!authLoading && !user) {
      router.push("/signin");
      return;
    }

    // Redirect Admin to dashboard
    if (!authLoading && user?.role === "Admin") {
      router.push("/dashboard");
      return;
    }

    if (user) {
      fetchMyArticles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const fetchMyArticles = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("http://127.0.0.1:8000/api/user/articles", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Ensure tags are always arrays
        const normalizedData = Array.isArray(data)
          ? data.map((article) => {
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
        // The new endpoint returns articles already filtered for the user
        setArticles(normalizedData);
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (articleId: number) => {
    if (!confirm("Are you sure you want to delete this article?")) return;

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `http://127.0.0.1:8000/api/articles/${articleId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        setArticles(articles.filter((article) => article.id !== articleId));
        alert("Article deleted successfully!");
      } else {
        alert("Failed to delete article");
      }
    } catch (error) {
      console.error("Error deleting article:", error);
      alert("Error deleting article");
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

  // Don't render if not authenticated or Admin
  if (authLoading || !user || user.role === "Admin") {
    return null;
  }

  return (
    <>
      <Breadcrumb
        pageName="My Articles"
        description="Manage your published articles"
      />

      <section className="pt-[120px] pb-[120px]">
        <div className="container">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-dark text-2xl font-bold dark:text-white">
              My Articles ({articles.length})
            </h2>
            <Link
              href="/create-article"
              className="bg-primary hover:bg-primary/90 rounded-md px-6 py-3 text-base font-semibold text-white transition duration-300"
            >
              + Create New Article
            </Link>
          </div>

          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <div className="border-primary inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-r-transparent"></div>
                <p className="text-body-color dark:text-body-color-dark mt-4">
                  Loading your articles...
                </p>
              </div>
            </div>
          ) : articles.length === 0 ? (
            <div className="dark:bg-dark dark:border-stroke-dark rounded-lg border border-gray-200 bg-gray-100 p-12 text-center">
              <h3 className="text-dark mb-4 text-xl font-bold dark:text-white">
                No articles yet
              </h3>
              <p className="text-body-color dark:text-body-color-dark mb-6">
                Start sharing your knowledge by creating your first article!
              </p>
              <Link
                href="/create-article"
                className="bg-primary hover:bg-primary/90 inline-block rounded-md px-8 py-3 text-base font-semibold text-white transition duration-300"
              >
                Create Your First Article
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="dark:bg-dark dark:border-stroke-dark flex flex-col gap-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:flex-row"
                >
                  {article.image && (
                    <div className="relative h-48 w-full flex-shrink-0 overflow-hidden rounded-md sm:h-40 sm:w-60">
                      <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-dark text-xl font-bold dark:text-white">
                          {article.title}
                        </h3>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            article.status === "Published"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          }`}
                        >
                          {article.status}
                        </span>
                      </div>
                      <p className="text-body-color dark:text-body-color-dark mb-4 line-clamp-2 text-sm">
                        {article.paragraph.substring(0, 150)}...
                      </p>
                      <p className="text-body-color dark:text-body-color-dark text-xs">
                        Published: {formatDate(article.publishDate)}
                      </p>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <Link
                        href={`/blog/${article.id}`}
                        className="border-primary text-primary hover:bg-primary rounded-md border px-4 py-2 text-sm font-semibold transition hover:text-white"
                      >
                        View
                      </Link>
                      <Link
                        href={`/edit-article/${article.id}`}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                      >
                        Delete
                      </button>
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

export default MyArticlesPage;
