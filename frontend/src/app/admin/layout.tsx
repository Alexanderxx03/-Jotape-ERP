"use client";
import { AuthProvider } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useState } from "react";
import { Menu } from "lucide-react";
import JotaPeLogo from "@/components/JotaPeLogo";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isLoginPage = pathname === "/admin/login";
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <AuthProvider>
            <div className="min-h-screen bg-stone-100 dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 flex flex-col md:flex-row">
                {!isLoginPage && (
                    <>
                        <header className="md:hidden bg-white dark:bg-zinc-950 border-b border-stone-200 dark:border-zinc-800 p-4 flex items-center justify-between z-20 sticky top-0">
                            <JotaPeLogo className="h-8 w-auto drop-shadow-sm" />
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-2 text-stone-600 dark:text-stone-300"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                        </header>
                        <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
                    </>
                )}
                <main className={`flex-1 overflow-x-hidden overflow-y-auto w-full bg-stone-100 dark:bg-zinc-900 ${!isLoginPage ? 'p-4 md:p-6' : ''}`}>
                    {children}
                </main>
            </div>
        </AuthProvider>
    );
}
