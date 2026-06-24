"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Settings, Pencil, Trash2, Loader2, Save, X, Plus, Users, Check, AlertTriangle, ShieldCheck, Palette, Layers, ShieldAlert } from "lucide-react";
import { getOpcionesFormulario, updateOpcionConfiguracion, guardarNuevaOpcion } from "@/lib/firestoreUtils";
import { collection, getDocs, doc, updateDoc, query, orderBy, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ModalAñadirOpcion from "@/components/admin/ModalAñadirOpcion";
import { motion, AnimatePresence } from "framer-motion";

type Area = "master" | "sales" | "inventory" | "salida" | "cutting" | "sewing";

interface UserData {
    id: string;
    email: string;
    displayName: string;
    areas_acceso: Area[];
    createdAt: Date;
}

const AREAS_LABELS: Record<Area, string> = {
    master: "👑 Admin Master",
    sales: "🛒 Punto de Venta",
    inventory: "📦 Inventario",
    salida: "🚪 Salidas de Almacén",
    cutting: "✂️ Área de Corte",
    sewing: "🧵 Área de Costura",
};

// Cyber-luxury distinct colors for tags
const AREAS_THEME: Record<Area, { border: string, bg: string, text: string, gradient: string }> = {
    master: { border: "border-yellow-500/30", bg: "bg-yellow-500/10", text: "text-yellow-400", gradient: "from-yellow-500/20 to-transparent" },
    sales: { border: "border-emerald-500/30", bg: "bg-emerald-500/10", text: "text-emerald-400", gradient: "from-emerald-500/20 to-transparent" },
    inventory: { border: "border-blue-500/30", bg: "bg-blue-500/10", text: "text-blue-400", gradient: "from-blue-500/20 to-transparent" },
    salida: { border: "border-orange-500/30", bg: "bg-orange-500/10", text: "text-orange-400", gradient: "from-orange-500/20 to-transparent" },
    cutting: { border: "border-purple-500/30", bg: "bg-purple-500/10", text: "text-purple-400", gradient: "from-purple-500/20 to-transparent" },
    sewing: { border: "border-rose-500/30", bg: "bg-rose-500/10", text: "text-rose-400", gradient: "from-rose-500/20 to-transparent" },
};

export default function ConfiguracionPage() {
    const [activeTab, setActiveTab] = useState<'categorias' | 'usuarios'>('categorias');

    // Categorías state
    const [isLoading, setIsLoading] = useState(true);
    const [categorias, setCategorias] = useState<Record<string, string[]>>({});
    const [colores, setColores] = useState<string[]>([]);
    const [editingNode, setEditingNode] = useState<{ tipo: 'categoria' | 'tipo_prenda' | 'color', valorActual: string, categoria?: string } | null>(null);
    const [editValue, setEditValue] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; tipo: 'categoria' | 'tipo_prenda' | 'color' | null; placeholder: string; title: string; extraData?: string }>({ isOpen: false, tipo: null, placeholder: '', title: '' });
    const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

    // Usuarios state
    const [usuarios, setUsuarios] = useState<UserData[]>([]);
    const [isLoadingUsuarios, setIsLoadingUsuarios] = useState(false);
    const [editingUsuario, setEditingUsuario] = useState<string | null>(null);
    const [tempAreas, setTempAreas] = useState<Area[]>([]);
    const [isSavingUsuario, setIsSavingUsuario] = useState(false);
    const [modalEliminarUsuario, setModalEliminarUsuario] = useState<{ open: boolean; item: UserData | null; isDeleting: boolean }>({
        open: false,
        item: null,
        isDeleting: false
    });

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

    const loadUsuarios = async () => {
        setIsLoadingUsuarios(true);
        try {
            const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            const users: UserData[] = [];
            snap.forEach(docSnap => {
                const data = docSnap.data();
                let areas: Area[] = [];
                if (data.areas_acceso && Array.isArray(data.areas_acceso)) {
                    areas = data.areas_acceso as Area[];
                } else if (data.role) {
                    areas = [data.role as Area];
                } else {
                    areas = ["sales"];
                }
                users.push({
                    id: docSnap.id,
                    email: data.email || '',
                    displayName: data.displayName || data.email?.split('@')[0] || 'Sin nombre',
                    areas_acceso: areas,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                });
            });
            setUsuarios(users);
        } catch (error) {
            console.error("Error cargando usuarios:", error);
            toast.error("No se pudieron cargar los usuarios");
        } finally {
            setIsLoadingUsuarios(false);
        }
    };

    useEffect(() => {
        loadData();
        loadUsuarios();
    }, []);

    // Categorías handlers
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

    // Usuarios handlers
    const toggleArea = (usuarioId: string, area: Area) => {
        setTempAreas(prev =>
            prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
        );
    };

    const startEditUsuario = (usuario: UserData) => {
        setEditingUsuario(usuario.id);
        setTempAreas([...usuario.areas_acceso]);
    };

    const cancelEditUsuario = () => {
        setEditingUsuario(null);
        setTempAreas([]);
    };

    const saveEditUsuario = async (usuarioId: string) => {
        if (tempAreas.length === 0) {
            toast.error("El usuario debe tener al menos un área de acceso.");
            return;
        }
        setIsSavingUsuario(true);
        try {
            await updateDoc(doc(db, 'users', usuarioId), {
                areas_acceso: tempAreas
            });
            setUsuarios(prev =>
                prev.map(u =>
                    u.id === usuarioId ? { ...u, areas_acceso: tempAreas } : u
                )
            );
            toast.success("Áreas de acceso actualizadas correctamente.");
            setEditingUsuario(null);
            setTempAreas([]);
        } catch (error) {
            console.error("Error al actualizar usuario:", error);
            toast.error("No se pudieron guardar los cambios.");
        } finally {
            setIsSavingUsuario(false);
        }
    };

    const handleEliminarUsuario = (usuario: UserData) => {
        setModalEliminarUsuario({ open: true, item: usuario, isDeleting: false });
    };

    const confirmarEliminarUsuario = async () => {
        if (!modalEliminarUsuario.item) return;
        setModalEliminarUsuario(prev => ({ ...prev, isDeleting: true }));
        try {
            await deleteDoc(doc(db, 'users', modalEliminarUsuario.item.id));
            setUsuarios(prev => prev.filter(u => u.id !== modalEliminarUsuario.item!.id));
            toast.success(`Usuario ${modalEliminarUsuario.item.displayName} eliminado correctamente.`);
            setModalEliminarUsuario({ open: false, item: null, isDeleting: false });
        } catch (error) {
            console.error("Error al eliminar usuario:", error);
            toast.error("No se pudo eliminar el usuario.");
            setModalEliminarUsuario(prev => ({ ...prev, isDeleting: false }));
        }
    };

    // UI Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants: any = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <ProtectedRoute allowedAreas={["master"]}>
            <div className="space-y-8 pb-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 border-b border-white/5 pb-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter text-white drop-shadow-sm flex items-center gap-3">
                            <Settings className="w-8 h-8 text-orange-500" />
                            CONFIGURACIÓN MAESTRA
                        </h1>
                        <p className="text-zinc-500 uppercase tracking-[0.2em] text-xs font-bold mt-2">Control del Sistema Central</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl w-fit border border-white/5 backdrop-blur-md">
                    <button
                        onClick={() => setActiveTab('categorias')}
                        className={`flex items-center px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all duration-300 ${activeTab === 'categorias' ? "bg-orange-600 shadow-lg shadow-orange-900/30 text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"}`}
                    >
                        <Layers className="w-4 h-4 mr-2" /> Base de Datos
                    </button>
                    <button
                        onClick={() => setActiveTab('usuarios')}
                        className={`flex items-center px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all duration-300 ${activeTab === 'usuarios' ? "bg-orange-600 shadow-lg shadow-orange-900/30 text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"}`}
                    >
                        <ShieldCheck className="w-4 h-4 mr-2" /> Privilegios y Usuarios
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'categorias' ? (
                        <motion.div key="categorias" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full">
                            {isLoading ? (
                                <div className="flex justify-center py-20">
                                    <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Categorias y Tipos Panel */}
                                    <div className="bg-[#050505] rounded-3xl p-6 shadow-2xl border border-white/5 h-fit relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 z-0"></div>
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-center mb-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-orange-500/10 rounded-xl border border-orange-500/20">
                                                        <Layers className="w-5 h-5 text-orange-400" />
                                                    </div>
                                                    <h2 className="text-xl font-bold text-white tracking-tight">Estructura Base</h2>
                                                </div>
                                                <button onClick={() => openAddModal('categoria')} className="text-xs bg-orange-600 text-white px-4 py-2 rounded-xl hover:bg-orange-500 font-bold flex items-center transition-all shadow-[0_0_15px_rgba(234,88,12,0.3)] hover:shadow-[0_0_25px_rgba(234,88,12,0.5)]">
                                                    <Plus className="w-3.5 h-3.5 mr-1" /> Nueva Categoría
                                                </button>
                                            </div>
                                            
                                            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
                                                {Object.keys(categorias).length === 0 ? (
                                                    <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
                                                        <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest">Base Pura ~ Sin Datos</p>
                                                    </div>
                                                ) : (
                                                    Object.entries(categorias).map(([catName, tipos]) => (
                                                        <motion.div variants={itemVariants} key={catName} className="border border-white/10 rounded-2xl overflow-hidden bg-black/40 backdrop-blur-sm">
                                                            <div className="bg-white/5 p-4 flex justify-between items-center group/header hover:bg-white/10 transition-colors">
                                                                {editingNode?.tipo === 'categoria' && editingNode.valorActual === catName ? (
                                                                    <div className="flex items-center gap-2 flex-1 mr-4">
                                                                        <input autoFocus type="text" value={editValue} onChange={e => setEditValue(e.target.value)} className="text-sm font-bold bg-black text-white border border-orange-500 rounded-lg px-3 py-1.5 w-full outline-none focus:ring-2 ring-orange-500/50" />
                                                                        <button onClick={saveEdit} disabled={isSaving} className="p-1.5 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 transition-colors"><Save className="w-4 h-4" /></button>
                                                                        <button onClick={cancelEdit} disabled={isSaving} className="p-1.5 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"><X className="w-4 h-4" /></button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex justify-between items-center w-full">
                                                                        <h3 className="font-bold text-lg text-white capitalize">{catName}</h3>
                                                                        <div className="flex items-center gap-2 opacity-0 group-hover/header:opacity-100 transition-opacity">
                                                                            <button onClick={() => startEdit('categoria', catName)} className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-400 hover:bg-white/5" title="Editar"><Pencil className="w-3.5 h-3.5" /></button>
                                                                            <button onClick={() => deleteItem('categoria', catName)} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-white/5" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                                                                            <button onClick={() => openAddModal('tipo_prenda', catName)} className="ml-2 px-3 py-1 bg-white/5 rounded-lg text-xs font-bold text-orange-400 hover:bg-white/10" title="Añadir Tipo">+ Sub-Tipo</button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="p-2 flex flex-wrap gap-2 bg-black/60">
                                                                {tipos.length === 0 ? (
                                                                    <div className="px-4 py-2 w-full text-xs text-zinc-600 italic">Árbol vacío</div>
                                                                ) : (
                                                                    tipos.map(tipo => (
                                                                        <div key={tipo} className="flex-auto min-w-[45%]">
                                                                            {editingNode?.tipo === 'tipo_prenda' && editingNode.valorActual === tipo && editingNode.categoria === catName ? (
                                                                                <div className="flex items-center gap-2 p-1.5 bg-zinc-900 border border-white/10 rounded-lg">
                                                                                    <input autoFocus type="text" value={editValue} onChange={e => setEditValue(e.target.value)} className="text-xs font-bold bg-black text-white border border-blue-500 rounded px-2 py-1 w-full outline-none" />
                                                                                    <button onClick={saveEdit} disabled={isSaving} className="text-emerald-400"><Save className="w-3 h-3" /></button>
                                                                                    <button onClick={cancelEdit} disabled={isSaving} className="text-zinc-500 pr-1"><X className="w-3 h-3" /></button>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="group/item flex items-center justify-between p-2 px-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-orange-500/5 hover:border-orange-500/20 transition-all">
                                                                                    <span className="text-sm font-medium text-zinc-300 capitalize flex items-center">
                                                                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500/50 mr-2 shadow-[0_0_8px_rgba(234,88,12,0.8)]"></span>
                                                                                        {tipo}
                                                                                    </span>
                                                                                    <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                                                        <button onClick={() => startEdit('tipo_prenda', tipo, catName)} className="p-1 text-zinc-500 hover:text-blue-400"><Pencil className="w-3 h-3" /></button>
                                                                                        <button onClick={() => deleteItem('tipo_prenda', tipo, catName)} className="p-1 text-zinc-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    ))
                                                )}
                                            </motion.div>
                                        </div>
                                    </div>
                                    
                                    {/* Colores Panel */}
                                    <div className="bg-[#050505] rounded-3xl p-6 shadow-2xl border border-white/5 h-fit relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-64 h-64 bg-fuchsia-500/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 z-0"></div>
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-center mb-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-fuchsia-500/10 rounded-xl border border-fuchsia-500/20">
                                                        <Palette className="w-5 h-5 text-fuchsia-400" />
                                                    </div>
                                                    <h2 className="text-xl font-bold text-white tracking-tight">Paleta Global</h2>
                                                </div>
                                                <button onClick={() => openAddModal('color')} className="text-xs bg-fuchsia-600 text-white px-4 py-2 rounded-xl hover:bg-fuchsia-500 font-bold flex items-center transition-all shadow-[0_0_15px_rgba(192,38,211,0.3)] hover:shadow-[0_0_25px_rgba(192,38,211,0.5)]">
                                                    <Plus className="w-3.5 h-3.5 mr-1" /> Nuevo Color
                                                </button>
                                            </div>

                                            <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden p-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {colores.length === 0 ? (
                                                    <div className="col-span-full py-12 text-center">
                                                        <p className="text-xs font-medium text-zinc-600 uppercase tracking-widest">Sin Paleta Definida</p>
                                                    </div>
                                                ) : (
                                                    colores.map(c => (
                                                        <div key={c} className="group/color">
                                                            {editingNode?.tipo === 'color' && editingNode.valorActual === c ? (
                                                                <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-white/10 rounded-xl w-full">
                                                                    <div className={`w-3 h-3 rounded-full flex-shrink-0 animate-pulse`} style={{ backgroundColor: c.toLowerCase().replace(" ", "") /* just visual */}} />
                                                                    <input autoFocus type="text" value={editValue} onChange={e => setEditValue(e.target.value)} className="text-[10px] sm:text-xs font-bold bg-black text-white border border-blue-500/50 rounded px-1.5 py-1 w-full outline-none" />
                                                                    <button onClick={saveEdit} disabled={isSaving} className="text-emerald-400 ml-1"><Save className="w-3.5 h-3.5" /></button>
                                                                    <button onClick={cancelEdit} disabled={isSaving} className="text-zinc-500 pr-1"><X className="w-3.5 h-3.5" /></button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-between p-2 px-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.06] transition-all">
                                                                    <div className="flex items-center gap-2 truncate">
                                                                        <div className="w-3 h-3 rounded-full shadow-inner border border-white/20" style={{ backgroundColor: c.toLowerCase().split("-")[0].trim() /* heuristic */}}></div>
                                                                        <span className="text-sm font-medium text-zinc-300 capitalize truncate">{c}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1 opacity-0 group-hover/color:opacity-100 transition-opacity ml-1 flex-shrink-0">
                                                                        <button onClick={() => startEdit('color', c)} className="p-1 text-zinc-500 hover:text-blue-400"><Pencil className="w-3 h-3" /></button>
                                                                        <button onClick={() => deleteItem('color', c)} className="p-1 text-zinc-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div key="usuarios" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <div className="bg-[#050505] rounded-3xl p-6 md:p-8 shadow-2xl border border-white/5 relative overflow-hidden">
                                {/* Ambient Glow */}
                                <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 z-0"></div>
                                
                                {isLoadingUsuarios ? (
                                    <div className="flex justify-center py-32 relative z-10">
                                        <Loader2 className="w-10 h-10 animate-spin text-orange-600" />
                                    </div>
                                ) : (
                                    <div className="relative z-10">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
                                            <div>
                                                <h2 className="text-2xl font-black text-white tracking-tight flex items-center">
                                                    Usuarios Activos
                                                </h2>
                                                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-2 bg-white/5 px-3 py-1 rounded-full w-fit">Gestión Autónoma de Master</p>
                                            </div>
                                            <div className="text-sm text-zinc-500 flex items-center bg-black/40 px-4 py-2 border border-white/5 rounded-xl">
                                                <Users className="w-4 h-4 mr-2 text-zinc-400" />
                                                {usuarios.length} Accesos
                                            </div>
                                        </div>

                                        {usuarios.length === 0 ? (
                                            <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-3xl bg-black/40">
                                                <ShieldCheck className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                                                <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest">Protocolo Fantasma ~ Sin Usuarios</p>
                                            </div>
                                        ) : (
                                            <div className="grid md:grid-cols-2 gap-4 xl:grid-cols-3">
                                                {usuarios.map(usuario => (
                                                    <motion.div key={usuario.id} layout className={`group flex flex-col border rounded-3xl overflow-hidden transition-all duration-300 ${editingUsuario === usuario.id ? 'border-orange-500/40 shadow-[0_0_30px_rgba(234,88,12,0.15)] bg-[#0a0a0a]' : 'border-white/5 bg-black/40 hover:border-white/10 hover:bg-black/60'}`}>
                                                        
                                                        {/* Top ID Card Section */}
                                                        <div className={`p-5 flex items-start gap-4 border-b ${editingUsuario === usuario.id ? 'border-orange-500/20' : 'border-white/5'}`}>
                                                            <div className="relative shrink-0">
                                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center text-white font-black text-lg shadow-inner relative z-10">
                                                                    {usuario.displayName.charAt(0).toUpperCase()}
                                                                </div>
                                                                {editingUsuario === usuario.id && (
                                                                    <div className="absolute inset-0 bg-orange-500 blur-md opacity-40 rounded-2xl"></div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-white text-base truncate">{usuario.displayName}</p>
                                                                <p className="text-xs text-zinc-500 truncate">{usuario.email}</p>
                                                                <div className="text-[9px] text-zinc-600 mt-1 uppercase font-bold tracking-wider">
                                                                    ID: {usuario.id.substring(0,8)}
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-1 shrink-0">
                                                                {editingUsuario === usuario.id ? (
                                                                    <>
                                                                        <button onClick={() => saveEditUsuario(usuario.id)} disabled={isSavingUsuario} className="p-1.5 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors"><Save className="w-4 h-4" /></button>
                                                                        <button onClick={cancelEditUsuario} disabled={isSavingUsuario} className="p-1.5 text-zinc-400 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <button onClick={() => startEditUsuario(usuario)} className="p-1.5 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 opacity-0 group-hover:opacity-100 rounded-lg transition-all" title="Ver / Editar Permisos"><Pencil className="w-4 h-4" /></button>
                                                                        <button onClick={() => handleEliminarUsuario(usuario)} className="p-1.5 text-red-500 bg-red-500/10 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 rounded-lg transition-all" title="Pugar Sistema"><Trash2 className="w-4 h-4" /></button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Bottom Access Section */}
                                                        <div className="p-5 flex-1 flex flex-col bg-gradient-to-b from-transparent to-black/40">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Nivel de Autorización</p>
                                                                {editingUsuario === usuario.id && <span className="text-[10px] text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 animate-pulse">MODO EDICIÓN</span>}
                                                            </div>

                                                            {editingUsuario === usuario.id ? (
                                                                <div className="space-y-2 flex-1">
                                                                    {(Object.keys(AREAS_LABELS) as Area[]).map(area => {
                                                                        const isSelected = tempAreas.includes(area);
                                                                        const theme = AREAS_THEME[area];
                                                                        
                                                                        return (
                                                                        <button
                                                                            key={area}
                                                                            type="button"
                                                                            onClick={() => toggleArea(usuario.id, area)}
                                                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-300 overflow-hidden relative ${isSelected
                                                                                ? `${theme.border} bg-white/[0.02]`
                                                                                : "border-white/5 bg-transparent hover:bg-white/5 hover:border-white/10"
                                                                                }`}
                                                                        >
                                                                            {isSelected && (
                                                                                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${theme.gradient}`}></div>
                                                                            )}
                                                                            <span className={`text-xs font-bold z-10 transition-colors ${isSelected ? "text-white drop-shadow-md" : "text-zinc-500"}`}>
                                                                                {AREAS_LABELS[area].split(" ")[0]} <span className={isSelected ? theme.text : ""}>{AREAS_LABELS[area].split(" ").slice(1).join(" ")}</span>
                                                                            </span>
                                                                            <div className={`w-4 h-4 rounded-full flex items-center justify-center border-2 transition-all z-10 ${isSelected
                                                                                ? `${theme.border.replace("border-", "bg-").split("/")[0]} border-transparent`
                                                                                : "border-zinc-700 bg-transparent"
                                                                                }`}>
                                                                                {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                                                            </div>
                                                                        </button>
                                                                    )})}
                                                                    {tempAreas.length === 0 && (
                                                                        <p className="text-[10px] text-red-500 font-bold text-center pt-2">⚠️ PROTOCOLO DE ALERTA: Sin Zonas Designadas</p>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-wrap gap-2 flex-1 content-start">
                                                                    {usuario.areas_acceso.map(area => {
                                                                        const theme = AREAS_THEME[area] || AREAS_THEME.master; // Fallback
                                                                        return (
                                                                        <div
                                                                            key={area}
                                                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border flex items-center gap-1.5 backdrop-blur-md relative overflow-hidden group/tag ${theme.border} ${theme.bg}`}
                                                                        >
                                                                            <div className={`absolute inset-0 bg-gradient-to-r opacity-20 ${theme.gradient} pointer-events-none`}></div>
                                                                            <span className={theme.text}>{AREAS_LABELS[area].split(" ")[0]}</span>
                                                                            <span className="text-white drop-shadow-sm">{AREAS_LABELS[area].split(" ").slice(1).join(" ")}</span>
                                                                        </div>
                                                                    )})}
                                                                    {usuario.areas_acceso.length === 0 && (
                                                                        <span className="text-[10px] font-bold text-red-500/70 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg flex items-center"><ShieldAlert className="w-3 h-3 mr-1" /> Acceso Restringido</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <div className="flex justify-between items-center mt-5 pt-4 border-t border-white/5 text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                                                                <span>Ingreso: {usuario.createdAt.toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <ModalAñadirOpcion
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                placeholder={modalConfig.placeholder}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={handleAddConfirm}
                isSubmitting={isSubmittingAdd}
            />

            {/* Modal eliminar usuario Cyber-Lujo Variante */}
            <AnimatePresence>
                {modalEliminarUsuario.open && modalEliminarUsuario.item && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-[#0a0a0a] rounded-3xl shadow-2xl w-full max-w-md border border-red-500/20 overflow-hidden relative">
                            {/* Danger Glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-red-500/20 blur-[50px] rounded-full pointer-events-none"></div>

                            <div className="relative z-10 p-8 text-center border-b border-white/5">
                                <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                                    <AlertTriangle className="w-10 h-10 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                                </div>
                                <h2 className="text-2xl font-black text-white tracking-tight mb-2 uppercase">Purgar Entidad</h2>
                                <p className="text-xs font-bold text-red-400 bg-red-500/10 px-3 py-1 rounded inline-block">ADVERTENCIA NIVEL DOOMSDAY</p>
                            </div>
                            
                            <div className="p-8 relative z-10">
                                <p className="text-sm font-medium text-zinc-400 text-center leading-relaxed mb-6">
                                    Destrucción absoluta del acceso para la entidad <span className="text-white font-bold block mt-1 text-lg">{modalEliminarUsuario.item.displayName}</span>
                                </p>
                                <div className="bg-black/60 rounded-xl border border-white/5 p-4 flex gap-4 items-center justify-center font-mono text-xs text-zinc-500">
                                    <span>HASH:</span>
                                    <span className="text-zinc-300">{modalEliminarUsuario.item.id}</span>
                                </div>
                            </div>

                            <div className="flex gap-4 p-8 pt-0 relative z-10">
                                <button
                                    onClick={() => setModalEliminarUsuario({ open: false, item: null, isDeleting: false })}
                                    disabled={modalEliminarUsuario.isDeleting}
                                    className="flex-1 py-3 rounded-2xl border border-white/10 text-zinc-300 font-bold hover:bg-white/5 transition-all focus:outline-none focus:ring-2 ring-white/20 disabled:opacity-50 text-sm"
                                >
                                    ABORTAR
                                </button>
                                <button
                                    onClick={confirmarEliminarUsuario}
                                    disabled={modalEliminarUsuario.isDeleting}
                                    className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black flex justify-center items-center gap-2 transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] disabled:opacity-50 text-sm tracking-wider"
                                >
                                    {modalEliminarUsuario.isDeleting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        "EJECUTAR"
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </ProtectedRoute>
    );
}
