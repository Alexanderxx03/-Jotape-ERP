"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Settings, Pencil, Trash2, Loader2, Save, X, Plus } from "lucide-react";
import { getOpcionesFormulario, updateOpcionConfiguracion, guardarNuevaOpcion } from "@/lib/firestoreUtils";
import ModalAñadirOpcion from "@/components/admin/ModalAñadirOpcion";

export default function ConfiguracionPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [categorias, setCategorias] = useState<Record<string, string[]>>({});
    const [colores, setColores] = useState<string[]>([]);

    // Edit state
    const [editingNode, setEditingNode] = useState<{ tipo: 'categoria' | 'tipo_prenda' | 'color', valorActual: string, categoria?: string } | null>(null);
    const [editValue, setEditValue] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Add state 
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; tipo: 'categoria' | 'tipo_prenda' | 'color' | null; placeholder: string; title: string; extraData?: string }>({ isOpen: false, tipo: null, placeholder: '', title: '' });
    const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data: any = await getOpcionesFormulario();
            setCategorias(data.categorias || {});
            setColores(data.colores || []);
        } catch (error) {
            console.error("Error cargando configuración:", error);
            toast.error("Error al cargar la configuración");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const startEdit = (tipo: 'categoria' | 'tipo_prenda' | 'color', valorActual: string, categoria?: string) => {
        setEditingNode({ tipo, valorActual, categoria });
        setEditValue(valorActual);
    };

    const cancelEdit = () => {
        setEditingNode(null);
        setEditValue("");
    };

    const saveEdit = async () => {
        if (!editingNode || !editValue.trim() || editValue.trim() === editingNode.valorActual) {
            cancelEdit();
            return;
        }

        setIsSaving(true);
        try {
            await updateOpcionConfiguracion(editingNode.tipo, {
                action: 'editar',
                valorActual: editingNode.valorActual,
                nuevoValor: editValue.trim(),
                categoria: editingNode.categoria
            });
            toast.success("Actualizado correctamente.");
            await loadData();
        } catch (error) {
            toast.error("Error al actualizar");
        } finally {
            setIsSaving(false);
            cancelEdit();
        }
    };

    const deleteItem = async (tipo: 'categoria' | 'tipo_prenda' | 'color', valorActual: string, categoria?: string) => {
        if (!confirm(`¿Estás seguro de eliminar '${valorActual}'?`)) return;

        try {
            await updateOpcionConfiguracion(tipo, {
                action: 'eliminar',
                valorActual,
                categoria
            });
            toast.success("Eliminado correctamente.");
            await loadData();
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    const openAddModal = (tipo: 'categoria' | 'tipo_prenda' | 'color', parentCat?: string) => {
        setModalConfig({
            isOpen: true,
            tipo,
            title: tipo === 'categoria' ? 'Añadir Categoría' : tipo === 'tipo_prenda' ? `Añadir Tipo a ${parentCat}` : 'Añadir Color',
            placeholder: 'Ingrese el nombre...',
            extraData: parentCat
        });
    };

    const handleAddConfirm = async (valor: string) => {
        if (!modalConfig.tipo || !valor.trim()) return;
        setIsSubmittingAdd(true);
        try {
            await guardarNuevaOpcion(modalConfig.tipo, {
                categoria: modalConfig.extraData,
                nuevoValor: valor.trim()
            });
            toast.success("Agregado correctamente.");
            await loadData();
            setModalConfig({ ...modalConfig, isOpen: false });
        } catch (error) {
            toast.error("Error al agregar");
        } finally {
            setIsSubmittingAdd(false);
        }
    };

    return (
        <ProtectedRoute allowedRoles={["master"]}>
            <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight flex items-center">
                            <Settings className="w-8 h-8 mr-3 text-orange-600" />
                            Configuración del Sistema
                        </h1>
                        <p className="text-stone-500 mt-1 flex items-center">
                            Gestiona las categorías, tipos de producto y colores.
                        </p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Categorias y Tipos */}
                        <div className="bg-white dark:bg-zinc-950 rounded-2xl p-6 shadow-sm border border-stone-200 dark:border-zinc-800">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-bold">Categorías y Tipos de Prenda</h2>
                                <button onClick={() => openAddModal('categoria')} className="text-sm bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg hover:bg-orange-200 font-bold flex items-center transition-colors">
                                    <Plus className="w-4 h-4 mr-1" /> Categoría
                                </button>
                            </div>

                            <div className="space-y-6">
                                {Object.keys(categorias).length === 0 ? (
                                    <p className="text-sm text-stone-500 text-center py-4">No hay categorías registradas.</p>
                                ) : (
                                    Object.entries(categorias).map(([catName, tipos]) => (
                                        <div key={catName} className="border border-stone-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                                            {/* Header de Categoria */}
                                            <div className="bg-stone-50 dark:bg-zinc-900 border-b border-stone-100 dark:border-zinc-800 p-3 flex justify-between items-center group">
                                                {editingNode?.tipo === 'categoria' && editingNode.valorActual === catName ? (
                                                    <div className="flex items-center gap-2 flex-1 mr-4">
                                                        <input autoFocus type="text" value={editValue} onChange={e => setEditValue(e.target.value)} className="text-sm font-bold bg-white dark:bg-zinc-950 border border-orange-300 dark:border-orange-700 rounded px-2 py-1 w-full" />
                                                        <button onClick={saveEdit} disabled={isSaving} className="text-green-600 hover:text-green-700"><Save className="w-4 h-4" /></button>
                                                        <button onClick={cancelEdit} disabled={isSaving} className="text-stone-400 hover:text-stone-600"><X className="w-4 h-4" /></button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-between items-center w-full">
                                                        <h3 className="font-bold text-stone-900 dark:text-white capitalize">{catName}</h3>
                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => startEdit('categoria', catName)} className="text-stone-400 hover:text-blue-600" title="Editar Categoría"><Pencil className="w-4 h-4" /></button>
                                                            <button onClick={() => deleteItem('categoria', catName)} className="text-stone-400 hover:text-red-600" title="Eliminar Categoría (Y todos sus tipos)"><Trash2 className="w-4 h-4" /></button>
                                                            <button onClick={() => openAddModal('tipo_prenda', catName)} className="text-stone-400 hover:text-orange-600 ml-2" title="Añadir Tipo de Prenda"><Plus className="w-4 h-4" /></button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Lista de Tipos */}
                                            <ul className="divide-y divide-stone-100 dark:divide-zinc-800/50 bg-white dark:bg-zinc-950">
                                                {tipos.length === 0 ? (
                                                    <li className="px-4 py-2 text-xs text-stone-400">Sin tipos registrados</li>
                                                ) : (
                                                    tipos.map(tipo => (
                                                        <li key={tipo} className="px-4 py-2.5 flex justify-between items-center group hover:bg-stone-50 dark:hover:bg-zinc-900/50 transition-colors">
                                                            {editingNode?.tipo === 'tipo_prenda' && editingNode.valorActual === tipo && editingNode.categoria === catName ? (
                                                                <div className="flex items-center gap-2 flex-1 w-full">
                                                                    <div className="w-2 h-2 rounded-full bg-stone-300 mr-2"></div>
                                                                    <input autoFocus type="text" value={editValue} onChange={e => setEditValue(e.target.value)} className="text-sm bg-stone-50 dark:bg-zinc-900 border border-blue-300 dark:border-blue-700 rounded px-2 py-1 flex-1" />
                                                                    <button onClick={saveEdit} disabled={isSaving} className="text-green-600 hover:text-green-700"><Save className="w-4 h-4" /></button>
                                                                    <button onClick={cancelEdit} disabled={isSaving} className="text-stone-400 hover:text-stone-600"><X className="w-4 h-4" /></button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <span className="text-sm text-stone-700 dark:text-stone-300 flex items-center capitalize">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700 mr-3"></div>
                                                                        {tipo}
                                                                    </span>
                                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button onClick={() => startEdit('tipo_prenda', tipo, catName)} className="text-stone-400 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                                                                        <button onClick={() => deleteItem('tipo_prenda', tipo, catName)} className="text-stone-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </li>
                                                    ))
                                                )}
                                            </ul>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Colores */}
                        <div className="bg-white dark:bg-zinc-950 rounded-2xl p-6 shadow-sm border border-stone-200 dark:border-zinc-800 h-fit">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-bold">Colores Predefinidos</h2>
                                <button onClick={() => openAddModal('color')} className="text-sm bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg hover:bg-orange-200 font-bold flex items-center transition-colors">
                                    <Plus className="w-4 h-4 mr-1" /> Color
                                </button>
                            </div>

                            <div className="border border-stone-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                                <ul className="divide-y divide-stone-100 dark:divide-zinc-800/50 bg-white dark:bg-zinc-950">
                                    {colores.length === 0 ? (
                                        <li className="px-4 py-8 text-sm text-stone-500 text-center">No hay colores registrados.</li>
                                    ) : (
                                        colores.map(c => (
                                            <li key={c} className="px-4 py-3 flex justify-between items-center group hover:bg-stone-50 dark:hover:bg-zinc-900/50 transition-colors">
                                                {editingNode?.tipo === 'color' && editingNode.valorActual === c ? (
                                                    <div className="flex items-center gap-2 flex-1 w-full">
                                                        <div className="w-3 h-3 rounded-full bg-stone-200 dark:bg-stone-700 mr-2 border border-stone-300 dark:border-stone-600"></div>
                                                        <input autoFocus type="text" value={editValue} onChange={e => setEditValue(e.target.value)} className="text-sm font-medium bg-stone-50 dark:bg-zinc-900 border border-blue-300 dark:border-blue-700 rounded px-2 py-1 flex-1" />
                                                        <button onClick={saveEdit} disabled={isSaving} className="text-green-600 hover:text-green-700"><Save className="w-4 h-4" /></button>
                                                        <button onClick={cancelEdit} disabled={isSaving} className="text-stone-400 hover:text-stone-600"><X className="w-4 h-4" /></button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="text-sm font-medium text-stone-800 dark:text-stone-200 flex items-center capitalize">
                                                            <div className="w-3 h-3 rounded-full mr-3 shadow-inner border border-stone-200 dark:border-zinc-700" style={{ backgroundColor: c.toLowerCase().replace(' ', '') }}></div>
                                                            {c}
                                                        </span>
                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => startEdit('color', c)} className="text-stone-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                                                            <button onClick={() => deleteItem('color', c)} className="text-stone-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </>
                                                )}
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ModalAñadirOpcion
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                placeholder={modalConfig.placeholder}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={handleAddConfirm}
                isSubmitting={isSubmittingAdd}
            />
        </ProtectedRoute>
    );
}
