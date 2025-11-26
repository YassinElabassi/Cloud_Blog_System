"use client";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ScrollToTop from "@/components/ScrollToTop";
import { Inter } from "next/font/google";
import "../styles/index.css";
import { AuthProvider } from "@/context/AuthContext";
import { Providers } from "./providers";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import ThemeToggler from "@/components/Header/ThemeToggler";

const inter = Inter({ subsets: ["latin"] });

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const pathname = usePathname(); 
  // Définir si la page est une page d'administration
  const isAdminPage = pathname.startsWith('/dashboard');


  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body className={`bg-[#FCFCFC] dark:bg-black ${inter.className}`} suppressHydrationWarning>
        <AuthProvider>
          <Providers>
            {/*  Afficher le Header uniquement si ce n'est PAS une page admin */}
            {!isAdminPage && <Header />}
             {/* AJOUTER LE THEMETOGGLER ICI --- */}
            <div className="fixed top-4 right-4 z-50">
              <ThemeToggler />
            </div>
            {children}
            {/*Afficher le Footer uniquement si ce n'est PAS une page admin */}
            {!isAdminPage && <Footer />}
            <ScrollToTop />
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}