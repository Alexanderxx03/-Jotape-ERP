"use client";
import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Lock, UserPlus } from "lucide-react";
import JotaPeLogo from "@/components/JotaPeLogo";

type AuthMode = "login" | "register";

export default function LoginPage() {
    const [mode, setMode] = useState<AuthMode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [role, setRole] = useState("sales");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            if (mode === "login") {
                await signInWithEmailAndPassword(auth, email, password);
                router.push("/admin");
            } else {
                // Registration Flow
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Save user profile and role in Firestore
                await setDoc(doc(db, "users", user.uid), {
                    email: user.email,
                    displayName: displayName || email.split("@")[0],
                    role: role,
                    createdAt: new Date()
                });

                setSuccess("Cuenta creada exitosamente. Ingresando...");
                setTimeout(() => router.push("/admin"), 1500);
            }
        } catch (err: any) {
            console.error(err);
            if (err.code === "auth/email-already-in-use") {
                setError("Este correo ya está registrado.");
            } else if (err.code === "auth/weak-password") {
                setError("La contraseña debe tener al menos 6 caracteres.");
            } else {
                setError(mode === "login" ? "Credenciales incorrectas." : "Error al crear la cuenta.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-stone-950 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-zinc-900 p-10 rounded-3xl border border-zinc-800 shadow-2xl">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center mb-6">
                        <JotaPeLogo className="h-16 w-auto drop-shadow-lg" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">
                        {mode === "login" ? "Acceso " : "Registro "}
                        <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right, #FFE600, #FF8B00, #86CB2D, #21A2FF, #D41C95, #E00B21)" }}>JOTAPE</span>
                    </h2>
                    <p className="mt-2 text-sm text-stone-400">Panel de Control Interno</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-zinc-950 p-1 rounded-xl">
                    <button
                        type="button"
                        onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === "login" ? "bg-zinc-800 text-white shadow" : "text-stone-400 hover:text-white"}`}
                    >
                        Iniciar Sesión
                    </button>
                    <button
                        type="button"
                        onClick={() => { setMode("register"); setError(""); setSuccess(""); }}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === "register" ? "bg-zinc-800 text-white shadow" : "text-stone-400 hover:text-white"}`}
                    >
                        Nueva Cuenta
                    </button>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        {mode === "register" && (
                            <div>
                                <label className="block text-sm font-medium text-stone-300 mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-zinc-700 placeholder-zinc-500 text-white bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-orange-600 sm:text-sm"
                                    placeholder="Ej: Juan Pérez"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-stone-300 mb-1">Correo Electrónico</label>
                            <input
                                type="email"
                                required
                                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-zinc-700 placeholder-zinc-500 text-white bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-orange-600 sm:text-sm"
                                placeholder="usuario@jotape.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-300 mb-1">Contraseña</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-zinc-700 placeholder-zinc-500 text-white bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-orange-600 sm:text-sm"
                                placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Contraseña secreta"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {mode === "register" && (
                            <div>
                                <label className="block text-sm font-medium text-stone-300 mb-1">Rol de Empleado</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-zinc-700 text-white bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-orange-600 sm:text-sm"
                                >
                                    <option value="sales">Ventas (Punto de Venta)</option>
                                    <option value="inventory">Almacén e Inventario</option>
                                    <option value="cutting">Área de Corte</option>
                                    <option value="sewing">Área de Costura</option>
                                    <option value="master">Administrador General (Master)</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm font-medium text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="text-green-500 text-sm font-medium text-center bg-green-500/10 py-2 rounded-lg border border-green-500/20">
                            {success}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:ring-offset-zinc-900 transition-all disabled:opacity-50 shadow-lg shadow-orange-600/20"
                        >
                            {loading ? "Procesando..." : mode === "login" ? "Ingresar" : "Crear Cuenta"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
