// src/app/dashboard/page.tsx

"use client";


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/api";
import Link from "next/link";
import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// --- ANIMATION VARIANTS ---

// 1. PAGE ENTRANCE
const pageAnimation: Variants = {
    hidden: { 
        opacity: 0, 
        y: 30, // Start lower down
        scale: 0.98 
    },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.8, 
            ease: [0.25, 1, 0.5, 1], 
            when: "beforeChildren", 
            staggerChildren: 0.05, 
        },
    },
};

// 2. CARD/ITEM ENTRANCE
const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: { 
            type: "spring", 
            stiffness: 150, 
            damping: 18 
        } 
    },
    hover: { 
        scale: 1.02, 
        y: -3, 
        boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
        transition: { duration: 0.3 } 
    },
};

const DashboardPage = () => {

    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
     // 1. AJOUTER UN ÉTAT POUR LES STATISTIQUES
    const [stats, setStats] = useState<any>(null); 
    

    useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
        router.push("/signin"); // redirige si pas connecté
        return;
    }

   // 2. MODIFIER LE FETCH POUR RÉCUPÉRER L'UTILISATEUR ET LES STATS EN PARALLÈLE
       Promise.all([
            fetchWithAuth("user"),
            fetchWithAuth("articles/stats") 
        ])
        .then(([userData, statsData]) => {
            setUser(userData);
            setStats(statsData);
        })
        .catch((error) => {
            console.error("Auth or data fetch error:", error);
            localStorage.removeItem("token");
            router.push("/signin");
        })
        .finally(() => {
            setLoading(false); // Mettre fin au chargement une fois que tout est récupéré
        }); 
    }, []);

    
    // --- CDN PURGE FUNCTION (SIMULATION) ---
   const handlePurgeCDN = async () => {
        alert("CDN Cache purge in progress... This may take a few minutes.");
        
        try {
            const response = await fetch('/api/purge-cdn', { method: 'POST' });
            
            // Pas besoin de simuler un délai ici, l'API le fait déjà
            
            if (response.ok) {
                const data = await response.json();
                // Utilise l'ID réel retourné par l'API simulée
                alert(`✅ Purge Success! Invalidation ID ${data.invalidationId} has been initiated. Status: ${data.status}`);
            } else {
                // Backend error handling
                const data = await response.json();
                alert(`⚠️ Purge Failed. Error: ${data.error || 'Unknown error.'}`);
            }

        } catch (error) {
            // Network connection error
            alert(`❌ Failed to connect to the purge API.`);
            console.error("CDN Purge Error:", error);
        }
    };
    
    // --- ICONS (Lucide/Heroicons Style) ---
    const SVGIcons = {
        file: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>),
        users: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>),
        messageCircle: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>),
        flag: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" x2="4" y1="22" y2="15"></line></svg>),
        activity: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>),
        lock: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>),
        cloud: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path></svg>),
        system: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><rect x="2" y="3" width="20" height="18" rx="2" ry="2"></rect><line x1="2" x2="22" y1="8" y2="8"></line><line x1="7" x2="7" y1="3" y2="8"></line><line x1="17" x2="17" y1="3" y2="8"></line></svg>),
        refresh: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M21.5 2v6h-6"/><path d="M2.5 22v-6h6"/><path d="M20.9 14.5a9 9 0 0 0-14.7-6.2l-3.2 3.2m18 3.2l-3.2 3.2a9 9 0 0 1-14.7 6.2"/></svg>),
    };

    // --- DATA ---
    const kpis = stats ? [
    { 
        title: "Total Users", 
        value: stats.userStats.total, 
        description: `${stats.userStats.active} active users`, 
        link: "/dashboard/users", 
        icon: SVGIcons.users, 
        color: "text-blue-500" 
    },
    { 
        title: "Total Articles", 
        value: stats.articleStats.total, 
        description: `${stats.articleStats.published} published articles`, 
        link: "/dashboard/articles", 
        icon: SVGIcons.file, 
        color: "text-green-500" 
    },
    { 
        title: "Total Comments", 
        value: stats.commentStats.total, 
        description: `${stats.commentStats.pending} pending comments`, 
        link: "/dashboard/comments", 
        icon: SVGIcons.messageCircle, 
        color: "text-yellow-500" 
    },
    ] : [];

    const managementLinks = [
        { title: "Articles for Moderation", description: "Check and archive inappropriate content", link: "/dashboard/articles", icon: SVGIcons.flag, label: "Moderate Articles" },
        { title: "Reported Comments", description: "Delete offensive or off-topic comments", link: "/dashboard/comments", icon: SVGIcons.flag, label: "Moderate Comments" },
        { title: "Metrics & Monitoring", description: "View logs and APM via AWS CloudWatch", link: "/dashboard/metrics", icon: SVGIcons.activity, label: "Consult CloudWatch" },
        { title: "Secrets Management", description: "Configure API keys via AWS Secrets Manager", link: "/dashboard/secrets", icon: SVGIcons.lock, label: "Manage Secrets Manager" },
        { title: "S3 Storage & CDN", description: "Manage static files (S3) and cache", link: "/dashboard/storage", icon: SVGIcons.cloud, label: "Access Storage" },
    ];
    
    // Quick Actions - Updated for Blue CDN button and Orange Manage Articles
    const quickActions = [
        { title: "Purge CDN Cache", link: "/dashboard/cdn-purge", icon: SVGIcons.refresh, color: "bg-blue-600" }, 
        { title: "Add New User", link: "/dashboard/users", icon: SVGIcons.users, color: "bg-green-600" },
        { title: "Manage Articles", link: "/dashboard/articles", icon: SVGIcons.activity, color: "bg-orange-500" }, // Simple change, linked to articles management
    ];
    
    const recentActivity = [
        { type: "article", text: "New article published: Serverless Patterns", time: "1 min ago", icon: SVGIcons.file },
        { type: "comment", text: "3 comments flagged by AI", time: "15 min ago", icon: SVGIcons.flag },
        { type: "user", text: "New user registered (ID: 404)", time: "1 hour ago", icon: SVGIcons.users },
    ];
    const systemStatus = {
        status: "Online",
        uptime: "99.98%",
        requests: "128/s",
        color: "text-green-500",
        ringColor: "ring-green-500"
    };

    // --- COMPONENTS ---

    // Live System Status Widget
    const SystemStatusWidget = () => (
        <motion.div variants={itemVariants} className="bg-white dark:bg-dark shadow-xl rounded-xl p-5">
            <h3 className="text-lg font-bold text-dark dark:text-white mb-3 flex items-center">
                {SVGIcons.system} <span className="ml-2">System Status</span>
            </h3>
            <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-body-color dark:text-body-color-dark">Main Status</span>
                    <span className={`flex items-center font-bold ${systemStatus.color}`}>
                        <span className={`h-2 w-2 rounded-full mr-2 bg-current ring-2 ${systemStatus.ringColor} animate-pulse`}></span>
                        {systemStatus.status}
                    </span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Total Uptime</span>
                    <span>{systemStatus.uptime}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Req/s (APM)</span>
                    <span>{systemStatus.requests}</span>
                </div>
            </div>
        </motion.div>
    );

    // Reusable KPI Card Component with motion
    const KPICard = ({ kpi, idx }) => (
        <motion.div
            variants={itemVariants}
            whileHover="hover"
            key={idx}
            className="
                bg-white dark:bg-dark shadow-xl rounded-xl p-6 h-full
                border-t-4 border-primary
                dark:shadow-sticky-dark
            "
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-body-color dark:text-body-color-dark mb-1">
                        {kpi.title}
                    </p>
                    <p className={`text-4xl font-extrabold ${kpi.color}`}>
                        {kpi.value}
                    </p>
                </div>
                <div className={`flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-primary/10 ${kpi.color}`}>
                    {kpi.icon}
                </div>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {kpi.description}
            </p>
            <Link href={kpi.link} className="block mt-4 text-xs font-semibold text-primary hover:underline">
                View list &rarr;
            </Link>
        </motion.div>
    );

    // Reusable Management Card Component with motion
    const ManagementCard = ({ title, description, link, icon, label }) => (
        <motion.div variants={itemVariants} whileHover="hover" className="h-full">
            <Link
                href={link}
                className="bg-white dark:bg-dark shadow-lg rounded-xl p-6 h-full border border-gray-100 dark:border-stroke-dark flex flex-col justify-between transition duration-300 hover:shadow-xl hover:border-primary/50 group"
            >
                <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4 h-10 w-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
                        {icon}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-dark dark:text-white mb-1">{title}</h2>
                        <p className="text-sm text-body-color dark:text-body-color-dark">{description}</p>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-stroke-dark">
                    <span className="inline-flex items-center text-sm font-semibold text-primary transition duration-300 group-hover:text-primary-dark">
                        {label}
                        <span className="ml-1 text-base transition duration-300 group-hover:translate-x-1">→</span>
                    </span>
                </div>
            </Link>
        </motion.div>
    );

    // Quick Action Button - Handles CDN Purge action and other links
    const QuickActionButton = ({ title, link, icon, color }) => (
        <motion.div 
            variants={itemVariants}
            whileHover="hover"
            className="h-full"
        >
            {title === "Purge CDN Cache" ? (
                // Button for CDN action (Blue color)
                <motion.button 
                    onClick={handlePurgeCDN}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl shadow-lg transition-all duration-300 transform border-b-4 border-opacity-70 text-white hover:opacity-90 ${color} w-full h-full`}
                >
                    {/* Icon animation on click */}
                    <motion.div whileTap={{ rotate: 360 }} className="h-6 w-6 mb-2">{icon}</motion.div>
                    <span className="text-sm font-semibold text-center">{title}</span>
                </motion.button>
            ) : (
                // Other actions are simple links
                <Link
                    href={link}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl shadow-lg transition-all duration-300 transform border-b-4 border-opacity-70 text-white hover:opacity-90 ${color} w-full h-full`}
                >
                    <div className="h-6 w-6 mb-2">{icon}</div>
                    <span className="text-sm font-semibold text-center">{title}</span>
                </Link>
            )}
        </motion.div>
    );
    
    // Recent Activity Item
    const ActivityItem = ({ data }) => (
        <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <div className="flex-shrink-0 text-primary dark:text-primary/80">{data.icon}</div>
            <div className="flex-grow">
                <p className="text-sm font-medium text-dark dark:text-white">{data.text}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{data.time}</p>
            </div>
        </div>
    );
  
    if (loading) {
     return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
   }

    return (
        <motion.div
            variants={pageAnimation}
            initial="hidden"
            animate="show"
            className="min-h-screen bg-gray-50 dark:bg-bg-color-dark px-4 py-16 sm:px-6 lg:px-8"
        >
            <div className="container mx-auto max-w-7xl">
                
                {/* Dashboard Header */}
                <header className="mb-12 sm:mb-16 text-center">
                    <h1 className="text-5xl sm:text-6xl font-extrabold text-dark dark:text-white mb-3 tracking-tight">
                        Admin <span className="text-primary">CloudBlog</span>
                    </h1>
                    <p className="text-lg text-body-color dark:text-body-color-dark max-w-2xl mx-auto">
                        Manage moderation and monitor the Cloud-Native infrastructure.
                    </p>
                </header>

                <hr className="my-12 border-gray-200 dark:border-stroke-dark" />

                {/* --- SECTION: QUICK ACTIONS --- */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold text-dark dark:text-white mb-6 border-b border-gray-200 dark:border-stroke-dark pb-3">
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {quickActions.map((action, idx) => (
                                <QuickActionButton {...action} key={idx} />
                            ))}
                        </AnimatePresence>
                    </div>
                </section>

                <hr className="my-12 border-gray-200 dark:border-stroke-dark" />

                {/* --- MAIN GRID LAYOUT (2/3 + 1/3) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    
                    {/* --- LEFT COLUMN (KPIs & Management Links) --- */}
                    <div className="lg:col-span-2">
                        
                      {/* KPI SECTION */}
                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-dark dark:text-white mb-6 border-b border-gray-200 dark:border-stroke-dark pb-3">
                                Key Blog Statistics
                            </h2>
                            {/* Les données sont maintenant dynamiques et le rendu est géré par le state */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <AnimatePresence>
                                    {kpis.map((kpi, idx) => (
                                        <KPICard kpi={kpi} idx={idx} key={idx} />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </section>
                        
                        {/* MANAGEMENT LINKS SECTION */}
                        <section>
                            <h2 className="text-2xl font-semibold text-dark dark:text-white mb-6 border-b border-gray-200 dark:border-stroke-dark pb-3">
                                Management & Cloud Operations
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <AnimatePresence>
                                    {managementLinks.map((link, idx) => (
                                        <ManagementCard {...link} key={idx} />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </section>
                    </div>
                    
                    {/* --- RIGHT COLUMN (System Status & Activity) --- */}
                    <div className="lg:col-span-1 space-y-12">

                        {/* SYSTEM STATUS WIDGET */}
                        <SystemStatusWidget />

                        {/* RECENT ACTIVITY WIDGET */}
                        <section>
                            <div className="bg-white dark:bg-dark shadow-xl rounded-xl p-6 h-full">
                                <h3 className="text-xl font-bold text-dark dark:text-white mb-4 border-b border-gray-200 dark:border-stroke-dark pb-3">
                                    Recent Activity
                                </h3>
                                <div className="space-y-2">
                                    <AnimatePresence>
                                        {recentActivity.map((activity, idx) => (
                                            <motion.div variants={itemVariants} initial="hidden" animate="show" key={idx}>
                                                <ActivityItem data={activity} />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-stroke-dark">
                                    <Link href="/dashboard/metrics" className="block text-sm font-semibold text-primary hover:underline">
                                        View full logs &rarr;
                                    </Link>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

            </div>
        </motion.div>
    );
};
  
export default DashboardPage;