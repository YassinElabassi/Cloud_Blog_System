"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Common/Breadcrumb";

const CreateArticlePage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    paragraph: "",
    image: "",
    tags: "",
    status: "Published",
  });

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
  }, [user, authLoading, router]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("auth_token");
      const formDataToSend = new FormData();

      formDataToSend.append("title", formData.title);
      formDataToSend.append("paragraph", formData.paragraph);
      formDataToSend.append("tags", formData.tags || "");

      // Only append image if a file was selected
      if (imageFile) {
        formDataToSend.append("image", imageFile);
      }

      const response = await fetch("http://127.0.0.1:8000/api/articles", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (response.ok) {
        const result = await response.json();
        alert("Article created successfully!");
        router.push("/my-articles");
      } else {
        // Try to parse as JSON, fallback to text if it fails
        let errorData;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          errorData = await response.json();
        } else {
          const text = await response.text();
          console.error("Non-JSON response:", text);
          alert("Server error. Check console for details.");
          return;
        }

        console.error("Create error:", errorData);

        // Display validation errors if they exist
        if (errorData.errors) {
          const errorMessages = Object.entries(errorData.errors)
            .map(
              ([field, messages]) =>
                `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`,
            )
            .join("\n");
          alert(`Validation errors:\n${errorMessages}`);
        } else {
          alert(
            errorData.message || errorData.error || "Failed to create article",
          );
        }
      }
    } catch (error) {
      console.error("Error creating article:", error);
      alert("Error creating article");
    } finally {
      setLoading(false);
    }
  };

  // Don't render if not authenticated or Admin
  if (authLoading || !user || user.role === "Admin") {
    return null;
  }

  return (
    <>
      <Breadcrumb
        pageName="Create Article"
        description="Share your knowledge with the community"
      />

      <section className="pt-[120px] pb-[120px]">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="dark:bg-dark dark:border-stroke-dark rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label
                    htmlFor="title"
                    className="text-dark mb-2 block text-sm font-semibold dark:text-white"
                  >
                    Article Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="text-body-color focus:border-primary dark:border-stroke-dark dark:text-body-color-dark w-full rounded-md border border-gray-200 px-4 py-3 text-base transition outline-none dark:bg-gray-800"
                    placeholder="Enter article title"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="paragraph"
                    className="text-dark mb-2 block text-sm font-semibold dark:text-white"
                  >
                    Article Content
                  </label>
                  <textarea
                    id="paragraph"
                    name="paragraph"
                    rows={10}
                    value={formData.paragraph}
                    onChange={handleChange}
                    className="text-body-color focus:border-primary dark:border-stroke-dark dark:text-body-color-dark w-full resize-none rounded-md border border-gray-200 px-4 py-3 text-base transition outline-none dark:bg-gray-800"
                    placeholder="Write your article content..."
                    required
                  ></textarea>
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="image"
                    className="text-dark mb-2 block text-sm font-semibold dark:text-white"
                  >
                    Featured Image (Optional)
                  </label>
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                    onChange={handleFileChange}
                    className="text-body-color focus:border-primary dark:border-stroke-dark dark:text-body-color-dark w-full rounded-md border border-gray-200 px-4 py-3 text-base transition outline-none dark:bg-gray-800"
                  />
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="tags"
                    className="text-dark mb-2 block text-sm font-semibold dark:text-white"
                  >
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    className="text-body-color focus:border-primary dark:border-stroke-dark dark:text-body-color-dark w-full rounded-md border border-gray-200 px-4 py-3 text-base transition outline-none dark:bg-gray-800"
                    placeholder="technology, programming, web development"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90 rounded-md px-8 py-3 text-base font-semibold text-white transition duration-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Creating..." : "Create Article"}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/my-articles")}
                    className="text-body-color dark:border-stroke-dark dark:text-body-color-dark rounded-md border border-gray-300 px-8 py-3 text-base font-semibold transition duration-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CreateArticlePage;
