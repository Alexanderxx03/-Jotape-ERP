"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { LogOut, Loader2, Pencil, Trash2, LayoutGrid, Table as TableIcon, History, Search } from "lucide-react";
import { useFormulariosProducto } from "@/hooks/useFormulariosProducto";
import { useAuth } from "@/context/AuthContext";
import { guardarEntradaInventario } from "@/lib/firestoreUtils";
import { collection, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";
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
    paquetes?: number;
    unidades_por_paquete?: number;
};

type InventoryEntry = {
    id: string;
    almacen_destino: string;
    origen?: string;
    categoria: string;
    tipo: string;
    variantes: VarianteLote[];
    total: number;
    fecha: Date;
    tipo_operacion: 'ingreso' | 'recepcion_talleres' | 'salida';
};

const ALMACENES = ["Inventario General", "Almacén 1", "Almacén 2"];

const UNIDADES_POR_PAQUETE: Record<string, number> = {
    poleras: 5,
    buzos: 10,
};

const getUnidadesPorPaquete = (cat: string): number =>
    UNIDADES_POR_PAQUETE[cat.toLowerCase().trim()] ?? 1;

export default function PaginaSalida() {
    const { user } = useAuth();
    const [almacenDestino, setAlmacenDestino] = useState('Inventario General');
    
    const [itemsSalida, setItemsSalida] = useState<InventoryEntry[]>([]);
    const [itemsHistorialGeneral, setItemsHistorialGeneral] = useState<InventoryEntry[]>([]);
    const [variantes, setVariantes] = useState<VarianteLote[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [matrizPaquetes, setMatrizPaquetes] = useState<Record<string, number>>({});
    const [stockMap, setStockMap] = useState<Record<string, any>>({});
    
    const [activeTab, setActiveTab] = useState<'operacion' | 'stock' | 'historial'>('operacion');
    const [filtroStock, setFiltroStock] = useState("");

    const [modalEliminar, setModalEliminar] = useState<{ open: boolean; item: InventoryEntry | null; isDeleting: boolean }>({
        open: false,
        item: null,
        isDeleting: false
    });

    const {
        categoria, tipoProducto, publico, color,
        setTipoProducto, setColor,
        tiposDisponibles, tallasDisponibles, categoriasDisponibles, publicosDisponibles, coloresDisponibles,
        handleCategoriaChange, handlePublicoChange, resetFormulario,
        modalConfig, isSubmittingModal, abrirModalNuevo, abrirModalEditar, abrirModalEliminar, cerrarModal, confirmarModal
    } = useFormulariosProducto();

    useEffect(() => {
        cargarHistorialSalidas();
    }, []);

    const cargarHistorialSalidas = async () => {
        try {
            const invQ = query(
                collection(db, 'entradas_inventario')
            );
            const invSnap = await getDocs(invQ);
            const rawEntradas: any[] = [];
            invSnap.forEach(d => rawEntradas.push({ id: d.id, ...d.data() }));

            // Build Stock Map to validate outputs
            const sMap: Record<string, any> = {};
            const ALMACENES = ["Inventario General", "Almacén 1", "Almacén 2"];

            const agregarAStock = (item: any, ubicacion: string, cant: number) => {
                const arrVariantes = item.variantes || [];
                arrVariantes.forEach((v: VarianteLote) => {
                    const clave = `${item.categoria}-${item.tipo_producto || item.tipo}-${v.publico}-${v.talla}-${v.color}`;
                    if (!sMap[clave]) {
                        sMap[clave] = {
                            categoria: item.categoria,
                            tipo: item.tipo_producto || item.tipo,
                            publico: v.publico,
                            talla: v.talla,
                            color: v.color,
                            cantidades: {}
                        };
                        ALMACENES.forEach(u => sMap[clave].cantidades[u] = 0);
                    }
                    const cantReal = v.cantidad * cant;
                    sMap[clave].cantidades[ubicacion] = (sMap[clave].cantidades[ubicacion] || 0) + cantReal;
                });
            };

            rawEntradas.forEach(entrada => {
                const destino = entrada.almacen_destino || 'Almacén 1';
                const multiplier = entrada.tipo_operacion === 'salida' ? -1 : 1;
                agregarAStock(entrada, destino, multiplier);
            });

            setStockMap(sMap);

            // Filter only salidas for the history table
            const rawSalidas = rawEntradas.filter(e => e.tipo_operacion === 'salida');

            rawEntradas.sort((a,b) => {
                const fa = a.fecha_registro?.toMillis() || 0;
                const fb = b.fecha_registro?.toMillis() || 0;
                return fb - fa;
            });

            const parsedTodas: InventoryEntry[] = rawEntradas.map(e => ({
                id: e.id,
                almacen_destino: e.almacen_destino || 'Almacén 1', 
                origen: e.origen,
                categoria: e.categoria,
                tipo: e.tipo_producto || e.tipo,
                variantes: e.variantes || [],
                total: e.total_ingresado || 0,
                fecha: e.fecha_registro?.toDate ? e.fecha_registro.toDate() : new Date(),
                tipo_operacion: e.tipo_operacion
            }));

            setItemsHistorialGeneral(parsedTodas);

            const parsedEntradas: InventoryEntry[] = rawSalidas.map(e => ({
                id: e.id,
                almacen_destino: e.almacen_destino || 'Almacén 1', 
                origen: e.origen,
                categoria: e.categoria,
                tipo: e.tipo_producto || e.tipo,
                variantes: e.variantes || [],
                total: e.total_ingresado || 0,
                fecha: e.fecha_registro?.toDate ? e.fecha_registro.toDate() : new Date(),
                tipo_operacion: 'salida'
            }));

            setItemsSalida(parsedEntradas);
        } catch (error) {
            console.error("Error al cargar salidas:", error);
            toast.error("Hubo un error al cargar el historial de salidas.");
        }
    };

    const updateCantidadTalla = (tallaName: string, value: string) => {
        const parsed = parseInt(value, 10);
        setMatrizPaquetes(prev => ({
            ...prev,
            [tallaName]: isNaN(parsed) ? 0 : parsed
        }));
    };

    const handleAgregarVariante = () => {
        if (!publico || !color) {
            toast.error("Por favor completa público y color para añadir a la lista.");
            return;
        }

        const tallasValidas = Object.entries(matrizPaquetes).filter(([_, cant]) => cant > 0);
        if (tallasValidas.length === 0) {
            toast.error("Ingresa al menos 1 paquete en alguna talla de la malla.");
            return;
        }

        const unidadesPorPaquete = getUnidadesPorPaquete(categoria);
        const nuevasVariantes: VarianteLote[] = [];
        let errorStock = false;

        for (const [tallaName, qty] of tallasValidas) {
            const unidadesTotales = qty * unidadesPorPaquete;
            const clave = `${categoria}-${tipoProducto}-${publico}-${tallaName}-${color}`;
            const stockDisponible = stockMap[clave]?.cantidades[almacenDestino] || 0;

            const yaAgregado = variantes
                .filter(v => v.publico === publico && v.talla === tallaName && v.color === color)
                .reduce((acc, v) => acc + v.cantidad, 0);

            if (unidadesTotales + yaAgregado > stockDisponible) {
                toast.error(`Stock insuficiente en ${almacenDestino} para la talla ${tallaName}. Disponible: ${stockDisponible}, Solicitado: ${unidadesTotales + yaAgregado}`);
                errorStock = true;
                break;
            }

            nuevasVariantes.push({
                id: Date.now().toString() + Math.random().toString(),
                publico,
                talla: tallaName,
                color,
                cantidad: unidadesTotales,
                ...(unidadesPorPaquete > 1 ? { paquetes: qty, unidades_por_paquete: unidadesPorPaquete } : {})
            });
        }

        if (errorStock) return;

        setVariantes([...variantes, ...nuevasVariantes]);
        setMatrizPaquetes({});
    };

    const handleRemoverVariante = (id: string) => {
        setVariantes(variantes.filter(v => v.id !== id));
    };

    const handleEliminarEntrada = async (id: string) => {
        const item = itemsSalida.find(i => i.id === id) || null;
        setModalEliminar({ open: true, item, isDeleting: false });
    };

    const confirmarEliminarEntrada = async () => {
        if (!modalEliminar.item) return;
        setModalEliminar(prev => ({ ...prev, isDeleting: true }));
        try {
            await deleteDoc(doc(db, 'entradas_inventario', modalEliminar.item.id));
            setItemsSalida(prev => prev.filter(i => i.id !== modalEliminar.item!.id));
            toast.success(`Salida ${modalEliminar.item.id} eliminada.`);
            setModalEliminar({ open: false, item: null, isDeleting: false });
            cargarHistorialSalidas(); // Refresh stock map
        } catch (error) {
            console.error('Error al eliminar entrada:', error);
            toast.error('No se pudo eliminar el registro.');
            setModalEliminar(prev => ({ ...prev, isDeleting: false }));
        }
    };

    const totalLote = variantes.reduce((acc, v) => acc + v.cantidad, 0);

    const handleGuardarOperacion = async () => {
        if (!categoria || !tipoProducto || variantes.length === 0 || isSubmitting) {
            toast.error("Selecciona la categoría, el tipo de prenda y añade al menos una variante.");
            return;
        }

        setIsSubmitting(true);
        try {
            const registro = {
                id_usuario: user?.uid || "desconocido",
                nombre_usuario: user?.email ? user.email.split('@')[0] : "Anonimo",
                almacen_destino: almacenDestino, // Technically the origin of extraction
                origen: null, 
                tipo_operacion: 'salida',
                categoria,
                tipo_producto: tipoProducto,
                variantes,
                total_ingresado: totalLote, // Keep same field name for firestore schema consistency
            };
            const idEntrada = await guardarEntradaInventario(registro);
            const nuevoItem: InventoryEntry = {
                id: idEntrada,
                almacen_destino: almacenDestino,
                origen: undefined,
                categoria,
                tipo: tipoProducto,
                variantes,
                total: totalLote,
                fecha: new Date(),
                tipo_operacion: 'salida'
            };
            setItemsSalida([nuevoItem, ...itemsSalida]);
            toast.success(`Salida registrada desde ${almacenDestino}.`);
            
            cargarHistorialSalidas(); // Refresh stock map

            setVariantes([]);
            setTipoProducto('');
            resetFormulario();
        } catch (error) {
            console.error(error);
            toast.error("Error al registrar la salida.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const agruparStockParaResumen = () => {
        const resumen: Record<string, Record<string, number>> = {};
        Object.values(stockMap).forEach((item: any) => {
            if (filtroStock && !`${item.categoria} ${item.tipo} ${item.publico} ${item.talla} ${item.color}`.toLowerCase().includes(filtroStock.toLowerCase())) {
                return;
            }
            const productoStr = `${item.categoria} ${item.tipo}`.toUpperCase();
            const colorStr = item.color;
            let totalUnidades = 0;
            ["Inventario General", "Almacén 1", "Almacén 2"].forEach(a => {
                totalUnidades += (item.cantidades[a] || 0);
            });
            if (totalUnidades > 0) {
                if (!resumen[productoStr]) resumen[productoStr] = {};
                if (!resumen[productoStr][colorStr]) resumen[productoStr][colorStr] = 0;
                resumen[productoStr][colorStr] += totalUnidades;
            }
        });
        return resumen;
    };
    
    const resumenAgrupado = agruparStockParaResumen();

    return (
        <ProtectedRoute allowedAreas={["master", "salida"]}>
            <div className="space-y-8 pb-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 border-b border-white/5 pb-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter text-white drop-shadow-sm flex items-center gap-3">
                            <LogOut className="w-8 h-8 text-orange-500" />
                            SALIDAS DE INVENTARIO
                        </h1>
                        <p className="text-zinc-500 uppercase tracking-[0.2em] text-xs font-bold mt-2">Centro de Retiros</p>
                    </div>
                    {/* Tab Navigation */}
                    <div className="flex bg-white dark:bg-zinc-950 p-1 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('operacion')}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'operacion' ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
                        >
                            <LogOut className="w-4 h-4 mr-2" /> Extraer Prendas
                        </button>
                        <button
                            onClick={() => setActiveTab('stock')}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'stock' ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
                        >
                            <TableIcon className="w-4 h-4 mr-2" /> Stock Actual
                        </button>
                        <button
                            onClick={() => setActiveTab('historial')}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'historial' ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
                        >
                            <History className="w-4 h-4 mr-2" /> Historial General
                        </button>
                    </div>
                </div>

                {activeTab === 'operacion' && (
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Operation Form */}
                    <div className="lg:col-span-1 bg-white/80 dark:bg-gradient-to-br dark:from-zinc-900/90 dark:to-black/90 backdrop-blur-2xl p-6 rounded-[2rem] shadow-xl dark:shadow-2xl border border-zinc-200 dark:border-white/5 h-fit">
                        <h2 className="text-xl font-bold mb-6 flex items-center">
                            <LogOut className="w-5 h-5 mr-2 text-orange-600" /> Registrar Salida de Almacén
                        </h2>

                        <form className="space-y-5">
                            {/* Locations Section */}
                            <div className="space-y-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Almacén de Origen (Extraer de)</label>
                                    <select
                                        value={almacenDestino} onChange={e => setAlmacenDestino(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                                    >
                                        <option value="Inventario General">Inventario General</option>
                                        {ALMACENES.filter(a => a !== 'Inventario General').map(a => <option key={a} value={a}>{a}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Product Section */}
                            <div className="space-y-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Categoría</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={categoria} onChange={e => {
                                                if (e.target.value === '___NUEVO___') {
                                                    abrirModalNuevo('categoria');
                                                } else {
                                                    handleCategoriaChange(e.target.value);
                                                }
                                            }}
                                            className="flex-1 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-orange-500"
                                            required
                                        >
                                            <option value="" disabled>Seleccione...</option>
                                            {categoriasDisponibles.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                            <option value="___NUEVO___" className="text-orange-600 font-bold">+ Añadir Nueva...</option>
                                        </select>
                                        {categoria && (
                                            <div className="flex gap-1">
                                                <button type="button" onClick={() => abrirModalEditar('categoria', categoria)} className="p-2 text-zinc-400 hover:text-blue-600 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg transition-colors border-dashed" title="Renombrar Categoría"><Pencil className="w-5 h-5" /></button>
                                                <button type="button" onClick={() => abrirModalEliminar('categoria', categoria)} className="p-2 text-zinc-400 hover:text-red-600 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg transition-colors border-dashed" title="Eliminar Categoría"><Trash2 className="w-5 h-5" /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tipo de Prenda</label>
                                    <div className="flex gap-2">
                                        <select
                                            disabled={!categoria}
                                            value={tipoProducto} onChange={e => {
                                                if (e.target.value === '___NUEVO___') {
                                                    abrirModalNuevo('tipo_prenda');
                                                } else {
                                                    setTipoProducto(e.target.value);
                                                }
                                            }}
                                            className="flex-1 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                                            required
                                        >
                                            <option value="" disabled>Seleccione...</option>
                                            {tiposDisponibles.map(tipo => (
                                                <option key={tipo} value={tipo}>{tipo}</option>
                                            ))}
                                            <option value="___NUEVO___" className="text-orange-600 font-bold">+ Añadir Nuevo...</option>
                                        </select>
                                        {tipoProducto && (
                                            <div className="flex gap-1">
                                                <button type="button" onClick={() => abrirModalEditar('tipo_prenda', tipoProducto, categoria)} className="p-2 text-zinc-400 hover:text-blue-600 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg transition-colors border-dashed" title="Renombrar Tipo"><Pencil className="w-5 h-5" /></button>
                                                <button type="button" onClick={() => abrirModalEliminar('tipo_prenda', tipoProducto, categoria)} className="p-2 text-zinc-400 hover:text-red-600 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg transition-colors border-dashed" title="Eliminar Tipo"><Trash2 className="w-5 h-5" /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">3. Público Objetivo</label>
                                    <div className="flex gap-2">
                                        {publicosDisponibles.map(pub => (
                                            <button
                                                key={pub} type="button"
                                                onClick={() => handlePublicoChange(pub)}
                                                className={`flex-1 py-3 px-2 rounded-xl border font-black uppercase tracking-widest text-[10px] transition-all ${
                                                    publico === pub 
                                                    ? 'bg-orange-600/20 border-orange-500 text-orange-600 dark:text-orange-400'
                                                    : 'bg-zinc-50 border-zinc-200 text-zinc-500 dark:bg-zinc-900/50 dark:border-zinc-800 dark:text-zinc-400'
                                                }`}
                                            >
                                                {pub}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Color</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={color} onChange={e => {
                                                if (e.target.value === '___NUEVO___') {
                                                    abrirModalNuevo('color');
                                                } else {
                                                    setColor(e.target.value);
                                                }
                                            }}
                                            className="flex-1 px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-orange-500"
                                        >
                                            <option value="" disabled>Seleccione...</option>
                                            {coloresDisponibles?.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                            <option value="___NUEVO___" className="text-orange-600 font-bold">+ Añadir Nuevo...</option>
                                        </select>
                                        {color && (
                                            <div className="flex gap-1">
                                                <button type="button" onClick={() => abrirModalEditar('color', color)} className="p-2 text-zinc-400 hover:text-blue-600 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg transition-colors border-dashed" title="Renombrar Color"><Pencil className="w-5 h-5" /></button>
                                                <button type="button" onClick={() => abrirModalEliminar('color', color)} className="p-2 text-zinc-400 hover:text-red-600 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg transition-colors border-dashed" title="Eliminar Color"><Trash2 className="w-5 h-5" /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <AnimatePresence mode="wait">
                                    {publico && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                            {(() => {
                                                const upq = getUnidadesPorPaquete(categoria);
                                                const totalPaquetesEnMatriz = Object.values(matrizPaquetes).reduce((a, b) => a + (b > 0 ? b : 0), 0);
                                                return (
                                                    <div className="bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-4">
                                                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                                                            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-500">
                                                                <LayoutGrid className="w-4 h-4" /> 
                                                                <span className="text-[10px] font-bold uppercase tracking-widest">Malla Numérica</span>
                                                            </div>
                                                            {upq > 1 && (
                                                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">
                                                                    VALORES EN PAQUETES (1PQ = {upq} U.)
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-4 gap-3">
                                                            {tallasDisponibles.map(tallaName => (
                                                                <div key={tallaName} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 transition-all">
                                                                    <div className="bg-zinc-100 dark:bg-zinc-950 text-center py-1.5 border-b border-zinc-200 dark:border-zinc-800">
                                                                        <span className="text-[10px] uppercase font-black text-zinc-600 dark:text-zinc-400">{tallaName}</span>
                                                                    </div>
                                                                    <input 
                                                                        type="text" 
                                                                        inputMode="numeric" 
                                                                        placeholder="-" 
                                                                        value={matrizPaquetes[tallaName] || ''} 
                                                                        onChange={(e) => updateCantidadTalla(tallaName, e.target.value)} 
                                                                        className="w-full bg-transparent text-center text-lg font-black text-zinc-700 dark:text-white p-2 outline-none placeholder-zinc-300 dark:placeholder-zinc-700" 
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col items-center">
                                                            <span className="text-xs uppercase font-bold tracking-widest text-zinc-500 dark:text-zinc-500">Volumen a Extraer</span>
                                                            <span className={`text-2xl font-black ${totalPaquetesEnMatriz > 0 ? 'text-orange-600 dark:text-orange-500' : 'text-zinc-300 dark:text-zinc-700'}`}>
                                                                {totalPaquetesEnMatriz * upq} <span className="text-xs">Uds.</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <button type="button" onClick={handleAgregarVariante} className="w-full py-4 mt-6 flex items-center justify-center font-black rounded-xl transition-all shadow-md text-white bg-orange-600 hover:bg-orange-700 hover:shadow-lg active:scale-[0.98]">
                                <LogOut className="w-6 h-6 mr-2" /> Añadir Variante a Extraer
                            </button>

                            {variantes.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                    <h3 className="text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-2">Prendas a Extraer ({totalLote} unids.)</h3>
                                    <ul className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-2">
                                        {variantes.map((v: any) => (
                                            <li key={v.id} className="flex justify-between items-center text-xs bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-md border border-zinc-100 dark:border-zinc-800">
                                                <span className="flex items-center gap-2 flex-wrap">
                                                    {v.publico} • {v.talla} • {v.color}
                                                    {v.paquetes && v.unidades_por_paquete ? (
                                                        <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded font-bold">
                                                            {v.paquetes} paq.
                                                        </span>
                                                    ) : null}
                                                </span>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-orange-600 dark:text-orange-500">-{v.cantidad} u.</span>
                                                    <button type="button" onClick={() => handleRemoverVariante(v.id)} className="text-red-500 hover:text-red-700 font-bold">X</button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <button type="button" onClick={handleGuardarOperacion} disabled={isSubmitting || variantes.length === 0} className="w-full py-4 mt-2 text-white dark:text-zinc-900 font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 flex justify-center items-center bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200">
                                {isSubmitting ? (
                                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Extrayendo...</>
                                ) : (
                                    "Confirmar Extracción"
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Operation List Table */}
                    <div className="lg:col-span-2 bg-white/80 dark:bg-gradient-to-br dark:from-zinc-900/90 dark:to-black/90 backdrop-blur-2xl p-6 rounded-[2rem] shadow-xl dark:shadow-2xl border border-zinc-200 dark:border-white/5 overflow-hidden flex flex-col h-full">
                        <h2 className="text-xl font-bold mb-4">Historial de Salidas de Almacén</h2>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
                                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-900">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">Origen</th>
                                        <th className="px-4 py-3">Prenda</th>
                                        <th className="px-4 py-3">Detalles</th>
                                        <th className="px-4 py-3 text-right">Cant. Extraída</th>
                                        <th className="px-4 py-3 text-right">Fecha / Hora</th>
                                        <th className="px-4 py-3 text-center rounded-tr-lg">Acc.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemsSalida.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-12 text-center text-zinc-500 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl mt-4">
                                                No hay salidas registradas.
                                            </td>
                                        </tr>
                                    ) : (
                                        itemsSalida.flatMap((item) =>
                                            item.variantes.map((v, vIdx) => (
                                                <tr key={`${item.id}-${vIdx}`} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                                                    {vIdx === 0 ? (
                                                        <td rowSpan={item.variantes.length} className="px-4 py-4 font-bold text-zinc-900 dark:text-white border-r border-zinc-100 dark:border-zinc-800/50 align-top pt-5">
                                                            {item.almacen_destino}
                                                        </td>
                                                    ) : null}
                                                    {vIdx === 0 ? (
                                                        <td rowSpan={item.variantes.length} className="px-4 py-4 font-medium text-zinc-900 dark:text-white capitalize border-r border-zinc-100 dark:border-zinc-800/50 align-top pt-5">
                                                            {item.categoria} {item.tipo}
                                                        </td>
                                                    ) : null}
                                                    <td className="px-4 py-3 capitalize text-xs">
                                                        <div className="flex flex-col gap-1 items-start">
                                                            <span>{v.publico} • <span className="font-bold border px-1 rounded mx-1 bg-zinc-100 dark:bg-zinc-800 uppercase">{v.talla}</span> • {v.color}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex flex-col items-end gap-0.5">
                                                            <span className="font-bold text-red-600 dark:text-red-400">
                                                                -{v.cantidad} u.
                                                            </span>
                                                            {(v as any).paquetes && (v as any).unidades_por_paquete ? (
                                                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                                                    {(v as any).paquetes} paq. × {(v as any).unidades_por_paquete}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                    {vIdx === 0 ? (
                                                        <td rowSpan={item.variantes.length} className="px-4 py-4 text-right text-xs border-l border-zinc-100 dark:border-zinc-800/50 align-top pt-5 text-zinc-500">
                                                            <div>{item.fecha.toLocaleDateString()}</div>
                                                            <div>{item.fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                        </td>
                                                    ) : null}
                                                    {vIdx === 0 ? (
                                                        <td rowSpan={item.variantes.length} className="px-4 py-4 text-center border-l border-zinc-100 dark:border-zinc-800/50 align-top pt-3">
                                                            <button
                                                                onClick={() => handleEliminarEntrada(item.id)}
                                                                title="Eliminar registro"
                                                                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors mt-2"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    ) : null}
                                                </tr>
                                            ))
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                )}

                {activeTab === 'stock' && (
                    <div className="bg-white/80 dark:bg-gradient-to-br dark:from-zinc-900/90 dark:to-black/90 backdrop-blur-2xl p-6 rounded-[2rem] shadow-xl dark:shadow-2xl border border-zinc-200 dark:border-white/5">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center">
                                    <TableIcon className="w-5 h-5 mr-2 text-orange-600" /> Stock Disponible
                                </h2>
                                <p className="text-sm text-zinc-500 mt-1">Consulta la cantidad de prendas disponibles antes de extraer.</p>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar prenda o talla..."
                                    className="flex-1 pl-9 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm outline-none bg-zinc-50 dark:bg-zinc-900 focus:ring-2 focus:ring-orange-500"
                                    value={filtroStock}
                                    onChange={e => setFiltroStock(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Resumen Visual por Color */}
                        <div className="mb-10 p-6 sm:p-8 rounded-[2rem] bg-gradient-to-br from-orange-500/5 via-transparent to-orange-600/10 border border-orange-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-orange-500/10 blur-3xl rounded-full pointer-events-none"></div>

                            <div className="flex items-center gap-4 mb-8 relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/5 flex items-center justify-center border border-orange-500/20 shadow-inner">
                                    <LayoutGrid className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white">Resumen por Color</h3>
                                    <p className="text-xs font-bold text-orange-600/80 uppercase tracking-[0.2em]">Agrupación Global de Stock</p>
                                </div>
                            </div>
                            
                            <div className="space-y-6 relative z-10">
                                {Object.entries(resumenAgrupado).map(([producto, colores]) => (
                                    <div key={producto} className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl rounded-2xl p-5 border border-white/50 dark:border-zinc-800/50 shadow-sm transition-all hover:shadow-md">
                                        <h4 className="text-xs font-black tracking-[0.15em] text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-sm bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></span>
                                            {producto}
                                        </h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                            {Object.entries(colores).sort((a,b) => b[1] - a[1]).map(([color, total]) => (
                                                <div key={color} className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 overflow-hidden transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-orange-500/40 hover:-translate-y-1 cursor-default">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                                    
                                                    <div className="relative z-10 flex flex-col justify-between h-full gap-3">
                                                        <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest truncate line-clamp-1" title={color}>
                                                            {color}
                                                        </span>
                                                        <div className="flex items-baseline gap-1.5">
                                                            <span className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                                                {total}
                                                            </span>
                                                            <span className="text-[9px] font-bold text-zinc-400 uppercase">
                                                                uds
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {Object.keys(resumenAgrupado).length === 0 && (
                                    <div className="text-center py-10 text-zinc-500 text-sm font-medium border-2 border-dashed border-orange-500/20 rounded-2xl">
                                        No hay stock disponible para mostrar en el resumen visual.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="overflow-x-auto pb-4">
                            <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
                                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                                    <tr>
                                        <th className="px-4 py-4 rounded-tl-lg">Producto</th>
                                        <th className="px-4 py-4">Variante (P/T/C)</th>
                                        <th className="px-4 py-4 text-center border-l border-zinc-200 dark:border-zinc-800">Inventario General</th>
                                        <th className="px-4 py-4 text-center border-l border-zinc-200 dark:border-zinc-800">Almacén 1</th>
                                        <th className="px-4 py-4 text-center border-l border-zinc-200 dark:border-zinc-800 rounded-tr-lg">Almacén 2</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.values(stockMap).filter((s: any) => 
                                        `${s.categoria} ${s.tipo} ${s.publico} ${s.talla} ${s.color}`.toLowerCase().includes(filtroStock.toLowerCase())
                                    ).map((item: any, idx: number) => (
                                        <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white capitalize">
                                                {item.categoria} {item.tipo}
                                            </td>
                                            <td className="px-4 py-3 capitalize text-xs">
                                                {item.publico} • <span className="font-bold border px-1 rounded mx-1 bg-zinc-100 dark:bg-zinc-800 uppercase">{item.talla}</span> • {item.color}
                                            </td>
                                            {["Inventario General", "Almacén 1", "Almacén 2"].map(a => (
                                                <td key={a} className="px-4 py-3 text-center border-l border-zinc-100 dark:border-zinc-800/50">
                                                    <span className={`font-bold text-[15px] ${item.cantidades[a] > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-300 dark:text-zinc-600'}`}>
                                                        {item.cantidades[a] || 0}
                                                    </span>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    {Object.keys(stockMap).length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-12 text-center text-zinc-500 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl mt-4">
                                                No hay prendas registradas en stock.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'historial' && (
                    <div className="bg-white/80 dark:bg-gradient-to-br dark:from-zinc-900/90 dark:to-black/90 backdrop-blur-2xl p-6 rounded-[2rem] shadow-xl dark:shadow-2xl border border-zinc-200 dark:border-white/5 overflow-hidden flex flex-col">
                        <h2 className="text-xl font-bold mb-6 flex items-center">
                            <History className="w-5 h-5 mr-2 text-orange-600" /> Historial Completo (Ingresos y Salidas)
                        </h2>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
                                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-900">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">Tipo</th>
                                        <th className="px-4 py-3">Almacén</th>
                                        <th className="px-4 py-3">Prenda</th>
                                        <th className="px-4 py-3">Detalles</th>
                                        <th className="px-4 py-3 text-right">Cant.</th>
                                        <th className="px-4 py-3 text-right rounded-tr-lg">Fecha / Hora</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemsHistorialGeneral.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-12 text-center text-zinc-500 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl mt-4">
                                                No hay registros.
                                            </td>
                                        </tr>
                                    ) : (
                                        itemsHistorialGeneral.flatMap((item) =>
                                            item.variantes.map((v, vIdx) => (
                                                <tr key={`${item.id}-${vIdx}`} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                                                    {vIdx === 0 ? (
                                                        <td rowSpan={item.variantes.length} className="px-4 py-4 font-bold align-top pt-5">
                                                            <span className={`px-2 py-1 rounded text-xs uppercase tracking-wider ${item.tipo_operacion === 'salida' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                                                                {item.tipo_operacion}
                                                            </span>
                                                        </td>
                                                    ) : null}
                                                    {vIdx === 0 ? (
                                                        <td rowSpan={item.variantes.length} className="px-4 py-4 font-bold text-zinc-900 dark:text-white border-r border-zinc-100 dark:border-zinc-800/50 align-top pt-5">
                                                            {item.almacen_destino}
                                                        </td>
                                                    ) : null}
                                                    {vIdx === 0 ? (
                                                        <td rowSpan={item.variantes.length} className="px-4 py-4 font-medium text-zinc-900 dark:text-white capitalize border-r border-zinc-100 dark:border-zinc-800/50 align-top pt-5">
                                                            {item.categoria} {item.tipo}
                                                        </td>
                                                    ) : null}
                                                    <td className="px-4 py-3 capitalize text-xs">
                                                        <div className="flex flex-col gap-1 items-start">
                                                            <span>{v.publico} • <span className="font-bold border px-1 rounded mx-1 bg-zinc-100 dark:bg-zinc-800 uppercase">{v.talla}</span> • {v.color}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className={`font-bold ${item.tipo_operacion === 'salida' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                            {item.tipo_operacion === 'salida' ? '-' : '+'}{v.cantidad} u.
                                                        </span>
                                                    </td>
                                                    {vIdx === 0 ? (
                                                        <td rowSpan={item.variantes.length} className="px-4 py-4 text-right text-xs border-l border-zinc-100 dark:border-zinc-800/50 align-top pt-5 text-zinc-500">
                                                            <div>{item.fecha.toLocaleDateString()}</div>
                                                            <div>{item.fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                        </td>
                                                    ) : null}
                                                </tr>
                                            ))
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <ModalAñadirOpcion
                {...modalConfig}
                onClose={cerrarModal}
                onConfirm={confirmarModal}
                isSubmitting={isSubmittingModal}
            />

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {modalEliminar.open && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl w-full max-w-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-8 h-8 text-red-600 dark:text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Eliminar Registro</h3>
                                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
                                    ¿Estás seguro que deseas eliminar la salida del almacén <b>{modalEliminar.item?.almacen_destino}</b>? Se revertirá en el stock unificado.
                                </p>
                                <div className="flex gap-3">
                                    <button onClick={() => setModalEliminar({ open: false, item: null, isDeleting: false })} disabled={modalEliminar.isDeleting} className="flex-1 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 font-medium text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50">
                                        Cancelar
                                    </button>
                                    <button onClick={confirmarEliminarEntrada} disabled={modalEliminar.isDeleting} className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center">
                                        {modalEliminar.isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </ProtectedRoute>
    );
}
