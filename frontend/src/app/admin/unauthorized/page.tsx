"use client";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function AdminUnauthorizedPage() {
    return (
        <ProtectedRoute>
            <div className="flex flex-col items-center justify-center h-[70vh] text-center">
                <h1 className="text-4xl font-bold text-stone-900 dark:text-white mb-4">Acceso Denegado</h1>
                <p className="text-stone-600 dark:text-stone-400 max-w-md">
                    Tu rol actual no tiene los permisos necesarios para ver esta sección del sistema. Por favor, comunícate con el administrador (Master) si crees que esto es un error.
                </p>
            </div>
        </ProtectedRoute>
    );
}
