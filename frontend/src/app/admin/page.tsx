"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Users, Package, Banknote, Scissors, Shirt, Loader2, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle, AlertTriangle } from "lucide-react";

type Tab = 'resumen' | 'empleados' | 'ventas' | 'inventario' | 'produccion';

export default function MasterDashboard() {
    const [activeTab, setActiveTab] = useState<Tab>('resumen');
    const [loading, setLoading] = useState(true);
    const [ventaSeleccionada, setVentaSeleccionada] = useState<any>(null);

    const [data, setData] = useState({
        usuarios: [] as any[],
        ventas: [] as any[],
        inventario: [] as any[],
        corte: [] as any[],
        costura: [] as any[]
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Usuarios
                const usersSnap = await getDocs(collection(db, 'users'));
                const usrs: any[] = [];
                usersSnap.forEach(d => usrs.push({ id: d.id, ...d.data() }));

                // 2. Ventas
                const ventasQ = query(collection(db, 'ventas'), orderBy('fecha_registro', 'desc'));
                const ventasSnap = await getDocs(ventasQ);
                const vnts: any[] = [];
                ventasSnap.forEach(d => vnts.push({ id: d.id, ...d.data() }));

                // 3. Inventario
                const invQ = query(collection(db, 'entradas_inventario'), orderBy('fecha_registro', 'desc'));
                const invSnap = await getDocs(invQ);
                const inv: any[] = [];
                invSnap.forEach(d => inv.push({ id: d.id, ...d.data() }));

                // 4. Corte
                const corteQ = query(collection(db, 'registros_corte'), orderBy('fecha_registro', 'desc'));
                const corteSnap = await getDocs(corteQ);
                const crt: any[] = [];
                corteSnap.forEach(d => crt.push({ id: d.id, ...d.data() }));

                // 5. Costura
                const costuraQ = query(collection(db, 'registros_costura'), orderBy('fecha_registro', 'desc'));
                const costuraSnap = await getDocs(costuraQ);
                const cst: any[] = [];
                costuraSnap.forEach(d => cst.push({ id: d.id, ...d.data() }));

                setData({
                    usuarios: usrs,
                    ventas: vnts,
                    inventario: inv,
                    corte: crt,
                    costura: cst
                });
            } catch (error) {
                console.error("Error obteniendo datos del dashboard: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Helper derivations
    const totalVentasSoles = data.ventas.reduce((acc, curr) => acc + (curr.total_venta || 0), 0);
    const totalInventarioUnids = data.inventario.reduce((acc, curr) => acc + (curr.cantidad || curr.total_ingresado || 0), 0);
    const totalCorte = data.corte.reduce((acc, curr) => acc + (curr.cantidad || curr.total_cortado || 0), 0);
    const totalCostura = data.costura.reduce((acc, curr) => acc + (curr.cantidad || curr.total_confeccionado || 0), 0);

    // Preparar datos para Gráficas
    const prepararGraficos = () => {
        // Ventas por Categoría
        const ventasPorCategoria: Record<string, number> = {};
        data.ventas.forEach(v => {
            if (v.productos && Array.isArray(v.productos)) {
                v.productos.forEach((p: any) => {
                    const cat = p.categoria || "Otros";
                    ventasPorCategoria[cat] = (ventasPorCategoria[cat] || 0) + (p.cantidad || 0);
                });
            }
        });
        const dVentasCat = Object.keys(ventasPorCategoria).map(key => ({
            name: key,
            cantidad: ventasPorCategoria[key]
        }));

        // Producción por Prenda (Corte vs Costura combinados)
        const dProduccionResumen = [
            { name: "Piezas Cortadas", total: totalCorte },
            { name: "Prendas Cosidas", total: totalCostura },
            { name: "Almacenado", total: totalInventarioUnids },
        ];

        // Cálculo Rápido de Stock 
        const stockItems: Record<string, { tipo: string, atributos: string, cantidad: number }> = {};

        data.inventario.forEach(i => {
            if (i.variantes && Array.isArray(i.variantes)) {
                i.variantes.forEach((v: any) => {
                    const id = `${i.categoria}-${i.tipo_producto}-${v.publico}-${v.talla}-${v.color}`;
                    if (!stockItems[id]) stockItems[id] = { tipo: `${i.categoria} ${i.tipo_producto}`, atributos: `${v.publico} Talla ${v.talla} (${v.color})`, cantidad: 0 };
                    stockItems[id].cantidad += v.cantidad;
                });
            }
        });

        data.ventas.forEach(v => {
            if (v.productos && Array.isArray(v.productos)) {
                v.productos.forEach((p: any) => {
                    const id = `${p.categoria}-${p.tipo}-${p.publico}-${p.talla}-${p.color}`;
                    if (!stockItems[id]) stockItems[id] = { tipo: `${p.categoria} ${p.tipo}`, atributos: `${p.publico} Talla ${p.talla} (${p.color})`, cantidad: 0 };
                    stockItems[id].cantidad -= p.cantidad;
                });
            }
        });

        const alertasStock = Object.values(stockItems).filter(item => item.cantidad <= 5 && item.cantidad > 0);
        const agotados = Object.values(stockItems).filter(item => item.cantidad <= 0);

        return { dVentasCat, dProduccionResumen, alertasStock, agotados };
    };

    const { dVentasCat, dProduccionResumen, alertasStock, agotados } = prepararGraficos();
    const COLORS = ['#f97316', '#a855f7', '#14b8a6', '#3b82f6', '#ef4444'];

    return (
        <ProtectedRoute allowedRoles={["master"]}>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-white">Panel Principal (Master)</h1>

                    {/* Tab Navigation */}
                    <div className="flex bg-white dark:bg-zinc-950 p-1 rounded-xl shadow-sm border border-stone-200 dark:border-zinc-800 overflow-x-auto">
                        <TabButton active={activeTab === 'resumen'} onClick={() => setActiveTab('resumen')} icon={<LayoutDashboard className="w-4 h-4 mr-2" />} label="Resumen" />
                        <TabButton active={activeTab === 'empleados'} onClick={() => setActiveTab('empleados')} icon={<Users className="w-4 h-4 mr-2" />} label="Empleados" />
                        <TabButton active={activeTab === 'ventas'} onClick={() => setActiveTab('ventas')} icon={<Banknote className="w-4 h-4 mr-2" />} label="Ventas" />
                        <TabButton active={activeTab === 'inventario'} onClick={() => setActiveTab('inventario')} icon={<Package className="w-4 h-4 mr-2" />} label="Inventario" />
                        <TabButton active={activeTab === 'produccion'} onClick={() => setActiveTab('produccion')} icon={<Scissors className="w-4 h-4 mr-2" />} label="Producción" />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-32">
                        <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
                    </div>
                ) : (
                    <div className="mt-6">
                        {activeTab === 'resumen' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <StatCard icon={<Banknote className="w-6 h-6" />} color="green" title="Ventas Totales" value={`S/ ${totalVentasSoles.toFixed(2)}`} />
                                    <StatCard icon={<Package className="w-6 h-6" />} color="orange" title="Entradas a Inventario" value={`${totalInventarioUnids} unds.`} />
                                    <StatCard icon={<Scissors className="w-6 h-6" />} color="purple" title="Producción: Corte" value={`${totalCorte} pcs.`} />
                                    <StatCard icon={<Shirt className="w-6 h-6" />} color="teal" title="Producción: Costura" value={`${totalCostura} prendas`} />
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Gráfica de Barras */}
                                    <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-zinc-800">
                                        <h2 className="text-xl font-bold mb-6">Flujo de Producción</h2>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={dProduccionResumen}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.3} />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#71717a' }} />
                                                    <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{ fill: '#71717a' }} />
                                                    <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }} />
                                                    <Bar dataKey="total" fill="#f97316" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Gráfica de Pastel */}
                                    <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-zinc-800">
                                        <h2 className="text-xl font-bold mb-6">Ventas por Categoría (Unidades)</h2>
                                        <div className="h-64">
                                            {dVentasCat.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={dVentasCat}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={60}
                                                            outerRadius={80}
                                                            paddingAngle={5}
                                                            dataKey="cantidad"
                                                        >
                                                            {dVentasCat.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <RechartsTooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-stone-500">No hay datos de ventas.</div>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap justify-center mt-2 gap-3">
                                            {dVentasCat.map((entry, i) => (
                                                <div key={entry.name} className="flex items-center text-xs">
                                                    <span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                                                    {entry.name} ({entry.cantidad})
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Panel de Stock y Alertas */}
                                {(alertasStock.length > 0 || agotados.length > 0) && (
                                    <div className="bg-orange-50 dark:bg-orange-950/20 p-6 rounded-2xl shadow-sm border border-orange-200 dark:border-orange-900/40">
                                        <h2 className="text-xl font-bold mb-4 flex items-center text-orange-800 dark:text-orange-500">
                                            <AlertTriangle className="w-6 h-6 mr-2" /> Alertas de Inventario
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Agotados */}
                                            {agotados.length > 0 && (
                                                <div>
                                                    <h3 className="text-sm font-bold text-red-600 dark:text-red-400 mb-3 flex items-center"><AlertCircle className="w-4 h-4 mr-1" /> STOCK AGOTADO</h3>
                                                    <ul className="space-y-2">
                                                        {agotados.slice(0, 10).map((item, idx) => (
                                                            <li key={idx} className="bg-white dark:bg-zinc-900 p-3 rounded-lg flex justify-between items-center shadow-sm">
                                                                <div>
                                                                    <p className="font-bold text-stone-800 dark:text-stone-200 text-sm capitalize">{item.tipo}</p>
                                                                    <p className="text-xs text-stone-500 dark:text-stone-400 capitalize">{item.atributos}</p>
                                                                </div>
                                                                <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold">0 u.</span>
                                                            </li>
                                                        ))}
                                                        {agotados.length > 10 && <li className="text-xs text-stone-500">Y {agotados.length - 10} artículos más...</li>}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Poco Stock */}
                                            {alertasStock.length > 0 && (
                                                <div>
                                                    <h3 className="text-sm font-bold text-orange-600 dark:text-orange-400 mb-3 flex items-center"><AlertTriangle className="w-4 h-4 mr-1" /> STOCK BAJO (≤ 5)</h3>
                                                    <ul className="space-y-2">
                                                        {alertasStock.slice(0, 10).map((item, idx) => (
                                                            <li key={idx} className="bg-white dark:bg-zinc-900 p-3 rounded-lg flex justify-between items-center shadow-sm">
                                                                <div>
                                                                    <p className="font-bold text-stone-800 dark:text-stone-200 text-sm capitalize">{item.tipo}</p>
                                                                    <p className="text-xs text-stone-500 dark:text-stone-400 capitalize">{item.atributos}</p>
                                                                </div>
                                                                <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-xs font-bold">{item.cantidad} u.</span>
                                                            </li>
                                                        ))}
                                                        {alertasStock.length > 10 && <li className="text-xs text-stone-500">Y {alertasStock.length - 10} artículos más...</li>}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'empleados' && (
                            <DataPanel title="Empleados del Sistema" icon={<Users className="w-6 h-6 mr-2 text-blue-500" />}>
                                <table className="w-full text-left text-sm text-stone-600 dark:text-stone-400">
                                    <thead className="bg-stone-50 dark:bg-zinc-900 text-xs uppercase font-medium">
                                        <tr>
                                            <th className="px-4 py-3">Nombre</th>
                                            <th className="px-4 py-3">Correo</th>
                                            <th className="px-4 py-3">Rol</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.usuarios.map(u => (
                                            <tr key={u.id} className="border-b border-stone-100 dark:border-zinc-800">
                                                <td className="px-4 py-3 font-bold text-stone-900 dark:text-white">{u.displayName || "Desconocido"}</td>
                                                <td className="px-4 py-3">{u.email}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-1 bg-stone-100 dark:bg-zinc-800 rounded font-bold capitalize text-xs">{u.role}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </DataPanel>
                        )}

                        {activeTab === 'ventas' && (
                            <DataPanel title="Detalle de Ventas" icon={<Banknote className="w-6 h-6 mr-2 text-green-500" />}>
                                <table className="w-full text-left text-sm text-stone-600 dark:text-stone-400">
                                    <thead className="bg-stone-50 dark:bg-zinc-900 text-xs uppercase font-medium">
                                        <tr>
                                            <th className="px-4 py-3">ID Venta</th>
                                            <th className="px-4 py-3">Vendedor</th>
                                            <th className="px-4 py-3 text-right">Items</th>
                                            <th className="px-4 py-3 text-right">Monto</th>
                                            <th className="px-4 py-3 text-center">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.ventas.map(v => (
                                            <tr key={v.id} className="border-b border-stone-100 dark:border-zinc-800">
                                                <td className="px-4 py-3 font-medium text-stone-900 dark:text-white">{v.id_venta}</td>
                                                <td className="px-4 py-3">{v.nombre_vendedor}</td>
                                                <td className="px-4 py-3 text-right">{v.productos?.length || 0} prod(s).</td>
                                                <td className="px-4 py-3 font-bold text-green-600 text-right">S/ {v.total_venta?.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => setVentaSeleccionada(v)}
                                                        className="text-xs font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                                                    >
                                                        Ver Detalle
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </DataPanel>
                        )}

                        {activeTab === 'inventario' && (
                            <DataPanel title="Ingresos de Inventario" icon={<Package className="w-6 h-6 mr-2 text-orange-500" />}>
                                <table className="w-full text-left text-sm text-stone-600 dark:text-stone-400">
                                    <thead className="bg-stone-50 dark:bg-zinc-900 text-xs uppercase font-medium">
                                        <tr>
                                            <th className="px-4 py-3">ID Ingreso</th>
                                            <th className="px-4 py-3">Usuario (Almacén)</th>
                                            <th className="px-4 py-3">Prenda</th>
                                            <th className="px-4 py-3 text-right">Cantidad</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.inventario.map(i => (
                                            <tr key={i.id} className="border-b border-stone-100 dark:border-zinc-800">
                                                <td className="px-4 py-3 font-medium text-stone-900 dark:text-white">{i.id_entrada}</td>
                                                <td className="px-4 py-3">{i.nombre_usuario}</td>
                                                <td className="px-4 py-3 capitalize">{i.tipo_producto}</td>
                                                <td className="px-4 py-3 font-bold text-right">+{i.cantidad || i.total_ingresado || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </DataPanel>
                        )}

                        {activeTab === 'produccion' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <DataPanel title="Lotes de Corte" icon={<Scissors className="w-6 h-6 mr-2 text-purple-500" />}>
                                    <table className="w-full text-left text-sm text-stone-600 dark:text-stone-400">
                                        <thead className="bg-stone-50 dark:bg-zinc-900 text-xs uppercase font-medium">
                                            <tr>
                                                <th className="px-4 py-3">ID</th>
                                                <th className="px-4 py-3">Usuario</th>
                                                <th className="px-4 py-3 text-right">Cant.</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.corte.map(c => (
                                                <tr key={c.id} className="border-b border-stone-100 dark:border-zinc-800">
                                                    <td className="px-4 py-3 font-medium">{c.id_registro}</td>
                                                    <td className="px-4 py-3">{c.nombre_usuario}</td>
                                                    <td className="px-4 py-3 font-bold text-right">{c.cantidad || c.total_cortado || 0}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </DataPanel>
                                <DataPanel title="Lotes de Costura" icon={<Shirt className="w-6 h-6 mr-2 text-teal-500" />}>
                                    <table className="w-full text-left text-sm text-stone-600 dark:text-stone-400">
                                        <thead className="bg-stone-50 dark:bg-zinc-900 text-xs uppercase font-medium">
                                            <tr>
                                                <th className="px-4 py-3">ID</th>
                                                <th className="px-4 py-3">Usuario</th>
                                                <th className="px-4 py-3 text-right">Cant.</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.costura.map(c => (
                                                <tr key={c.id} className="border-b border-stone-100 dark:border-zinc-800">
                                                    <td className="px-4 py-3 font-medium">{c.id_registro}</td>
                                                    <td className="px-4 py-3">{c.nombre_usuario}</td>
                                                    <td className="px-4 py-3 font-bold text-right">{c.cantidad || c.total_confeccionado || 0}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </DataPanel>
                            </div>
                        )}
                    </div>
                )}

                {ventaSeleccionada && (
                    <ModalDetalleVenta
                        venta={ventaSeleccionada}
                        onClose={() => setVentaSeleccionada(null)}
                    />
                )}
            </div>
        </ProtectedRoute>
    );
}

// UI Components Helpers
function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${active ? "bg-stone-100 dark:bg-zinc-900 text-stone-900 dark:text-white shadow-sm" : "text-stone-500 hover:text-stone-900 dark:hover:text-white"
                }`}
        >
            {icon} {label}
        </button>
    );
}

function StatCard({ icon, color, title, value }: { icon: React.ReactNode, color: 'green' | 'orange' | 'purple' | 'teal', title: string, value: string }) {
    const colorClasses = {
        green: "bg-green-100 text-green-600",
        orange: "bg-orange-100 text-orange-600",
        purple: "bg-purple-100 text-purple-600",
        teal: "bg-teal-100 text-teal-600",
    };
    return (
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-zinc-800">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                    {icon}
                </div>
            </div>
            <p className="text-sm text-stone-500 font-medium">{title}</p>
            <p className="text-3xl font-bold text-stone-900 dark:text-white mt-1">{value}</p>
        </div>
    );
}

function DataPanel({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-stone-200 dark:border-zinc-800 overflow-x-auto">
            <h2 className="text-xl font-bold mb-4 flex items-center">{icon} {title}</h2>
            {children}
        </div>
    );
}

// Component Modal de Detalle de Venta
function ModalDetalleVenta({ venta, onClose }: { venta: any, onClose: () => void }) {
    if (!venta) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:hidden">
            <div className="bg-white dark:bg-zinc-950 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-stone-100 dark:border-zinc-800 flex justify-between items-center bg-stone-50/50 dark:bg-zinc-900/50">
                    <div>
                        <h2 className="text-xl font-bold text-stone-900 dark:text-white">Detalle de Venta #{venta.id_venta}</h2>
                        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">Atendido por {venta.nombre_vendedor}</p>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-stone-200 dark:hover:bg-zinc-800 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-500"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <h3 className="text-sm font-bold text-stone-900 dark:text-white mb-4 uppercase tracking-wider">Productos Vendidos</h3>
                    <div className="space-y-4">
                        {venta.productos?.map((p: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center p-4 rounded-xl border border-stone-100 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900 flex-wrap gap-4">
                                <div>
                                    <p className="font-bold text-stone-900 dark:text-white capitalize">{p.categoria} {p.tipo_producto}</p>
                                    <p className="text-sm text-stone-500 dark:text-stone-400 capitalize">
                                        {p.publico} • Talla: {p.talla} • Color: {p.color}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-stone-500 dark:text-stone-400">{p.cantidad} u. x S/ {p.precio_unitario?.toFixed(2)}</p>
                                    <p className="font-bold text-stone-900 dark:text-white mt-1">S/ {p.subtotal?.toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                        {(!venta.productos || venta.productos.length === 0) && (
                            <p className="text-center text-stone-500 dark:text-stone-400 py-4">No hay detalles de productos para esta venta.</p>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-stone-100 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900">
                    <div className="flex justify-between items-center">
                        <p className="text-stone-500 font-medium">Total de Venta</p>
                        <p className="text-2xl font-bold text-green-600">S/ {venta.total_venta?.toFixed(2)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
