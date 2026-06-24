"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { MoveRight, Loader2, Pencil, Trash2, Truck, Check, PackageSearch, Activity, Box, Settings, AlertCircle } from "lucide-react";
import { useFormulariosProducto } from "@/hooks/useFormulariosProducto";
import { useAuth } from "@/context/AuthContext";
import { guardarRegistroProduccion, guardarEnvioTaller, marcarEnvioRecibido, guardarEntradaInventario } from "@/lib/firestoreUtils";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ModalAñadirOpcion from "@/components/admin/ModalAñadirOpcion";
import { motion, AnimatePresence } from "framer-motion";

type VarianteLote = {
    id: string;
    publico: string;
    talla: string;
    color: string;
    cantidad: number;
    cantidad_faltante?: number;
};

type VarianteCorte = {
    talla: string;
    cantidad: number;
};

type CuttingRecord = {
    id: string;
    rollo_descripcion: string;
    tipo_prenda: string;
    modelo_prenda: string;
    tallas: VarianteCorte[];
    total_cortado: number;
    fecha: Date;
};

type EnvioTaller = {
    id: string;
    id_corte: string;
    taller_destino: string;
    estado: 'pendiente' | 'recibido';
    fecha_envio: Date;
    corte_origen: CuttingRecord;
    variantes_recibidas?: VarianteLote[];
    total_recibido?: number;
};

export default function PaginaCostura() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'envio' | 'recepcion'>('envio');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Datos Locales
    const [cortes, setCortes] = useState<CuttingRecord[]>([]);
    const [enviosPendientes, setEnviosPendientes] = useState<EnvioTaller[]>([]);
    const [historialEnvios, setHistorialEnvios] = useState<EnvioTaller[]>([]);

    // Formulario Envío a Talleres
    const [corteSeleccionadoId, setCorteSeleccionadoId] = useState<string>('');
    const [tallerDestino, setTallerDestino] = useState<string>('');
    
    // Formulario Recepción de Talleres
    const [envioPendienteId, setEnvioPendienteId] = useState<string>('');
    const [variantesRecepción, setVariantesRecepción] = useState<VarianteLote[]>([]);

    // Instanciar Hook de Formularios Reutilizable
    const {
        categoria, tipoProducto, publico, talla, color,
        setTipoProducto, handleCategoriaChange, resetFormulario,
        talleresDisponibles,
        modalConfig, isSubmittingModal, abrirModalNuevo, abrirModalEditar, abrirModalEliminar, cerrarModal, confirmarModal
    } = useFormulariosProducto();

    useEffect(() => {
        cargarDatos();
    }, [activeTab]);

    const cargarDatos = async () => {
        if (activeTab === 'envio') {
            try {
                const q = query(collection(db, 'registros_corte'), orderBy('fecha_registro', 'desc'));
                const snap = await getDocs(q);
                const fetchedCortes: CuttingRecord[] = [];
                snap.forEach(doc => {
                    const data = doc.data();
                    fetchedCortes.push({
                        id: doc.id,
                        rollo_descripcion: data.rollo_descripcion || '',
                        tipo_prenda: data.tipo_prenda || data.categoria || '',
                        modelo_prenda: data.modelo_prenda || data.tipo_producto || '',
                        tallas: data.tallas || [],
                        total_cortado: data.total_cortado || 0,
                        fecha: data.fecha_registro?.toDate ? data.fecha_registro.toDate() : new Date(),
                    });
                });
                setCortes(fetchedCortes);

                const qEnvios = query(collection(db, 'envios_talleres'), orderBy('fecha_envio', 'desc'));
                const snapEnvios = await getDocs(qEnvios);
                const fetchedHistorial: EnvioTaller[] = [];
                snapEnvios.forEach(doc => {
                    const data = doc.data();
                    fetchedHistorial.push({
                        id: doc.id,
                        id_corte: data.id_corte,
                        taller_destino: data.taller_destino,
                        estado: data.estado,
                        corte_origen: data.corte_origen,
                        variantes_recibidas: data.variantes_recibidas || [],
                        total_recibido: data.total_recibido || 0,
                        fecha_envio: data.fecha_envio?.toDate ? data.fecha_envio.toDate() : new Date(),
                    });
                });
                setHistorialEnvios(fetchedHistorial);
            } catch (error) {
                console.error("Error fetching cuts or history:", error);
            }
        }

        if (activeTab === 'recepcion') {
            try {
                const q = query(collection(db, 'envios_talleres'), where('estado', '==', 'pendiente'));
                const snap = await getDocs(q);
                const fetchedEnvios: EnvioTaller[] = [];
                snap.forEach(doc => {
                    const data = doc.data();
                    fetchedEnvios.push({
                        id: doc.id,
                        id_corte: data.id_corte,
                        taller_destino: data.taller_destino,
                        estado: data.estado,
                        corte_origen: data.corte_origen,
                        fecha_envio: data.fecha_envio?.toDate ? data.fecha_envio.toDate() : new Date(),
                    });
                });
                setEnviosPendientes(fetchedEnvios);
            } catch (error) {
                console.error("Error fetching pending sends:", error);
            }
        }
    };

    // --- ACCIONES ENVIO A TALLER ---
    const handleGuardarEnvio = async () => {
        if (!corteSeleccionadoId || !tallerDestino.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const corteData = cortes.find(c => c.id === corteSeleccionadoId);
            if (!corteData) throw new Error("Corte no valid");

            const registro = {
                id_usuario: user?.uid || "desconocido",
                id_corte: corteSeleccionadoId,
                taller_destino: tallerDestino.trim(),
                corte_origen: corteData
            };
            await guardarEnvioTaller(registro);
            
            setCorteSeleccionadoId('');
            setTallerDestino('');
            toast.success("Corte enviado a taller exitosamente.");
            setActiveTab('recepcion');
        } catch (error) {
            toast.error("Error al registrar el envío.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- ACCIONES RECEPCION DE TALLER ---
    useEffect(() => {
        if (envioPendienteId) {
            const envio = enviosPendientes.find(e => e.id === envioPendienteId);
            if (envio && envio.corte_origen) {
                const colorParse = envio.corte_origen.rollo_descripcion.split(' - ')[1] || 'Color Default';
                // Generar auto variantes para confirmar
                const autovariantes = envio.corte_origen.tallas.map((t, idx) => ({
                    id: `gen-${idx}`,
                    publico: 'Adultos', // Por defecto conceptual
                    talla: t.talla,
                    color: colorParse,
                    cantidad: t.cantidad, // esperado a recibir
                    cantidad_faltante: 0
                }));
                setVariantesRecepción(autovariantes);
                handleCategoriaChange(envio.corte_origen.tipo_prenda);
                setTipoProducto(envio.corte_origen.modelo_prenda);
            }
        } else {
            setVariantesRecepción([]);
            resetFormulario();
        }
    }, [envioPendienteId]);

    const handleUpdateRecepción = (id: string, field: keyof VarianteLote, value: any) => {
        setVariantesRecepción(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
    };

    const handleConfirmarRecepcion = async () => {
        if (!envioPendienteId || variantesRecepción.length === 0 || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const envio = enviosPendientes.find(e => e.id === envioPendienteId);
            const totalRecibido = variantesRecepción.reduce((acc, v) => acc + Number(v.cantidad), 0);

            // Se elimina la llamada a guardarEntradaInventario para DESCONECTAR de inventario
            // Ahora la trazabilidad se guarda detallada directamente en el log del taller:
            await marcarEnvioRecibido(envioPendienteId, {
                variantes: variantesRecepción,
                total_recibido: totalRecibido
            });

            setEnvioPendienteId('');
            setVariantesRecepción([]);
            resetFormulario();
            toast.success("Recepción confirmada y stock actualizado exitosamente.");
            cargarDatos();
        } catch (error) {
            console.error(error);
            toast.error("Error al registrar recepción de taller.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ProtectedRoute allowedAreas={["master", "sewing"]}>
            <div className="space-y-8 pb-10">
                {/* Cabecera Estilo Cyber-Luxury */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 border-b border-zinc-200 dark:border-white/5 pb-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white drop-shadow-sm flex items-center gap-3">
                            <Activity className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                            ÁREA DE TALLERES
                        </h1>
                        <p className="text-zinc-500 uppercase tracking-[0.2em] text-xs font-bold mt-2">Centro de Control de Costura Exterior</p>
                    </div>

                    {/* Tab Navigation Animado */}
                    <div className="relative flex p-1.5 bg-zinc-100 dark:bg-black/60 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-2xl w-full md:w-auto overflow-x-auto shadow-sm dark:shadow-2xl">
                        <button 
                            onClick={() => setActiveTab('envio')} 
                            className={`relative flex items-center justify-center px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'envio' ? "text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
                        >
                            <Truck className="w-4 h-4 mr-2" /> Envío a Gestor
                            {activeTab === 'envio' && (
                                <motion.div layoutId="costuraTab" className="absolute inset-0 bg-white dark:bg-gradient-to-r dark:from-indigo-600/30 dark:to-blue-500/10 border border-zinc-200 dark:border-indigo-500/40 rounded-xl -z-10 shadow-sm dark:shadow-[0_0_15px_rgba(79,70,229,0.3)]" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                            )}
                        </button>
                        <button 
                            onClick={() => setActiveTab('recepcion')} 
                            className={`relative flex items-center justify-center px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'recepcion' ? "text-zinc-900 dark:text-white" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
                        >
                            <PackageSearch className="w-4 h-4 mr-2" /> Recepción Final
                            {activeTab === 'recepcion' && (
                                <motion.div layoutId="costuraTab" className="absolute inset-0 bg-white dark:bg-gradient-to-r dark:from-teal-600/30 dark:to-emerald-500/10 border border-zinc-200 dark:border-teal-500/40 rounded-xl -z-10 shadow-sm dark:shadow-[0_0_15px_rgba(20,184,166,0.3)]" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                            )}
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'envio' && (
                        <motion.div key="envio" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-8">
                            
                            <div className="grid lg:grid-cols-2 gap-8">
                                {/* Formulario Envio */}
                                <div className="bg-white/80 dark:bg-gradient-to-b dark:from-zinc-900/80 dark:to-black/80 backdrop-blur-xl p-8 rounded-[2rem] border border-zinc-200 dark:border-white/5 shadow-xl dark:shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-indigo-500/20 dark:group-hover:bg-indigo-500/10 transition-colors duration-700" />
                                    
                                    <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-8 flex items-center text-zinc-800 dark:text-zinc-300">
                                        <Truck className="w-5 h-5 mr-3 text-indigo-500 dark:text-indigo-400" /> Nuevo Despacho a Taller
                                    </h2>

                                    <div className="space-y-6 relative z-10">
                                        <div>
                                            <label className="block text-xs uppercase tracking-wider font-bold mb-2 text-zinc-500">Corte Origen (No Enviados)</label>
                                            <select value={corteSeleccionadoId} onChange={e => setCorteSeleccionadoId(e.target.value)} className="w-full px-5 py-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/50 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer">
                                                <option value="" disabled>SELECCIONE LOTE CORTADO...</option>
                                                {cortes.filter(c => !historialEnvios.some(e => e.id_corte === c.id)).map(c => (
                                                    <option key={c.id} value={c.id}>{c.tipo_prenda} {c.modelo_prenda} • {c.rollo_descripcion} • {c.total_cortado} UDS</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs uppercase tracking-wider font-bold mb-2 text-zinc-500">Taller Destino</label>
                                            <div className="flex gap-3">
                                                <select
                                                    value={tallerDestino} onChange={e => {
                                                        if (e.target.value === '___NUEVO___') abrirModalNuevo('taller');
                                                        else setTallerDestino(e.target.value);
                                                    }}
                                                    className="flex-1 w-full px-5 py-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/50 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="" disabled>SELECCIONE DESTINO...</option>
                                                    {talleresDisponibles.map(t => (
                                                        <option key={t} value={t}>{t}</option>
                                                    ))}
                                                    <option value="___NUEVO___" className="text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/30">+ REGISTRAR NUEVO TALLER...</option>
                                                </select>
                                                
                                                {tallerDestino && (
                                                    <div className="flex gap-2">
                                                        <button type="button" onClick={() => abrirModalEditar('taller', tallerDestino)} className="px-4 bg-zinc-900 border border-white/10 rounded-xl text-zinc-400 hover:text-indigo-400 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all shadow-sm" title="Renombrar"><Pencil className="w-4 h-4" /></button>
                                                        <button type="button" onClick={() => abrirModalEliminar('taller', tallerDestino)} className="px-4 bg-zinc-900 border border-white/10 rounded-xl text-zinc-400 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-all shadow-sm" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <button onClick={handleGuardarEnvio} disabled={isSubmitting || !corteSeleccionadoId || !tallerDestino} className="w-full py-5 mt-4 font-black uppercase tracking-widest text-sm rounded-xl flex justify-center items-center bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-all duration-300 disabled:opacity-30 disabled:hover:shadow-none">
                                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : "Registrar Despacho Oficial"}
                                        </button>
                                    </div>
                                </div>

                                {/* Preview del Corte Seleccionado */}
                                <div className="bg-white/80 dark:bg-gradient-to-b dark:from-zinc-900/80 dark:to-black/80 backdrop-blur-xl p-8 rounded-[2rem] border border-zinc-200 dark:border-white/5 shadow-xl dark:shadow-2xl relative overflow-hidden flex flex-col">
                                    <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-6 flex items-center text-zinc-500">
                                        <Box className="w-5 h-5 mr-3 text-zinc-400" /> Desglose Técnico
                                    </h2>
                                    
                                    <div className="flex-1 flex flex-col justify-center">
                                        <AnimatePresence mode="wait">
                                            {corteSeleccionadoId && cortes.find(c => c.id === corteSeleccionadoId) ? (() => {
                                                const corteDetalle = cortes.find(c => c.id === corteSeleccionadoId)!;
                                                return (
                                                    <motion.div key="detalle" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-8">
                                                        <div className="flex justify-between items-start border-b border-zinc-200 dark:border-white/5 pb-6">
                                                            <div>
                                                                <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Prenda / Modelo</div>
                                                                <div className="text-2xl font-black text-zinc-900 dark:text-white">{corteDetalle.tipo_prenda} <span className="text-zinc-500 dark:text-zinc-400 font-medium">{corteDetalle.modelo_prenda}</span></div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Total Unidades</div>
                                                                <div className="text-3xl font-black text-indigo-500 dark:text-indigo-400">{corteDetalle.total_cortado}</div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div>
                                                            <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-3">Materia Prima</div>
                                                            <div className="inline-flex items-center px-4 py-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-bold text-zinc-700 dark:text-zinc-300">
                                                                {corteDetalle.rollo_descripcion}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Matriz de Tallas</div>
                                                            <div className="flex flex-wrap gap-3">
                                                                {corteDetalle.tallas.map((t, idx) => (
                                                                    <div key={idx} className="flex flex-col items-center justify-center p-3 w-20 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/5 rounded-xl shadow-inner relative overflow-hidden group">
                                                                        <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                        <span className="text-xs font-bold text-zinc-500 uppercase z-10 mb-1">{t.talla}</span>
                                                                        <span className="text-lg font-black text-zinc-900 dark:text-white z-10">{t.cantidad}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })() : (
                                                <motion.div key="vacio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full text-center p-6 bg-black/40 border border-white/5 rounded-2xl border-dashed">
                                                    <Box className="w-12 h-12 text-zinc-800 mb-4" />
                                                    <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest">Seleccione un lote para visualizar <br/>el Manifiesto Técnico.</p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Historial Cyber Table */}
                            <div className="bg-white/80 dark:bg-gradient-to-br dark:from-zinc-900/90 dark:to-black/90 backdrop-blur-2xl rounded-[2rem] border border-zinc-200 dark:border-white/5 shadow-xl dark:shadow-2xl overflow-hidden p-1">
                                <div className="p-6 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between bg-zinc-50 dark:bg-black/50 rounded-t-[1.8rem]">
                                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-800 dark:text-zinc-300 flex items-center">
                                        <Activity className="w-4 h-4 mr-3 text-emerald-500 dark:text-emerald-400" /> Log de Transacciones
                                    </h2>
                                    <div className="px-3 py-1 bg-zinc-200 dark:bg-white/5 rounded-full text-[10px] font-bold text-zinc-500 tracking-widest">REGISTRO INMUTABLE</div>
                                </div>
                                <div className="overflow-x-auto p-4">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead>
                                            <tr>
                                                <th className="p-4 text-xs font-bold uppercase tracking-widest text-zinc-600">Timestamp</th>
                                                <th className="p-4 text-xs font-bold uppercase tracking-widest text-zinc-600">Lote Origen</th>
                                                <th className="p-4 text-xs font-bold uppercase tracking-widest text-zinc-600">Taller Destino</th>
                                                <th className="p-4 text-xs font-bold uppercase tracking-widest text-zinc-600 text-center">Volumen</th>
                                                <th className="p-4 text-xs font-bold uppercase tracking-widest text-zinc-600 text-center">Protocolo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                                            {historialEnvios.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="p-12 text-center text-zinc-600 font-bold tracking-widest text-xs uppercase bg-zinc-50 dark:bg-black/20 rounded-xl">Sin Datos de Telemetría</td>
                                                </tr>
                                            ) : historialEnvios.map((envio, i) => (
                                                <motion.tr key={envio.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors group">
                                                    <td className="p-4">
                                                        <div className="font-bold text-zinc-500 dark:text-zinc-400">{envio.fecha_envio.toLocaleDateString()}</div>
                                                        <div className="text-xs text-zinc-600 font-medium">{envio.fecha_envio.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                                            {envio.corte_origen?.tipo_prenda} {envio.corte_origen?.modelo_prenda}
                                                        </div>
                                                        <div className="text-xs text-zinc-500 mt-1 pl-3.5 tracking-wide">{envio.corte_origen?.rollo_descripcion}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="inline-flex items-center px-3 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold text-zinc-800 dark:text-white">
                                                            {envio.taller_destino}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex flex-col items-center justify-center gap-1 w-full max-w-[140px] mx-auto">
                                                            <div className="relative group/volumen flex flex-col items-center">
                                                                <span className="font-black text-2xl text-zinc-900 dark:text-white tracking-tighter drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" title="Enviado">{envio.corte_origen?.total_cortado}</span>
                                                                <span className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] font-bold mt-[-4px]">Enviado</span>
                                                            </div>
                                                            {envio.estado === 'recibido' && envio.total_recibido !== undefined && (
                                                                <div className="flex flex-col items-center mt-3 border-t border-white/[0.08] pt-3 w-full relative">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Recibido</span>
                                                                        <span className="font-black text-sm text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)] bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">{envio.total_recibido}</span>
                                                                    </div>
                                                                    {envio.variantes_recibidas?.some(v => v.cantidad_faltante && v.cantidad_faltante > 0) && (
                                                                        <div className="mt-1 flex flex-col gap-1.5 w-full">
                                                                            {envio.variantes_recibidas?.map((v, idx) => v.cantidad_faltante && v.cantidad_faltante > 0 ? (
                                                                                <div key={idx} className="flex flex-col justify-center items-center bg-red-950/40 border border-red-500/30 px-2 py-1.5 rounded-lg text-xs w-full box-border relative overflow-hidden group/alert shadow-[0_2px_10px_rgba(239,68,68,0.1)] hover:border-red-500/60 hover:bg-red-900/40 transition-all">
                                                                                    <div className="absolute inset-0 bg-red-500/10 blur-xl opacity-0 group-hover/alert:opacity-100 transition-opacity pointer-events-none"></div>
                                                                                    <span className="font-black text-red-500 text-[10px] tracking-wider flex items-center relative z-10"><AlertCircle className="w-3 h-3 mr-1 inline stroke-[2.5]" /> FALTAN {v.cantidad_faltante} u.</span>
                                                                                    <span className="text-red-300/80 font-bold text-[9px] relative z-10 bg-black/40 px-1.5 mt-0.5 rounded border border-red-500/20">TALLA {v.talla.toUpperCase()}</span>
                                                                                </div>
                                                                            ) : null)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center align-top pt-6">
                                                        {envio.estado === 'recibido' ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                                                <Check className="w-3 h-3" /> Logueado
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                                                                <Loader2 className="w-3 h-3 animate-spin" /> En Proceso
                                                            </span>
                                                        )}
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'recepcion' && (
                        <motion.div key="recepcion" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-8">
                            
                            <div className="bg-white/80 dark:bg-gradient-to-br dark:from-zinc-900/90 dark:to-black/90 backdrop-blur-2xl rounded-[2rem] border border-zinc-200 dark:border-white/5 shadow-xl dark:shadow-2xl p-8 lg:p-12 relative overflow-hidden">
                                <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
                                
                                <div className="max-w-4xl mx-auto">
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-200 dark:border-white/10 pb-8 mb-8">
                                        <div>
                                            <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center">
                                                <Check className="w-8 h-8 mr-4 text-teal-500 dark:text-teal-400 bg-teal-500/10 dark:bg-teal-400/10 p-1.5 rounded-xl border border-teal-500/20 dark:border-teal-400/20" /> 
                                                Confirmación de Retorno
                                            </h2>
                                            <p className="text-zinc-400 mt-2 text-sm">Escanea y valida las cantidades ingresadas por los proveedores de costura externa para actualizar el Macro-Inventario.</p>
                                        </div>
                                    </div>

                                    <div className="mb-10">
                                        <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-3 ml-2">Seleccionar Expediente Activo</label>
                                        <div className="relative">
                                            <select 
                                                value={envioPendienteId} 
                                                onChange={e => setEnvioPendienteId(e.target.value)} 
                                                className="w-full px-6 py-5 rounded-2xl bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white font-medium text-lg appearance-none cursor-pointer hover:border-teal-500/50 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none"
                                            >
                                                <option value="" disabled>SELECCIONE ORDEN EN ESPERA...</option>
                                                {enviosPendientes.map(e => (
                                                    <option key={e.id} value={e.id}>
                                                        [{e.taller_destino.toUpperCase()}] • {e.corte_origen.tipo_prenda} {e.corte_origen.modelo_prenda} ({e.corte_origen.total_cortado} UDS) 
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-teal-500">
                                                <Settings className="w-5 h-5 animate-[spin_4s_linear_infinite]" />
                                            </div>
                                        </div>
                                    </div>

                                    {envioPendienteId && (
                                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="pt-8 border-t border-zinc-200 dark:border-white/5 space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-md text-teal-600 dark:text-teal-400 text-xs font-black uppercase tracking-widest">
                                                    INSPECCIÓN
                                                </div>
                                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-wide">
                                                    Lote: {enviosPendientes.find(e => e.id === envioPendienteId)?.corte_origen.rollo_descripcion}
                                                </h3>
                                            </div>
                                            
                                            <div className="grid gap-4">
                                                {variantesRecepción.map((v, i) => (
                                                    <motion.div key={v.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="group relative overflow-hidden bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-white/5 rounded-2xl p-5 hover:border-teal-500/30 hover:bg-zinc-100 dark:hover:bg-black/60 transition-all">
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                                            
                                                            {/* Datos Inmutables del Corte */}
                                                            <div className="flex gap-2 flex-wrap">
                                                                <span className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-300">
                                                                    {v.publico}
                                                                </span>
                                                                <span className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 shadow-sm dark:shadow-[0_0_10px_rgba(79,70,229,0.1)]">
                                                                    TALLA {v.talla}
                                                                </span>
                                                                <span className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-400">
                                                                    {v.color}
                                                                </span>
                                                            </div>

                                                            {/* Inputs de Validacion */}
                                                            <div className="flex items-center gap-4 bg-white dark:bg-zinc-950 p-2 rounded-xl border border-zinc-200 dark:border-white/5">
                                                                <div className="flex flex-col items-center px-4">
                                                                    <label className="text-[10px] uppercase font-black tracking-widest text-emerald-500 mb-2">Ingresa Correcto</label>
                                                                    <input 
                                                                        type="number" 
                                                                        value={v.cantidad} 
                                                                        onChange={e => handleUpdateRecepción(v.id, 'cantidad', e.target.value)} 
                                                                        className="w-20 text-center text-xl font-black bg-transparent border-b-2 border-emerald-500/50 focus:border-emerald-400 text-zinc-900 dark:text-white outline-none pb-1 transition-colors" 
                                                                    />
                                                                </div>
                                                                
                                                                <div className="w-px h-10 bg-zinc-200 dark:bg-white/10" />

                                                                <div className="flex flex-col items-center px-4">
                                                                    <label className="text-[10px] uppercase font-black tracking-widest text-red-500 mb-2">Mermas / Fallas</label>
                                                                    <input 
                                                                        type="number" 
                                                                        value={v.cantidad_faltante || ''} 
                                                                        onChange={e => handleUpdateRecepción(v.id, 'cantidad_faltante', e.target.value)} 
                                                                        placeholder="0" 
                                                                        className="w-16 text-center text-xl font-black bg-transparent border-b-2 border-red-500/50 focus:border-red-400 text-red-600 dark:text-red-400 placeholder:text-red-300 dark:placeholder:text-red-900/50 outline-none pb-1 transition-colors" 
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 via-teal-500/[0.02] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
                                                    </motion.div>
                                                ))}
                                            </div>

                                            <button 
                                                onClick={handleConfirmarRecepcion} 
                                                disabled={isSubmitting || variantesRecepción.length === 0} 
                                                className="w-full relative overflow-hidden py-6 mt-8 rounded-2xl bg-teal-600 border border-teal-500 text-white shadow-[0_0_40px_rgba(20,184,166,0.3)] hover:shadow-[0_0_60px_rgba(20,184,166,0.5)] transition-all duration-300 disabled:opacity-50 disabled:hover:shadow-[0_0_40px_rgba(20,184,166,0.3)] group"
                                            >
                                                <span className="relative z-10 flex items-center justify-center font-black uppercase tracking-[0.2em] text-sm">
                                                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                                        <>
                                                            <Check className="w-5 h-5 mr-3" /> CERRAR LOTE E INTEGRAR AL INVENTARIO
                                                        </>
                                                    )}
                                                </span>
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                                            </button>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <ModalAñadirOpcion
                {...modalConfig}
                onClose={cerrarModal}
                onConfirm={confirmarModal}
                isSubmitting={isSubmittingModal}
            />
        </ProtectedRoute>
    );
}
