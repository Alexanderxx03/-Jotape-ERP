"use client";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Users, Package, Scissors, Shirt, Loader2, LayoutDashboard, ScrollText, AlertTriangle, AlertCircle, TrendingUp, Layers, Box } from "lucide-react";
import { useState, useEffect } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type Tab = 'resumen' | 'empleados' | 'inventario' | 'produccion';

export default function MasterDashboard() {
    const [activeTab, setActiveTab] = useState<Tab>('resumen');
    const [loading, setLoading] = useState(true);

    const [data, setData] = useState({
        usuarios: [] as any[],
        inventario: [] as any[],
        rollos: [] as any[],
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

                // 2. Rollos de Tela
                const rollosQ = query(collection(db, 'inventario_rollos'), orderBy('fecha_registro', 'desc'));
                const rollosSnap = await getDocs(rollosQ);
                const rlls: any[] = [];
                rollosSnap.forEach(d => rlls.push({ id: d.id, ...d.data() }));

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
                    inventario: inv,
                    rollos: rlls,
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
    const totalRollosDisponibles = data.rollos.reduce((acc, curr) => acc + (curr.disponible !== false ? (curr.cantidad_rollos || 0) : 0), 0);
    const totalInventarioUnids = data.inventario.reduce((acc, curr) => acc + (curr.cantidad || curr.total_ingresado || 0), 0);
    const totalCorte = data.corte.reduce((acc, curr) => acc + (curr.cantidad || curr.total_cortado || 0), 0);
    const totalCostura = data.costura.reduce((acc, curr) => acc + (curr.cantidad || curr.total_confeccionado || 0), 0);

    // Preparar datos para Gráficas
    const prepararGraficos = () => {
        // Stock por Categoría (desde inventario)
        const stockPorCategoria: Record<string, number> = {};
        data.inventario.forEach(i => {
            const cat = i.categoria || "Otros";
            stockPorCategoria[cat] = (stockPorCategoria[cat] || 0) + (i.cantidad || i.total_ingresado || 0);
        });
        const dStockCat = Object.keys(stockPorCategoria).map(key => ({
            name: key,
            cantidad: stockPorCategoria[key]
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

        const alertasStock = Object.values(stockItems).filter(item => item.cantidad <= 5 && item.cantidad > 0);
        const agotados = Object.values(stockItems).filter(item => item.cantidad <= 0);

        return { dStockCat, dProduccionResumen, alertasStock, agotados };
    };

    const { dStockCat, dProduccionResumen, alertasStock, agotados } = prepararGraficos();
    const COLORS = ['#f97316', '#8b5cf6', '#14b8a6', '#0ea5e9', '#ec4899'];

    return (
        <ProtectedRoute allowedAreas={["master"]}>
            <div className="space-y-8 pb-10 max-w-7xl mx-auto">
                
                {/* HEADERS - BRUTALIST STYLE */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 border-b border-zinc-200 dark:border-white/5 pb-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-900 dark:text-white drop-shadow-sm flex items-center gap-3">
                            <Layers className="w-10 h-10 text-orange-500" />
                            PANEL MASTER
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] text-xs font-bold mt-2">
                            Sistema Central de Operaciones y Producción
                        </p>
                    </div>

                    <div className="flex bg-zinc-100 dark:bg-black/60 backdrop-blur-2xl p-1.5 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-lg dark:shadow-2xl gap-2 overflow-x-auto scrollbar-hide">
                        <TabButton active={activeTab === 'resumen'} onClick={() => setActiveTab('resumen')} icon={<LayoutDashboard className="w-4 h-4 mr-2" />} label="RESUMEN" />
                        <TabButton active={activeTab === 'empleados'} onClick={() => setActiveTab('empleados')} icon={<Users className="w-4 h-4 mr-2" />} label="EMPLEADOS" />
                        <TabButton active={activeTab === 'inventario'} onClick={() => setActiveTab('inventario')} icon={<Package className="w-4 h-4 mr-2" />} label="INVENTARIO" />
                        <TabButton active={activeTab === 'produccion'} onClick={() => setActiveTab('produccion')} icon={<Scissors className="w-4 h-4 mr-2" />} label="PRODUCCIÓN" />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-32">
                        <div className="relative">
                            <div className="absolute inset-0 blur-xl bg-orange-500/30 rounded-full animate-pulse" />
                            <Loader2 className="w-12 h-12 text-orange-500 animate-spin relative z-10" />
                        </div>
                    </div>
                ) : (
                    <div className="animate-fadeIn">
                        {activeTab === 'resumen' && (
                            <div className="space-y-8">
                                {/* STAT CARDS */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <StatCard 
                                        icon={<Package className="w-5 h-5 text-emerald-400" />} 
                                        title="ROLLOS DE TELA" 
                                        value={totalRollosDisponibles.toString()} 
                                        subtitle="Disponibles"
                                        glowColor="group-hover:shadow-[0_0_30px_-5px_rgba(52,211,153,0.3)]"
                                    />
                                    <StatCard 
                                        icon={<Box className="w-5 h-5 text-orange-400" />} 
                                        title="STOCK PRENDAS" 
                                        value={totalInventarioUnids.toString()} 
                                        subtitle="Unidades totales"
                                        glowColor="group-hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.3)]"
                                    />
                                    <StatCard 
                                        icon={<Scissors className="w-5 h-5 text-purple-400" />} 
                                        title="ÁREA CORTE" 
                                        value={totalCorte.toString()} 
                                        subtitle="Piezas cortadas"
                                        glowColor="group-hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]"
                                    />
                                    <StatCard 
                                        icon={<Shirt className="w-5 h-5 text-teal-400" />} 
                                        title="ÁREA COSTURA" 
                                        value={totalCostura.toString()} 
                                        subtitle="Prendas confeccionadas"
                                        glowColor="group-hover:shadow-[0_0_30px_-5px_rgba(45,212,191,0.3)]"
                                    />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                                    {/* Gráfica de Barras */}
                                    <div className="lg:col-span-3 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl p-8 rounded-[2rem] border border-zinc-200 dark:border-white/5 shadow-xl relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-orange-500/10 transition-colors duration-700" />
                                        
                                        <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-8 flex items-center text-zinc-800 dark:text-zinc-300 relative z-10">
                                            <TrendingUp className="w-5 h-5 mr-3 text-orange-500" /> Flujo de Producción
                                        </h2>
                                        
                                        <div className="h-72 relative z-10">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={dProduccionResumen} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#52525b" opacity={0.2} />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#71717a' }} dy={10} />
                                                    <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#71717a' }} />
                                                    <RechartsTooltip 
                                                        cursor={{ fill: 'rgba(249, 115, 22, 0.05)' }} 
                                                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fff', borderRadius: '12px', padding: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }} 
                                                        itemStyle={{ color: '#f97316', fontWeight: 'bold' }}
                                                    />
                                                    <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                                                        {dProduccionResumen.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#a855f7' : index === 1 ? '#2dd4bf' : '#f97316'} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Gráfica de Pastel - Stock por Categoría */}
                                    <div className="lg:col-span-2 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl p-8 rounded-[2rem] border border-zinc-200 dark:border-white/5 shadow-xl relative overflow-hidden group">
                                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-700" />
                                        
                                        <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-6 flex items-center text-zinc-800 dark:text-zinc-300 relative z-10">
                                            <Package className="w-5 h-5 mr-3 text-blue-500" /> Distribución Stock
                                        </h2>
                                        
                                        <div className="h-56 relative z-10">
                                            {dStockCat.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={dStockCat}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={50}
                                                            outerRadius={80}
                                                            paddingAngle={5}
                                                            dataKey="cantidad"
                                                            stroke="none"
                                                        >
                                                            {dStockCat.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <RechartsTooltip 
                                                            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fff', borderRadius: '12px' }} 
                                                            itemStyle={{ fontWeight: 'bold' }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-zinc-500 font-medium">Sin datos de inventario</div>
                                            )}
                                        </div>
                                        
                                        <div className="flex flex-wrap justify-center mt-4 gap-2 relative z-10">
                                            {dStockCat.map((entry, i) => (
                                                <div key={entry.name} className="flex items-center text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-zinc-100 dark:bg-black/40 border border-zinc-200 dark:border-white/5">
                                                    <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                                                    {entry.name} <span className="text-zinc-500 ml-1">({entry.cantidad})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Panel de Stock y Alertas */}
                                {(alertasStock.length > 0 || agotados.length > 0) && (
                                    <div className="bg-red-50/50 dark:bg-red-950/10 backdrop-blur-md p-8 rounded-[2rem] border border-red-200 dark:border-red-900/30 shadow-xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-full h-full bg-red-500/5 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-500/10 via-transparent to-transparent pointer-events-none" />
                                        
                                        <h2 className="text-xl font-black tracking-tight mb-6 flex items-center text-red-600 dark:text-red-500 relative z-10">
                                            <AlertTriangle className="w-6 h-6 mr-3" /> ALERTAS CRÍTICAS DE INVENTARIO
                                        </h2>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                            {/* Agotados */}
                                            {agotados.length > 0 && (
                                                <div className="space-y-4">
                                                    <h3 className="text-[11px] font-black text-red-600 dark:text-red-400 uppercase tracking-[0.2em] flex items-center bg-red-100 dark:bg-red-950/50 px-3 py-1.5 rounded-lg w-fit">
                                                        <AlertCircle className="w-3 h-3 mr-2" /> STOCK AGOTADO
                                                    </h3>
                                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                        {agotados.map((item, idx) => (
                                                            <div key={idx} className="bg-white dark:bg-black/40 p-4 rounded-xl flex justify-between items-center border border-red-100 dark:border-red-900/30">
                                                                <div>
                                                                    <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm capitalize">{item.tipo}</p>
                                                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize mt-1">{item.atributos}</p>
                                                                </div>
                                                                <span className="bg-red-500 text-white px-3 py-1 rounded-md text-xs font-black tracking-widest shadow-[0_0_15px_-3px_rgba(239,68,68,0.5)]">0 u.</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Poco Stock */}
                                            {alertasStock.length > 0 && (
                                                <div className="space-y-4">
                                                    <h3 className="text-[11px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-[0.2em] flex items-center bg-orange-100 dark:bg-orange-950/50 px-3 py-1.5 rounded-lg w-fit">
                                                        <AlertTriangle className="w-3 h-3 mr-2" /> STOCK BAJO (≤ 5)
                                                    </h3>
                                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                        {alertasStock.map((item, idx) => (
                                                            <div key={idx} className="bg-white dark:bg-black/40 p-4 rounded-xl flex justify-between items-center border border-orange-100 dark:border-orange-900/30">
                                                                <div>
                                                                    <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm capitalize">{item.tipo}</p>
                                                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize mt-1">{item.atributos}</p>
                                                                </div>
                                                                <span className="bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-md text-xs font-black tracking-widest border border-orange-500/20">{item.cantidad} u.</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'empleados' && (
                            <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl p-8 rounded-[2rem] border border-zinc-200 dark:border-white/5 shadow-xl">
                                <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-6 flex items-center text-zinc-800 dark:text-zinc-300">
                                    <Users className="w-5 h-5 mr-3 text-blue-500" /> Registro de Personal
                                </h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="text-[10px] uppercase font-black tracking-widest text-zinc-500 border-b border-zinc-200 dark:border-white/5">
                                            <tr>
                                                <th className="px-4 py-4">Operador</th>
                                                <th className="px-4 py-4">Contacto</th>
                                                <th className="px-4 py-4">Rol Asignado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                                            {data.usuarios.map(u => (
                                                <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors group">
                                                    <td className="px-4 py-4 font-bold text-zinc-900 dark:text-white group-hover:text-blue-500 transition-colors">{u.displayName || "Desconocido"}</td>
                                                    <td className="px-4 py-4 text-zinc-600 dark:text-zinc-400">{u.email}</td>
                                                    <td className="px-4 py-4">
                                                        <span className="px-3 py-1 bg-zinc-100 dark:bg-black border border-zinc-200 dark:border-white/10 rounded-md font-bold uppercase tracking-wider text-[10px] text-zinc-700 dark:text-zinc-300">
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'inventario' && (
                            <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl p-8 rounded-[2rem] border border-zinc-200 dark:border-white/5 shadow-xl">
                                <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-6 flex items-center text-zinc-800 dark:text-zinc-300">
                                    <Package className="w-5 h-5 mr-3 text-emerald-500" /> Movimientos de Ingreso
                                </h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="text-[10px] uppercase font-black tracking-widest text-zinc-500 border-b border-zinc-200 dark:border-white/5">
                                            <tr>
                                                <th className="px-4 py-4">ID Transacción</th>
                                                <th className="px-4 py-4">Responsable</th>
                                                <th className="px-4 py-4">Referencia</th>
                                                <th className="px-4 py-4 text-right">Volumen</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                                            {data.inventario.map(i => (
                                                <tr key={i.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                                                    <td className="px-4 py-4 font-mono text-xs text-zinc-500">{i.id_entrada}</td>
                                                    <td className="px-4 py-4 font-bold text-zinc-900 dark:text-white">{i.nombre_usuario}</td>
                                                    <td className="px-4 py-4 text-zinc-600 dark:text-zinc-400 capitalize">{i.tipo_producto}</td>
                                                    <td className="px-4 py-4 font-black text-right text-emerald-600 dark:text-emerald-400">+{i.cantidad || i.total_ingresado || 0} u.</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'produccion' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl p-8 rounded-[2rem] border border-zinc-200 dark:border-white/5 shadow-xl">
                                    <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-6 flex items-center text-zinc-800 dark:text-zinc-300">
                                        <Scissors className="w-5 h-5 mr-3 text-purple-500" /> Registros de Corte
                                    </h2>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="text-[10px] uppercase font-black tracking-widest text-zinc-500 border-b border-zinc-200 dark:border-white/5">
                                                <tr>
                                                    <th className="px-4 py-4">Lote ID</th>
                                                    <th className="px-4 py-4">Operador</th>
                                                    <th className="px-4 py-4 text-right">Rendimiento</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                                                {data.corte.map(c => (
                                                    <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                                                        <td className="px-4 py-4 font-mono text-xs text-zinc-500">{c.id_registro}</td>
                                                        <td className="px-4 py-4 font-bold text-zinc-900 dark:text-white">{c.nombre_usuario}</td>
                                                        <td className="px-4 py-4 font-black text-right text-purple-600 dark:text-purple-400">{c.cantidad || c.total_cortado || 0} pcs</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl p-8 rounded-[2rem] border border-zinc-200 dark:border-white/5 shadow-xl">
                                    <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-6 flex items-center text-zinc-800 dark:text-zinc-300">
                                        <Shirt className="w-5 h-5 mr-3 text-teal-500" /> Registros de Costura
                                    </h2>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="text-[10px] uppercase font-black tracking-widest text-zinc-500 border-b border-zinc-200 dark:border-white/5">
                                                <tr>
                                                    <th className="px-4 py-4">Lote ID</th>
                                                    <th className="px-4 py-4">Operador</th>
                                                    <th className="px-4 py-4 text-right">Rendimiento</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                                                {data.costura.map(c => (
                                                    <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                                                        <td className="px-4 py-4 font-mono text-xs text-zinc-500">{c.id_registro}</td>
                                                        <td className="px-4 py-4 font-bold text-zinc-900 dark:text-white">{c.nombre_usuario}</td>
                                                        <td className="px-4 py-4 font-black text-right text-teal-600 dark:text-teal-400">{c.cantidad || c.total_confeccionado || 0} uds</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
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
            className={`flex items-center px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest font-black transition-all whitespace-nowrap ${
                active 
                ? "bg-zinc-900 text-white dark:bg-white dark:text-black shadow-lg scale-[1.02]" 
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-white/5"
            }`}
        >
            {icon} {label}
        </button>
    );
}

function StatCard({ icon, title, value, subtitle, glowColor }: { icon: React.ReactNode, title: string, value: string, subtitle: string, glowColor: string }) {
    return (
        <div className={`bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6 rounded-[2rem] border border-zinc-200 dark:border-white/5 shadow-lg group transition-all duration-300 hover:-translate-y-1 ${glowColor}`}>
            <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-zinc-100 dark:bg-black rounded-xl border border-zinc-200 dark:border-white/10 group-hover:scale-110 transition-transform duration-300">
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">{title}</p>
                <h3 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white mt-1">{value}</h3>
                <p className="text-xs text-zinc-400 font-medium mt-1">{subtitle}</p>
            </div>
        </div>
    );
}
