"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Calendar,
  Archive,
  Trash2,
  Edit,
  Clock,
  CheckCircle,
  BookOpen,
  X,
  Search,
  List,
  Tag,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";

// Secure API fetching function
import { fetchWithAuth } from "@/lib/api";

// --- Types (Adjusted for API data structure) ---
type Author = {
  name: string;
  image: string;
  designation: string;
};

export type Blog = {
  id: number;
  title: string;
  paragraph: string;
  image: string;
  author: Author;
  tags: string[]; // Stored as an array for the front-end
  publishDate: string;
  status: "Published" | "Archived";
};

type FilterStatus = "All" | Blog["status"];

// --- Status Badge Component (Unchanged) ---
const StatusBadge = ({ status }: { status: Blog["status"] }) => {
  let colorClass = "bg-gray-200 text-gray-800";
  let Icon = Clock;

  if (status === "Published") {
    colorClass =
      "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100";
    Icon = CheckCircle;
  } else if (status === "Archived") {
    colorClass =
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-100";
    Icon = Archive;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${colorClass}`}
    >
      <Icon size={14} className="mr-1" />
      {status}
    </span>
  );
};

// --- Blog Modal Component (Unchanged) ---
interface BlogModalProps {
  blog: Blog | null;
  onClose: () => void;
}

const BlogModal = ({ blog, onClose }: BlogModalProps) => {
  if (!blog) return null;

  return (
    <AnimatePresence>
      {blog && (
        <>
          {/* Semi-transparent overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-md dark:bg-black/40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-auto"
          >
            <div className="relative my-8 w-11/12 max-w-2xl rounded-xl bg-white p-6 shadow-lg dark:bg-gray-800">
              {/* Close button */}
              <button
                className="absolute top-4 right-4 z-50 p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                onClick={onClose}
              >
                <X size={20} />
              </button>

              {/* Blog Content */}
              <img
                src={blog.image}
                alt={blog.title}
                className="mb-4 h-60 w-full rounded-xl object-cover"
              />
              <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                {blog.title}
              </h2>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                {blog.paragraph}
              </p>
              <div className="mb-4 flex items-center gap-2">
                <img
                  src={blog.author.image}
                  alt={blog.author.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {blog.author.name}
                  </p>
                  <p>{blog.author.designation}</p>
                </div>
              </div>
              <div className="mb-2 flex flex-wrap gap-2">
                {Array.isArray(blog.tags) &&
                  blog.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                  <Calendar size={12} /> {blog.publishDate}
                </p>
                <StatusBadge status={blog.status} />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- Framer Motion Variants for Card Animation (Unchanged) ---
const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

// --- Blog Card Component (Structure Unchanged) ---
interface BlogCardProps {
  blog: Blog;
  onArchiveToggle: (id: number) => void;
  onDelete: (id: number) => void;
  // onEdit prop removed
  onView: (blog: Blog) => void;
  onTagClick: (tag: string) => void;
  isTagSelected: (tag: string) => boolean;
}

const BlogCard = ({
  blog,
  onArchiveToggle,
  onDelete,
  onView,
  onTagClick,
  isTagSelected,
}: BlogCardProps) => {
  // onEdit prop removed
  return (
    <motion.div
      layout
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-lg transition duration-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800"
    >
      {/* Clickable Area for View Modal */}
      <div onClick={() => onView(blog)} className="cursor-pointer">
        {/* Blog Image */}
        <img
          src={blog.image}
          alt={blog.title}
          className="mb-4 h-40 w-full rounded-xl object-cover"
        />

        {/* Blog Info */}
        <div>
          <div className="mb-2">
            <StatusBadge status={blog.status} />
          </div>
          <h2 className="line-clamp-2 text-lg font-semibold text-gray-900 dark:text-white">
            {blog.title}
          </h2>
        </div>
      </div>

      {/* Interactive Tags */}
      <div className="my-3 flex flex-wrap gap-1 border-t border-b border-gray-100 py-2 dark:border-gray-700">
        {Array.isArray(blog.tags) &&
          blog.tags.map((tag) => (
            <motion.button
              key={tag}
              onClick={(e) => {
                e.stopPropagation(); // Prevent card view modal from opening
                onTagClick(tag);
              }}
              className={`rounded-full px-2 py-0.5 text-xs transition-colors ${
                isTagSelected(tag)
                  ? "bg-blue-600 font-bold text-white" // Selected style
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-700/50 dark:text-blue-200 dark:hover:bg-blue-600" // Unselected style
              } cursor-pointer`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tag}
            </motion.button>
          ))}
      </div>

      {/* Footer Actions (Unchanged) */}
      <div className="mt-auto flex items-center justify-between pt-3">
        <p className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
          <Calendar size={12} /> {blog.publishDate}
        </p>
        <div className="flex gap-2">
          {/* --- BOUTON MODIFIER SUPPRIMÉ --- */}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onArchiveToggle(blog.id); // Uses API function
            }}
            className={`p-2 transition ${
              blog.status === "Archived"
                ? "text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                : "text-yellow-500 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300"
            }`}
            title={
              blog.status === "Archived" ? "Unarchive (Publish)" : "Archive"
            }
          >
            {blog.status === "Archived" ? (
              <Clock size={18} />
            ) : (
              <Archive size={18} />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(blog.id); // Uses API function
            }}
            className="p-2 text-red-500 transition hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main Articles Page Component ---
const ArticlesPage = () => {
  // States for API data
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);

  // States for filtering
  const [filter, setFilter] = useState<FilterStatus>("Published");
  const [searchText, setSearchText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Auto-close success message after 4 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
      return () => clearTimeout(timer); // Cleanup function
    }
  }, [successMessage]);

  // ----------------------------------------------------
  // 1. API Communication Functions
  // ----------------------------------------------------

  const fetchArticles = useCallback(async () => {
  setLoading(true);
  setError(null);

  try {
    const data: Blog[] = await fetchWithAuth("admin/articles");

    const normalizedData = data.map((blog) => {
      let tags: string[] = [];

      if (Array.isArray(blog.tags)) {
        tags = blog.tags;
      } else {
        // Si tags n’est pas un array, on met un array vide
        tags = [];
      }

      return { ...blog, tags };
    });

    setBlogs(normalizedData);
  } catch (err: any) {
    console.error("Error loading articles:", err);
    setError(
      err.message === "No auth token found"
        ? "Failed to load articles. Authentication token missing."
        : `Error: ${err.message}`
    );
  } finally {
    setLoading(false);
  }
}, []);

  // ----------------------------------------------------
  // 2. API Action Handlers
  // ----------------------------------------------------

  const handleArchiveToggle = async (id: number) => {
    const blogToUpdate = blogs.find((b) => b.id === id);
    if (!blogToUpdate) return;

    const newStatus =
      blogToUpdate.status === "Archived" ? "Published" : "Archived";

    if (
      !window.confirm(
        `Are you sure you want to change the status of this article to "${newStatus}"?`,
      )
    ) {
      return;
    }

    // 1. Déterminer la bonne URL d'API en fonction de l'action
    const endpoint =
      newStatus === "Published"
        ? `articles/${id}/publish`
        : `articles/${id}/archive`;

    try {
      // 2. Utiliser l'URL dynamique dans l'appel API
      await fetchWithAuth(endpoint, {
        method: "PUT",
        // Le body n'est plus strictement nécessaire car la route définit l'action,
        // mais l'envoyer ne pose pas de problème.
        body: JSON.stringify({ status: newStatus }),
      });

      // Rafraîchir les données après la modification
      fetchArticles();
    } catch (err) {
      alert(`Error: Failed to update article status to "${newStatus}".`);
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !window.confirm(
        "Are you sure you want to PERMANENTLY DELETE this article?",
      )
    ) {
      return;
    }

    try {
      // 1. Appeler l'API pour supprimer l'article
      const successResponse = await fetchWithAuth(`articles/${id}`, {
        method: "DELETE",
      });

      // 2. Définir le message de succès.
      // Le back-end Laravel renvoie ['message' => 'Article successfully deleted.'].
      // Si fetchWithAuth renvoie cet objet, utilisez-le directement.
      const message =
        successResponse?.message || "Article deleted successfully!";

      setSuccessMessage(message); // Définir le message

      // 3. Déclencher le rafraîchissement des données
      fetchArticles();
    } catch (err: any) {
      // Si fetchWithAuth lève une exception (pour un statut 4xx/5xx), elle sera attrapée ici.
      // La propriété 'message' pourrait être sur l'objet d'erreur (err.message)
      const errorMessage = err.message || "Error: Failed to delete article.";
      alert(errorMessage);
      console.error(err);
    }
  };

  // --- FONCTION handleEdit SUPPRIMÉE ---

  const handleView = (blog: Blog) => {
    setSelectedBlog(blog);
  };

  const closeModal = () => setSelectedBlog(null);

  // Tag Handler (Unchanged)
  const handleTagClick = (tag: string) => {
    setSelectedTags((prevTags) => {
      if (prevTags.includes(tag)) {
        return prevTags.filter((t) => t !== tag);
      } else {
        return [...prevTags, tag];
      }
    });
  };

  const isTagSelected = (tag: string) => selectedTags.includes(tag);

  // ----------------------------------------------------
  // 3. Effects and Memos (Unchanged)
  // ----------------------------------------------------

  // Initial call on component load
  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Filtering Logic (Unchanged)
  const filteredBlogs = useMemo(() => {
    let result = blogs;

    // 1. Filter by Status (Tabs)
    if (filter !== "All") {
      result = result.filter((blog) => blog.status === filter);
    }

    // 2. Filter by Multiple Tags
    if (selectedTags.length > 0) {
      result = result.filter(
        (blog) =>
          Array.isArray(blog.tags) &&
          selectedTags.some((tag) => blog.tags.includes(tag)),
      );
    }

    // 3. Filter by Text (Author or Title)
    if (searchText.trim() !== "") {
      const lowerCaseSearch = searchText.toLowerCase().trim();
      result = result.filter(
        (blog) =>
          blog.author.name.toLowerCase().includes(lowerCaseSearch) ||
          blog.title.toLowerCase().includes(lowerCaseSearch),
      );
    }

    return result;
  }, [blogs, filter, searchText, selectedTags]);

  // Statistics and Tags (Unchanged)
  const publishedCount = blogs.filter((b) => b.status === "Published").length;
  const archivedCount = blogs.filter((b) => b.status === "Archived").length;

  const uniqueTags = useMemo(() => {
    const tagSet = new Set<string>();
    blogs.forEach((blog) => {
      if (Array.isArray(blog.tags)) {
        blog.tags.forEach((tag) => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [blogs]);

  // Tab Button Component (Unchanged)
  const TabButton = ({
    name,
    currentFilter,
    count = 0,
  }: {
    name: FilterStatus;
    currentFilter: FilterStatus;
    count?: number;
  }) => {
    const isActive = name === currentFilter;

    return (
      <button
        onClick={() => setFilter(name)}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          isActive
            ? "bg-blue-600 text-white shadow-md"
            : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        } flex items-center gap-1 whitespace-nowrap`}
      >
        {name}
        {name !== "All" && count > 0 && (
          <span
            className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${name === "Archived" ? "bg-yellow-500 text-white" : "bg-green-500 text-white"}`}
          >
            {count}
          </span>
        )}
      </button>
    );
  };

  const SuccessAlert = ({
    message,
    onClose,
  }: {
    message: string;
    onClose: () => void;
  }) => (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -50, opacity: 0 }}
      className="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl bg-green-500 p-4 text-white shadow-xl"
    >
      <CheckCircle size={20} />
      <p className="font-medium">{message}</p>
      <button
        onClick={onClose}
        className="rounded-full p-1 transition hover:bg-green-600"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
  // ----------------------------------------------------
  // 4. Render
  // ----------------------------------------------------

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50 p-8 dark:bg-gray-900"
    >
      {/* Header */}
      <h1 className="mb-8 flex items-center gap-3 text-3xl font-bold text-gray-900 dark:text-white">
        <BookOpen size={28} className="text-blue-600 dark:text-blue-400" />{" "}
        Article Management (Blogs)
      </h1>

      {/* Statistics Block */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3"
      >
        {/* Total Articles */}
        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-5 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {blogs.length}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Total Articles
            </p>
          </div>
          <List size={32} className={`text-blue-600 opacity-70`} />
        </div>
        {/* Published */}
        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-5 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {publishedCount}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Published
            </p>
          </div>
          <CheckCircle size={32} className={`text-green-600 opacity-70`} />
        </div>
        {/* Archived */}
        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-5 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {archivedCount}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Archived
            </p>
          </div>
          <Archive size={32} className={`text-yellow-600 opacity-70`} />
        </div>
      </motion.div>

      {/* Loading/Error States */}
      {loading && (
        <div className="mb-8 rounded-xl bg-blue-100 p-10 text-center dark:bg-blue-900/50">
          <p className="font-semibold text-blue-700 dark:text-blue-300">
            Loading articles from API...
          </p>
        </div>
      )}

      {error && (
        <div className="mb-8 rounded-xl bg-red-100 p-10 text-center dark:bg-red-900/50">
          <p className="font-semibold text-red-700 dark:text-red-300">
            Error: {error}
          </p>
          <button
            onClick={fetchArticles}
            className="mt-2 text-sm text-red-500 underline hover:text-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Rest of the interface if neither loading nor error */}
      {!loading && !error && (
        <>
          {/* Status Filter Bar (Tabs) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mb-6 flex flex-wrap gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800"
          >
            <TabButton
              name="Published"
              currentFilter={filter}
              count={publishedCount}
            />
            <TabButton
              name="Archived"
              currentFilter={filter}
              count={archivedCount}
            />
            <TabButton name="All" currentFilter={filter} />
          </motion.div>

          {/* Interactive Tags and Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mb-8"
          >
            {/* Current Tag Filter Indicator */}
            <AnimatePresence>
              {selectedTags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-700/50 dark:bg-blue-900/50 dark:text-blue-300"
                >
                  <span className="flex flex-wrap items-center gap-2 font-medium">
                    <Tag size={16} />
                    Filtering by Tag:
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center rounded-lg bg-blue-200 px-2 py-0.5 font-bold dark:bg-blue-700"
                      >
                        {tag}
                        <button
                          onClick={() => handleTagClick(tag)}
                          className="ml-1 text-blue-700 hover:text-red-500 dark:text-blue-300 dark:hover:text-red-300"
                          title={`Remove ${tag}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </span>
                  <button
                    onClick={() => setSelectedTags([])}
                    className="rounded-full p-1 transition hover:bg-blue-100 dark:hover:bg-blue-900"
                    title="Clear All Tag Filters"
                  >
                    <XCircle size={18} /> Clear All
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Popular Tags / Tag Selection Area */}
            <div className="mb-4 flex flex-wrap gap-2 rounded-xl border border-gray-100 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <span className="mr-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                Quick Tags:
              </span>
              {uniqueTags.map((tag) => (
                <motion.button
                  key={`quick-tag-${tag}`}
                  onClick={() => handleTagClick(tag)}
                  className={`rounded-full px-3 py-1 text-xs transition-colors ${
                    isTagSelected(tag)
                      ? "bg-blue-600 font-bold text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {tag}
                </motion.button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <Search size={20} className="text-gray-500" />
              <input
                type="text"
                placeholder="Search by title or author..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full border-none bg-transparent p-0 text-gray-900 focus:ring-0 dark:text-white"
              />
            </div>
          </motion.div>

          {/* Filtered Articles Grid with Animation */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {filteredBlogs.length > 0 ? (
                filteredBlogs.map((blog) => (
                  <BlogCard
                    key={blog.id}
                    blog={blog}
                    onArchiveToggle={handleArchiveToggle}
                    onDelete={handleDelete}
                    // onEdit prop removed
                    onView={handleView}
                    onTagClick={handleTagClick}
                    isTagSelected={isTagSelected}
                  />
                ))
              ) : (
                <motion.div
                  key="no-results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-lg bg-white p-10 text-center shadow-md sm:col-span-2 lg:col-span-3 xl:col-span-4 dark:bg-gray-800"
                >
                  <p className="text-lg text-gray-500 dark:text-gray-400">
                    No articles match the current filters.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* View Modal */}
      <BlogModal blog={selectedBlog} onClose={closeModal} />
      {/* Success Alert */}
      <AnimatePresence>
        {successMessage && (
          <SuccessAlert
            message={successMessage}
            onClose={() => setSuccessMessage(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ArticlesPage;
