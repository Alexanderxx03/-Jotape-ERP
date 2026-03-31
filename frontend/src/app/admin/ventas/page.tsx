"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { ShoppingCart, Banknote, Tag, Loader2, Pencil, Trash2 } from "lucide-react";
import { useFormulariosProducto } from "@/hooks/useFormulariosProducto";
import { useAuth } from "@/context/AuthContext";
import { guardarVenta } from "@/lib/firestoreUtils";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ModalAñadirOpcion from "@/components/admin/ModalAñadirOpcion";

type ItemVenta = {
    id: string;
    categoria: string;
    tipo: string;
    publico: string;
    talla: string;
    color: string;
    precio: number;
    cantidad: number;
};

export default function PaginaVentas() {
    const { user } = useAuth();
    const [carrito, setCarrito] = useState<ItemVenta[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Configuración para Notificaciones por WhatsApp
    const [enviarWA, setEnviarWA] = useState(false);
    const [telefonoCliente, setTelefonoCliente] = useState('');

    // Instanciar Hook de Formularios Reutilizable
    const {
        categoria, tipoProducto, publico, talla, cantidad, color,
        setCantidad, setTipoProducto, setTalla, setColor,
        tiposDisponibles, tallasDisponibles, categoriasDisponibles, publicosDisponibles, coloresDisponibles,
        handleCategoriaChange, handlePublicoChange, resetFormulario,
        modalConfig, isSubmittingModal, abrirModalNuevo, abrirModalEditar, abrirModalEliminar, cerrarModal, confirmarModal
    } = useFormulariosProducto();

    // Estado local solo para el precio (ya que el hook es general para todas las áreas)
    const [precio, setPrecio] = useState<number>(0);

    // Estado de las ventas registradas
    const [ventasGuardadas, setVentasGuardadas] = useState<any[]>([]);

    useEffect(() => {
        const fetchVentas = async () => {
            try {
                const q = query(collection(db, 'ventas'), orderBy('fecha_registro', 'desc'));
                const snap = await getDocs(q);
                const fetchedVentas: any[] = [];
                snap.forEach(doc => {
                    const data = doc.data();
                    fetchedVentas.push({
                        ...data,
                        id: doc.id,
                        fecha: data.fecha_registro?.toDate ? data.fecha_registro.toDate() : new Date(),
                    });
                });
                setVentasGuardadas(fetchedVentas);
            } catch (error) {
                console.error("Error fetching historical sales:", error);
            }
        };
        fetchVentas();
    }, []);

    const handleAgregarAlCarrito = (e: React.FormEvent) => {
        e.preventDefault();

        if (!categoria || !tipoProducto || !publico || !talla || !color || precio <= 0 || cantidad <= 0) {
            toast.error("Por favor completa todos los campos correctamente, incluyendo el color.");
            return;
        }

        const nuevoItem: ItemVenta = {
            id: Date.now().toString(),
            categoria,
            tipo: tipoProducto,
            publico,
            talla,
            color,
            precio: Number(precio),
            cantidad: Number(cantidad),
        };

        setCarrito([...carrito, nuevoItem]);

        // Limpiar el form pero mantener categoría y público por conveniencia
        setTipoProducto('');
        setTalla('');
        setColor('');
        setCantidad(1);
    };

    const handleCompletarVenta = async () => {
        if (carrito.length === 0 || isSubmitting) return;
        setIsSubmitting(true);
        try {
            // El id_vendedor puede ser el uid de Auth y el nombre su displayName o email formateado
            const nombreVendedor = user?.email ? user.email.split('@')[0] : "Anonimo";
            const idVenta = await guardarVenta(user?.uid, nombreVendedor, carrito, montoTotal);

            toast.success(`¡Venta #${idVenta} registrada con éxito por S/ ${montoTotal.toFixed(2)}!`);

            setVentasGuardadas([{
                id_venta: idVenta,
                nombre_vendedor: nombreVendedor,
                productos: carrito,
                total_venta: montoTotal,
                fecha: new Date(),
            }, ...ventasGuardadas]);

            // Lógica de Notificación por WhatsApp
            if (enviarWA && telefonoCliente.trim().length >= 9) {
                const num = telefonoCliente.replace(/\D/g, '');
                let detalles = carrito.map(c => `• ${c.cantidad}x ${c.tipo} Talla ${c.talla} (${c.color})`).join('%0A');
                const mensaje = `¡Hola! Tu compra en *Jotape* por S/ ${montoTotal.toFixed(2)} ha sido registrada exitosamente. %0A%0A*Detalle del pedido:*%0A${detalles}%0A%0A¡Gracias por tu preferencia!`;

                // Abre nueva pestaña con el enlace de WA
                window.open(`https://wa.me/51${num}?text=${mensaje}`, '_blank');
            }

            setCarrito([]);
            setEnviarWA(false);
            setTelefonoCliente('');
        } catch (error) {
            console.error(error);
            toast.error("Ocurrió un error al procesar la venta. Inténtalo nuevamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const montoTotal = carrito.reduce((acc, current) => acc + (current.precio * current.cantidad), 0);
    const totalItems = carrito.reduce((acc, current) => acc + current.cantidad, 0);

    return (
        <ProtectedRoute allowedRoles={["master", "sales"]}>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-white">Punto de Venta</h1>

                {/* Dashboard Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-zinc-800 flex items-center">
                        <div className="p-4 bg-green-100 dark:bg-green-500/20 text-green-600 rounded-xl mr-4">
                            <Banknote className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm text-stone-500 font-medium">Histórico de Ventas</p>
                            <p className="text-3xl font-bold text-stone-900 dark:text-white">S/ {ventasGuardadas.reduce((acc, v) => acc + (v.total_venta || 0), 0).toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Add Sale Form */}
                    <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-zinc-800 h-fit flex flex-col">
                        <h2 className="text-xl font-bold mb-6 flex items-center">
                            <Tag className="w-5 h-5 mr-2 text-orange-600" /> Nuevo Item
                        </h2>

                        <form onSubmit={handleAgregarAlCarrito} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
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
                                            className="flex-1 px-4 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-orange-500"
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
                                            className="flex-1 px-4 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
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
                                        className="w-full px-4 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-orange-500"
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
                                        className="w-full px-4 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
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
                                            className="flex-1 px-4 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-orange-500"
                                            required
                                        >
                                            <option value="" disabled>Seleccione...</option>
                                            {coloresDisponibles?.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                            <option value="___NUEVO___" className="text-orange-600 font-bold">+ Añadir Nuevo...</option>
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
                                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Precio Unid. (S/)</label>
                                    <input
                                        type="number" min="0" step="0.5" required
                                        value={precio || ''} onChange={e => setPrecio(Number(e.target.value))}
                                        className="w-full px-4 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                                        placeholder="Ej: 65.00"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Cantidad a Vender</label>
                                <input
                                    type="number" min="1" required
                                    value={cantidad} onChange={e => setCantidad(Number(e.target.value))}
                                    className="w-full px-4 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-orange-500 font-bold text-lg"
                                />
                            </div>

                            <div className="pt-4 mt-6 border-t border-stone-100 dark:border-zinc-800">
                                <div className="flex justify-between items-center p-4 bg-stone-50 dark:bg-zinc-900 rounded-lg mb-4">
                                    <span className="font-medium">Subtotal del Item:</span>
                                    <span className="font-bold text-lg text-orange-600">S/ {(precio * cantidad).toFixed(2)}</span>
                                </div>
                                <button type="submit" className={`w-full py-4 flex items-center justify-center font-black rounded-xl transition-all shadow-md text-white bg-orange-600 hover:bg-orange-700 hover:shadow-lg active:scale-[0.98]`}>
                                    Agregar a la Orden
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Cart & Checkout */}
                    <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-zinc-800 flex flex-col">
                        <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
                            <span className="flex items-center"><ShoppingCart className="w-5 h-5 mr-2" /> Orden Actual</span>
                            <span className="bg-stone-100 dark:bg-zinc-900 text-stone-600 dark:text-stone-400 text-sm px-3 py-1 rounded-full">{totalItems} prendas</span>
                        </h2>

                        <div className="flex-1 overflow-y-auto min-h-[200px] mb-4 space-y-3 pr-2">
                            {carrito.map((item) => (
                                <div key={item.id} className="flex justify-between items-center p-3 border border-stone-100 dark:border-zinc-800 rounded-xl bg-stone-50 dark:bg-zinc-900/50">
                                    <div>
                                        <p className="font-bold text-stone-900 dark:text-white capitalize">
                                            {item.categoria} {item.tipo} <span className="text-sm font-normal text-stone-500 dark:text-stone-400 ml-1">x{item.cantidad}</span>
                                        </p>
                                        <p className="text-xs text-stone-500 dark:text-stone-400 capitalize mt-1">
                                            {item.publico} • Talla {item.talla} • {item.color}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs text-stone-500 dark:text-stone-400 mb-1">S/ {item.precio.toFixed(2)} c/u</span>
                                        <span className="font-bold text-stone-900 dark:text-white">
                                            S/ {(item.precio * item.cantidad).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {carrito.length === 0 && (
                                <div className="h-full flex items-center justify-center text-stone-400 text-sm">
                                    La orden está vacía. Añade prendas desde el formulario.
                                </div>
                            )}
                        </div>

                        <div className="border-t border-stone-200 dark:border-zinc-800 pt-4 mt-auto space-y-4">
                            {/* Opciones de Envío */}
                            <div className="bg-stone-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-stone-100 dark:border-zinc-800">
                                <label className="flex items-center cursor-pointer mb-2">
                                    <input
                                        type="checkbox"
                                        checked={enviarWA}
                                        onChange={(e) => setEnviarWA(e.target.checked)}
                                        className="w-4 h-4 text-orange-600 border-stone-300 rounded focus:ring-orange-500"
                                    />
                                    <span className="ml-2 text-sm font-bold text-stone-700 dark:text-stone-300">Enviar Comprobante por WhatsApp</span>
                                </label>

                                {enviarWA && (
                                    <input
                                        type="tel"
                                        placeholder="Número de Celular (Ej: 987654321)"
                                        value={telefonoCliente}
                                        onChange={(e) => setTelefonoCliente(e.target.value)}
                                        className="w-full px-3 py-2 mt-1 text-sm rounded-lg border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                )}
                            </div>
                            <div className="flex justify-between items-end mb-4">
                                <span className="text-stone-500 font-medium">Total a cobrar</span>
                                <span className="text-3xl font-black text-stone-900 dark:text-white">S/ {montoTotal.toFixed(2)}</span>
                            </div>
                            <button
                                onClick={handleCompletarVenta}
                                disabled={carrito.length === 0 || isSubmitting}
                                className="w-full py-4 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-600/20 text-lg flex items-center justify-center"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="w-6 h-6 mr-2 animate-spin" /> Procesando Venta...</>
                                ) : (
                                    "Confirmar Venta"
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Historial de Ventas (Completo) */}
                <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-zinc-800 lg:col-span-3 mt-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center">
                        <Banknote className="w-5 h-5 mr-2 text-green-600" /> Historial General de Ventas
                    </h2>

                    <div className="overflow-x-auto pb-4">
                        <table className="w-full text-left text-sm text-stone-600 dark:text-stone-400">
                            <thead className="text-xs text-stone-500 uppercase bg-stone-50 dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800">
                                <tr>
                                    <th className="px-4 py-4 rounded-tl-lg">ID Venta / Hora</th>
                                    <th className="px-4 py-4">Vendedor</th>
                                    <th className="px-4 py-4">Producto</th>
                                    <th className="px-4 py-4">Variante (P/T/C)</th>
                                    <th className="px-4 py-4 text-right">Precio Unit.</th>
                                    <th className="px-4 py-4 text-right">Cantidad</th>
                                    <th className="px-4 py-4 text-right">Subtotal</th>
                                    <th className="px-4 py-4 text-center border-l border-stone-300 dark:border-zinc-700 font-bold bg-stone-100 dark:bg-zinc-800 rounded-tr-lg">Total Venta</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ventasGuardadas.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center text-stone-500 border-2 border-dashed border-stone-200 dark:border-zinc-800 rounded-xl mt-4">
                                            Aún no hay ventas registradas en el historial.
                                        </td>
                                    </tr>
                                ) : (
                                    ventasGuardadas.flatMap((venta) => {
                                        const prodList = venta.productos || [];
                                        return prodList.map((p: any, pIdx: number) => (
                                            <tr key={`${venta.id || venta.id_venta}-${pIdx}`} className="border-b border-stone-100 dark:border-zinc-800 last:border-0 hover:bg-stone-50 dark:hover:bg-zinc-900/50">
                                                {pIdx === 0 ? (
                                                    <td rowSpan={prodList.length} className="px-4 py-4 font-bold text-stone-900 dark:text-white border-r border-stone-100 dark:border-zinc-800/50 align-top pt-5">
                                                        <div>{venta.id_venta}</div>
                                                        <div className="text-xs font-normal text-stone-500 mt-1">{venta.fecha?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                    </td>
                                                ) : null}
                                                {pIdx === 0 ? (
                                                    <td rowSpan={prodList.length} className="px-4 py-4 font-medium text-stone-700 dark:text-stone-300 capitalize border-r border-stone-100 dark:border-zinc-800/50 align-top pt-5">
                                                        {venta.nombre_vendedor}
                                                    </td>
                                                ) : null}
                                                <td className="px-4 py-3 font-medium text-stone-900 dark:text-white capitalize">
                                                    {p.categoria} {p.tipo || p.tipo_producto}
                                                </td>
                                                <td className="px-4 py-3 capitalize text-xs">
                                                    {p.publico} • <span className="font-bold border px-1 rounded mx-1 bg-stone-100 dark:bg-zinc-800 uppercase">{p.talla}</span> • {p.color}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    S/ {Number(p.precio || p.precio_unitario || 0).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="font-bold text-green-600 dark:text-green-400">{p.cantidad} u.</span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium">
                                                    S/ {Number((p.precio || p.precio_unitario || 0) * p.cantidad).toFixed(2)}
                                                </td>
                                                {pIdx === 0 ? (
                                                    <td rowSpan={prodList.length} className="px-4 py-4 text-center border-l border-stone-300 dark:border-zinc-700 font-bold bg-stone-50/50 dark:bg-zinc-900/50 align-top pt-5">
                                                        <span className="text-green-600">S/ {Number(venta.total_venta || 0).toFixed(2)}</span>
                                                    </td>
                                                ) : null}
                                            </tr>
                                        ));
                                    })
                                )}
                            </tbody>
                        </table>
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


