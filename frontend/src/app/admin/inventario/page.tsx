"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Plus, PackageSearch, TrendingUp, Loader2, Building2, Table as TableIcon, Download, ScrollText, Pencil, Trash2, Truck, LogOut } from "lucide-react";
import { useFormulariosProducto } from "@/hooks/useFormulariosProducto";
import { useAuth } from "@/context/AuthContext";
import { guardarEntradaInventario, guardarIngresoRollo } from "@/lib/firestoreUtils";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ModalAñadirOpcion from "@/components/admin/ModalAñadirOpcion";
import * as XLSX from 'xlsx';

type VarianteLote = {
    id: string;
    publico: string;
    talla: string;
    color: string;
    cantidad: number;
    cantidad_faltante?: number;
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
    codigo: string;
    tipo_tela: string;
    color: string;
    metros: number;
    peso_kg: number;
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
    totalGeneral: number;
};

const ALMACENES = ["Inventario General", "Almacén 1", "Almacén 2"];
const UBICACIONES = [...ALMACENES];

export default function PaginaInventario() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'ingreso' | 'recepcion_talleres' | 'salida' | 'stock' | 'rollos'>('ingreso');
    const [almacenDestino, setAlmacenDestino] = useState(ALMACENES[0]);
    const [tallerOrigen, setTallerOrigen] = useState('');

    const [itemsIngreso, setItemsIngreso] = useState<InventoryEntry[]>([]);
    const [itemsRollos, setItemsRollos] = useState<RolloTela[]>([]);
    const [variantes, setVariantes] = useState<VarianteLote[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cantidadFaltante, setCantidadFaltante] = useState(0);

    // Rollos Data State
    const [rolloCodigo, setRolloCodigo] = useState('');
    const [rolloTipoTela, setRolloTipoTela] = useState('');
    const [rolloMetros, setRolloMetros] = useState('');
    const [rolloPeso, setRolloPeso] = useState('');

    // Stock Data
    const [stockMap, setStockMap] = useState<Record<string, StockItem>>({});
    const [isLoadingStock, setIsLoadingStock] = useState(false);
    const [filtroStock, setFiltroStock] = useState("");

    // Hook de Formularios Reutilizable
    const {
        categoria, tipoProducto, publico, talla, cantidad, color,
        setCantidad, setTipoProducto, setTalla, setColor,
        tiposDisponibles, tallasDisponibles, categoriasDisponibles, publicosDisponibles, coloresDisponibles,
        handleCategoriaChange, handlePublicoChange, resetFormulario,
        modalConfig, isSubmittingModal, abrirModalNuevo, abrirModalEditar, abrirModalEliminar, cerrarModal, confirmarModal
    } = useFormulariosProducto();

    useEffect(() => {
        cargarDatosStock();
    }, []);

    useEffect(() => {
        setVariantes([]);
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
                tipo_operacion: e.tipo_operacion || 'ingreso'
            }));

            setItemsIngreso(parsedEntradas);

            // Fetch Rollos
            const rollosQ = query(collection(db, 'inventario_rollos'), orderBy('fecha_registro', 'desc'));
            const rollosSnap = await getDocs(rollosQ);
            const rawRollos: any[] = [];
            rollosSnap.forEach(d => rawRollos.push({ id: d.id, ...d.data() }));

            const parsedRollos: RolloTela[] = rawRollos.map(r => ({
                id: r.id,
                codigo: r.codigo,
                tipo_tela: r.tipo_tela,
                color: r.color,
                metros: r.metros || 0,
                peso_kg: r.peso_kg || 0,
                fecha_ingreso: r.fecha_registro?.toDate ? r.fecha_registro.toDate() : new Date(),
            }));
            
            setItemsRollos(parsedRollos);

            // Build Stock Map
            const sMap: Record<string, StockItem> = {};

            const agregarAStock = (item: any, ubicacion: string, cant: number) => {
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
                            totalGeneral: 0
                        };
                        UBICACIONES.forEach(u => sMap[clave].cantidades[u] = 0);
                    }
                    
                    const cantReal = v.cantidad * cant;
                    sMap[clave].cantidades[ubicacion] = (sMap[clave].cantidades[ubicacion] || 0) + cantReal;
                    sMap[clave].totalGeneral += cantReal;
                });
            };

            // Procesar Entradas (+ al almacén destino, o - si es salida)
            rawEntradas.forEach(entrada => {
                const destino = entrada.almacen_destino || 'Almacén 1';
                const multiplier = entrada.tipo_operacion === 'salida' ? -1 : 1;
                agregarAStock(entrada, destino, multiplier);
            });

            setStockMap(sMap);

        } catch (error) {
            console.error("Error al cargar stock:", error);
            toast.error("Hubo un error al calcular el stock total.");
        } finally {
            setIsLoadingStock(false);
        }
    };

    const handleAgregarVariante = () => {
        if (!publico || !talla || !color || cantidad <= 0) {
            toast.error("Por favor completa público, talla, color y cantidad para añadir a la lista.");
            return;
        }
        const nuevaVariante: VarianteLote = { id: Date.now().toString(), publico, talla, color, cantidad: Number(cantidad) };
        if (activeTab === 'recepcion_talleres' && Number(cantidadFaltante) > 0) {
            nuevaVariante.cantidad_faltante = Number(cantidadFaltante);
        }
        setVariantes([...variantes, nuevaVariante]);
        setTalla('');
        setCantidad(1);
        setCantidadFaltante(0);
    };

    const handleRemoverVariante = (id: string) => {
        setVariantes(variantes.filter(v => v.id !== id));
    };

    const totalLote = variantes.reduce((acc, v) => acc + v.cantidad, 0);

    const handleGuardarOperacion = async () => {
        if (!categoria || !tipoProducto || variantes.length === 0 || isSubmitting) {
            toast.error("Selecciona la categoría, el tipo de prenda y añade al menos una variante.");
            return;
        }
        if ((activeTab === 'recepcion_talleres' || activeTab === 'salida') && !tallerOrigen.trim()) {
            toast.error(activeTab === 'salida' ? "Por favor especifica el Motivo o Destino de la salida." : "Por favor especifica el Taller de Origen.");
            return;
        }

        setIsSubmitting(true);
        try {
            const registro = {
                id_usuario: user?.uid || "desconocido",
                nombre_usuario: user?.email ? user.email.split('@')[0] : "Anonimo",
                almacen_destino: activeTab === 'recepcion_talleres' ? 'Inventario General' : almacenDestino,
                origen: (activeTab === 'recepcion_talleres' || activeTab === 'salida') ? tallerOrigen.trim() : null,
                tipo_operacion: activeTab === 'recepcion_talleres' ? 'recepcion_talleres' : (activeTab === 'salida' ? 'salida' : 'ingreso'),
                categoria,
                tipo_producto: tipoProducto,
                variantes,
                total_ingresado: totalLote,
            };
            const idEntrada = await guardarEntradaInventario(registro);
            const nuevoItem: InventoryEntry = {
                id: idEntrada,
                almacen_destino: activeTab === 'recepcion_talleres' ? 'Inventario General' : almacenDestino,
                origen: (activeTab === 'recepcion_talleres' || activeTab === 'salida') ? tallerOrigen.trim() : undefined,
                categoria,
                tipo: tipoProducto,
                variantes,
                total: totalLote,
                fecha: new Date(),
                tipo_operacion: activeTab === 'recepcion_talleres' ? 'recepcion_talleres' : (activeTab === 'salida' ? 'salida' : 'ingreso')
            };
            setItemsIngreso([nuevoItem, ...itemsIngreso]);
            toast.success(`Registro #${idEntrada} guardado en ${almacenDestino}.`);

            // Limpiar
            setVariantes([]);
            setTipoProducto('');
            setTallerOrigen('');
            resetFormulario();
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar la operación. Revisa tu conexión o permisos.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGuardarRollo = async () => {
        if (!rolloCodigo.trim() || !rolloTipoTela.trim() || !color || !rolloMetros || !rolloPeso || isSubmitting) {
            toast.error("Por favor completa todos los campos del rollo de tela.");
            return;
        }

        setIsSubmitting(true);
        try {
            const registro = {
                codigo: rolloCodigo.trim(),
                tipo_tela: rolloTipoTela.trim(),
                color: color,
                metros: Number(rolloMetros),
                peso_kg: Number(rolloPeso),
                id_usuario: user?.uid || "desconocido"
            };
            const idRollo = await guardarIngresoRollo(registro);
            const nuevoRollo: RolloTela = {
                id: idRollo,
                ...registro,
                fecha_ingreso: new Date()
            };
            
            setItemsRollos([nuevoRollo, ...itemsRollos]);
            toast.success(`Rollo de tela ${registro.codigo} registrado exitosamente.`);
            
            setRolloCodigo('');
            setRolloTipoTela('');
            setRolloMetros('');
            setRolloPeso('');
            setColor('');
        } catch (error) {
            console.error("Error al registrar rollo", error);
            toast.error("Error al guardar registro.");
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

    const itemsAMostrar = itemsIngreso.filter(i => i.tipo_operacion === activeTab);
    const totalIngresosHistorico = itemsIngreso.reduce((acc, current) => acc + current.total, 0);

    return (
        <ProtectedRoute allowedRoles={["master", "inventory"]}>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-white">Gestión de Inventario</h1>
                    {/* Tab Navigation */}
                    <div className="flex bg-white dark:bg-zinc-950 p-1 rounded-xl shadow-sm border border-stone-200 dark:border-zinc-800 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('ingreso')}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'ingreso' ? "bg-stone-100 dark:bg-zinc-900 text-stone-900 dark:text-white shadow-sm" : "text-stone-500 hover:text-stone-900 dark:hover:text-white"}`}
                        >
                            <Building2 className="w-4 h-4 mr-2" /> Ingreso a Almacén
                        </button>
                        <button
                            onClick={() => setActiveTab('recepcion_talleres')}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'recepcion_talleres' ? "bg-stone-100 dark:bg-zinc-900 text-stone-900 dark:text-white shadow-sm" : "text-stone-500 hover:text-stone-900 dark:hover:text-white"}`}
                        >
                            <Truck className="w-4 h-4 mr-2" /> Recepción de Talleres
                        </button>
                        <button
                            onClick={() => setActiveTab('salida')}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'salida' ? "bg-stone-100 dark:bg-zinc-900 text-stone-900 dark:text-white shadow-sm" : "text-stone-500 hover:text-stone-900 dark:hover:text-white"}`}
                        >
                            <LogOut className="w-4 h-4 mr-2" /> Salidas de Almacén
                        </button>
                        <button
                            onClick={() => setActiveTab('rollos')}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'rollos' ? "bg-stone-100 dark:bg-zinc-900 text-stone-900 dark:text-white shadow-sm" : "text-stone-500 hover:text-stone-900 dark:hover:text-white"}`}
                        >
                            <ScrollText className="w-4 h-4 mr-2" /> Rollos de Tela
                        </button>
                        <button
                            onClick={() => setActiveTab('stock')}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'stock' ? "bg-stone-100 dark:bg-zinc-900 text-stone-900 dark:text-white shadow-sm" : "text-stone-500 hover:text-stone-900 dark:hover:text-white"}`}
                        >
                            <TableIcon className="w-4 h-4 mr-2" /> Stock Actual
                        </button>
                    </div>
                </div>

                {/* Dashboard Summary Cards */}
                {activeTab !== 'stock' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-zinc-800 flex items-center">
                            <div className="p-4 bg-green-100 dark:bg-green-500/20 text-green-600 rounded-xl mr-4">
                                <PackageSearch className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm text-stone-500 font-medium">Histórico: Prendas Ingresadas</p>
                                <p className="text-3xl font-bold text-stone-900 dark:text-white">{itemsIngreso.filter(i => i.tipo_operacion !== 'salida').reduce((acc, current) => acc + current.total, 0)}</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-zinc-800 flex items-center">
                            <div className="p-4 bg-orange-100 dark:bg-orange-500/20 text-orange-600 rounded-xl mr-4">
                                <LogOut className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm text-stone-500 font-medium">Histórico: Prendas Retiradas</p>
                                <p className="text-3xl font-bold text-stone-900 dark:text-white">{itemsIngreso.filter(i => i.tipo_operacion === 'salida').reduce((acc, current) => acc + current.total, 0)}</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'stock' ? (
                    <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-zinc-800">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-stone-900 dark:text-white">Stock Total Unificado</h2>
                                <p className="text-sm text-stone-500">Vista calculada en tiempo real de almacenes y tiendas.</p>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <input 
                                    type="text" 
                                    placeholder="Buscar prenda o talla..." 
                                    className="flex-1 px-4 py-2 border border-stone-200 dark:border-zinc-800 rounded-lg text-sm outline-none bg-stone-50 dark:bg-zinc-900 focus:ring-2 focus:ring-stone-500"
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
                            <div className="flex flex-col items-center justify-center p-12 text-stone-500">
                                <Loader2 className="w-8 h-8 animate-spin text-stone-400 mb-2" />
                                <p>Calculando matrices de stock...</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Tabla Almacenes */}
                                <div className="overflow-x-auto pb-4">
                                    <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-4">Stock en Almacenes</h3>
                                    <table className="w-full text-left text-sm text-stone-600 dark:text-stone-400">
                                        <thead className="text-xs text-stone-500 uppercase bg-stone-50 dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800">
                                            <tr>
                                                <th className="px-4 py-4 rounded-tl-lg">Producto</th>
                                                <th className="px-4 py-4">Variante (P/T/C)</th>
                                                {ALMACENES.map(a => (
                                                    <th key={a} className="px-4 py-4 text-center border-l border-stone-200 dark:border-zinc-800">{a}</th>
                                                ))}
                                                <th className="px-4 py-4 text-center border-l border-stone-300 dark:border-zinc-700 font-bold bg-stone-100 dark:bg-zinc-800 rounded-tr-lg">Total Almacenes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stockItemsFiltered.map((item, idx) => {
                                                let totalAlmacen = 0;
                                                ALMACENES.forEach(a => totalAlmacen += (item.cantidades[a] || 0));
                                                return (
                                                <tr key={idx} className="border-b border-stone-100 dark:border-zinc-800 last:border-0 hover:bg-stone-50 dark:hover:bg-zinc-900/50 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-stone-900 dark:text-white capitalize">
                                                        {item.categoria} {item.tipo}
                                                    </td>
                                                    <td className="px-4 py-3 capitalize text-xs">
                                                        {item.publico} • <span className="font-bold border px-1 rounded mx-1 bg-stone-100 dark:bg-zinc-800 uppercase">{item.talla}</span> • {item.color}
                                                    </td>
                                                    {ALMACENES.map(a => (
                                                        <td key={a} className="px-4 py-3 text-center border-l border-stone-100 dark:border-zinc-800/50">
                                                            <span className={`font-bold ${item.cantidades[a] > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-stone-300 dark:text-stone-600'}`}>
                                                                {item.cantidades[a] || 0}
                                                            </span>
                                                        </td>
                                                    ))}
                                                    <td className="px-4 py-3 text-center border-l border-stone-300 dark:border-zinc-700 font-bold bg-stone-50/50 dark:bg-zinc-900/50">
                                                        {totalAlmacen}
                                                    </td>
                                                </tr>
                                            )})}
                                            {stockItemsFiltered.length === 0 && (
                                                <tr>
                                                    <td colSpan={ALMACENES.length + 3} className="px-4 py-12 text-center text-stone-500 border-2 border-dashed border-stone-200 dark:border-zinc-800 rounded-xl mt-4">
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
                ) : (activeTab === 'ingreso' || activeTab === 'recepcion_talleres' || activeTab === 'salida') ? (
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Operation Form */}
                        <div className="lg:col-span-1 bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-zinc-800 h-fit">
                            <h2 className="text-xl font-bold mb-6 flex items-center">
                                {activeTab === 'ingreso' ? (
                                    <><Plus className="w-5 h-5 mr-2 text-green-600" /> Registrar Ingreso a Almacén</>
                                ) : activeTab === 'recepcion_talleres' ? (
                                    <><Plus className="w-5 h-5 mr-2 text-blue-600" /> Registrar Recepción de Taller</>
                                ) : (
                                    <><LogOut className="w-5 h-5 mr-2 text-orange-600" /> Registrar Salida de Almacén</>
                                )}
                            </h2>
                            
                            <form className="space-y-5">
                                {/* Locations Section */}
                                <div className="space-y-4 border-b border-stone-100 dark:border-zinc-800 pb-5">
                                    {(activeTab === 'recepcion_talleres' || activeTab === 'salida') && (
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">{activeTab === 'salida' ? 'Motivo o Destino de Salida' : 'Taller de Origen'}</label>
                                            <input 
                                                type="text" 
                                                placeholder={activeTab === 'salida' ? 'Ej. Venta Externa, Defectuoso...' : 'Ej. Taller Costura Central'}
                                                value={tallerOrigen}
                                                onChange={e => setTallerOrigen(e.target.value)}
                                                className="w-full px-4 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                                required
                                            />
                                        </div>
                                    )}
                                    {activeTab !== 'recepcion_talleres' && (
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">{activeTab === 'salida' ? 'Almacén de Origen (Extraer de)' : 'Almacén Destino'}</label>
                                            <select
                                                value={almacenDestino} onChange={e => setAlmacenDestino(e.target.value)}
                                                className={`w-full px-4 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 outline-none focus:ring-2 font-bold ${activeTab === 'salida' ? 'focus:ring-orange-500' : 'focus:ring-green-500'}`}
                                            >
                                                {ALMACENES.filter(a => a !== 'Inventario General').map(a => <option key={a} value={a}>{a}</option>)}
                                                <option value="Inventario General">Inventario General</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {/* Product Section */}
                                <div className="space-y-4 border-b border-stone-100 dark:border-zinc-800 pb-5">
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Categoría</label>
                                        <div className="flex gap-2">
                                            <select
                                                value={categoria} onChange={e => {
                                                    if (e.target.value === '___NUEVO___') {
                                                        abrirModalNuevo('categoria');
                                                    } else {
                                                        handleCategoriaChange(e.target.value);
                                                    }
                                                }}
                                                className={`flex-1 px-4 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 outline-none focus:ring-2 ${activeTab === 'recepcion_talleres' ? 'focus:ring-blue-500' : 'focus:ring-orange-500'}`}
                                                required
                                            >
                                                <option value="" disabled>Seleccione...</option>
                                                {categoriasDisponibles.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                                <option value="___NUEVO___" className={`${activeTab === 'recepcion_talleres' ? 'text-blue-600' : 'text-orange-600'} font-bold`}>+ Añadir Nueva...</option>
                                            </select>
                                            {categoria && (
                                                <div className="flex gap-1">
                                                    <button type="button" onClick={() => abrirModalEditar('categoria', categoria)} className="p-2 text-stone-400 hover:text-blue-600 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg transition-colors border-dashed" title="Renombrar Categoría"><Pencil className="w-5 h-5" /></button>
                                                    <button type="button" onClick={() => abrirModalEliminar('categoria', categoria)} className="p-2 text-stone-400 hover:text-red-600 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg transition-colors border-dashed" title="Eliminar Categoría"><Trash2 className="w-5 h-5" /></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Tipo de Prenda</label>
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
                                                className={`flex-1 px-4 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 outline-none focus:ring-2 disabled:opacity-50 ${activeTab === 'recepcion_talleres' ? 'focus:ring-blue-500' : 'focus:ring-orange-500'}`}
                                                required
                                            >
                                                <option value="" disabled>Seleccione...</option>
                                                {tiposDisponibles.map(tipo => (
                                                    <option key={tipo} value={tipo}>{tipo}</option>
                                                ))}
                                                <option value="___NUEVO___" className={`${activeTab === 'recepcion_talleres' ? 'text-blue-600' : 'text-orange-600'} font-bold`}>+ Añadir Nuevo...</option>
                                            </select>
                                            {tipoProducto && (
                                                <div className="flex gap-1">
                                                    <button type="button" onClick={() => abrirModalEditar('tipo_prenda', tipoProducto, categoria)} className="p-2 text-stone-400 hover:text-blue-600 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg transition-colors border-dashed" title="Renombrar Tipo"><Pencil className="w-5 h-5" /></button>
                                                    <button type="button" onClick={() => abrirModalEliminar('tipo_prenda', tipoProducto, categoria)} className="p-2 text-stone-400 hover:text-red-600 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg transition-colors border-dashed" title="Eliminar Tipo"><Trash2 className="w-5 h-5" /></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Público</label>
                                        <select
                                            value={publico} onChange={e => handlePublicoChange(e.target.value)}
                                            className={`w-full px-4 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 outline-none focus:ring-2 ${activeTab === 'recepcion_talleres' ? 'focus:ring-blue-500' : 'focus:ring-orange-500'}`}
                                            required
                                        >
                                            <option value="" disabled>Seleccione...</option>
                                            {publicosDisponibles.map(pub => (
                                                <option key={pub} value={pub}>{pub}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Talla</label>
                                        <select
                                            disabled={!publico}
                                            value={talla} onChange={e => setTalla(e.target.value)}
                                            className={`w-full px-4 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 outline-none focus:ring-2 disabled:opacity-50 ${activeTab === 'recepcion_talleres' ? 'focus:ring-blue-500' : 'focus:ring-orange-500'}`}
                                            required
                                        >
                                            <option value="" disabled>Seleccione...</option>
                                            {tallasDisponibles.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Color Especificado</label>
                                        <div className="flex gap-2">
                                            <select
                                                value={color} onChange={e => {
                                                    if (e.target.value === '___NUEVO___') {
                                                        abrirModalNuevo('color');
                                                    } else {
                                                        setColor(e.target.value);
                                                    }
                                                }}
                                                className={`flex-1 px-4 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 outline-none focus:ring-2 ${activeTab === 'recepcion_talleres' ? 'focus:ring-blue-500' : 'focus:ring-orange-500'}`}
                                            >
                                                <option value="" disabled>Seleccione...</option>
                                                {coloresDisponibles?.map(c => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                                <option value="___NUEVO___" className={`${activeTab === 'recepcion_talleres' ? 'text-blue-600' : 'text-orange-600'} font-bold`}>+ Añadir Nuevo...</option>
                                            </select>
                                            {color && (
                                                <div className="flex gap-1">
                                                    <button type="button" onClick={() => abrirModalEditar('color', color)} className="p-2 text-stone-400 hover:text-blue-600 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg transition-colors border-dashed" title="Renombrar Color"><Pencil className="w-5 h-5" /></button>
                                                    <button type="button" onClick={() => abrirModalEliminar('color', color)} className="p-2 text-stone-400 hover:text-red-600 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg transition-colors border-dashed" title="Eliminar Color"><Trash2 className="w-5 h-5" /></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className={`col-span-2 grid gap-4 ${activeTab === 'recepcion_talleres' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                        <div>
                                            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">{activeTab === 'salida' ? 'Cantidad a Extraer' : 'Cantidad Múltiple a Ingresar'}</label>
                                            <input
                                                type="number" min="1"
                                                value={cantidad} onChange={e => setCantidad(Number(e.target.value))}
                                                className={`w-full px-4 py-3 text-lg rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 outline-none focus:ring-2 font-black text-center ${activeTab === 'recepcion_talleres' ? 'focus:ring-blue-500' : (activeTab === 'salida' ? 'focus:ring-orange-500' : 'focus:ring-green-500')}`}
                                            />
                                        </div>
                                        {activeTab === 'recepcion_talleres' && (
                                            <div>
                                                <label className="block text-sm text-red-600 dark:text-red-400 font-bold mb-1">Prendas Faltantes (Opcional)</label>
                                                <input
                                                    type="number" min="0" placeholder="0"
                                                    value={cantidadFaltante || ''} onChange={e => setCantidadFaltante(Number(e.target.value) || 0)}
                                                    className="w-full px-4 py-3 text-lg rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 outline-none focus:ring-2 focus:ring-red-500 font-bold text-center placeholder:text-red-300 dark:placeholder:text-red-800"
                                                    title="Prendas faltantes no entregadas"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button type="button" onClick={handleAgregarVariante} className={`w-full py-4 mt-6 flex items-center justify-center font-black rounded-xl transition-all shadow-md text-white hover:shadow-lg active:scale-[0.98] ${activeTab === 'recepcion_talleres' ? 'bg-blue-600 hover:bg-blue-700' : (activeTab === 'salida' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700')}`}>
                                    <Plus className="w-6 h-6 mr-2" /> Añadir Variante a la Lista
                                </button>

                                {variantes.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-stone-100 dark:border-zinc-800">
                                        <h3 className="text-sm font-bold text-stone-600 dark:text-stone-400 mb-2">{activeTab === 'salida' ? 'Prendas a Extraer' : 'Prendas a Ingresar'} ({totalLote} unids.)</h3>
                                        <ul className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-2">
                                            {variantes.map(v => (
                                                <li key={v.id} className="flex justify-between items-center text-xs bg-stone-50 dark:bg-zinc-900/50 p-2 rounded-md border border-stone-100 dark:border-zinc-800">
                                                    <span className="flex items-center gap-2">
                                                        {v.publico} • {v.talla} • {v.color}
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

                                <button type="button" onClick={handleGuardarOperacion} disabled={isSubmitting || variantes.length === 0} className={`w-full py-4 mt-2 text-white dark:text-stone-900 font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 flex justify-center items-center bg-stone-900 dark:bg-white hover:bg-stone-800 dark:hover:bg-stone-200`}>
                                    {isSubmitting ? (
                                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Registrando...</>
                                    ) : (
                                        "Guardar Lote Final"
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Operation List Table */}
                        <div className="lg:col-span-2 bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-zinc-800 overflow-hidden flex flex-col h-full">
                            <h2 className="text-xl font-bold mb-4">{activeTab === 'salida' ? 'Historial de Salidas de Almacén' : 'Historial de Ingresos a Almacén'}</h2>
                            <div className="overflow-x-auto flex-1">
                                    <table className="w-full text-left text-sm text-stone-600 dark:text-stone-400">
                                        <thead className="text-xs text-stone-500 uppercase bg-stone-50 dark:bg-zinc-900">
                                            <tr>
                                                <th className="px-4 py-3 rounded-tl-lg">{activeTab === 'salida' ? 'Origen' : 'Destino'}</th>
                                                {(activeTab === 'recepcion_talleres' || activeTab === 'salida') && (
                                                    <th className="px-4 py-3">{activeTab === 'salida' ? 'Motivo/Destino' : 'Origen'}</th>
                                                )}
                                                <th className="px-4 py-3">Prenda</th>
                                                <th className="px-4 py-3">Detalles</th>
                                                <th className="px-4 py-3 text-right">Cant.</th>
                                                <th className="px-4 py-3 text-right rounded-tr-lg">Hora</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {itemsAMostrar.length === 0 ? (
                                                <tr>
                                                    <td colSpan={(activeTab === 'recepcion_talleres' || activeTab === 'salida') ? 6 : 5} className="px-4 py-12 text-center text-stone-500 border-2 border-dashed border-stone-200 dark:border-zinc-800 rounded-xl mt-4">
                                                        No hay registros en el historial general.
                                                    </td>
                                                </tr>
                                            ) : (
                                                itemsAMostrar.flatMap((item) => 
                                                    item.variantes.map((v, vIdx) => (
                                                        <tr key={`${item.id}-${vIdx}`} className="border-b border-stone-100 dark:border-zinc-800 last:border-0 hover:bg-stone-50 dark:hover:bg-zinc-900/50">
                                                            {vIdx === 0 ? (
                                                                <td rowSpan={item.variantes.length} className="px-4 py-4 font-bold text-stone-900 dark:text-white border-r border-stone-100 dark:border-zinc-800/50 align-top pt-5">
                                                                    {item.almacen_destino}
                                                                </td>
                                                            ) : null}
                                                            {(activeTab === 'recepcion_talleres' || activeTab === 'salida') && vIdx === 0 ? (
                                                                <td rowSpan={item.variantes.length} className={`px-4 py-4 font-bold border-r border-stone-100 dark:border-zinc-800/50 align-top pt-5 ${activeTab === 'salida' ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                                                    {item.origen}
                                                                </td>
                                                            ) : null}
                                                            {vIdx === 0 ? (
                                                                <td rowSpan={item.variantes.length} className="px-4 py-4 font-medium text-stone-900 dark:text-white capitalize border-r border-stone-100 dark:border-zinc-800/50 align-top pt-5">
                                                                    {item.categoria} {item.tipo}
                                                                </td>
                                                            ) : null}
                                                            <td className="px-4 py-3 capitalize text-xs">
                                                                <div className="flex flex-col gap-1 items-start">
                                                                    <span>{v.publico} • <span className="font-bold border px-1 rounded mx-1 bg-stone-100 dark:bg-zinc-800 uppercase">{v.talla}</span> • {v.color}</span>
                                                                    {v.cantidad_faltante && v.cantidad_faltante > 0 ? (
                                                                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded-md flex items-center shadow-sm w-fit">
                                                                            ⚠️ Faltan {v.cantidad_faltante} u.
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <span className={`font-bold ${activeTab === 'salida' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                                    {activeTab === 'salida' ? `-${v.cantidad}` : `+${v.cantidad}`}
                                                                </span>
                                                            </td>
                                                            {vIdx === 0 ? (
                                                                <td rowSpan={item.variantes.length} className="px-4 py-4 text-right text-xs border-l border-stone-100 dark:border-zinc-800/50 align-top pt-5 text-stone-500">
                                                                    {item.fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                        {/* Operation Form */}
                        <div className="lg:col-span-1 bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-zinc-800 h-fit">
                            <h2 className="text-xl font-bold mb-6 flex items-center">
                                <Plus className="w-5 h-5 mr-2 text-indigo-600" /> Registrar Rollo de Tela
                            </h2>
                            
                            <form className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Código del Rollo</label>
                                    <input
                                        type="text" placeholder="Ej. R-001"
                                        value={rolloCodigo} onChange={e => setRolloCodigo(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Tipo de Tela</label>
                                    <input
                                        type="text" placeholder="Ej. Franela Reactiva"
                                        value={rolloTipoTela} onChange={e => setRolloTipoTela(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Color Especificado</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={color} onChange={e => {
                                                if (e.target.value === '___NUEVO___') {
                                                    abrirModalNuevo('color');
                                                } else {
                                                    setColor(e.target.value);
                                                }
                                            }}
                                            className="flex-1 px-4 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="" disabled>Seleccione...</option>
                                            {coloresDisponibles?.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                            <option value="___NUEVO___" className="text-indigo-600 font-bold">+ Añadir Nuevo...</option>
                                        </select>
                                        {color && (
                                            <div className="flex gap-1">
                                                <button type="button" onClick={() => abrirModalEditar('color', color)} className="p-2 text-stone-400 hover:text-blue-600 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg transition-colors border-dashed" title="Renombrar Color"><Pencil className="w-5 h-5" /></button>
                                                <button type="button" onClick={() => abrirModalEliminar('color', color)} className="p-2 text-stone-400 hover:text-red-600 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg transition-colors border-dashed" title="Eliminar Color"><Trash2 className="w-5 h-5" /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Metros</label>
                                        <input
                                            type="number" min="0" step="any" placeholder="0.00"
                                            value={rolloMetros} onChange={e => setRolloMetros(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Peso (Kg)</label>
                                        <input
                                            type="number" min="0" step="any" placeholder="0.00"
                                            value={rolloPeso} onChange={e => setRolloPeso(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                <button type="button" onClick={handleGuardarRollo} disabled={isSubmitting} className={`w-full py-4 mt-6 text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 flex justify-center items-center bg-indigo-600 hover:bg-indigo-700`}>
                                    {isSubmitting ? (
                                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Registrando...</>
                                    ) : (
                                        "Guardar Rollo de Tela"
                                    )}
                                </button>
                            </form>
                        </div>

                        {/* Rollos List Table */}
                        <div className="lg:col-span-2 bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-zinc-800 overflow-hidden flex flex-col h-full">
                            <h2 className="text-xl font-bold mb-4 flex items-center"><ScrollText className="w-5 h-5 mr-2 text-indigo-600" /> Inventario de Rollos de Tela</h2>
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-left text-sm text-stone-600 dark:text-stone-400">
                                    <thead className="text-xs text-stone-500 uppercase bg-stone-50 dark:bg-zinc-900">
                                        <tr>
                                            <th className="px-4 py-3 rounded-tl-lg">Código</th>
                                            <th className="px-4 py-3">Tipo de Tela</th>
                                            <th className="px-4 py-3">Color</th>
                                            <th className="px-4 py-3 text-right">Metros</th>
                                            <th className="px-4 py-3 text-right">Peso (Kg)</th>
                                            <th className="px-4 py-3 text-right rounded-tr-lg">Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {itemsRollos.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-12 text-center text-stone-500 border-2 border-dashed border-stone-200 dark:border-zinc-800 rounded-xl mt-4">
                                                    No hay rollos de tela registrados en el inventario.
                                                </td>
                                            </tr>
                                        ) : (
                                            itemsRollos.map((rollo) => (
                                                <tr key={rollo.id} className="border-b border-stone-100 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-900/50">
                                                    <td className="px-4 py-4 font-bold text-stone-900 dark:text-white border-r border-stone-100 dark:border-zinc-800/50">
                                                        {rollo.codigo}
                                                    </td>
                                                    <td className="px-4 py-4 font-medium text-stone-900 dark:text-white capitalize border-r border-stone-100 dark:border-zinc-800/50">
                                                        {rollo.tipo_tela}
                                                    </td>
                                                    <td className="px-4 py-4 text-xs">
                                                        <span className="font-bold border px-2 py-1 flex w-fit items-center rounded bg-stone-100 dark:bg-zinc-800 uppercase">
                                                            <div className="w-2 h-2 rounded-full mr-2 shadow-inner border border-stone-200 dark:border-zinc-700" style={{ backgroundColor: rollo.color.toLowerCase().replace(' ', '') }}></div>
                                                            {rollo.color}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <span className="font-bold text-indigo-600 dark:text-indigo-400">{rollo.metros} m</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-right border-l border-stone-100 dark:border-zinc-800/50">
                                                        <span className="font-medium text-stone-700 dark:text-stone-300">{rollo.peso_kg} kg</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-right text-xs border-l border-stone-100 dark:border-zinc-800/50 text-stone-400">
                                                        {rollo.fecha_ingreso.toLocaleDateString()} {rollo.fecha_ingreso.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
        </ProtectedRoute>
    );
}
