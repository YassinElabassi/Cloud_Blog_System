"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, Flag, MessageSquare, Trash2, BookOpen, User, List } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// Secure API fetching function
import { fetchWithAuth } from "@/lib/api";

// --- TYPES ---
// --- LA CORRECTION EST ICI ---
interface Article {
    id: number;
    title: string;
}

interface Comment {
    id: number;
    content: string;
    author: string;
    articleId: number;
    articleTitle: string;
    isReported: boolean;
    status: "Pending" | "Approved" | "Rejected";
}

type ApiComment = {
    id: number;
    content: string;
    is_reported: boolean;
    status: "Pending" | "Approved" | "Rejected";
    user: { id: number; name: string; };
    article: { id: number; title: string; };
};

type FilterStatus = "All" | Comment['status'] | "Reported";

// --- Helper for Dynamic Avatars ---
const getAuthorAvatar = (author: string) => {
    const firstLetter = author ? author.charAt(0).toUpperCase() : 'A';
    const colorHash = firstLetter.charCodeAt(0) * 10 % 360; 
    const bgColor = `hsl(${colorHash}, 60%, 50%)`;
    return { firstLetter, bgColor };
};

// --- SUB-COMPONENTS ---

const ModerationBadge = ({ status }: { status: Comment["status"] }) => {
    let colorClass: string, Icon: typeof Flag, text: string;
    if (status === "Approved") {
        colorClass = "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"; Icon = CheckCircle; text = "Approved";
    } else if (status === "Rejected") {
        colorClass = "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"; Icon = XCircle; text = "Rejected";
    } else { // Pending
        colorClass = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300"; Icon = MessageSquare; text = "Pending";
    }
    return (<span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${colorClass}`}><Icon size={14} className="mr-1" />{text}</span>);
};

const StatCard = ({ title, value, Icon, color }: { title: string; value: number; Icon: typeof List; color: string; }) => (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border"><p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{title}</p><div className={`p-3 rounded-full bg-gray-100 dark:bg-gray-700 ${color}`}><Icon size={24} className={`${color} opacity-80`} /></div></div>
);

const StatsBlock = ({ total, pending, reported }: { total: number; pending: number; reported: number; }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Comments" value={total} Icon={List} color="text-blue-600" />
        <StatCard title="Pending Review" value={pending} Icon={MessageSquare} color="text-yellow-500" />
        <StatCard title="Reported" value={reported} Icon={Flag} color="text-orange-500" />
    </div>
);

const CommentCard = ({ comment, onApprove, onReject, onDelete, onResolve }: { comment: Comment; onApprove: (id: number) => void; onReject: (id: number) => void; onDelete: (id: number) => void; onResolve: (id: number) => void; }) => {
    const isPending = comment.status === "Pending";
    const { firstLetter, bgColor } = getAuthorAvatar(comment.author);

    return (
        <motion.div
            layout 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, transition: { duration: 0.2 } }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-5 border border-gray-200 dark:border-gray-700 flex flex-col justify-between"
        >
            <div>
                <div className="flex items-center justify-between text-xs mb-3 border-b pb-2 dark:border-gray-700">
                    <div className="flex items-center min-w-0 text-blue-600 dark:text-blue-400">
                        <BookOpen size={14} className="mr-2 flex-shrink-0" />
                        <span className="font-medium truncate" title={comment.articleTitle}>
                            {comment.articleTitle}
                        </span>
                    </div>
                    {comment.isReported && (
                        <button 
                            onClick={() => onResolve(comment.id)}
                            title="This comment was reported. Click to resolve."
                            className="ml-2 p-1 bg-orange-500 text-white rounded-full transition transform hover:scale-110"
                        >
                            <Flag size={14} />
                        </button>
                    )}
                </div>
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow" style={{ backgroundColor: bgColor }}>
                            {firstLetter}
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{comment.author}</p>
                    </div>
                    <ModerationBadge status={comment.status} />
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{comment.content}</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-3 border-t dark:border-gray-700 mt-auto">
                {isPending && (
                    <>
                        <button onClick={() => onApprove(comment.id)} className="flex items-center gap-1 px-3 py-1 text-sm text-green-700 bg-green-100 rounded hover:bg-green-200 transition">
                            <CheckCircle size={16} /> Approve
                        </button>
                        <button onClick={() => onReject(comment.id)} className="flex items-center gap-1 px-3 py-1 text-sm text-yellow-700 bg-yellow-100 rounded hover:bg-yellow-200 transition">
                            <XCircle size={16} /> Reject
                        </button>
                    </>
                )}
                <button onClick={() => onDelete(comment.id)} className="ml-auto p-1 text-red-500 hover:text-red-700 transition" title="Permanently Delete">
                    <Trash2 size={20} />
                </button>
            </div>
        </motion.div>
    );
};

const TabButton = ({ name, currentFilter, count = 0, onClick }: { name: FilterStatus; currentFilter: FilterStatus; count?: number; onClick: () => void; }) => {
    const isActive = name === currentFilter;
    return ( <button onClick={onClick} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isActive ? "bg-blue-600 text-white shadow-md" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"} flex items-center gap-1 whitespace-nowrap`}> {name} {count > 0 && <span className={`ml-1 text-xs font-bold px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600`}>{count}</span>} </button> );
};

// --- Main Comments Page ---
const CommentsPage = () => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [allArticles, setAllArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState({ total: 0, pending: 0, reported: 0 });
    const [filter, setFilter] = useState<FilterStatus>("Pending"); 
    const [selectedArticleId, setSelectedArticleId] = useState<number | 'all'>('all');
    const [searchText, setSearchText] = useState('');

    const fetchDashboardData = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const params = new URLSearchParams();
            if (filter !== "All") params.append('status', filter);
            if (selectedArticleId !== 'all') params.append('article_id', String(selectedArticleId));
            if (searchText) params.append('search', searchText);
            const data = await fetchWithAuth(`admin/comments?${params.toString()}`);
            const formattedComments: Comment[] = data.comments.map((c: ApiComment) => ({ id: c.id, content: c.content, author: c.user.name, articleId: c.article.id, articleTitle: c.article.title, isReported: c.is_reported, status: c.status }));
            const articlesFromComments = Array.from(new Map(formattedComments.map(c => [c.articleId, { id: c.articleId, title: c.articleTitle }])).values());
            setAllArticles(articlesFromComments);
            setComments(formattedComments);
            setStats(data.stats);
        } catch (err: any) {
            setError(err.message || "Failed to load comments.");
            toast.error("Could not load moderation dashboard.");
        } finally { setLoading(false); }
    }, [filter, selectedArticleId, searchText]);

    useEffect(() => { const handler = setTimeout(() => fetchDashboardData(), 300); return () => clearTimeout(handler); }, [fetchDashboardData]);

    const handleModerate = async (id: number, newStatus: 'Approved' | 'Rejected') => {
        if (!window.confirm(`Are you sure you want to ${newStatus.toUpperCase()} this comment?`)) return;
        const originalComments = [...comments];
        setComments(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
        try {
            await fetchWithAuth(`comments/${id}/moderate`, { method: 'PUT', body: JSON.stringify({ status: newStatus }) });
            toast.success(`Comment successfully ${newStatus.toLowerCase()}.`);
            fetchDashboardData();
        } catch (err: any) {
            toast.error(`Failed to moderate comment: ${err.message}`);
            setComments(originalComments);
        }
    };
    
    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to PERMANENTLY DELETE this comment?")) return;
        const originalComments = [...comments];
        setComments(prev => prev.filter(c => c.id !== id));
        try {
            await fetchWithAuth(`comments/${id}`, { method: 'DELETE' });
            toast.success("Comment permanently deleted.");
            fetchDashboardData();
        } catch (err: any) {
            toast.error(`Failed to delete comment: ${err.message}`);
            setComments(originalComments);
        }
    };

    const handleResolveReport = async (id: number) => {
        if (!window.confirm("Are you sure you want to resolve this report? This will unmark the comment as reported.")) return;
        const originalComments = [...comments];
        setComments(prev => prev.map(c => c.id === id ? { ...c, isReported: false } : c));
        try {
            await fetchWithAuth(`comments/${id}/report-toggle`, { method: 'PUT' });
            toast.success("Report has been resolved.");
            fetchDashboardData();
        } catch (err: any) {
            toast.error(`Failed to resolve report: ${err.message}`);
            setComments(originalComments);
        }
    };
    
    return (
        <div className="p-8 min-h-screen bg-gray-50 dark:bg-gray-900">
            <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white flex items-center gap-2"><MessageSquare size={28} className="text-blue-600" /> Comment Moderation</h1>
            <StatsBlock total={stats.total} pending={stats.pending} reported={stats.reported} />
            <div className="flex flex-wrap gap-3 mb-6 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <TabButton name="Pending" currentFilter={filter} count={stats.pending} onClick={() => setFilter("Pending")} />
                <TabButton name="Reported" currentFilter={filter} count={stats.reported} onClick={() => setFilter("Reported")} />
                <TabButton name="Approved" currentFilter={filter} onClick={() => setFilter("Approved")} />
                <TabButton name="Rejected" currentFilter={filter} onClick={() => setFilter("Rejected")} />
                <TabButton name="All" currentFilter={filter} onClick={() => setFilter("All")} />
            </div>
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex items-center gap-3 w-full md:w-1/2 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                    <BookOpen size={20} className="text-blue-500" />
                    <select value={selectedArticleId} onChange={(e) => setSelectedArticleId(Number(e.target.value) || 'all')} className="w-full bg-transparent text-gray-900 dark:text-white border-none focus:ring-0">
                        <option value="all">Filter by Article (All)</option>
                        {allArticles.map(article => <option key={article.id} value={article.id}>{article.title}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-3 w-full md:w-1/2 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                    <User size={20} className="text-gray-500" />
                    <input type="text" placeholder="Search by Author..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="w-full bg-transparent text-gray-900 dark:text-white border-none focus:ring-0" />
                </div>
            </div>
            {loading ? <div className="text-center p-10">Loading comments...</div> : error ? <div className="text-center p-10 text-red-500">Error: {error}</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {comments.length > 0 ? (comments.map(comment => 
                            <CommentCard 
                                key={comment.id} 
                                comment={comment} 
                                onApprove={() => handleModerate(comment.id, "Approved")} 
                                onReject={() => handleModerate(comment.id, "Rejected")} 
                                onDelete={handleDelete} 
                                onResolve={handleResolveReport} 
                            />
                        )) : (
                            <div className="md:col-span-3 text-center p-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                                <p className="text-lg text-gray-500 dark:text-gray-400">No comments matched the selected filters.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default CommentsPage;