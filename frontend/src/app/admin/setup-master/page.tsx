"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function SetupMasterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [status, setStatus] = useState("");
    const router = useRouter();

    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("Creando cuenta...");
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create user document with 'master' role in Firestore
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                role: "master",
                displayName: "Administrador Master"
            });

            setStatus("Cuenta master creada con éxito. Redirigiendo al login...");
            setTimeout(() => router.push("/admin/login"), 2000);
        } catch (error: any) {
            console.error(error);
            setStatus("Error: " + error.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-orange-200">
                <h1 className="text-2xl font-bold text-orange-600 mb-2">Configuración Inicial</h1>
                <p className="text-sm text-stone-600 mb-6">Usa esta página una sola vez para crear la cuenta del Dueño (Master).</p>

                <form onSubmit={handleSetup} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Email Master</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Contraseña</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                            minLength={6}
                        />
                    </div>
                    <button type="submit" className="w-full bg-stone-900 text-white py-3 rounded-lg hover:bg-black transition-colors font-medium">
                        Crear Cuenta Master
                    </button>
                    {status && <p className="text-sm font-medium text-center mt-4 text-orange-700">{status}</p>}
                </form>
            </div>
        </div>
    );
}
