"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, Area } from "@/context/AuthContext";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedAreas?: Area[];
}

export default function ProtectedRoute({ children, allowedAreas }: ProtectedRouteProps) {
    const { user, loading, hasArea } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/admin/login");
            } else if (allowedAreas && allowedAreas.length > 0) {
                // Verificar si el usuario tiene al menos una de las áreas permitidas
                const tieneAcceso = allowedAreas.some(area => hasArea(area));
                if (!tieneAcceso) {
                    console.warn(`Acceso denegado. Áreas del usuario: ${user.areas_acceso.join(",")}, Permitidas: ${allowedAreas.join(",")}`);
                    // Redirigir a la primera página que tenga disponible
                    if (hasArea("sales")) router.push('/admin/ventas');
                    else if (hasArea("inventory")) router.push('/admin/inventario');
                    else if (hasArea("cutting")) router.push('/admin/corte');
                    else if (hasArea("sewing")) router.push('/admin/costura');
                    else if (hasArea("master")) router.push('/admin');
                    else router.push('/admin/unauthorized');
                }
            }
        }
    }, [user, loading, router, pathname, allowedAreas, hasArea]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    if (user && (!allowedAreas || allowedAreas.length === 0 || allowedAreas.some(area => hasArea(area)))) {
        return <>{children}</>;
    }

    return null;
}
