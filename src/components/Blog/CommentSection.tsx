"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image";

interface Comment {
  id: number;
  user: {
    id: number;
    name: string;
    image: string | null;
  };
  content: string;
  status: string;
  created_at: string;
}

interface CommentSectionProps {
  articleId: number;
}

const CommentSection = ({ articleId }: CommentSectionProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/articles/${articleId}/comments`,
      );
      if (response.ok) {
        const data = await response.json();
        setComments(data.filter((c: Comment) => c.status === "Approved"));
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `http://127.0.0.1:8000/api/articles/${articleId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: newComment }),
        },
      );

      if (response.ok) {
        setNewComment("");
        alert("Comment submitted! It will appear after moderation.");
        fetchComments();
      } else {
        alert("Failed to submit comment");
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("Error submitting comment");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="dark:border-stroke-dark mt-12 border-t border-gray-200 pt-8">
      <h3 className="text-dark mb-8 text-2xl font-bold dark:text-white">
        Comments ({comments.length})
      </h3>

      {/* Comment Form - Only visible to authenticated users */}
      <div className="mb-10">
        {user ? (
          <form onSubmit={handleSubmitComment}>
            <div className="mb-4">
              <label className="text-dark mb-2 block text-sm font-medium dark:text-white">
                Leave a Comment
              </label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
                className="border-stroke dark:border-stroke-dark dark:bg-dark focus:border-primary w-full rounded-md border bg-transparent px-4 py-3 text-base outline-none dark:text-white"
                placeholder="Write your comment here..."
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/90 rounded-md px-8 py-3 text-base font-semibold text-white transition duration-300 disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Comment"}
            </button>
          </form>
        ) : (
          <div className="dark:bg-dark dark:border-stroke-dark rounded-lg border border-gray-200 bg-gray-100 p-6 text-center">
            <p className="text-body-color dark:text-body-color-dark mb-4 text-base">
              You need to be signed in to leave a comment.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/signin"
                className="bg-primary hover:bg-primary/90 inline-block rounded-md px-6 py-2.5 text-base font-semibold text-white transition duration-300"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="border-primary text-primary hover:bg-primary inline-block rounded-md border-2 px-6 py-2.5 text-base font-semibold transition duration-300 hover:text-white"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {loadingComments ? (
          <p className="text-body-color dark:text-body-color-dark text-center">
            Loading comments...
          </p>
        ) : comments.length === 0 ? (
          <p className="text-body-color dark:text-body-color-dark py-8 text-center">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="dark:border-stroke-dark border-b border-gray-100 pb-6 last:border-0"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full bg-gray-200">
                    {comment.user.image ? (
                      <Image
                        src={comment.user.image}
                        alt={comment.user.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="bg-primary flex h-full w-full items-center justify-center text-lg font-semibold text-white">
                        {comment.user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-dark font-semibold dark:text-white">
                      {comment.user.name}
                    </h4>
                    <span className="text-body-color dark:text-body-color-dark text-sm">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-body-color dark:text-body-color-dark leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
