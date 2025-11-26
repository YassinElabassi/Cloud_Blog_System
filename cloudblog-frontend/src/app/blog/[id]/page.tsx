"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import CommentSection from "@/components/Blog/CommentSection";
import SharePost from "@/components/Blog/SharePost";
import TagButton from "@/components/Blog/TagButton";

interface Article {
  id: number;
  title: string;
  paragraph: string;
  image: string | null;
  tags: string[] | string | null;
  publish_date: string;
  user: {
    id: number;
    name: string;
    image: string | null;
    designation: string;
  };
}

const BlogDetailsPage = () => {
  const params = useParams();
  const articleId = params?.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (articleId) {
      fetchArticle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  const fetchArticle = async () => {
    try {
      // Get auth token from localStorage (using correct key)
      const token = localStorage.getItem("auth_token");

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // Add authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        console.log("Fetching article with auth token");
      } else {
        console.log("No auth token found, fetching as guest");
      }

      const response = await fetch(
        `http://127.0.0.1:8000/api/articles/${articleId}`,
        { headers },
      );
      if (response.ok) {
        const data = await response.json();

        // Parse tags - handle both JSON strings, arrays, and comma-separated strings
        let tags = [];
        if (data.tags) {
          if (Array.isArray(data.tags)) {
            tags = data.tags;
          } else if (typeof data.tags === "string") {
            if (data.tags.trim()) {
              try {
                // Try parsing as JSON first
                tags = JSON.parse(data.tags);
              } catch {
                // If JSON parse fails, treat as comma-separated string
                tags = data.tags
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter((tag) => tag);
              }
            }
          }
        }
        data.tags = tags;

        setArticle(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Article fetch failed:", {
          status: response.status,
          error: errorData,
          articleId,
          hasToken: !!token,
        });
      }
    } catch (error) {
      console.error("Error fetching article:", error);
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

  if (loading) {
    return (
      <section className="pt-[150px] pb-[120px]">
        <div className="container">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="border-primary inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-r-transparent"></div>
              <p className="text-body-color dark:text-body-color-dark mt-4">
                Loading article...
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!article) {
    return (
      <section className="pt-[150px] pb-[120px]">
        <div className="container">
          <div className="py-20 text-center">
            <h2 className="text-dark mb-4 text-3xl font-bold dark:text-white">
              Article Not Found
            </h2>
            <p className="text-body-color dark:text-body-color-dark mb-8">
              The article you're looking for doesn't exist.
            </p>
            <Link
              href="/blog-public"
              className="bg-primary hover:bg-primary/90 inline-block rounded-md px-8 py-3 text-base font-semibold text-white transition duration-300"
            >
              Back to Blog
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="pt-[150px] pb-[120px]">
        <div className="container">
          <div className="-mx-4 flex flex-wrap justify-center">
            <div className="w-full px-4 lg:w-8/12">
              <div>
                <h1 className="text-dark mb-8 text-3xl leading-tight font-bold sm:text-4xl sm:leading-tight dark:text-white">
                  {article.title}
                </h1>

                <div className="border-body-color/10 mb-10 flex flex-wrap items-center justify-between border-b pb-4 dark:border-white/10">
                  <div className="flex flex-wrap items-center">
                    <div className="mr-10 mb-5 flex items-center">
                      <div className="mr-4">
                        <div className="relative h-12 w-12 overflow-hidden rounded-full">
                          {article.user.image ? (
                            <Image
                              src={article.user.image}
                              alt={article.user.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="bg-primary flex h-full w-full items-center justify-center text-lg font-semibold text-white">
                              {article.user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="w-full">
                        <h4 className="text-dark mb-1 text-base font-medium dark:text-white">
                          {article.user.name}
                        </h4>
                        <p className="text-body-color dark:text-body-color-dark text-xs">
                          {article.user.designation || "Author"}
                        </p>
                      </div>
                    </div>
                    <div className="mb-5 flex items-center">
                      <p className="text-body-color dark:text-body-color-dark mr-5 flex items-center text-base font-medium">
                        <span className="mr-3">
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 15 15"
                            className="fill-current"
                          >
                            <path d="M3.89531 8.67529H3.10666C2.96327 8.67529 2.86768 8.77089 2.86768 8.91428V9.67904C2.86768 9.82243 2.96327 9.91802 3.10666 9.91802H3.89531C4.03871 9.91802 4.1343 9.82243 4.1343 9.67904V8.91428C4.1343 8.77089 4.03871 8.67529 3.89531 8.67529Z" />
                            <path d="M6.429 8.67529H5.64035C5.49696 8.67529 5.40137 8.77089 5.40137 8.91428V9.67904C5.40137 9.82243 5.49696 9.91802 5.64035 9.91802H6.429C6.57239 9.91802 6.66799 9.82243 6.66799 9.67904V8.91428C6.66799 8.77089 6.5485 8.67529 6.429 8.67529Z" />
                            <path d="M8.93828 8.67529H8.14963C8.00624 8.67529 7.91064 8.77089 7.91064 8.91428V9.67904C7.91064 9.82243 8.00624 9.91802 8.14963 9.91802H8.93828C9.08167 9.91802 9.17727 9.82243 9.17727 9.67904V8.91428C9.17727 8.77089 9.08167 8.67529 8.93828 8.67529Z" />
                            <path d="M11.4715 8.67529H10.6828C10.5394 8.67529 10.4438 8.77089 10.4438 8.91428V9.67904C10.4438 9.82243 10.5394 9.91802 10.6828 9.91802H11.4715C11.6149 9.91802 11.7105 9.82243 11.7105 9.67904V8.91428C11.7105 8.77089 11.591 8.67529 11.4715 8.67529Z" />
                            <path d="M3.89531 11.1606H3.10666C2.96327 11.1606 2.86768 11.2562 2.86768 11.3996V12.1644C2.86768 12.3078 2.96327 12.4034 3.10666 12.4034H3.89531C4.03871 12.4034 4.1343 12.3078 4.1343 12.1644V11.3996C4.1343 11.2562 4.03871 11.1606 3.89531 11.1606Z" />
                            <path d="M6.429 11.1606H5.64035C5.49696 11.1606 5.40137 11.2562 5.40137 11.3996V12.1644C5.40137 12.3078 5.49696 12.4034 5.64035 12.4034H6.429C6.57239 12.4034 6.66799 12.3078 6.66799 12.1644V11.3996C6.66799 11.2562 6.5485 11.1606 6.429 11.1606Z" />
                            <path d="M8.93828 11.1606H8.14963C8.00624 11.1606 7.91064 11.2562 7.91064 11.3996V12.1644C7.91064 12.3078 8.00624 12.4034 8.14963 12.4034H8.93828C9.08167 12.4034 9.17727 12.3078 9.17727 12.1644V11.3996C9.17727 11.2562 9.08167 11.1606 8.93828 11.1606Z" />
                            <path d="M11.4715 11.1606H10.6828C10.5394 11.1606 10.4438 11.2562 10.4438 11.3996V12.1644C10.4438 12.3078 10.5394 12.4034 10.6828 12.4034H11.4715C11.6149 12.4034 11.7105 12.3078 11.7105 12.1644V11.3996C11.7105 11.2562 11.591 11.1606 11.4715 11.1606Z" />
                            <path d="M13.2637 3.3697H7.64754V2.58105C8.19721 2.43765 8.62738 1.91189 8.62738 1.31442C8.62738 0.597464 8.02992 0 7.28906 0C6.54821 0 5.95074 0.597464 5.95074 1.31442C5.95074 1.91189 6.35702 2.41376 6.93058 2.58105V3.3697H1.31442C0.597464 3.3697 0 3.96716 0 4.68412V13.2637C0 13.9807 0.597464 14.5781 1.31442 14.5781H13.2637C13.9807 14.5781 14.5781 13.9807 14.5781 13.2637V4.68412C14.5781 3.96716 13.9807 3.3697 13.2637 3.3697ZM6.6677 1.31442C6.6677 0.979841 6.93058 0.716957 7.28906 0.716957C7.62364 0.716957 7.91042 0.979841 7.91042 1.31442C7.91042 1.649 7.64754 1.91189 7.28906 1.91189C6.95448 1.91189 6.6677 1.6251 6.6677 1.31442ZM1.31442 4.08665H13.2637C13.5983 4.08665 13.8612 4.34954 13.8612 4.68412V6.45261H0.716957V4.68412C0.716957 4.34954 0.979841 4.08665 1.31442 4.08665ZM13.2637 13.8612H1.31442C0.979841 13.8612 0.716957 13.5983 0.716957 13.2637V7.16957H13.8612V13.2637C13.8612 13.5983 13.5983 13.8612 13.2637 13.8612Z" />
                          </svg>
                        </span>
                        {formatDate(article.publish_date)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Article Image */}
                {article.image && (
                  <div className="mb-10 w-full overflow-hidden rounded-md">
                    <div className="relative aspect-[97/60] w-full sm:aspect-[97/44]">
                      <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        className="object-cover object-center"
                      />
                    </div>
                  </div>
                )}

                {/* Article Content */}
                <div className="mb-10">
                  {article.paragraph.split("\n\n").map((paragraph, index) => (
                    <p
                      key={index}
                      className="text-body-color dark:text-body-color-dark mb-8 text-base leading-relaxed font-medium sm:text-lg sm:leading-relaxed"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>

                {/* Tags and Share */}
                <div className="border-body-color/10 items-center justify-between border-t pt-8 sm:flex dark:border-white/10">
                  {article.tags &&
                    Array.isArray(article.tags) &&
                    article.tags.length > 0 && (
                      <div className="mb-5">
                        <h5 className="text-body-color dark:text-body-color-dark mb-3 text-sm font-medium">
                          Tags:
                        </h5>
                        <div className="flex flex-wrap items-center gap-2">
                          {article.tags.map((tag, index) => (
                            <TagButton key={index} text={tag} />
                          ))}
                        </div>
                      </div>
                    )}
                  <div className="mb-5">
                    <h5 className="text-body-color dark:text-body-color-dark mb-3 text-sm font-medium sm:text-right">
                      Share this post:
                    </h5>
                    <div className="flex items-center sm:justify-end">
                      <SharePost />
                    </div>
                  </div>
                </div>

                {/* Comments Section */}
                <CommentSection articleId={article.id} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default BlogDetailsPage;