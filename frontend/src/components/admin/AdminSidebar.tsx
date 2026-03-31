"use client";
import { useAuth } from "@/context/AuthContext";
import { LogOut, LayoutDashboard, ShoppingCart, Package, Scissors, Shirt, X, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";
import { usePathname } from "next/navigation";
import JotaPeLogo from "@/components/JotaPeLogo";

interface AdminSidebarProps {
    isOpen?: boolean;
    setIsOpen?: (isOpen: boolean) => void;
}

export default function AdminSidebar({ isOpen = false, setIsOpen }: AdminSidebarProps) {
    const { user, signOut } = useAuth();
    const pathname = usePathname();

    if (!user) return null;

    // Determine which links to show based on role
    const links = [];

    if (user.role === 'master' || user.role === 'sales') {
        links.push({ href: "/admin/ventas", label: "Punto de Venta", icon: ShoppingCart });
    }
    if (user.role === 'master' || user.role === 'inventory') {
        links.push({ href: "/admin/inventario", label: "Inventario", icon: Package });
    }
    if (user.role === 'master' || user.role === 'cutting') {
        links.push({ href: "/admin/corte", label: "Área de Corte", icon: Scissors });
    }
    if (user.role === 'master' || user.role === 'sewing') {
        links.push({ href: "/admin/costura", label: "Área de Costura", icon: Shirt });
    }
    if (user.role === 'master') {
        links.push({ href: "/admin", label: "Dashboard Master", icon: LayoutDashboard });
        links.push({ href: "/admin/configuracion", label: "Configuración", icon: Settings });
    }

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsOpen && setIsOpen(false)}
                />
            )}

            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-950 border-r border-stone-200 dark:border-zinc-800 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen md:sticky md:top-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="p-6 border-b border-stone-200 dark:border-zinc-800 flex justify-between items-center">
                    <div>
                        <JotaPeLogo className="h-8 w-auto hidden md:block drop-shadow-sm" />
                        <JotaPeLogo className="h-6 w-auto md:hidden drop-shadow-sm" />
                        <p className="text-xs text-stone-500 mt-1 capitalize font-medium">Panel: {user.role}</p>
                    </div>
                    {setIsOpen && (
                        <button
                            className="md:hidden p-2 -mr-2 text-stone-500 hover:text-stone-900 dark:hover:text-white"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <nav className="flex-1 overflow-y-auto py-4">
                    <ul className="space-y-1 px-3">
                        {links.map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href;
                            return (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        onClick={() => setIsOpen && setIsOpen(false)}
                                        className={`flex items-center px-3 py-2.5 rounded-lg transition-colors group text-sm font-medium ${isActive
                                            ? "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-500"
                                            : "text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-zinc-900 hover:text-stone-900 dark:hover:text-white"
                                            }`}
                                    >
                                        <Icon className={`w-5 h-5 mr-3 ${isActive ? "text-orange-600 dark:text-orange-500" : "text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300"}`} />
                                        {link.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="p-4 border-t border-stone-200 dark:border-zinc-800">
                    <div className="flex items-center mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold mr-3">
                            {user.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-stone-900 dark:text-white truncate">
                                {user.displayName || 'Usuario'}
                            </p>
                            <p className="text-xs text-stone-500 truncate">{user.email}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={signOut}
                            className="flex items-center flex-1 px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                            <LogOut className="w-5 h-5 mr-3" />
                            Cerrar Sesión
                        </button>
                        <ThemeToggle />
                    </div>
                </div>
            </aside>
        </>
    );
}
