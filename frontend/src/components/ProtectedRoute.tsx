"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, Role } from "@/context/AuthContext";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: Role[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                // Not logged in, redirect to login
                router.push("/admin/login");
            } else if (allowedRoles && !allowedRoles.includes(user.role)) {
                // Logged in but doesn't have the required role
                console.warn(`Access denied. User role: ${user.role}, Allowed: ${allowedRoles.join(",")}`);
                // Redirect to a safe default page based on role, or a generic unauthorized page
                if (user.role === 'sales') router.push('/admin/ventas');
                else if (user.role === 'inventory') router.push('/admin/inventario');
                else if (user.role === 'cutting') router.push('/admin/corte');
                else if (user.role === 'sewing') router.push('/admin/costura');
                else if (user.role === 'master') router.push('/admin');
                else router.push('/admin/unauthorized');
            }
        }
    }, [user, loading, router, pathname, allowedRoles]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    // Only render children if user exists and has correct role (if roles are specified)
    if (user && (!allowedRoles || allowedRoles.includes(user.role))) {
        return <>{children}</>;
    }

    return null;
}
