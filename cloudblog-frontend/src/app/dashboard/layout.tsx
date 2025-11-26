// src/app/dashboard/layout.tsx

"use client";

import Link from "next/link";
// 1. Importer useRouter pour la redirection
import { usePathname, useRouter } from "next/navigation";
import { LogOut, FileText, MessageCircle, Users, BarChart2, Key, LayoutDashboard } from "lucide-react"; 
import { ReactNode } from "react";
// 2. Importer le contexte d'authentification
import { useAuth } from "@/context/AuthContext";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    // 3. Initialiser le router et le contexte
    const router = useRouter();
    const { logout } = useAuth();

    const navLinks = [
        { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
        { href: "/dashboard/articles", label: "Articles", icon: <FileText size={18} /> },
        { href: "/dashboard/comments", label: "Comments", icon: <MessageCircle size={18} /> },
        { href: "/dashboard/users", label: "Users", icon: <Users size={18} /> },
        { href: "/dashboard/metrics", label: "Metrics & Logs", icon: <BarChart2 size={18} /> }, 
        { href: "/dashboard/storage", label: "Storage & CDN", icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path></svg> },
        { href: "/dashboard/secrets", label: "Secrets", icon: <Key size={18} /> },
    ];

    const activeLinkClass = "bg-primary text-white shadow-md hover:bg-primary/90";
    const inactiveLinkClass = "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700";

   const handleLogout = async () => {
        const confirmed = window.confirm("Are you sure you want to log out ?");
        if (confirmed) {
            await logout();
            router.push('/');
        }
    };

    return (
       <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
            <aside className="w-64 bg-white dark:bg-gray-900 shadow-2xl flex flex-col border-r dark:border-gray-800">
                <div className="p-6 border-b dark:border-gray-800">
                    <h2 className="text-2xl font-extrabold text-dark dark:text-white">
                        <span className="text-primary">CloudBlog</span> Console
                    </h2>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {navLinks.map(({ href, label, icon }) => {
                        const isExactMatch = pathname === href;
                        const isSubPathMatch = href !== "/dashboard" && pathname.startsWith(href);
                        const isActive = isExactMatch || isSubPathMatch;
                        
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition duration-200 ease-in-out ${
                                    isActive ? activeLinkClass : inactiveLinkClass
                                }`}
                            >
                                {icon}
                                <span>{label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t dark:border-gray-800">
                    {/* 5. Lier la fonction au clic du bouton */}
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full text-left px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition font-semibold"
                    >
                        <LogOut size={18} /> Logout
                    </button>
                    <p className="text-xs text-center text-gray-500 dark:text-gray-600 mt-2">
                        v1.0.0 Cloud-Native
                    </p>
                </div>
            </aside>

            <main className="flex-1 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}