"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { MoveRight, Layers, FileText, Loader2, Pencil, Trash2 } from "lucide-react";
import { useFormulariosProducto } from "@/hooks/useFormulariosProducto";
import { useAuth } from "@/context/AuthContext";
import { guardarRegistroProduccion } from "@/lib/firestoreUtils";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ModalAñadirOpcion from "@/components/admin/ModalAñadirOpcion";

type VarianteLote = {
    id: string;
    publico: string;
    talla: string;
    color: string;
    cantidad: number;
};

type SewingRecord = {
    id: string;
    categoria: string;
    tipo: string;
    variantes: VarianteLote[];
    total: number;
    fecha: Date;
};

export default function PaginaCostura() {
    const { user } = useAuth();
    const [records, setRecords] = useState<SewingRecord[]>([]);
    const [variantes, setVariantes] = useState<VarianteLote[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Instanciar Hook de Formularios Reutilizable
    const {
        categoria, tipoProducto, publico, talla, cantidad, color,
        setCantidad, setTipoProducto, setTalla, setColor,
        tiposDisponibles, tallasDisponibles, categoriasDisponibles, publicosDisponibles, coloresDisponibles,
        handleCategoriaChange, handlePublicoChange, resetFormulario,
        modalConfig, isSubmittingModal, abrirModalNuevo, abrirModalEditar, abrirModalEliminar, cerrarModal, confirmarModal
    } = useFormulariosProducto();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const q = query(collection(db, 'registros_costura'), orderBy('fecha_registro', 'desc'));
                const snap = await getDocs(q);
                const fetchedRecords: SewingRecord[] = [];
                snap.forEach(doc => {
                    const data = doc.data();
                    fetchedRecords.push({
                        id: doc.id,
                        categoria: data.categoria,
                        tipo: data.tipo_producto || data.tipo,
                        variantes: data.variantes || [],
                        total: data.total_confeccionado || 0,
                        fecha: data.fecha_registro?.toDate ? data.fecha_registro.toDate() : new Date(),
                    });
                });
                setRecords(fetchedRecords);
            } catch (error) {
                console.error("Error fetching historical sewing records:", error);
            }
        };
        fetchHistory();
    }, []);

    const handleAgregarVariante = () => {
        if (!publico || !talla || !color || cantidad <= 0) {
            toast.error("Por favor completa público, talla, color y cantidad para añadir a la lista.");
            return;
        }
        const nuevaVariante: VarianteLote = { id: Date.now().toString(), publico, talla, color, cantidad: Number(cantidad) };
        setVariantes([...variantes, nuevaVariante]);
        setTalla('');
        setCantidad(1);
    };

    const handleRemoverVariante = (id: string) => {
        setVariantes(variantes.filter(v => v.id !== id));
    };

    const totalLote = variantes.reduce((acc, v) => acc + v.cantidad, 0);

    const handleAgregarRegistro = async () => {
        if (!categoria || !tipoProducto || variantes.length === 0 || isSubmitting) {
            toast.error("Selecciona la categoría, el tipo de prenda y añade al menos una variante.");
            return;
        }

        setIsSubmitting(true);
        try {
            const registro = {
                id_usuario: user?.uid || "desconocido",
                nombre_usuario: user?.email ? user.email.split('@')[0] : "Anonimo",
                categoria,
                tipo_producto: tipoProducto,
                variantes,
                total_confeccionado: totalLote,
            };

            const idRegistro = await guardarRegistroProduccion('registros_costura', registro);

            const nuevoRegistro: SewingRecord = {
                id: idRegistro,
                categoria,
                tipo: tipoProducto,
                variantes,
                total: totalLote,
                fecha: new Date(),
            };

            setRecords([nuevoRegistro, ...records]);

            // Limpiar todo después de guardar el lote
            setVariantes([]);
            setTipoProducto('');
            toast.success(`Lote de costura #${idRegistro} guardado con ${totalLote} prendas en total.`);
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar el lote. Revisa tu conexión o permisos.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalConfeccionadoHoy = records.reduce((acc, current) => acc + current.total, 0);

    return (
        <ProtectedRoute allowedRoles={["master", "sewing"]}>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-white">Área de Costura</h1>

                {/* Dashboard Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-zinc-800 flex items-center">
                        <div className="p-4 bg-teal-100 dark:bg-teal-500/20 text-teal-600 rounded-xl mr-4">
                            <Layers className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-stone-500 font-medium">Histórico: Prendas Confeccionadas</p>
                            <p className="text-3xl font-bold text-stone-900 dark:text-white">{totalConfeccionadoHoy}</p>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Add Record Form */}
                    <div className="lg:col-span-1 bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-zinc-800 h-fit">
                        <h2 className="text-xl font-bold mb-6 flex items-center">
                            <FileText className="w-5 h-5 mr-2 text-teal-600" /> Registrar Costura
                        </h2>
                        <form onSubmit={handleAgregarRegistro} className="space-y-5">
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
                                            className="flex-1 px-4 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-teal-500"
                                            required
                                        >
                                            <option value="" disabled>Seleccione...</option>
                                            {categoriasDisponibles.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                            <option value="___NUEVO___" className="text-teal-600 font-bold">+ Añadir Nueva...</option>
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
                                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Tipo de Prenda Armónica</label>
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
                                            className="flex-1 px-4 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                                            required
                                        >
                                            <option value="" disabled>Seleccione...</option>
                                            {tiposDisponibles.map(tipo => (
                                                <option key={tipo} value={tipo}>{tipo}</option>
                                            ))}
                                            <option value="___NUEVO___" className="text-teal-600 font-bold">+ Añadir Nuevo...</option>
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
                                        className="w-full px-4 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-teal-500"
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
                                        className="w-full px-4 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
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
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Color del Lote</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={color} onChange={e => {
                                                if (e.target.value === '___NUEVO___') {
                                                    abrirModalNuevo('color');
                                                } else {
                                                    setColor(e.target.value);
                                                }
                                            }}
                                            className="flex-1 px-4 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-teal-500"
                                        >
                                            <option value="" disabled>Seleccione...</option>
                                            {coloresDisponibles?.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                            <option value="___NUEVO___" className="text-teal-600 font-bold">+ Añadir Nuevo...</option>
                                        </select>
                                        {color && (
                                            <div className="flex gap-1">
                                                <button type="button" onClick={() => abrirModalEditar('color', color)} className="p-2 text-stone-400 hover:text-blue-600 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg transition-colors border-dashed" title="Renombrar Color"><Pencil className="w-5 h-5" /></button>
                                                <button type="button" onClick={() => abrirModalEliminar('color', color)} className="p-2 text-stone-400 hover:text-red-600 bg-stone-50 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg transition-colors border-dashed" title="Eliminar Color"><Trash2 className="w-5 h-5" /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Cantidad Terminada</label>
                                    <input
                                        type="number" min="1"
                                        value={cantidad} onChange={e => setCantidad(Number(e.target.value))}
                                        className="w-full px-4 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-teal-500 font-bold"
                                    />
                                </div>
                            </div>

                            <button type="button" onClick={handleAgregarVariante} className={`w-full py-4 flex items-center justify-center font-black rounded-xl transition-all shadow-md text-white bg-teal-600 hover:bg-teal-700 hover:shadow-lg active:scale-[0.98]`}>
                                + Añadir Variante a la Lista
                            </button>

                            {variantes.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-stone-100 dark:border-zinc-800">
                                    <h3 className="text-sm font-bold text-stone-600 dark:text-stone-400 mb-2">Variantes Configuradas ({totalLote} prendas en total)</h3>
                                    <ul className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-2">
                                        {variantes.map(v => (
                                            <li key={v.id} className="flex justify-between items-center text-xs bg-stone-50 dark:bg-zinc-900/50 p-2 rounded-md border border-stone-100 dark:border-zinc-800">
                                                <span>{v.publico} • {v.talla} • {v.color}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold">{v.cantidad} u.</span>
                                                    <button type="button" onClick={() => handleRemoverVariante(v.id)} className="text-red-500 hover:text-red-700 font-bold">X</button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <button type="button" onClick={handleAgregarRegistro} disabled={isSubmitting || variantes.length === 0} className="w-full py-4 mt-2 flex items-center justify-center bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors shadow-sm disabled:opacity-50">
                                {isSubmitting ? (
                                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Procesando...</>
                                ) : (
                                    <><MoveRight className="w-5 h-5 mr-2" /> Enviar a Almacén</>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Sewing Table */}
                    <div className="lg:col-span-2 bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-zinc-800 overflow-hidden flex flex-col h-full">
                        <h2 className="text-xl font-bold mb-4">Historial de Lotes de Costura</h2>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left text-sm text-stone-600 dark:text-stone-400">
                                <thead className="text-xs text-stone-500 uppercase bg-stone-50 dark:bg-zinc-900">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">Prenda</th>
                                        <th className="px-4 py-3">Público / Talla</th>
                                        <th className="px-4 py-3">Color</th>
                                        <th className="px-4 py-3 text-right">Cantidad</th>
                                        <th className="px-4 py-3 text-right rounded-tr-lg">Hora</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-12 text-center text-stone-500 border-2 border-dashed border-stone-200 dark:border-zinc-800 rounded-xl mt-4">
                                                No hay lotes de costura registrados en el historial general.
                                            </td>
                                        </tr>
                                    ) : (
                                        records.flatMap((record) => 
                                            record.variantes.map((v, vIdx) => (
                                                <tr key={`${record.id}-${vIdx}`} className="border-b border-stone-100 dark:border-zinc-800 last:border-0 hover:bg-stone-50 dark:hover:bg-zinc-900/50">
                                                    {vIdx === 0 ? (
                                                        <td rowSpan={record.variantes.length} className="px-4 py-4 font-medium text-stone-900 dark:text-white capitalize border-r border-stone-100 dark:border-zinc-800/50 align-top pt-5">
                                                            {record.categoria} {record.tipo}
                                                        </td>
                                                    ) : null}
                                                    <td className="px-4 py-3 capitalize text-xs">
                                                        {v.publico} • <span className="font-bold border px-1 rounded mx-1 bg-stone-100 dark:bg-zinc-800 uppercase">{v.talla}</span>
                                                    </td>
                                                    <td className="px-4 py-3 capitalize text-xs">
                                                        {v.color}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="font-bold text-stone-900 dark:text-white">{v.cantidad} u.</span>
                                                    </td>
                                                    {vIdx === 0 ? (
                                                        <td rowSpan={record.variantes.length} className="px-4 py-4 text-right text-xs border-l border-stone-100 dark:border-zinc-800/50 align-top pt-5 text-stone-500">
                                                            {record.fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
