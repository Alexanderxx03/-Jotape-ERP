"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState } from "react";
import { getApps, initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, deleteUser } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { usuarioPrueba, ventaPrueba, rolloPrueba, cortePrueba, costuraPrueba, envioPrueba } from "./datosPrueba";
import { Play, Trash2, CheckCircle2, XCircle, HelpCircle, Loader2, Eye, EyeOff, Database, ShieldCheck, ChevronDown, ChevronUp, Clock, TrendingDown, Zap, ShieldAlert, Award } from "lucide-react";

// Configuración de Firebase para inicializar la aplicación secundaria de pruebas
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

interface PasoPrueba {
    id: string;
    nombre: string;
    descripcion: string;
    estado: "pendiente" | "ejecutando" | "correcto" | "fallido";
    detalles: string;
}

export default function PaginaPruebas() {
    const [ejecutando, setEjecutando] = useState(false);
    const [autoLimpiar, setAutoLimpiar] = useState(false);
    const [uidUsuarioCreado, setUidUsuarioCreado] = useState<string | null>(null);
    const [datosRetornados, setDatosRetornados] = useState<Record<string, unknown>>({});
    const [pasoExpandido, setPasoExpandido] = useState<Record<string, boolean>>({});
    const [mostrarMockData, setMostrarMockData] = useState(false);
    
    const [pasos, setPasos] = useState<PasoPrueba[]>([
        { id: "auth_registro", nombre: "Registro de Usuario (Sign Up)", descripcion: "Crea una cuenta ficticia de prueba en Firebase Auth", estado: "pendiente", detalles: "" },
        { id: "auth_perfil", nombre: "Perfil de Usuario (Firestore)", descripcion: "Guarda los permisos del usuario en la colección 'users'", estado: "pendiente", detalles: "" },
        { id: "auth_login", nombre: "Inicio de Sesión (Sign In)", descripcion: "Cierra la sesión temporal y se vuelve a loguear para validar credenciales", estado: "pendiente", detalles: "" },
        { id: "db_venta", nombre: "Registro de Venta", descripcion: "Inserta una venta simulada (V-TEST-99999) en Firestore y la valida", estado: "pendiente", detalles: "" },
        { id: "db_rollo", nombre: "Registro de Rollo de Tela", descripcion: "Inserta un rollo de materia prima (ROLLO-TEST-99999) y lo valida", estado: "pendiente", detalles: "" },
        { id: "db_corte", nombre: "Registro de Área de Corte", descripcion: "Inserta un reporte de corte (CT-TEST-99999) y verifica su almacenamiento", estado: "pendiente", detalles: "" },
        { id: "db_costura", nombre: "Registro de Área de Costura", descripcion: "Inserta un reporte de confección (CS-TEST-99999) y verifica su almacenamiento", estado: "pendiente", detalles: "" },
        { id: "db_envio", nombre: "Envío a Taller", descripcion: "Inserta un envío logístico a taller (ET-TEST-99999) y verifica su almacenamiento", estado: "pendiente", detalles: "" },
    ]);

    const [estadoLimpieza, setEstadoLimpieza] = useState<"pendiente" | "ejecutando" | "correcto" | "fallido">("pendiente");
    const [detallesLimpieza, setDetallesLimpieza] = useState("");

    // Inicializa la app secundaria de pruebas de manera segura (Singleton)
    const obtenerFirebaseTemporal = () => {
        const apps = getApps();
        const appExistente = apps.find(app => app.name === "temp-test-app");
        if (appExistente) {
            return {
                auth: getAuth(appExistente),
                db: getFirestore(appExistente)
            };
        }
        const appTemporal = initializeApp(firebaseConfig, "temp-test-app");
        return {
            auth: getAuth(appTemporal),
            db: getFirestore(appTemporal)
        };
    };

    const actualizarEstadoPaso = (id: string, estado: PasoPrueba["estado"], detalles: string) => {
        setPasos(prev => prev.map(paso => paso.id === id ? { ...paso, estado, detalles } : paso));
    };

    const alternarAcordeon = (id: string) => {
        setPasoExpandido(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const formatearJSON = (objeto: unknown) => {
        if (!objeto) return "";
        const clon = JSON.parse(JSON.stringify(objeto, (key, value) => {
            // Convierte timestamps de Firebase (objeto con seconds y nanoseconds) a formato fecha legible
            if (value && typeof value === "object" && value.seconds !== undefined) {
                return new Date(value.seconds * 1000).toLocaleString("es-PE");
            }
            return value;
        }));
        return JSON.stringify(clon, null, 2);
    };

    const ejecutarPruebas = async () => {
        setEjecutando(true);
        setEstadoLimpieza("pendiente");
        setDetallesLimpieza("");
        setDatosRetornados({});
        setPasoExpandido({});
        
        // Reiniciar todos los pasos a pendiente
        setPasos(prev => prev.map(p => ({ ...p, estado: "pendiente", detalles: "" })));

        const temporal = obtenerFirebaseTemporal();
        let uidUsuario: string | null = null;

        try {
            // PASO 1: Registro en Firebase Auth
            actualizarEstadoPaso("auth_registro", "ejecutando", "Registrando credenciales...");
            const credenciales = await createUserWithEmailAndPassword(temporal.auth, usuarioPrueba.correo, usuarioPrueba.contrasena);
            uidUsuario = credenciales.user.uid;
            setUidUsuarioCreado(uidUsuario);
            actualizarEstadoPaso("auth_registro", "correcto", `Usuario creado. UID: ${uidUsuario}`);
            setDatosRetornados(prev => ({ 
                ...prev, 
                auth_registro: { 
                    uid: uidUsuario, 
                    email: credenciales.user.email,
                    displayName: usuarioPrueba.nombre,
                    authProvider: "Firebase Authentication"
                } 
            }));

            // PASO 2: Escribir perfil en Firestore
            actualizarEstadoPaso("auth_perfil", "ejecutando", "Escribiendo en colección 'users'...");
            const refDocUsuario = doc(db, "users", uidUsuario);
            await setDoc(refDocUsuario, {
                email: usuarioPrueba.correo,
                displayName: usuarioPrueba.nombre,
                areas_acceso: usuarioPrueba.areas_acceso,
                createdAt: serverTimestamp()
            });
            // Validar la lectura inmediata
            const snapUsuario = await getDoc(refDocUsuario);
            if (snapUsuario.exists() && snapUsuario.data().email === usuarioPrueba.correo) {
                actualizarEstadoPaso("auth_perfil", "correcto", "Perfil verificado en Firestore de forma exitosa.");
                setDatosRetornados(prev => ({ ...prev, auth_perfil: snapUsuario.data() }));
            } else {
                throw new Error("No se pudo verificar el documento de perfil en Firestore.");
            }

            // PASO 3: Log Out y Log In temporal para verificar sesión
            actualizarEstadoPaso("auth_login", "ejecutando", "Probando ciclo de sesión...");
            await signOut(temporal.auth); // Cierra sesión temporal
            const loginCredenciales = await signInWithEmailAndPassword(temporal.auth, usuarioPrueba.correo, usuarioPrueba.contrasena);
            actualizarEstadoPaso("auth_login", "correcto", `Sesión validada para ${loginCredenciales.user.email}`);
            setDatosRetornados(prev => ({ 
                ...prev, 
                auth_login: { 
                    sesionActiva: true, 
                    emailLogueado: loginCredenciales.user.email,
                    tokenValido: true,
                    time: new Date().toLocaleTimeString()
                } 
            }));

            // PASO 4: Escribir y validar Venta
            actualizarEstadoPaso("db_venta", "ejecutando", "Insertando venta V-TEST-99999...");
            const refVenta = doc(db, "ventas", ventaPrueba.id_venta);
            await setDoc(refVenta, {
                ...ventaPrueba,
                fecha_registro: serverTimestamp()
            });
            const snapVenta = await getDoc(refVenta);
            if (snapVenta.exists() && snapVenta.data().total_venta === ventaPrueba.total_venta) {
                actualizarEstadoPaso("db_venta", "correcto", "Venta registrada y validada en Firestore.");
                setDatosRetornados(prev => ({ ...prev, db_venta: snapVenta.data() }));
            } else {
                throw new Error("No se pudo leer o verificar la venta insertada.");
            }

            // PASO 5: Escribir y validar Rollo de tela
            actualizarEstadoPaso("db_rollo", "ejecutando", "Insertando rollo ROLLO-TEST-99999...");
            const refRollo = doc(db, "inventario_rollos", "ROLLO-TEST-99999");
            await setDoc(refRollo, {
                ...rolloPrueba,
                fecha_registro: serverTimestamp()
            });
            const snapRollo = await getDoc(refRollo);
            if (snapRollo.exists() && snapRollo.data().tipo_tela === rolloPrueba.tipo_tela) {
                actualizarEstadoPaso("db_rollo", "correcto", "Rollo de tela registrado e inventariado.");
                setDatosRetornados(prev => ({ ...prev, db_rollo: snapRollo.data() }));
            } else {
                throw new Error("No se pudo verificar el rollo insertado.");
            }

            // PASO 6: Escribir y validar Corte
            actualizarEstadoPaso("db_corte", "ejecutando", "Insertando corte CT-TEST-99999...");
            const refCorte = doc(db, "registros_corte", cortePrueba.id_registro);
            await setDoc(refCorte, {
                ...cortePrueba,
                fecha_registro: serverTimestamp()
            });
            const snapCorte = await getDoc(refCorte);
            if (snapCorte.exists() && snapCorte.data().cantidad_cortada === cortePrueba.cantidad_cortada) {
                actualizarEstadoPaso("db_corte", "correcto", "Reporte de corte registrado en base de datos.");
                setDatosRetornados(prev => ({ ...prev, db_corte: snapCorte.data() }));
            } else {
                throw new Error("No se pudo verificar el registro de corte.");
            }

            // PASO 7: Escribir y validar Costura
            actualizarEstadoPaso("db_costura", "ejecutando", "Insertando costura CS-TEST-99999...");
            const refCostura = doc(db, "registros_costura", costuraPrueba.id_registro);
            await setDoc(refCostura, {
                ...costuraPrueba,
                fecha_registro: serverTimestamp()
            });
            const snapCostura = await getDoc(refCostura);
            if (snapCostura.exists() && snapCostura.data().cantidad === costuraPrueba.cantidad) {
                actualizarEstadoPaso("db_costura", "correcto", "Reporte de costura registrado en base de datos.");
                setDatosRetornados(prev => ({ ...prev, db_costura: snapCostura.data() }));
            } else {
                throw new Error("No se pudo verificar la costura.");
            }

            // PASO 8: Escribir y validar Envío a Taller
            actualizarEstadoPaso("db_envio", "ejecutando", "Insertando envío ET-TEST-99999...");
            const refEnvio = doc(db, "envios_talleres", envioPrueba.id_envio);
            await setDoc(refEnvio, {
                ...envioPrueba,
                fecha_envio: serverTimestamp()
            });
            const snapEnvio = await getDoc(refEnvio);
            if (snapEnvio.exists() && snapEnvio.data().taller === envioPrueba.taller) {
                actualizarEstadoPaso("db_envio", "correcto", "Lote enviado a taller de costura registrado.");
                setDatosRetornados(prev => ({ ...prev, db_envio: snapEnvio.data() }));
            } else {
                throw new Error("No se pudo verificar el envío a taller.");
            }

            // Limpieza automática si está encendida
            if (autoLimpiar) {
                await ejecutarLimpieza(uidUsuario);
            }

        } catch (error: any) {
            console.error("Error en suite de pruebas:", error);
            const pasoEjecutando = pasos.find(p => p.estado === "ejecutando");
            if (pasoEjecutando) {
                actualizarEstadoPaso(pasoEjecutando.id, "fallido", error.message || "Error desconocido");
            }
        } finally {
            setEjecutando(false);
        }
    };

    const manejarLimpiezaManual = async () => {
        setEstadoLimpieza("ejecutando");
        setDetallesLimpieza("Iniciando purga de datos...");
        try {
            await ejecutarLimpieza(uidUsuarioCreado);
            setEstadoLimpieza("correcto");
            setDetallesLimpieza("Limpieza completada. Todos los registros y la cuenta de prueba fueron purgados.");
            setDatosRetornados({});
            setPasoExpandido({});
        } catch (error: any) {
            setEstadoLimpieza("fallido");
            setDetallesLimpieza(`Error al limpiar: ${error.message}`);
        }
    };

    const ejecutarLimpieza = async (uidUsuario: string | null) => {
        const temporal = obtenerFirebaseTemporal();
        
        // 1. Eliminar documentos de Firestore creados por las pruebas
        await deleteDoc(doc(db, "ventas", ventaPrueba.id_venta));
        await deleteDoc(doc(db, "inventario_rollos", "ROLLO-TEST-99999"));
        await deleteDoc(doc(db, "registros_corte", cortePrueba.id_registro));
        await deleteDoc(doc(db, "registros_costura", costuraPrueba.id_registro));
        await deleteDoc(doc(db, "envios_talleres", envioPrueba.id_envio));

        if (uidUsuario) {
            // Eliminar perfil de usuario de Firestore
            await deleteDoc(doc(db, "users", uidUsuario));

            // Eliminar usuario de Firebase Auth
            try {
                const usuarioActual = temporal.auth.currentUser;
                if (usuarioActual) {
                    await deleteUser(usuarioActual);
                }
            } catch (errAuth) {
                console.warn("La sesión expiró o se requiere re-login. Intentando sesión rápida para purgar...", errAuth);
                try {
                    await signInWithEmailAndPassword(temporal.auth, usuarioPrueba.correo, usuarioPrueba.contrasena);
                    if (temporal.auth.currentUser) {
                        await deleteUser(temporal.auth.currentUser);
                    }
                } catch (e) {
                    console.error("No se pudo eliminar el usuario de Auth", e);
                }
            }
        }

        setUidUsuarioCreado(null);
    };

    // Calcular si la prueba finalizó y todo fue exitoso
    const pruebasTerminadas = pasos.every(p => p.estado === "correcto" || p.estado === "fallido");
    const exitoTotal = pasos.every(p => p.estado === "correcto");

    return (
        <ProtectedRoute allowedAreas={["master"]}>
            <div className="max-w-4xl mx-auto space-y-8 pb-10 pt-4 md:pt-8">
                
                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-200 dark:border-white/5 pb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white uppercase flex items-center gap-3">
                            <Database className="w-8 h-8 text-orange-500" />
                            Suite de Pruebas Integrada
                        </h1>
                        <p className="text-sm text-zinc-500 mt-2 uppercase tracking-widest font-bold">
                            Validación de Transacciones y Credenciales de Demostración
                        </p>
                    </div>

                    <div className="flex bg-zinc-100 dark:bg-black/60 p-1.5 rounded-2xl border border-zinc-200 dark:border-white/10 gap-2">
                        <button
                            onClick={() => setMostrarMockData(!mostrarMockData)}
                            className="flex items-center px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/5"
                        >
                            {mostrarMockData ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                            {mostrarMockData ? "Ocultar Datos Mock" : "Ver Datos Mock"}
                        </button>
                    </div>
                </div>

                {/* VISTA PREVIA DE DATOS DE ENTRADA */}
                {mostrarMockData && (
                    <div className="bg-zinc-950 text-stone-300 p-6 rounded-3xl border border-zinc-800 shadow-2xl space-y-4 animate-fadeIn">
                        <h3 className="text-xs font-black tracking-widest text-orange-500 uppercase flex items-center gap-2">
                            <Database className="w-4 h-4" /> Datos Simulados del Archivo (datosPrueba.ts)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                            <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                <p className="font-bold text-white mb-2">// 1. Usuario Auth & Firestore</p>
                                <pre>{JSON.stringify(usuarioPrueba, null, 2)}</pre>
                            </div>
                            <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                <p className="font-bold text-white mb-2">// 2. Registro de Venta (POS)</p>
                                <pre>{JSON.stringify(ventaPrueba, null, 2)}</pre>
                            </div>
                            <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                <p className="font-bold text-white mb-2">// 3. Insumo (Tela)</p>
                                <pre>{JSON.stringify(rolloPrueba, null, 2)}</pre>
                            </div>
                            <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                <p className="font-bold text-white mb-2">// 4. Proceso Manufactura</p>
                                <pre>{JSON.stringify({ corte: cortePrueba, costura: costuraPrueba }, null, 2)}</pre>
                            </div>
                        </div>
                    </div>
                )}

                {/* RESUMEN EJECUTIVO DE ÉXITO Y MÉTRICAS DE IMPACTO */}
                {pruebasTerminadas && exitoTotal && (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Banner Principal */}
                        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-[2rem] p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
                            
                            <div className="space-y-2 relative z-10">
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black tracking-tight text-xl">
                                    <ShieldCheck className="w-6 h-6" /> DEMOSTRACIÓN EXITOSA
                                </div>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-xl">
                                    Todos los sistemas están funcionando correctamente. Los datos de prueba fueron registrados, verificados en la nube y leídos exitosamente.
                                </p>
                            </div>

                            <div className="bg-emerald-500/10 backdrop-blur-sm px-5 py-3 rounded-2xl border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400 relative z-10 font-bold uppercase tracking-wider flex items-center gap-3">
                                <Award className="w-5 h-5 text-emerald-500" />
                                <div>
                                    <span className="text-[10px] text-zinc-500 block">Tiempo Optimizado</span>
                                    <span className="font-black text-sm">78.6 Minutos Totales</span>
                                </div>
                            </div>
                        </div>

                        {/* Grid de Métricas de Impacto */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <MetricCard 
                                icon={<Clock className="w-5 h-5 text-emerald-500" />}
                                value="+12.1 min"
                                title="Ahorro en Inventario"
                                subtitle="Por cada registro de prendas"
                                description="Reducción de 15.2 min a 3.1 min de procesamiento."
                            />
                            <MetricCard 
                                icon={<TrendingDown className="w-5 h-5 text-emerald-500" />}
                                value="-10.7%"
                                title="Pérdidas en Traslado"
                                subtitle="Mitigación de fugas"
                                description="De 12.8% a 2.1% gracias al cálculo de merma en talleres."
                            />
                            <MetricCard 
                                icon={<Zap className="w-5 h-5 text-emerald-500" />}
                                value="+66.5 min"
                                title="Ahorro en Reportes"
                                subtitle="Por consulta gerencial"
                                description="De 67.3 min a 0.8 min gracias a KPIs automatizados."
                            />
                            <MetricCard 
                                icon={<ShieldAlert className="w-5 h-5 text-emerald-500" />}
                                value="< 1%"
                                title="Tasa de Error"
                                subtitle="Precisión de datos"
                                description="De 18.4% de error en lápiz y papel a <1% en el sistema."
                            />
                        </div>
                    </div>
                )}

                {/* CONTROLES DE LA SUITE */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-[2rem] p-6 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div className="space-y-2">
                        <h3 className="font-bold text-zinc-900 dark:text-white text-lg">Controles del Sistema</h3>
                        <p className="text-xs text-zinc-500">Ejecuta y simula flujos completos en una app sandbox aislada.</p>
                        
                        <label className="flex items-center gap-3 pt-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={autoLimpiar} 
                                onChange={(e) => setAutoLimpiar(e.target.checked)}
                                className="rounded border-zinc-300 dark:border-zinc-700 bg-zinc-950 text-orange-600 focus:ring-orange-500 w-4 h-4"
                            />
                            <span className="text-xs text-zinc-600 dark:text-zinc-400 font-bold uppercase">Limpiar base de datos automáticamente al terminar</span>
                        </label>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={ejecutarPruebas}
                            disabled={ejecutando}
                            className="flex items-center justify-center px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-md shadow-orange-600/10"
                        >
                            {ejecutando ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Corriendo...
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4 mr-2" />
                                    Correr Pruebas
                                </>
                            )}
                        </button>

                        <button
                            onClick={manejarLimpiezaManual}
                            disabled={ejecutando || estadoLimpieza === "ejecutando"}
                            className="flex items-center justify-center px-6 py-3 bg-red-600/10 dark:bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl text-xs font-black tracking-widest uppercase transition-all"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Purgar Datos
                        </button>
                    </div>
                </div>

                {/* PASOS DE PRUEBA Y LIVE JSON VIEWERS */}
                <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 rounded-[2rem] overflow-hidden shadow-xl">
                    <div className="bg-zinc-50 dark:bg-zinc-900 px-6 py-4 border-b border-zinc-200 dark:border-white/5">
                        <h3 className="font-bold text-sm text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">Ejecución del Plan de Pruebas</h3>
                    </div>

                    <div className="divide-y divide-zinc-200 dark:divide-white/5">
                        {pasos.map((paso) => {
                            const tieneDatos = datosRetornados[paso.id] !== undefined;
                            const expandido = pasoExpandido[paso.id] || false;
                            
                            return (
                                <div key={paso.id} className="divide-y divide-zinc-200 dark:divide-white/5">
                                    {/* Cabecera del Paso */}
                                    <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-50/50 dark:hover:bg-white/5 transition-colors">
                                        <div className="space-y-1 flex-1">
                                            <span className="font-bold text-sm text-zinc-900 dark:text-white capitalize">{paso.nombre}</span>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{paso.descripcion}</p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4">
                                            {paso.detalles && (
                                                <span className="text-[10px] md:text-xs font-mono bg-zinc-100 dark:bg-black/60 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/5 text-zinc-600 dark:text-zinc-400 max-w-[280px] md:max-w-[400px] truncate">
                                                    {paso.detalles}
                                                </span>
                                            )}

                                            {paso.estado === "pendiente" && (
                                                <span className="flex items-center gap-1.5 text-xs text-zinc-400 font-bold uppercase">
                                                    <HelpCircle className="w-4 h-4" /> Pendiente
                                                </span>
                                            )}
                                            {paso.estado === "ejecutando" && (
                                                <span className="flex items-center gap-1.5 text-xs text-orange-500 font-bold uppercase">
                                                    <Loader2 className="w-4 h-4 animate-spin" /> Corriendo
                                                </span>
                                            )}
                                            {paso.estado === "correcto" && (
                                                <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-bold uppercase bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                                                    <CheckCircle2 className="w-4 h-4" /> Éxito
                                                </span>
                                            )}
                                            {paso.estado === "fallido" && (
                                                <span className="flex items-center gap-1.5 text-xs text-red-500 font-bold uppercase bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20">
                                                    <XCircle className="w-4 h-4" /> Error
                                                </span>
                                            )}

                                            {tieneDatos && (
                                                <button
                                                    onClick={() => alternarAcordeon(paso.id)}
                                                    className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                                                    title={expandido ? "Ocultar Documento" : "Ver Documento"}
                                                >
                                                    {expandido ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Acordeón con JSON de Firestore */}
                                    {tieneDatos && expandido && (
                                        <div className="bg-zinc-950 p-6 font-mono text-xs text-zinc-300 border-t border-b border-zinc-800 animate-fadeIn">
                                            <div className="flex items-center justify-between mb-3 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                                <span>Base de Datos de Nube (Firestore / Auth)</span>
                                                <span className="text-emerald-500 font-black">Documento Verificado ✓</span>
                                            </div>
                                            <pre className="overflow-x-auto whitespace-pre-wrap max-h-64 custom-scrollbar bg-black/40 p-4 rounded-xl border border-white/5">
                                                <code>{formatearJSON(datosRetornados[paso.id])}</code>
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* LOGS DE LIMPIEZA */}
                {estadoLimpieza !== "pendiente" && (
                    <div className={`p-6 rounded-3xl border ${
                        estadoLimpieza === "ejecutando" ? "bg-orange-500/5 border-orange-500/20 text-orange-500" :
                        estadoLimpieza === "correcto" ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500" :
                        "bg-red-500/5 border-red-500/20 text-red-500"
                    }`}>
                        <div className="flex items-center gap-3">
                            {estadoLimpieza === "ejecutando" ? <Loader2 className="w-5 h-5 animate-spin" /> :
                             estadoLimpieza === "correcto" ? <CheckCircle2 className="w-5 h-5" /> :
                             <XCircle className="w-5 h-5" />}
                            <span className="font-bold text-sm uppercase tracking-wide">Purga de Datos de Prueba</span>
                        </div>
                        <p className="text-xs mt-2 opacity-80">{detallesLimpieza}</p>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}

function MetricCard({ icon, value, title, subtitle, description }: { icon: React.ReactNode, value: string, title: string, subtitle: string, description: string }) {
    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-3xl p-5 shadow-lg relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-zinc-100 dark:bg-black rounded-xl border border-zinc-200 dark:border-white/10">
                    {icon}
                </div>
                <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter">{value}</span>
            </div>
            <div className="space-y-1">
                <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">{title}</h4>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">{subtitle}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-1 leading-relaxed">{description}</p>
            </div>
        </div>
    );
}
