"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect } from "react";
import { Brain, RefreshCw, AlertTriangle, AlertCircle, Shirt, Palette, Activity, Layers, ArrowUpRight, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

interface Insights {
    color_mas_vendido: string;
    prenda_mas_vendida: string;
    prenda_mas_producida: string;
    urgencia_compra_tela: string;
    eficiencia_taller_nota: string;
}

interface DemandaItem {
    nombre: string;
    stock_actual: number;
    demanda_proyectada: number;
}

interface SugerenciaTela {
    tipo_tela: string;
    color: string;
    cantidad_rollos_sugerida: number;
    prioridad: "Alta" | "Media" | "Baja";
    razon_inteligente: string;
}

interface SugerenciaPrenda {
    categoria: string;
    tipo_prenda: string;
    color: string;
    cantidad_confeccion_sugerida: number;
    prioridad: "Alta" | "Media" | "Baja";
    justificacion: string;
}

interface SugerenciaCorte {
    tipo_tela: string;
    color: string;
    lote_corte_estimado: number;
    tallas_prioritarias: string;
    indicacion_optimizacion: string;
}

interface Alerta {
    nivel: "Crítica" | "Advertencia" | "Normal";
    mensaje: string;
}

interface PredictionData {
    insights_principales: Insights;
    grafico_demanda_telas: DemandaItem[];
    grafico_demanda_prendas: DemandaItem[];
    sugerencias_reabastecimiento_telas: SugerenciaTela[];
    sugerencias_confeccion_prendas: SugerenciaPrenda[];
    sugerencias_corte: SugerenciaCorte[];
    alertas_produccion: Alerta[];
}

export default function PrediccionesPage() {
    const [cargando, setCargando] = useState(true);
    const [datos, setDatos] = useState<PredictionData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"telas" | "prendas" | "cortes">("telas");

    const obtenerPredicciones = async () => {
        setCargando(true);
        setError(null);
        try {
            const res = await fetch("/api/predictions");
            if (!res.ok) {
                throw new Error(`Error en el servidor: ${res.statusText}`);
            }
            const data = await res.json();
            if (data.error) {
                throw new Error(data.mensaje || "Error al obtener predicciones");
            }
            setDatos(data);
        } catch (e: unknown) {
            console.error(e);
            const err = e as Error;
            setError(err.message || "Error de red al conectar con el servidor.");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        obtenerPredicciones();
    }, []);

    return (
        <ProtectedRoute allowedAreas={["master", "inventory"]}>
            <div className="max-w-7xl mx-auto space-y-8 pb-10 pt-4 md:pt-8 animate-fadeIn">
                
                {/* CABECERA */}
                <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-200 dark:border-white/5 pb-6 gap-4">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-900 dark:text-white flex items-center gap-3">
                            <Brain className="w-10 h-10 text-violet-500 drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]" />
                            PLANIFICACIÓN PREDICTIVA IA
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] text-xs font-bold mt-2">
                            Análisis Inteligente de Ventas, Consumos y Abastecimiento de Telas
                        </p>
                    </div>

                    <button
                        onClick={obtenerPredicciones}
                        disabled={cargando}
                        className="flex items-center justify-center px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-2xl text-xs font-black tracking-widest uppercase transition-all shadow-lg shadow-violet-600/20 gap-2 cursor-pointer"
                    >
                        <RefreshCw className={`w-4 h-4 ${cargando ? "animate-spin" : ""}`} />
                        {cargando ? "Analizando..." : "Refrescar con IA"}
                    </button>
                </div>

                {/* MENSAJES DE ERROR */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-3xl flex items-center gap-4">
                        <AlertCircle className="w-8 h-8 flex-shrink-0" />
                        <div>
                            <p className="font-bold text-sm">Error en la API Predictiva</p>
                            <p className="text-xs opacity-90">{error}</p>
                        </div>
                    </div>
                )}

                {cargando ? (
                    // ESTRUCTURA DE CARGA (SKELETONS ANIMADOS)
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-[2rem]" />
                            ))}
                        </div>
                        <div className="h-16 bg-zinc-200 dark:bg-zinc-800 rounded-3xl animate-pulse" />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
                            <div className="h-80 bg-zinc-200 dark:bg-zinc-800 rounded-[2rem]" />
                            <div className="h-80 bg-zinc-200 dark:bg-zinc-800 rounded-[2rem]" />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
                            <div className="h-96 bg-zinc-200 dark:bg-zinc-800 rounded-[2rem]" />
                            <div className="lg:col-span-2 h-96 bg-zinc-200 dark:bg-zinc-800 rounded-[2rem]" />
                        </div>
                    </div>
                ) : (
                    datos && (
                        <div className="space-y-8">
                            
                            {/* CARDS DE INSIGHTS PRINCIPALES */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <InsightCard 
                                    icon={<Shirt className="w-5 h-5 text-violet-400" />}
                                    title="Prenda Más Vendida"
                                    value={datos.insights_principales.prenda_mas_vendida}
                                    colorClass="group-hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.25)]"
                                />
                                <InsightCard 
                                    icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
                                    title="Prenda Más Producida"
                                    value={datos.insights_principales.prenda_mas_producida}
                                    colorClass="group-hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.25)]"
                                />
                                <InsightCard 
                                    icon={<Palette className="w-5 h-5 text-pink-400" />}
                                    title="Color de Mayor Demanda"
                                    value={datos.insights_principales.color_mas_vendido}
                                    colorClass="group-hover:shadow-[0_0_30px_-5px_rgba(236,72,153,0.25)]"
                                />
                                <InsightCard 
                                    icon={<AlertTriangle className="w-5 h-5 text-orange-400" />}
                                    title="Mayor Urgencia de Compra"
                                    value={datos.insights_principales.urgencia_compra_tela}
                                    colorClass="group-hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.25)]"
                                />
                            </div>

                            {/* BANNER NOTA DE PRODUCCIÓN */}
                            <div className="bg-gradient-to-r from-violet-600/10 via-pink-600/10 to-transparent border border-violet-500/20 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-violet-500/20 text-violet-400 rounded-xl">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Estado de Producción y Talleres</h4>
                                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{datos.insights_principales.eficiencia_taller_nota}</p>
                                    </div>
                                </div>
                            </div>

                            {/* GRÁFICOS DE DEMANDA */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                
                                {/* Gráfico Telas */}
                                <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl p-8 rounded-[2rem] border border-zinc-200 dark:border-white/5 shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-violet-500/10 transition-colors duration-700" />
                                    
                                    <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-8 flex items-center text-zinc-800 dark:text-zinc-300 relative z-10">
                                        <Layers className="w-5 h-5 mr-3 text-violet-500" /> Balance de Telas (Materia Prima)
                                    </h2>

                                    <div className="h-72 relative z-10">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={datos.grafico_demanda_telas} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#52525b" opacity={0.2} />
                                                <XAxis dataKey="nombre" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#71717a' }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#71717a' }} />
                                                <RechartsTooltip 
                                                    cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }} 
                                                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fff', borderRadius: '12px', padding: '12px' }} 
                                                />
                                                <Legend wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', paddingTop: '15px' }} />
                                                <Bar name="Stock de Tela (Rollos)" dataKey="stock_actual" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                                <Bar name="Demanda Proyectada" dataKey="demanda_proyectada" fill="#ec4899" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Gráfico Prendas */}
                                <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl p-8 rounded-[2rem] border border-zinc-200 dark:border-white/5 shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-pink-500/10 transition-colors duration-700" />
                                    
                                    <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-8 flex items-center text-zinc-800 dark:text-zinc-300 relative z-10">
                                        <Shirt className="w-5 h-5 mr-3 text-pink-500" /> Balance de Prendas (Confeccionadas)
                                    </h2>

                                    <div className="h-72 relative z-10">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={datos.grafico_demanda_prendas} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#52525b" opacity={0.2} />
                                                <XAxis dataKey="nombre" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#71717a' }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#71717a' }} />
                                                <RechartsTooltip 
                                                    cursor={{ fill: 'rgba(236, 72, 153, 0.05)' }} 
                                                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fff', borderRadius: '12px', padding: '12px' }} 
                                                />
                                                <Legend wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', paddingTop: '15px' }} />
                                                <Bar name="Stock de Prendas (Unidades)" dataKey="stock_actual" fill="#ec4899" radius={[4, 4, 0, 0]} />
                                                <Bar name="Demanda Proyectada" dataKey="demanda_proyectada" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* PANELES DE ALERTAS Y SUGERENCIAS */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                
                                {/* Panel Lateral de Alertas Críticas (col-span-1) */}
                                <div className="lg:col-span-1 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl p-8 rounded-[2rem] border border-zinc-200 dark:border-white/5 shadow-xl relative overflow-hidden group flex flex-col justify-between">
                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-red-500/10 transition-colors duration-700" />
                                    
                                    <div>
                                        <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-6 flex items-center text-zinc-800 dark:text-zinc-300 relative z-10">
                                            <AlertTriangle className="w-5 h-5 mr-3 text-red-500 animate-pulse" /> Alertas de Manufactura
                                        </h2>

                                        <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                                            {datos.alertas_produccion.map((alerta, idx) => (
                                                <div 
                                                    key={idx} 
                                                    className={`p-4 rounded-2xl border text-xs flex gap-3 ${
                                                        alerta.nivel === "Crítica" 
                                                            ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400" 
                                                            : alerta.nivel === "Advertencia"
                                                            ? "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400"
                                                            : "bg-zinc-500/10 border-zinc-500/20 text-zinc-600 dark:text-zinc-400"
                                                    }`}
                                                >
                                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                                    <div>
                                                        <span className="font-black uppercase tracking-wider block mb-1">
                                                            Alerta {alerta.nivel}
                                                        </span>
                                                        <p className="leading-relaxed opacity-95">{alerta.mensaje}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {datos.alertas_produccion.length === 0 && (
                                                <p className="text-zinc-500 text-xs italic">No hay alertas de producción activas en este período.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Panel de Sugerencias con Tabs (col-span-2) */}
                                <div className="lg:col-span-2 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl p-8 rounded-[2rem] border border-zinc-200 dark:border-white/5 shadow-xl relative overflow-hidden">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 dark:border-white/5 pb-4 mb-6 gap-4">
                                        <h2 className="text-sm font-black uppercase tracking-[0.2em] flex items-center text-zinc-800 dark:text-zinc-300">
                                            <ArrowUpRight className="w-5 h-5 mr-3 text-emerald-500" /> Planificación de Producción
                                        </h2>
                                        
                                        {/* TABS SELECTOR */}
                                        <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-white/5 text-[10px] font-black uppercase tracking-wider">
                                            <button 
                                                onClick={() => setActiveTab("telas")}
                                                className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${activeTab === "telas" ? "bg-violet-600 text-white shadow-md shadow-violet-600/20" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"}`}
                                            >
                                                Telas
                                            </button>
                                            <button 
                                                onClick={() => setActiveTab("prendas")}
                                                className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${activeTab === "prendas" ? "bg-violet-600 text-white shadow-md shadow-violet-600/20" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"}`}
                                            >
                                                Confección
                                            </button>
                                            <button 
                                                onClick={() => setActiveTab("cortes")}
                                                className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${activeTab === "cortes" ? "bg-violet-600 text-white shadow-md shadow-violet-600/20" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"}`}
                                            >
                                                Cortes
                                            </button>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto min-h-[300px]">
                                        {activeTab === "telas" && (
                                            <table className="w-full text-left text-sm animate-fadeIn">
                                                <thead className="text-[10px] uppercase font-black tracking-widest text-zinc-500 border-b border-zinc-200 dark:border-white/5">
                                                    <tr>
                                                        <th className="px-4 py-3">Materia Prima</th>
                                                        <th className="px-4 py-3">Color</th>
                                                        <th className="px-4 py-3 text-center">Sugerencia</th>
                                                        <th className="px-4 py-3">Prioridad</th>
                                                        <th className="px-4 py-3 max-w-xs">Justificación IA</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-zinc-200 dark:divide-white/5 text-xs">
                                                    {datos.sugerencias_reabastecimiento_telas.map((sug, idx) => (
                                                        <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                                                            <td className="px-4 py-3.5 font-bold text-zinc-900 dark:text-white capitalize">{sug.tipo_tela}</td>
                                                            <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-400 capitalize">{sug.color}</td>
                                                            <td className="px-4 py-3.5 text-center font-black text-violet-600 dark:text-violet-400">+{sug.cantidad_rollos_sugerida} rollos</td>
                                                            <td className="px-4 py-3.5">
                                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                                                                    sug.prioridad === "Alta" 
                                                                        ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400" 
                                                                        : sug.prioridad === "Media" 
                                                                        ? "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400" 
                                                                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                                                }`}>
                                                                    {sug.prioridad}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3.5 text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs">{sug.razon_inteligente}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}

                                        {activeTab === "prendas" && (
                                            <table className="w-full text-left text-sm animate-fadeIn">
                                                <thead className="text-[10px] uppercase font-black tracking-widest text-zinc-500 border-b border-zinc-200 dark:border-white/5">
                                                    <tr>
                                                        <th className="px-4 py-3">Categoría</th>
                                                        <th className="px-4 py-3">Producto / Color</th>
                                                        <th className="px-4 py-3 text-center">Confeccionar</th>
                                                        <th className="px-4 py-3">Prioridad</th>
                                                        <th className="px-4 py-3 max-w-xs">Justificación IA</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-zinc-200 dark:divide-white/5 text-xs">
                                                    {datos.sugerencias_confeccion_prendas.map((sug, idx) => (
                                                        <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                                                            <td className="px-4 py-3.5 font-bold text-zinc-900 dark:text-white capitalize">{sug.categoria}</td>
                                                            <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-400 capitalize">{sug.tipo_prenda} ({sug.color})</td>
                                                            <td className="px-4 py-3.5 text-center font-black text-violet-600 dark:text-violet-400">+{sug.cantidad_confeccion_sugerida} uds</td>
                                                            <td className="px-4 py-3.5">
                                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                                                                    sug.prioridad === "Alta" 
                                                                        ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400" 
                                                                        : sug.prioridad === "Media" 
                                                                        ? "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400" 
                                                                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                                                }`}>
                                                                    {sug.prioridad}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3.5 text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs">{sug.justificacion}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}

                                        {activeTab === "cortes" && (
                                            <table className="w-full text-left text-sm animate-fadeIn">
                                                <thead className="text-[10px] uppercase font-black tracking-widest text-zinc-500 border-b border-zinc-200 dark:border-white/5">
                                                    <tr>
                                                        <th className="px-4 py-3">Tela base</th>
                                                        <th className="px-4 py-3">Color</th>
                                                        <th className="px-4 py-3 text-center">Cortes Sugeridos</th>
                                                        <th className="px-4 py-3">Tallas clave</th>
                                                        <th className="px-4 py-3 max-w-xs">Optimización de Merma</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-zinc-200 dark:divide-white/5 text-xs">
                                                    {datos.sugerencias_corte.map((sug, idx) => (
                                                        <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                                                            <td className="px-4 py-3.5 font-bold text-zinc-900 dark:text-white capitalize">{sug.tipo_tela}</td>
                                                            <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-400 capitalize">{sug.color}</td>
                                                            <td className="px-4 py-3.5 text-center font-black text-pink-600 dark:text-pink-400">{sug.lote_corte_estimado} pzs</td>
                                                            <td className="px-4 py-3.5 text-zinc-700 dark:text-zinc-300 font-mono">{sug.tallas_prioritarias}</td>
                                                            <td className="px-4 py-3.5 text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs">{sug.indicacion_optimizacion}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>
                    )
                )}
            </div>
        </ProtectedRoute>
    );
}

// Subcomponente de Tarjeta de Insights
function InsightCard({ icon, title, value, colorClass, isLongText = false }: { icon: React.ReactNode, title: string, value: string, colorClass: string, isLongText?: boolean }) {
    return (
        <div className={`bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6 rounded-[2rem] border border-zinc-200 dark:border-white/5 shadow-lg group transition-all duration-300 hover:-translate-y-1 ${colorClass}`}>
            <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-zinc-100 dark:bg-black rounded-xl border border-zinc-200 dark:border-white/10 group-hover:scale-110 transition-transform duration-300">
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">{title}</p>
                <h3 className={`font-black tracking-tighter text-zinc-900 dark:text-white mt-1 capitalize ${isLongText ? "text-sm leading-relaxed font-semibold pt-1" : "text-3xl"}`}>
                    {value}
                </h3>
            </div>
        </div>
    );
}
