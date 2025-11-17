"use client";

import Blog from "@/components/Blog";
import ScrollUp from "@/components/Common/ScrollUp";
import Contact from "@/components/Contact";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect Admin to dashboard if they try to access home page
    if (!loading && user?.role === "Admin") {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  // Show nothing while checking auth or if user is Admin (will redirect)
  if (loading || user?.role === "Admin") {
    return null;
  }

  return (
    <>
      <ScrollUp />
      <Blog />
      <Contact />
    </>
  );
}
