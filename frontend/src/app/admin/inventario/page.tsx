"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Plus, PackageSearch, TrendingUp, Loader2, Building2, Table as TableIcon, Download, ScrollText, Pencil, Trash2, Truck, LogOut, AlertTriangle, LayoutGrid } from "lucide-react";
import { useFormulariosProducto } from "@/hooks/useFormulariosProducto";
import { useAuth } from "@/context/AuthContext";
import { guardarEntradaInventario, guardarIngresoRollo, guardarNuevoTipoTela } from "@/lib/firestoreUtils";
import { collection, getDocs, orderBy, query, deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ModalAñadirOpcion from "@/components/admin/ModalAñadirOpcion";
import * as XLSX from 'xlsx';
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

type RolloTela = {
    id?: string;
    tipo_tela: string;
    color: string;
    cantidad_rollos: number;
    cantidad_original?: number;
    disponible: boolean;
    fecha_ingreso: Date;
};

type StockItem = {
    clave: string; // e.g., "Mochilas-Escolar-Niños-S-Rojo"
    categoria: string;
    tipo: string;
    publico: string;
    talla: string;
    color: string;
    cantidades: Record<string, number>; // { "Almacén 1": 10 }
    cantidadesHistoricas: Record<string, number>; // { "Almacén 1": 15 }
    totalGeneral: number;
    totalHistorico: number;
};

const ALMACENES = ["Inventario General", "Almacén 1", "Almacén 2"];
const UBICACIONES = [...ALMACENES];

// Unidades por paquete según categoría (case-insensitive)
const UNIDADES_POR_PAQUETE: Record<string, number> = {
    poleras: 5,
    buzos: 10,
};

// Búsqueda insensible a mayúsculas/minúsculas
const getUnidadesPorPaquete = (cat: string): number =>
    UNIDADES_POR_PAQUETE[cat.toLowerCase().trim()] ?? 1;

export default function PaginaInventario() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'ingreso' | 'stock' | 'rollos' | 'stock_telas'>('ingreso');
    const [almacenDestino, setAlmacenDestino] = useState(ALMACENES[0]);

    const [itemsIngreso, setItemsIngreso] = useState<InventoryEntry[]>([]);
    const [itemsRollos, setItemsRollos] = useState<RolloTela[]>([]);
    const [variantes, setVariantes] = useState<VarianteLote[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cantidadFaltante, setCantidadFaltante] = useState(0);
    const [numeroPaquetes, setNumeroPaquetes] = useState<number>(1);
    const [matrizPaquetes, setMatrizPaquetes] = useState<Record<string, number>>({});

    // Modal de confirmación de eliminación
    const [modalEliminar, setModalEliminar] = useState<{ open: boolean; item: InventoryEntry | null; isDeleting: boolean }>({
        open: false,
        item: null,
        isDeleting: false
    });

    // Rollos Data State
    const [rolloTipoTela, setRolloTipoTela] = useState('');
    const [rolloCantidad, setRolloCantidad] = useState<number>(1);
    const [modalNuevoTipoTela, setModalNuevoTipoTela] = useState(false);
    const [nuevoTipoTela, setNuevoTipoTela] = useState('');

    // Modal eliminar rollo
    const [modalEliminarRollo, setModalEliminarRollo] = useState<{ open: boolean; item: RolloTela | null; isDeleting: boolean }>({
        open: false,
        item: null,
        isDeleting: false
    });

    // Stock Data
    const [stockMap, setStockMap] = useState<Record<string, StockItem>>({});
    const [isLoadingStock, setIsLoadingStock] = useState(false);
    const [filtroStock, setFiltroStock] = useState("");

    // Hook de Formularios Reutilizable
    const {
        categoria, tipoProducto, publico, talla, cantidad, color,
        setCantidad, setTipoProducto, setTalla, setColor, setTiposTelaDisponibles,
        tiposDisponibles, tallasDisponibles, categoriasDisponibles, publicosDisponibles, coloresDisponibles, tiposTelaDisponibles,
        handleCategoriaChange, handlePublicoChange, resetFormulario,
        modalConfig, isSubmittingModal, abrirModalNuevo, abrirModalEditar, abrirModalEliminar, cerrarModal, confirmarModal
    } = useFormulariosProducto();

    useEffect(() => {
        cargarDatosStock();
    }, []);

    useEffect(() => {
        setVariantes([]);
        setNumeroPaquetes(1);
        setMatrizPaquetes({});
        resetFormulario();
    }, [activeTab]);

    const cargarDatosStock = async () => {
        setIsLoadingStock(true);
        try {
            const invQ = query(collection(db, 'entradas_inventario'), orderBy('fecha_registro', 'desc'));
            const invSnap = await getDocs(invQ);
            const rawEntradas: any[] = [];
            invSnap.forEach(d => rawEntradas.push({ id: d.id, ...d.data() }));

            // Populate History arrays for UI tables
            const parsedEntradas: InventoryEntry[] = rawEntradas.map(e => ({
                id: e.id,
                almacen_destino: e.almacen_destino || 'Almacén 1',
                origen: e.origen,
                categoria: e.categoria,
                tipo: e.tipo_producto || e.tipo,
                variantes: e.variantes || [],
                total: e.total_ingresado || 0,
                fecha: e.fecha_registro?.toDate ? e.fecha_registro.toDate() : new Date(),
                tipo_operacion: 'ingreso'
            }));

            setItemsIngreso(parsedEntradas);

            // Fetch Rollos
            const rollosQ = query(collection(db, 'inventario_rollos'), orderBy('fecha_registro', 'desc'));
            const rollosSnap = await getDocs(rollosQ);
            const rawRollos: any[] = [];
            rollosSnap.forEach(d => rawRollos.push({ id: d.id, ...d.data() }));

            const parsedRollos: RolloTela[] = rawRollos.map(r => ({
                id: r.id,
                tipo_tela: r.tipo_tela,
                color: r.color,
                cantidad_rollos: r.cantidad_rollos || 0,
                cantidad_original: r.cantidad_original,
                disponible: r.disponible !== false,
                fecha_ingreso: r.fecha_registro?.toDate ? r.fecha_registro.toDate() : new Date(),
            }));

            setItemsRollos(parsedRollos);

            // Build Stock Map
            const sMap: Record<string, StockItem> = {};

            const agregarAStock = (item: any, ubicacion: string, cant: number, isIngreso: boolean) => {
                const arrVariantes = item.variantes || [];
                arrVariantes.forEach((v: VarianteLote) => {
                    const clave = `${item.categoria}-${item.tipo_producto || item.tipo}-${v.publico}-${v.talla}-${v.color}`;
                    if (!sMap[clave]) {
                        sMap[clave] = {
                            clave,
                            categoria: item.categoria,
                            tipo: item.tipo_producto || item.tipo,
                            publico: v.publico,
                            talla: v.talla,
                            color: v.color,
                            cantidades: {},
                            cantidadesHistoricas: {},
                            totalGeneral: 0,
                            totalHistorico: 0
                        };
                        UBICACIONES.forEach(u => {
                            sMap[clave].cantidades[u] = 0;
                            sMap[clave].cantidadesHistoricas[u] = 0;
                        });
                    }

                    const cantReal = v.cantidad * cant;
                    sMap[clave].cantidades[ubicacion] = (sMap[clave].cantidades[ubicacion] || 0) + cantReal;
                    sMap[clave].totalGeneral += cantReal;

                    // If it's an ingress (ingreso or recepcion), we accumulate to the historical stock as well
                    if (isIngreso) {
                        const cantHistoricaReal = v.cantidad; // Always positive for historical
                        sMap[clave].cantidadesHistoricas[ubicacion] = (sMap[clave].cantidadesHistoricas[ubicacion] || 0) + cantHistoricaReal;
                        sMap[clave].totalHistorico += cantHistoricaReal;
                    }
                });
            };

            // Procesar Entradas (+ al almacén destino, o - si es salida)
            rawEntradas.forEach(entrada => {
                const destino = entrada.almacen_destino || 'Almacén 1';
                const multiplier = entrada.tipo_operacion === 'salida' ? -1 : 1;
                const isIngreso = entrada.tipo_operacion !== 'salida';
                agregarAStock(entrada, destino, multiplier, isIngreso);
            });

            setStockMap(sMap);

        } catch (error) {
            console.error("Error al cargar stock:", error);
            toast.error("Hubo un error al calcular el stock total.");
        } finally {
            setIsLoadingStock(false);
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
        // Ingreso / Salida: por paquetes
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

        const nuevasVariantes: VarianteLote[] = tallasValidas.map(([tallaName, qty]) => {
            const unidadesTotales = qty * unidadesPorPaquete;
            return {
                id: Date.now().toString() + Math.random().toString(),
                publico,
                talla: tallaName,
                color,
                cantidad: unidadesTotales,
                ...(unidadesPorPaquete > 1 ? { paquetes: qty, unidades_por_paquete: unidadesPorPaquete } : {})
            };
        });

        setVariantes([...variantes, ...nuevasVariantes]);
        setMatrizPaquetes({});
    };

    const handleRemoverVariante = (id: string) => {
        setVariantes(variantes.filter(v => v.id !== id));
    };

    const handleEliminarEntrada = async (id: string) => {
        const item = itemsIngreso.find(i => i.id === id) || null;
        setModalEliminar({ open: true, item, isDeleting: false });
    };

    const confirmarEliminarEntrada = async () => {
        if (!modalEliminar.item) return;
        setModalEliminar(prev => ({ ...prev, isDeleting: true }));
        try {
            await deleteDoc(doc(db, 'entradas_inventario', modalEliminar.item.id));
            setItemsIngreso(prev => prev.filter(i => i.id !== modalEliminar.item!.id));
            toast.success(`Registro ${modalEliminar.item.id} eliminado correctamente.`);
            cargarDatosStock();
            setModalEliminar({ open: false, item: null, isDeleting: false });
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
                almacen_destino: almacenDestino,
                origen: null,
                tipo_operacion: 'ingreso',
                categoria,
                tipo_producto: tipoProducto,
                variantes,
                total_ingresado: totalLote,
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
                tipo_operacion: 'ingreso'
            };
            setItemsIngreso([nuevoItem, ...itemsIngreso]);
            toast.success(`Registro #${idEntrada} guardado en ${almacenDestino}.`);

            // Limpiar
            setVariantes([]);
            setTipoProducto('');
            setNumeroPaquetes(1);
            resetFormulario();
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar la operación. Revisa tu conexión o permisos.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGuardarRollo = async () => {
        if (!rolloTipoTela.trim() || !color || rolloCantidad <= 0 || isSubmitting) {
            toast.error("Por favor completa el tipo de tela, color y cantidad de rollos.");
            return;
        }

        setIsSubmitting(true);
        try {
            const registro = {
                tipo_tela: rolloTipoTela.trim(),
                color: color,
                cantidad_rollos: rolloCantidad,
                id_usuario: user?.uid || "desconocido"
            };
            const idRollo = await guardarIngresoRollo(registro);
            const nuevoRollo: RolloTela = {
                id: idRollo,
                tipo_tela: registro.tipo_tela,
                color: registro.color,
                cantidad_rollos: registro.cantidad_rollos,
                cantidad_original: registro.cantidad_rollos,
                disponible: true,
                fecha_ingreso: new Date()
            };

            setItemsRollos([nuevoRollo, ...itemsRollos]);
            toast.success(`${registro.cantidad_rollos} rollo(s) de ${registro.tipo_tela} - ${registro.color} registrados exitosamente.`);

            setRolloTipoTela('');
            setRolloCantidad(1);
            setColor('');
        } catch (error) {
            console.error("Error al registrar rollo", error);
            toast.error("Error al guardar registro.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAgregarTipoTela = async () => {
        if (!nuevoTipoTela.trim()) {
            toast.error("Escribe un nombre para el tipo de tela.");
            return;
        }
        try {
            await guardarNuevoTipoTela(nuevoTipoTela.trim());
            setTiposTelaDisponibles(prev => [...prev, nuevoTipoTela.trim()]);
            setRolloTipoTela(nuevoTipoTela.trim());
            setNuevoTipoTela('');
            setModalNuevoTipoTela(false);
            toast.success("Tipo de tela agregado correctamente.");
        } catch (error) {
            console.error("Error al agregar tipo de tela", error);
            toast.error("No se pudo agregar el tipo de tela.");
        }
    };

    const handleEliminarRollo = (rollo: RolloTela) => {
        setModalEliminarRollo({ open: true, item: rollo, isDeleting: false });
    };

    const confirmarEliminarRollo = async () => {
        if (!modalEliminarRollo.item?.id) return;
        setModalEliminarRollo(prev => ({ ...prev, isDeleting: true }));
        try {
            await deleteDoc(doc(db, 'inventario_rollos', modalEliminarRollo.item.id!));
            setItemsRollos(prev => prev.filter(r => r.id !== modalEliminarRollo.item!.id));
            toast.success(`Rollo de ${modalEliminarRollo.item.tipo_tela} - ${modalEliminarRollo.item.color} eliminado correctamente.`);
            setModalEliminarRollo({ open: false, item: null, isDeleting: false });
        } catch (error) {
            console.error('Error al eliminar rollo:', error);
            toast.error('No se pudo eliminar el rollo.');
            setModalEliminarRollo(prev => ({ ...prev, isDeleting: false }));
        }
    };

    const handleVaciarStockTelas = async (tipo_tela: string, color: string) => {
        if (!window.confirm(`¿Estás seguro de vaciar todo el stock de ${tipo_tela} color ${color}? \nEsto pondrá a 0 los rollos actuales pero no borrará el historial de ingreso.`)) return;
        
        setIsSubmitting(true);
        try {
            // Find all docs to update in memory
            const rollosMutar = itemsRollos.filter(r => r.tipo_tela === tipo_tela && r.color === color && r.disponible && r.cantidad_rollos > 0);
            
            // Execute batch update in firestore or promise.all
            await Promise.all(rollosMutar.map(r => {
                if (r.id) {
                    return updateDoc(doc(db, 'inventario_rollos', r.id), {
                        cantidad_rollos: 0,
                        disponible: false
                    });
                }
            }));
            
            // Local state update
            setItemsRollos(prev => prev.map(r => {
                if (r.tipo_tela === tipo_tela && r.color === color) {
                    return { ...r, cantidad_rollos: 0, disponible: false };
                }
                return r;
            }));
            
            toast.success(`Stock de ${tipo_tela} - ${color} vaciado correctamente.`);
        } catch (error) {
            console.error("Error vaciando stock:", error);
            toast.error("Hubo un error al intentar vaciar el stock.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const exportarExcel = () => {
        if (Object.keys(stockMap).length === 0) {
            toast.error("No hay datos de stock para exportar");
            return;
        }

        const dataAlmacenes = Object.values(stockMap).map(item => {
            const row: any = {
                "Categoría": item.categoria,
                "Tipo de Prenda": item.tipo,
                "Público": item.publico,
                "Talla": item.talla,
                "Color": item.color,
            };
            let totalAlmacen = 0;
            ALMACENES.forEach(a => {
                row[a] = item.cantidades[a] || 0;
                totalAlmacen += row[a];
            });
            row["Total en Almacenes"] = totalAlmacen;
            return row;
        }).filter(row => row["Total en Almacenes"] > 0 || Object.keys(row).length > 6); // Filter if completely empty

        const wsAlmacenes = XLSX.utils.json_to_sheet(dataAlmacenes);
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, wsAlmacenes, "Stock Almacenes");

        // Generar archivo y descargarlo
        XLSX.writeFile(workbook, `Stock_Inventario_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success("Excel exportado exitosamente.");
    };

    const stockItemsFiltered = Object.values(stockMap).filter(s =>
        `${s.categoria} ${s.tipo} ${s.publico} ${s.talla} ${s.color}`.toLowerCase().includes(filtroStock.toLowerCase())
    );

    const itemsAMostrar = itemsIngreso.filter(i => i.tipo_operacion === 'ingreso');
    const totalIngresosHistorico = itemsIngreso.reduce((acc, current) => acc + current.total, 0);

    return (
        <ProtectedRoute allowedAreas={["master", "inventory"]}>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Gestión de Inventario</h1>
                    {/* Tab Navigation */}
                    <div className="flex bg-white dark:bg-zinc-950 p-1 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('ingreso')}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'ingreso' ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
                        >
                            <Building2 className="w-4 h-4 mr-2" /> Ingreso a Almacén
                        </button>
                        <button
                            onClick={() => setActiveTab('rollos')}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'rollos' ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
                        >
                            <ScrollText className="w-4 h-4 mr-2" /> Rollos de Tela
                        </button>
                        <button
                            onClick={() => setActiveTab('stock')}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'stock' ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
                        >
                            <TableIcon className="w-4 h-4 mr-2" /> Stock de Prendas
                        </button>
                        <button
                            onClick={() => setActiveTab('stock_telas')}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'stock_telas' ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
                        >
                            <PackageSearch className="w-4 h-4 mr-2" /> Stock de Telas
                        </button>
                    </div>
                </div>



                {activeTab === 'stock' ? (
                    <div className="bg-white/80 dark:bg-gradient-to-br dark:from-zinc-900/90 dark:to-black/90 backdrop-blur-2xl p-6 rounded-[2rem] shadow-xl dark:shadow-2xl border border-zinc-200 dark:border-white/5">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Stock Total Unificado</h2>
                                <p className="text-sm text-zinc-500">Vista calculada en tiempo real de almacenes y tiendas.</p>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <input
                                    type="text"
                                    placeholder="Buscar prenda o talla..."
                                    className="flex-1 px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm outline-none bg-zinc-50 dark:bg-zinc-900 focus:ring-2 focus:ring-zinc-500"
                                    value={filtroStock}
                                    onChange={e => setFiltroStock(e.target.value)}
                                />
                                <button
                                    onClick={exportarExcel}
                                    disabled={isLoadingStock}
                                    className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                >
                                    <Download className="w-4 h-4 mr-2" /> Exportar a Excel
                                </button>
                            </div>
                        </div>

                        {isLoadingStock ? (
                            <div className="flex flex-col items-center justify-center p-12 text-zinc-500">
                                <Loader2 className="w-8 h-8 animate-spin text-zinc-400 mb-2" />
                                <p>Calculando matrices de stock...</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Tabla Almacenes */}
                                <div className="overflow-x-auto pb-4">
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Stock en Almacenes</h3>
                                    <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
                                        <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                                            <tr>
                                                <th className="px-4 py-4 rounded-tl-lg">Producto</th>
                                                <th className="px-4 py-4">Variante (P/T/C)</th>
                                                {ALMACENES.map(a => (
                                                    <th key={a} className="px-4 py-4 text-center border-l border-zinc-200 dark:border-zinc-800">
                                                        {a}
                                                        <div className="text-[10px] text-zinc-400 font-normal mt-1">Actual / Histórico</div>
                                                    </th>
                                                ))}
                                                <th className="px-4 py-4 text-center border-l border-zinc-300 dark:border-zinc-700 font-bold bg-zinc-100 dark:bg-zinc-800 rounded-tr-lg">
                                                    Total Almacenes
                                                    <div className="text-[10px] text-zinc-500 font-normal mt-1">Actual / Histórico</div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stockItemsFiltered.map((item, idx) => {
                                                let totalAlmacen = 0;
                                                let totalHistoricoAlmacen = 0;
                                                ALMACENES.forEach(a => {
                                                    totalAlmacen += (item.cantidades[a] || 0);
                                                    totalHistoricoAlmacen += (item.cantidadesHistoricas[a] || 0);
                                                });
                                                return (
                                                    <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                                                        <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white capitalize">
                                                            {item.categoria} {item.tipo}
                                                        </td>
                                                        <td className="px-4 py-3 capitalize text-xs">
                                                            {item.publico} • <span className="font-bold border px-1 rounded mx-1 bg-zinc-100 dark:bg-zinc-800 uppercase">{item.talla}</span> • {item.color}
                                                        </td>
                                                        {ALMACENES.map(a => (
                                                            <td key={a} className="px-4 py-3 text-center border-l border-zinc-100 dark:border-zinc-800/50">
                                                                <div className="flex flex-col items-center justify-center">
                                                                    <span className={`font-bold text-[15px] ${item.cantidades[a] > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-300 dark:text-zinc-600'}`}>
                                                                        {item.cantidades[a] || 0}
                                                                    </span>
                                                                    <span className="text-[10px] font-medium text-zinc-400" title="Stock Original Histórico">
                                                                        Orig: {item.cantidadesHistoricas[a] || 0}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        ))}
                                                        <td className="px-4 py-3 text-center border-l border-zinc-300 dark:border-zinc-700 font-bold bg-zinc-50/50 dark:bg-zinc-900/50">
                                                            <div className="flex flex-col items-center justify-center">
                                                                <span className="text-xl text-zinc-900 dark:text-white">{totalAlmacen}</span>
                                                                <span className="text-[10px] text-zinc-500 font-bold tracking-wide mt-0.5">
                                                                    Orig: {totalHistoricoAlmacen}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                            {stockItemsFiltered.length === 0 && (
                                                <tr>
                                                    <td colSpan={ALMACENES.length + 3} className="px-4 py-12 text-center text-zinc-500 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl mt-4">
                                                        No se encontraron resultados en el stock de almacenes.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                ) : activeTab === 'stock_telas' ? (
                    <div className="bg-white/80 dark:bg-gradient-to-br dark:from-zinc-900/90 dark:to-black/90 backdrop-blur-2xl p-6 rounded-[2rem] shadow-xl dark:shadow-2xl border border-zinc-200 dark:border-white/5">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Stock Actual Consolidado de Telas</h2>
                                <p className="text-sm text-zinc-500">Vista calculada en tiempo real de los rollos disponibles en bodega.</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
                                <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-900">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg border-b border-zinc-200 dark:border-zinc-800">Tipo de Tela</th>
                                        <th className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">Color</th>
                                        <th className="px-4 py-3 text-center border-l rounded-tr-lg border-b border-zinc-200 dark:border-zinc-800">Total de Rollos Visibles</th>
                                        <th className="px-4 py-3 text-center border-l rounded-tr-lg border-b border-zinc-200 dark:border-zinc-800 w-24">Acc.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        const agrupacion = itemsRollos.reduce((acc, rollo) => {
                                            if (!rollo.disponible) return acc;
                                            const key = `${rollo.tipo_tela}-${rollo.color}`;
                                            if (!acc[key]) acc[key] = { tipo_tela: rollo.tipo_tela, color: rollo.color, total: 0 };
                                            acc[key].total += rollo.cantidad_rollos;
                                            return acc;
                                        }, {} as Record<string, { tipo_tela: string, color: string, total: number }>);
                                        const arrayStock = Object.values(agrupacion).filter(r => r.total > 0).sort((a,b) => b.total - a.total);
                                        
                                        if (arrayStock.length === 0) {
                                            return (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-12 text-center text-zinc-500 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl mt-4">
                                                        No hay rollos disponibles actualmente en stock.
                                                    </td>
                                                </tr>
                                            );
                                        }
                                        return arrayStock.map((item, idx) => (
                                            <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                                                <td className="px-4 py-4 font-bold text-zinc-900 dark:text-white capitalize border-r border-zinc-100 dark:border-zinc-800/50">
                                                    {item.tipo_tela}
                                                </td>
                                                <td className="px-4 py-4 text-xs">
                                                    <span className="font-bold border px-2 py-1 flex w-fit items-center rounded bg-zinc-100 dark:bg-zinc-800 uppercase">
                                                        {item.color}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center border-l border-zinc-100 dark:border-zinc-800/50">
                                                    <span className="font-black text-2xl text-green-600 dark:text-green-400">
                                                        {item.total}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center border-l border-zinc-100 dark:border-zinc-800/50 align-middle">
                                                    <button
                                                        onClick={() => handleVaciarStockTelas(item.tipo_tela, item.color)}
                                                        title="Vaciar Stock"
                                                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors mx-auto flex items-center justify-center"
                                                        disabled={isSubmitting}
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ));
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (activeTab === 'ingreso') ? (
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Operation Form */}
                        <div className="lg:col-span-1 bg-white/80 dark:bg-gradient-to-br dark:from-zinc-900/90 dark:to-black/90 backdrop-blur-2xl p-6 rounded-[2rem] shadow-xl dark:shadow-2xl border border-zinc-200 dark:border-white/5 h-fit">
                            <h2 className="text-xl font-bold mb-6 flex items-center">
                                <Plus className="w-5 h-5 mr-2 text-green-600" /> Registrar Ingreso a Almacén
                            </h2>

                            <form className="space-y-5">
                                {/* Locations Section */}
                                <div className="space-y-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Almacén Destino</label>
                                        <select
                                            value={almacenDestino} onChange={e => setAlmacenDestino(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 outline-none focus:ring-2 font-bold focus:ring-green-500"
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
                                                className={`flex-1 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-orange-500`}
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
                                                className={`flex-1 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 outline-none focus:ring-2 disabled:opacity-50 focus:ring-orange-500`}
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
                                                        ? 'bg-green-600/20 border-green-500 text-green-700 dark:text-green-400'
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
                                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Color Especificado</label>
                                        <div className="flex gap-2">
                                            <select
                                                value={color} onChange={e => {
                                                    if (e.target.value === '___NUEVO___') {
                                                        abrirModalNuevo('color');
                                                    } else {
                                                        setColor(e.target.value);
                                                    }
                                                }}
                                                className="flex-1 px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-green-500"
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
                                    
                                    {/* Malla Dinámica al seleccionar Público */}
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
                                                                    <div key={tallaName} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-green-500 transition-all">
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
                                                                <span className="text-xs uppercase font-bold tracking-widest text-zinc-500 dark:text-zinc-500">Volumen Consolidado</span>
                                                                <span className={`text-2xl font-black ${totalPaquetesEnMatriz > 0 ? 'text-green-600 dark:text-green-500' : 'text-zinc-300 dark:text-zinc-700'}`}>
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

                                <button type="button" onClick={handleAgregarVariante} className="w-full py-4 mt-6 flex items-center justify-center font-black rounded-xl transition-all shadow-md text-white hover:shadow-lg active:scale-[0.98] bg-green-600 hover:bg-green-700">
                                    <Plus className="w-6 h-6 mr-2" /> Añadir Variante a la Lista
                                </button>

                                {variantes.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                    <h3 className="text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-2">Prendas a Ingresar ({totalLote} unids.)</h3>
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
                                                        {v.cantidad_faltante && v.cantidad_faltante > 0 ? (
                                                            <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 px-1.5 py-0.5 rounded text-[10px] font-bold">Faltan {v.cantidad_faltante}</span>
                                                        ) : null}
                                                    </span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold">{v.cantidad} u.</span>
                                                        <button type="button" onClick={() => handleRemoverVariante(v.id)} className="text-red-500 hover:text-red-700 font-bold">X</button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <button type="button" onClick={handleGuardarOperacion} disabled={isSubmitting || variantes.length === 0} className={`w-full py-4 mt-2 text-white dark:text-zinc-900 font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 flex justify-center items-center bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200`}>
                                    {isSubmitting ? (
                                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Registrando...</>
                                    ) : (
                                        "Guardar Lote Final"
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Operation List Table */}
                        <div className="lg:col-span-2 bg-white/80 dark:bg-gradient-to-br dark:from-zinc-900/90 dark:to-black/90 backdrop-blur-2xl p-6 rounded-[2rem] shadow-xl dark:shadow-2xl border border-zinc-200 dark:border-white/5 overflow-hidden flex flex-col h-full">
                            <h2 className="text-xl font-bold mb-4">Historial de Ingresos a Almacén</h2>
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
                                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-900">
                                        <tr>
                                            <th className="px-4 py-3 rounded-tl-lg">Destino</th>
                                            <th className="px-4 py-3">Prenda</th>
                                            <th className="px-4 py-3">Detalles</th>
                                            <th className="px-4 py-3 text-right">Cant.</th>
                                            <th className="px-4 py-3 text-right">Hora</th>
                                            <th className="px-4 py-3 text-center rounded-tr-lg">Acc.</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itemsAMostrar.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-12 text-center text-zinc-500 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl mt-4">
                                                    No hay registros en el historial general.
                                                </td>
                                            </tr>
                                        ) : (
                                            itemsAMostrar.flatMap((item) =>
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
                                                                {v.cantidad_faltante && v.cantidad_faltante > 0 ? (
                                                                    <span className="text-[10px] font-bold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded-md flex items-center shadow-sm w-fit">
                                                                        ⚠️ Faltan {v.cantidad_faltante} u.
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex flex-col items-end gap-0.5">
                                                                <span className="font-bold text-green-600 dark:text-green-400">
                                                                    +{v.cantidad} u.
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
                                                                {item.fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </td>
                                                        ) : null}
                                                        {vIdx === 0 ? (
                                                            <td rowSpan={item.variantes.length} className="px-4 py-4 text-center border-l border-zinc-100 dark:border-zinc-800/50 align-top pt-3">
                                                                <button
                                                                    onClick={() => handleEliminarEntrada(item.id)}
                                                                    title="Eliminar registro"
                                                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
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
                ) : (
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Formulario Ingreso de Rollos */}
                        <div className="lg:col-span-1 bg-white/80 dark:bg-gradient-to-br dark:from-zinc-900/90 dark:to-black/90 backdrop-blur-2xl p-6 rounded-[2rem] shadow-xl dark:shadow-2xl border border-zinc-200 dark:border-white/5 h-fit">
                            <h2 className="text-xl font-bold mb-6 flex items-center">
                                <ScrollText className="w-5 h-5 mr-2 text-indigo-600" /> Ingreso de Telas
                            </h2>

                            <form className="space-y-4">
                                {/* Tipo de Tela */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tipo de Tela</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={rolloTipoTela}
                                            onChange={e => {
                                                if (e.target.value === '___NUEVO___') {
                                                    setModalNuevoTipoTela(true);
                                                } else {
                                                    setRolloTipoTela(e.target.value);
                                                }
                                            }}
                                            className="flex-1 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                            required
                                        >
                                            <option value="" disabled>Seleccione...</option>
                                            {tiposTelaDisponibles.map(tipo => (
                                                <option key={tipo} value={tipo}>{tipo}</option>
                                            ))}
                                            <option value="___NUEVO___" className="text-indigo-600 font-bold">+ Añadir Nuevo...</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Color */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Color</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={color}
                                            onChange={e => {
                                                if (e.target.value === '___NUEVO___') {
                                                    abrirModalNuevo('color');
                                                } else {
                                                    setColor(e.target.value);
                                                }
                                            }}
                                            className="flex-1 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                            required
                                        >
                                            <option value="" disabled>Seleccione...</option>
                                            {coloresDisponibles?.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                            <option value="___NUEVO___" className="text-indigo-600 font-bold">+ Añadir Nuevo...</option>
                                        </select>
                                        {color && (
                                            <div className="flex gap-1">
                                                <button type="button" onClick={() => abrirModalEditar('color', color)} className="p-2 text-zinc-400 hover:text-blue-600 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg transition-colors border-dashed" title="Renombrar Color"><Pencil className="w-5 h-5" /></button>
                                                <button type="button" onClick={() => abrirModalEliminar('color', color)} className="p-2 text-zinc-400 hover:text-red-600 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg transition-colors border-dashed" title="Eliminar Color"><Trash2 className="w-5 h-5" /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Cantidad de Rollos */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Cantidad de Rollos</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={rolloCantidad}
                                        onChange={e => setRolloCantidad(Math.max(1, Number(e.target.value)))}
                                        className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-center text-lg"
                                        required
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={handleGuardarRollo}
                                    disabled={isSubmitting}
                                    className="w-full py-4 mt-6 text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 flex justify-center items-center bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Registrando...</>
                                    ) : (
                                        "Guardar Lote de Telas"
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Tabla de Rollos */}
                        <div className="lg:col-span-2 bg-white/80 dark:bg-gradient-to-br dark:from-zinc-900/90 dark:to-black/90 backdrop-blur-2xl p-6 rounded-[2rem] shadow-xl dark:shadow-2xl border border-zinc-200 dark:border-white/5 overflow-hidden flex flex-col h-full">
                            <h2 className="text-xl font-bold mb-4 flex items-center">
                                <PackageSearch className="w-5 h-5 mr-2 text-indigo-600" /> Historial de Telas
                            </h2>
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
                                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-900">
                                        <tr>
                                            <th className="px-4 py-3 rounded-tl-lg">Tipo de Tela</th>
                                            <th className="px-4 py-3">Color</th>
                                            <th className="px-4 py-3 text-center">Cantidad Rollos</th>
                                            <th className="px-4 py-3 text-right">Fecha Ingreso</th>
                                            <th className="px-4 py-3 text-center rounded-tr-lg">Acc.</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itemsRollos.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-12 text-center text-zinc-500 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl mt-4">
                                                    No se registra historial de ingresos de tela.
                                                </td>
                                            </tr>
                                        ) : (
                                            itemsRollos.map((rollo) => (
                                                <tr key={rollo.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                                                    <td className="px-4 py-4 font-bold text-zinc-900 dark:text-white capitalize border-r border-zinc-100 dark:border-zinc-800/50">
                                                        {rollo.tipo_tela}
                                                    </td>
                                                    <td className="px-4 py-4 text-xs">
                                                        <span className="font-bold border px-2 py-1 flex w-fit items-center rounded bg-zinc-100 dark:bg-zinc-800 uppercase">
                                                            {rollo.color}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="font-bold text-base text-zinc-600 dark:text-zinc-400">
                                                            {rollo.cantidad_original ?? rollo.cantidad_rollos}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-right text-xs border-l border-zinc-100 dark:border-zinc-800/50 text-zinc-400">
                                                        {rollo.fecha_ingreso.toLocaleDateString()} {rollo.fecha_ingreso.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="px-4 py-4 text-center border-l border-zinc-100 dark:border-zinc-800/50 align-top pt-3">
                                                        <button
                                                            onClick={() => handleEliminarRollo(rollo)}
                                                            title="Eliminar registro"
                                                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
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

            {/* Modal para agregar nuevo tipo de tela */}
            {modalNuevoTipoTela && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="flex items-center gap-4 p-6 border-b border-zinc-100 dark:border-zinc-800 bg-indigo-50/60 dark:bg-indigo-950/20">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl">
                                <ScrollText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Agregar Nuevo Tipo de Tela</h2>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Ej: Franela, Jersey, Fresh Terry</p>
                            </div>
                        </div>

                        <div className="p-6">
                            <input
                                type="text"
                                placeholder="Ej: Jersey Premium"
                                value={nuevoTipoTela}
                                onChange={e => setNuevoTipoTela(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-lg"
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleAgregarTipoTela();
                                    if (e.key === 'Escape') {
                                        setModalNuevoTipoTela(false);
                                        setNuevoTipoTela('');
                                    }
                                }}
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3 px-6 pb-6 justify-end">
                            <button
                                onClick={() => {
                                    setModalNuevoTipoTela(false);
                                    setNuevoTipoTela('');
                                }}
                                className="px-5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAgregarTipoTela}
                                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
                            >
                                Guardar Tipo de Tela
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para eliminar rollo de tela */}
            {modalEliminarRollo.open && modalEliminarRollo.item && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="flex items-center gap-4 p-6 border-b border-zinc-100 dark:border-zinc-800 bg-red-50/60 dark:bg-red-950/20">
                            <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-xl">
                                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Eliminar Rollo de Tela</h2>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Esta acción es irreversible</p>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                Estás a punto de eliminar el siguiente rollo de forma <span className="font-bold text-red-600 dark:text-red-400">permanente</span>:
                            </p>

                            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-2">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-xs text-zinc-400 uppercase font-semibold mb-1">Tipo de Tela</p>
                                        <p className="font-bold text-zinc-900 dark:text-white capitalize">{modalEliminarRollo.item.tipo_tela}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-400 uppercase font-semibold mb-1">Color</p>
                                        <p className="font-bold text-zinc-900 dark:text-white">{modalEliminarRollo.item.color}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-400 uppercase font-semibold mb-1">Cantidad Rollos</p>
                                        <p className="font-black text-lg text-indigo-600 dark:text-indigo-400">{modalEliminarRollo.item.cantidad_rollos}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-400 uppercase font-semibold mb-1">Estado</p>
                                        <p className={`font-bold text-sm ${modalEliminarRollo.item.disponible ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {modalEliminarRollo.item.disponible ? 'Disponible' : 'Agotado'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 px-6 pb-6 justify-end">
                            <button
                                onClick={() => setModalEliminarRollo({ open: false, item: null, isDeleting: false })}
                                disabled={modalEliminarRollo.isDeleting}
                                className="px-5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmarEliminarRollo}
                                disabled={modalEliminarRollo.isDeleting}
                                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-2 transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50"
                            >
                                {modalEliminarRollo.isDeleting ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Eliminando...</>
                                ) : (
                                    <><Trash2 className="w-4 h-4" /> Eliminar Rollo</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal personalizado de confirmación de eliminación */}
            {modalEliminar.open && modalEliminar.item && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl w-full max-w-lg border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center gap-4 p-6 border-b border-zinc-100 dark:border-zinc-800 bg-red-50/60 dark:bg-red-950/20">
                            <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-xl">
                                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Eliminar Registro de Inventario</h2>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">ID: <span className="font-mono font-bold text-red-600 dark:text-red-400">{modalEliminar.item.id}</span></p>
                            </div>
                        </div>

                        {/* Detalles del registro */}
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                Estás a punto de eliminar el siguiente registro de forma <span className="font-bold text-red-600 dark:text-red-400">permanente e irreversible</span>:
                            </p>

                            {/* Info general */}
                            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-2">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-xs text-zinc-400 uppercase font-semibold mb-1">Almacén</p>
                                        <p className="font-bold text-zinc-900 dark:text-white">{modalEliminar.item.almacen_destino}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-400 uppercase font-semibold mb-1">Prenda</p>
                                        <p className="font-bold text-zinc-900 dark:text-white capitalize">{modalEliminar.item.categoria} {modalEliminar.item.tipo}</p>
                                    </div>
                                    {modalEliminar.item.origen && (
                                        <div className="col-span-2">
                                            <p className="text-xs text-zinc-400 uppercase font-semibold mb-1">Origen / Motivo</p>
                                            <p className="font-medium text-blue-600 dark:text-blue-400">{modalEliminar.item.origen}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs text-zinc-400 uppercase font-semibold mb-1">Fecha</p>
                                        <p className="font-medium text-zinc-700 dark:text-zinc-300 text-xs">{modalEliminar.item.fecha.toLocaleDateString()} {modalEliminar.item.fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-400 uppercase font-semibold mb-1">Total</p>
                                        <p className="font-black text-lg text-zinc-900 dark:text-white">{modalEliminar.item.total} <span className="text-xs font-normal text-zinc-400">unidades</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Variantes */}
                            <div>
                                <p className="text-xs text-zinc-400 uppercase font-semibold mb-2">Variantes incluidas ({modalEliminar.item.variantes.length})</p>
                                <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                    {modalEliminar.item.variantes.map((v, i) => (
                                        <li key={i} className="flex justify-between items-center text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-2 rounded-lg">
                                            <span className="capitalize text-zinc-700 dark:text-zinc-300">
                                                {v.publico} • <span className="font-bold border px-1 rounded bg-zinc-100 dark:bg-zinc-800 uppercase mx-0.5">{v.talla}</span> • {v.color}
                                            </span>
                                            <span className="font-black text-zinc-900 dark:text-white">{v.cantidad} u.</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex gap-3 px-6 pb-6 justify-end">
                            <button
                                onClick={() => setModalEliminar({ open: false, item: null, isDeleting: false })}
                                disabled={modalEliminar.isDeleting}
                                className="px-5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmarEliminarEntrada}
                                disabled={modalEliminar.isDeleting}
                                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-2 transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50"
                            >
                                {modalEliminar.isDeleting ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Eliminando...</>
                                ) : (
                                    <><Trash2 className="w-4 h-4" /> Eliminar Registro</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ProtectedRoute>
    );
}
