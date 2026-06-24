"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Scissors, ClipboardList, Loader2, Plus, Trash2, Box, Activity, Check, ActivitySquare, LayoutGrid } from "lucide-react";
import { useFormulariosProducto } from "@/hooks/useFormulariosProducto";
import { useAuth } from "@/context/AuthContext";
import { guardarRegistroProduccion, getRollosDisponibles, descontarRollos } from "@/lib/firestoreUtils";
import { collection, getDocs, orderBy, query, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ModalAñadirOpcion from "@/components/admin/ModalAñadirOpcion";
import { motion, AnimatePresence } from "framer-motion";

type RolloDisponible = {
    id: string;
    tipo_tela: string;
    color: string;
    cantidad_rollos: number;
    disponible: boolean;
};

type VarianteCorte = {
    talla: string;
    cantidad: number;
};

type CuttingRecord = {
    id: string;
    rollo_origen_id: string;
    rollo_descripcion: string;
    tipo_tela?: string;
    cantidad_rollos_cortados?: number;
    tipo_prenda: string;
    modelo_prenda: string;
    tallas: VarianteCorte[];
    total_cortado: number;
    fecha: Date;
};

export default function PaginaCorte() {
    const { user } = useAuth();
    const [records, setRecords] = useState<CuttingRecord[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Rollos disponibles
    const [rollosDisponibles, setRollosDisponibles] = useState<RolloDisponible[]>([]);
    const [rolloSeleccionado, setRolloSeleccionado] = useState('');
    const [cantidadRollosACortar, setCantidadRollosACortar] = useState<number>(1);

    // Modal eliminar registro de corte
    const [modalEliminarCorte, setModalEliminarCorte] = useState<{ open: boolean; item: CuttingRecord | null; isDeleting: boolean }>({
        open: false,
        item: null,
        isDeleting: false
    });

    // Tallas y Matriz
    const [matrizTallas, setMatrizTallas] = useState<Record<string, number>>({});

    // Hook de Formularios Reutilizable (para categorías y modelos)
    const {
        categoria, tipoProducto, publico, 
        setTipoProducto, handleCategoriaChange, handlePublicoChange, resetFormulario,
        categoriasDisponibles, tiposDisponibles, publicosDisponibles, tallasDisponibles,
        modalConfig, isSubmittingModal, abrirModalNuevo, cerrarModal, confirmarModal
    } = useFormulariosProducto();

    // Resetear matriz cuando cambia el público
    useEffect(() => {
        setMatrizTallas({});
    }, [publico]);

    // Cargar datos al montar
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Cargar rollos disponibles y forzar filtrado estricto
                const rollosRaw = await getRollosDisponibles();
                setRollosDisponibles(rollosRaw.filter(r => r.cantidad_rollos > 0));
            } catch (error) {
                console.error("Error al cargar rollos:", error);
            }

            try {
                // Cargar historial de corte
                const q = query(collection(db, 'registros_corte'), orderBy('fecha_registro', 'desc'));
                const snap = await getDocs(q);
                const fetchedRecords: CuttingRecord[] = [];
                snap.forEach(docSnap => {
                    const data = docSnap.data();
                    fetchedRecords.push({
                        id: docSnap.id,
                        rollo_origen_id: data.rollo_origen_id || '',
                        rollo_descripcion: data.rollo_descripcion || data.tipo_tela ? `${data.tipo_tela} - ${data.color || ''}` : '',
                        tipo_tela: data.tipo_tela || '',
                        cantidad_rollos_cortados: data.cantidad_rollos_cortados || 0,
                        tipo_prenda: data.tipo_prenda || data.categoria || '',
                        modelo_prenda: data.modelo_prenda || data.tipo_producto || '',
                        tallas: data.tallas || [],
                        total_cortado: data.total_cortado || 0,
                        fecha: data.fecha_registro?.toDate ? data.fecha_registro.toDate() : new Date(),
                    });
                });
                setRecords(fetchedRecords);
            } catch (error) {
                console.error("Error al cargar historial:", error);
            }
        };
        fetchData();
    }, []);

    // Helper: Modificar Matriz de Tallas Individualmente
    const updateCantidadTalla = (talla: string, value: string) => {
        const parsed = parseInt(value, 10);
        setMatrizTallas(prev => ({
            ...prev,
            [talla]: isNaN(parsed) ? 0 : parsed
        }));
    };

    const totalCortado = Object.values(matrizTallas).reduce((acc, current) => acc + (current > 0 ? current : 0), 0);

    // Guardar registro de corte
    const handleGuardarCorte = async () => {
        if (!rolloSeleccionado) {
            toast.error("Selecciona un rollo de tela original.");
            return;
        }
        if (!categoria || !tipoProducto) {
            toast.error("Selecciona la categoría y modelo de prenda a facturar.");
            return;
        }
        if (totalCortado <= 0) {
            toast.error("Ingresa al menos una cantidad válida en la matriz de tallas a cortar.");
            return;
        }
        if (cantidadRollosACortar <= 0) {
            toast.error("La cantidad de rollos consumidos debe ser mayor a 0.");
            return;
        }

        setIsSubmitting(true);
        try {
            const rollo = rollosDisponibles.find(r => r.id === rolloSeleccionado);
            if (!rollo) {
                toast.error("El rollo seleccionado presenta incongruencias de red.");
                setIsSubmitting(false);
                return;
            }
            if (cantidadRollosACortar > rollo.cantidad_rollos) {
                toast.error(`Solo existen ${rollo.cantidad_rollos} rollo(s) en inventario para este ítem.`);
                setIsSubmitting(false);
                return;
            }

            // Preparar variantes filtrando valores cero
            const variantes: VarianteCorte[] = Object.entries(matrizTallas)
                .filter(([_, qty]) => qty > 0)
                .map(([talla, qty]) => ({ talla, cantidad: qty }));

            // Guardar registro
            const registro = {
                rollo_origen_id: rolloSeleccionado,
                rollo_descripcion: `${rollo.tipo_tela} - ${rollo.color}`,
                tipo_tela: rollo.tipo_tela,
                cantidad_rollos_cortados: cantidadRollosACortar,
                tipo_prenda: categoria,
                modelo_prenda: tipoProducto,
                tallas: variantes,
                total_cortado: totalCortado,
                id_usuario: user?.uid || "desconocido",
                nombre_usuario: user?.email ? user.email.split('@')[0] : "Anonimo",
            };

            const idRegistro = await guardarRegistroProduccion('registros_corte', registro);

            // Descontar rollos usados en DB
            await descontarRollos(rolloSeleccionado, cantidadRollosACortar);

            const nuevoRegistro: CuttingRecord = {
                id: idRegistro,
                rollo_origen_id: rolloSeleccionado,
                rollo_descripcion: `${rollo.tipo_tela} - ${rollo.color}`,
                cantidad_rollos_cortados: cantidadRollosACortar,
                tipo_prenda: categoria,
                modelo_prenda: tipoProducto,
                tallas: variantes,
                total_cortado: totalCortado,
                fecha: new Date(),
            };

            setRecords([nuevoRegistro, ...records]);

            // Actualizar rollos y obligar filtrado drastico en memoria
            setRollosDisponibles(prev =>
                prev.map(r => {
                    if (r.id === rolloSeleccionado) {
                        const nuevaCantidad = r.cantidad_rollos - cantidadRollosACortar;
                        return {
                            ...r,
                            cantidad_rollos: Math.max(0, nuevaCantidad),
                            disponible: nuevaCantidad > 0
                        };
                    }
                    return r;
                }).filter(r => r.cantidad_rollos > 0) // ¡Filtro fuerte in-situ!
            );

            toast.success(`Corte Autorizado.`);

            // Limpiar formulario
            setRolloSeleccionado('');
            setCantidadRollosACortar(1);
            resetFormulario();
            setMatrizTallas({});
        } catch (error) {
            console.error("Error al guardar corte:", error);
            toast.error("Fallo crítico al asentar el registro de corte.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEliminarCorte = (record: CuttingRecord) => {
        setModalEliminarCorte({ open: true, item: record, isDeleting: false });
    };

    const confirmEliminarCorte = async () => {
        const { item } = modalEliminarCorte;
        if (!item) return;

        setModalEliminarCorte(prev => ({ ...prev, isDeleting: true }));
        try {
            await deleteDoc(doc(db, 'registros_corte', item.id));
            setRecords(prev => prev.filter(r => r.id !== item.id));
            toast.success("Registro de corte eliminado.");
            setModalEliminarCorte({ open: false, item: null, isDeleting: false });
        } catch (error) {
            toast.error("Error al eliminar registro.");
            setModalEliminarCorte(prev => ({ ...prev, isDeleting: false }));
        }
    };

    const totalCortadoHistorico = records.reduce((acc, current) => acc + current.total_cortado, 0);

    return (
        <ProtectedRoute allowedAreas={["master", "cutting"]}>
            <div className="space-y-8 pb-10">
                {/* Cabecera Estilo Cyber-Luxury */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 border-b border-zinc-200 dark:border-white/5 pb-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white drop-shadow-sm flex items-center gap-3">
                            <Scissors className="w-8 h-8 text-fuchsia-500" />
                            ÁREA DE CORTE
                        </h1>
                        <p className="text-zinc-500 uppercase tracking-[0.2em] text-xs font-bold mt-2">Módulo de Despiece y Facturación Textil</p>
                    </div>

                    <div className="flex bg-white/80 dark:bg-black/60 backdrop-blur-2xl p-1.5 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-lg dark:shadow-2xl gap-2">
                        <div className="flex items-center px-6 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl relative overflow-hidden group">
                           <div className="absolute inset-0 bg-fuchsia-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                           <Scissors className="w-4 h-4 mr-3 text-fuchsia-500 dark:text-fuchsia-400" />
                           <div>
                               <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-tight">Prendas Procesadas</div>
                               <div className="text-xl font-black text-zinc-900 dark:text-white leading-tight">{totalCortadoHistorico}</div>
                           </div>
                        </div>
                        <div className="flex items-center px-6 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl relative overflow-hidden group">
                           <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                           <ClipboardList className="w-4 h-4 mr-3 text-blue-500 dark:text-blue-400" />
                           <div>
                               <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-tight">Rollos Libres</div>
                               <div className="text-xl font-black text-zinc-900 dark:text-white leading-tight">{rollosDisponibles.length}</div>
                           </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Formulario de Corte - Maximalist Form */}
                    <div className="lg:col-span-1 bg-white/90 dark:bg-gradient-to-b dark:from-zinc-900/80 dark:to-black/80 backdrop-blur-xl p-8 rounded-[2rem] border border-zinc-200 dark:border-white/5 shadow-xl dark:shadow-2xl relative overflow-hidden group h-fit">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 dark:bg-fuchsia-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-fuchsia-500/20 dark:group-hover:bg-fuchsia-500/10 transition-colors duration-700" />

                        <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-8 flex items-center text-zinc-800 dark:text-zinc-300 relative z-10">
                            <ActivitySquare className="w-5 h-5 mr-3 text-fuchsia-500 dark:text-fuchsia-400" /> Autorizar Corte
                        </h2>

                        <form className="space-y-8 relative z-10">
                            {/* ROLLO */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded bg-fuchsia-500/20 text-fuchsia-400 text-xs font-black">1</span>
                                    <h3 className="text-xs font-black text-fuchsia-400 uppercase tracking-widest">Base Textil</h3>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Seleccionar Lote de Tela</label>
                                    <select
                                        value={rolloSeleccionado}
                                        onChange={e => {
                                            setRolloSeleccionado(e.target.value);
                                            setCantidadRollosACortar(1);
                                        }}
                                        className="w-full px-5 py-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/50 text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-fuchsia-500 transition-all outline-none appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value="" disabled>SELECCIONE ROLLO...</option>
                                        {rollosDisponibles.map(rollo => (
                                            <option key={rollo.id} value={rollo.id}>
                                                {rollo.tipo_tela} - {rollo.color} ({rollo.cantidad_rollos} disp.)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                {rolloSeleccionado && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col gap-2">
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Rollos a Procesar</label>
                                        <div className="flex items-center gap-4 bg-black/40 border border-white/5 rounded-xl p-3">
                                            <input type="range" min="1" max={rollosDisponibles.find(r => r.id === rolloSeleccionado)?.cantidad_rollos || 1} value={cantidadRollosACortar} onChange={e => setCantidadRollosACortar(Number(e.target.value))} className="flex-1 accent-fuchsia-500" />
                                            <span className="w-12 text-center text-xl font-black text-white">{cantidadRollosACortar}</span>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* PRENDA */}
                            <div className="space-y-4 pt-6 border-t border-zinc-200 dark:border-white/5">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded bg-fuchsia-500/20 text-fuchsia-500 dark:text-fuchsia-400 text-xs font-black">2</span>
                                    <h3 className="text-xs font-black text-fuchsia-500 dark:text-fuchsia-400 uppercase tracking-widest">Atributos Modelo</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Familia</label>
                                        <select value={categoria} onChange={e => { if (e.target.value === '___NUEVO___') abrirModalNuevo('categoria'); else handleCategoriaChange(e.target.value); }} className="w-full p-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/50 text-zinc-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-fuchsia-500 outline-none appearance-none cursor-pointer">
                                            <option value="" disabled>Elegir...</option>
                                            {categoriasDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                                            <option value="___NUEVO___" className="text-fuchsia-600 dark:text-fuchsia-400 font-bold">+ Nuevo...</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Variante</label>
                                        <select value={tipoProducto} onChange={e => setTipoProducto(e.target.value)} disabled={!categoria} className="w-full p-4 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/50 text-zinc-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-fuchsia-500 outline-none appearance-none cursor-pointer disabled:opacity-30">
                                            <option value="" disabled>Elegir...</option>
                                            {tiposDisponibles.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* MATRIZ DE CORTE */}
                            <div className="space-y-4 pt-6 border-t border-zinc-200 dark:border-white/5">
                                <div className="flex flex-col gap-2 mb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="flex items-center justify-center w-5 h-5 rounded bg-fuchsia-500/20 text-fuchsia-500 dark:text-fuchsia-400 text-xs font-black">3</span>
                                            <h3 className="text-xs font-black text-fuchsia-500 dark:text-fuchsia-400 uppercase tracking-widest">Matriz de Extracción</h3>
                                        </div>
                                    </div>
                                </div>

                                {/* Selección Rápida Público */}
                                <div className="flex gap-2 mb-4">
                                    {publicosDisponibles.map(p => (
                                        <button 
                                            key={p} type="button" 
                                            onClick={() => handlePublicoChange(p)} 
                                            className={`flex-1 py-3 px-2 rounded-xl border font-black uppercase tracking-widest text-[10px] transition-all ${publico === p ? 'bg-fuchsia-600/20 border-fuchsia-500 text-fuchsia-600 dark:text-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.2)]' : 'bg-zinc-100 dark:bg-black/40 border-zinc-200 dark:border-white/5 text-zinc-500 hover:border-zinc-300 dark:hover:border-white/20'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>

                                {/* Grid de Tallas */}
                                <AnimatePresence mode="wait">
                                    {publico && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                            <div className="bg-zinc-100/50 dark:bg-black/60 border border-zinc-200 dark:border-white/5 rounded-2xl p-4">
                                                <div className="flex items-center gap-2 text-zinc-500 mb-4 ml-1">
                                                    <LayoutGrid className="w-4 h-4" /> 
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">Malla de Tallas • Ingreso Rápido</span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-3">
                                                    {tallasDisponibles.map(tallaName => (
                                                        <div key={tallaName} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-xl overflow-hidden group focus-within:border-fuchsia-500/50 focus-within:shadow-[0_0_15px_rgba(217,70,239,0.1)] transition-all">
                                                            <div className="bg-zinc-50 dark:bg-black/50 text-center py-1 border-b border-zinc-200 dark:border-white/5">
                                                                <span className="text-[10px] uppercase font-black text-zinc-500 dark:text-zinc-400">{tallaName}</span>
                                                            </div>
                                                            <input 
                                                                type="text" 
                                                                inputMode="numeric" 
                                                                placeholder="-" 
                                                                value={matrizTallas[tallaName] || ''} 
                                                                onChange={(e) => updateCantidadTalla(tallaName, e.target.value)} 
                                                                className="w-full bg-transparent text-center text-lg font-black text-zinc-900 dark:text-white p-2 outline-none placeholder-zinc-300 dark:placeholder-zinc-700" 
                                                            />
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-white/5 flex justify-between items-center px-1">
                                                    <span className="text-xs uppercase font-bold tracking-widest text-zinc-500">Volumen Consolidado</span>
                                                    <span className="text-2xl font-black text-fuchsia-500 dark:text-fuchsia-400">{totalCortado}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                
                            </div>

                            <button type="button" onClick={handleGuardarCorte} disabled={isSubmitting || totalCortado === 0} className="w-full py-5 mt-6 relative overflow-hidden group rounded-xl bg-fuchsia-600 border border-fuchsia-500 text-white shadow-[0_0_30px_rgba(217,70,239,0.3)] hover:shadow-[0_0_50px_rgba(217,70,239,0.5)] transition-all duration-300 disabled:opacity-30 disabled:hover:shadow-none">
                                <span className="relative z-10 font-black uppercase tracking-[0.2em] text-xs flex justify-center items-center">
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "COMPILAR LOTE A INVENTARIO"}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                            </button>
                        </form>
                    </div>

                    {/* Historial Cyber Table */}
                    <div className="lg:col-span-2">
                        <div className="bg-white/80 dark:bg-gradient-to-br dark:from-zinc-900/90 dark:to-black/90 backdrop-blur-2xl rounded-[2rem] border border-zinc-200 dark:border-white/5 shadow-xl dark:shadow-2xl overflow-hidden p-1">
                            <div className="p-6 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between bg-zinc-50 dark:bg-black/50 rounded-t-[1.8rem]">
                                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-800 dark:text-zinc-300 flex items-center">
                                    <Activity className="w-4 h-4 mr-3 text-fuchsia-500 dark:text-fuchsia-400" /> Log de Transacciones Textil
                                </h2>
                                <div className="px-3 py-1 bg-zinc-200 dark:bg-white/5 rounded-full text-[10px] font-bold text-zinc-500 tracking-widest">SISTEMA INMUTABLE</div>
                            </div>
                            
                            <div className="overflow-x-auto p-2">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead>
                                        <tr>
                                            <th className="p-4 text-xs font-bold uppercase tracking-widest text-zinc-600">Origen Textil</th>
                                            <th className="p-4 text-xs font-bold uppercase tracking-widest text-zinc-600 text-center">Consumo</th>
                                            <th className="p-4 text-xs font-bold uppercase tracking-widest text-zinc-600">Modelo Derivado</th>
                                            <th className="p-4 text-xs font-bold uppercase tracking-widest text-zinc-600">Mapa Tallas</th>
                                            <th className="p-4 text-xs font-bold uppercase tracking-widest text-zinc-600 text-center">Output</th>
                                            <th className="p-4 text-xs font-bold uppercase tracking-widest text-zinc-600 text-center">CMD</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                                        {records.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="p-12 text-center text-zinc-600 font-bold tracking-widest text-xs uppercase bg-zinc-50 dark:bg-black/20 rounded-xl">Vacío. Sin telemetría recolectada.</td>
                                            </tr>
                                        ) : records.map((record, i) => (
                                            <motion.tr key={record.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors group">
                                                <td className="p-4">
                                                    <div className="font-bold text-zinc-900 dark:text-white max-w-[160px] truncate">{record.rollo_descripcion}</div>
                                                    <div className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mt-1">
                                                        {record.fecha.toLocaleDateString([], { month: 'short', day: '2-digit' })} • {record.fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="inline-flex justify-center items-center w-7 h-7 bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400 rounded-lg text-xs font-black">
                                                        {record.cantidad_rollos_cortados || '-'}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold text-zinc-800 dark:text-zinc-300">{record.tipo_prenda}</div>
                                                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{record.modelo_prenda}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex gap-1.5 flex-wrap max-w-[180px]">
                                                        {record.tallas.map((t, idx) => (
                                                            <div key={idx} className="flex bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded overflow-hidden shadow-sm dark:shadow-[0_0_5px_rgba(0,0,0,0.5)]">
                                                                <span className="bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 text-[9px] font-black uppercase px-2 py-1 flex items-center border-r border-zinc-200 dark:border-zinc-800">
                                                                    {t.talla}
                                                                </span>
                                                                <span className="text-zinc-900 dark:text-white text-[10px] font-bold px-2 py-1 flex items-center">
                                                                    {t.cantidad}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="font-black text-lg text-indigo-600 dark:text-indigo-400 drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(129,140,248,0.5)]">{record.total_cortado}</span>
                                                    <span className="text-[9px] font-bold text-zinc-600 block uppercase tracking-widest">Uds</span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button onClick={() => handleEliminarCorte(record)} className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 rounded-xl transition-all">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ModalAñadirOpcion
                {...modalConfig}
                onClose={cerrarModal}
                onConfirm={confirmarModal}
                isSubmitting={isSubmittingModal}
            />

            {/* Modal Confirmar Eliminacion */}
            <AnimatePresence>
                {modalEliminarCorte.open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-zinc-900/40 dark:bg-black/80 backdrop-blur-sm" onClick={() => setModalEliminarCorte({ open: false, item: null, isDeleting: false })} />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 p-6 rounded-[2rem] shadow-2xl relative z-10 flex flex-col items-center text-center text-zinc-900 dark:text-white">
                            <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm dark:shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                                <Trash2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-black mb-2 uppercase tracking-wide">Expurgar Registro</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
                                Estas a punto de destruir el manifiesto de <span className="font-bold text-zinc-900 dark:text-white">{modalEliminarCorte.item?.total_cortado} prendas</span> origen del rollo <span className="text-fuchsia-600 dark:text-fuchsia-400 font-bold">{modalEliminarCorte.item?.rollo_descripcion}</span>. Esta acción no restibuye rollos y es irreversible.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button onClick={() => setModalEliminarCorte({ open: false, item: null, isDeleting: false })} disabled={modalEliminarCorte.isDeleting} className="flex-1 py-3 px-4 rounded-xl border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-white font-bold hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50">
                                    Abortar
                                </button>
                                <button onClick={confirmEliminarCorte} disabled={modalEliminarCorte.isDeleting} className="flex-1 py-3 px-4 rounded-xl bg-red-600 font-bold text-white shadow-lg dark:shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:bg-red-500 flex justify-center items-center disabled:opacity-50 transition-colors">
                                    {modalEliminarCorte.isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Destruir"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </ProtectedRoute>
    );
}
