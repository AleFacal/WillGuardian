"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase"; // Import Firebase auth
import { signOut } from "firebase/auth"; // Import signOut from Firebase
import { FaSignOutAlt } from "react-icons/fa"; // Import logout icon from react-icons

import "./globals.css";

// --- Navbar component without translations ---
function Navbar() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user); // User is logged in
      } else {
        setUser(null); // User is not logged in
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle logout functionality
  const handleLogout = async () => {
    try {
      await signOut(auth); // Log the user out from Firebase
      router.push("/auth"); // Redirect to the auth page or homepage
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  return (
    <header className="header">
      <div className="container mx-auto flex justify-between items-center px-6">
        <h1 className="text-xl font-semibold text-white">WillGuardian</h1>
        <nav className="flex gap-6 text-white">
          <Link href="/">Home</Link>
          <Link href="/will">Create Will</Link>
          <Link href="/settings">Settings</Link>
          <Link href="/faq">FAQ</Link>
        </nav>
        <div className="flex gap-4 items-center">
          {user && (
            <button
              onClick={handleLogout}
              className="text-white hover:text-gray-300"
            >
              <FaSignOutAlt size={24} /> {/* Logout Icon */}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`h-full flex flex-col bg-lightblue text-gray-900 dark:bg-gray-900 dark:text-white overflow-hidden`}
      >
        <Navbar />
        {/* Main content area starts below the fixed header */}
        <main className="container mx-auto pt-28 pb-8 flex-grow overflow-y-auto scrollbar-hide">
          {children}
        </main>
        <footer className="footer">
          <p>
            &copy; {new Date().getFullYear()} WillGuardian. All rights reserved.
          </p>
        </footer>
      </body>
    </html>
  );
}
