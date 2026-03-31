"use client";
import { ArrowRight, ShoppingBag, TrendingUp, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";

const products = [
    {
        id: 1,
        name: "Jogger Essential Franela",
        price: "S/ 65.00",
        color: "Gris Jaspeado",
        image: "https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=1982&auto=format&fit=crop",
        isNew: true,
    },
    {
        id: 2,
        name: "Polera Oversize Reactiva",
        price: "S/ 85.00",
        color: "Negro Ónix",
        image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=2574&auto=format&fit=crop",
        isNew: false,
    },
    {
        id: 3,
        name: "Set Urban Comfort",
        price: "S/ 140.00",
        color: "Beige Arena",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1920&auto=format&fit=crop",
        isNew: true,
    }
];

export default function BestSellers() {
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    const cardVariants: Variants = {
        hidden: { y: 30, opacity: 0, scale: 0.95 },
        show: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 60, damping: 15 } }
    };

    return (
        <section id="best-sellers" className="py-32 bg-zinc-950 relative overflow-hidden">
            {/* Background Texture Layer */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-900/10 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="flex flex-col relative"
                    >
                        <div className="absolute -left-8 -top-8 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl z-0"></div>
                        <div className="flex items-center gap-3 mb-5 text-orange-500 relative z-10">
                            <Sparkles className="w-5 h-5" />
                            <span className="font-oswald tracking-[0.2em] uppercase text-sm font-medium">Trending Now</span>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black font-oswald text-white uppercase tracking-tighter leading-[0.9] relative z-10">
                            Los Más <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right, #FFE600, #FF8B00, #86CB2D, #21A2FF, #D41C95, #E00B21)" }}>Vendidos.</span>
                        </h2>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                    >
                        <Link href="#coleccion" className="hidden md:inline-flex items-center px-8 py-4 bg-zinc-900 text-white rounded-full font-oswald uppercase tracking-widest text-sm hover:bg-white hover:text-black transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] border border-zinc-800 hover:border-white">
                            Explorar Catálogo <ArrowRight className="ml-3 w-4 h-4" />
                        </Link>
                    </motion.div>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10"
                >
                    {products.map((product) => (
                        <motion.div variants={cardVariants} key={product.id} className="group relative flex flex-col">
                            {/* Premium Card Container */}
                            <div className="relative w-full aspect-[4/5] bg-zinc-900 overflow-hidden rounded-2xl border border-zinc-800/50 shadow-2xl transition-all duration-500 group-hover:border-zinc-700 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                {product.isNew && (
                                    <div className="absolute top-5 left-5 z-20">
                                        <div className="flex px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full border border-orange-500/30 items-center justify-center">
                                            <span className="text-orange-400 text-[10px] font-oswald tracking-[0.2em] font-medium uppercase">
                                                New Release
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-40 transition-opacity z-10 duration-500" />
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover object-center scale-100 group-hover:scale-110 transition-transform duration-700 ease-in-out"
                                />

                                {/* Glassmorphism Quick Add */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] translate-y-[150%] group-hover:translate-y-0 transition-transform duration-500 ease-out z-20">
                                    <button className="w-full py-4 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-xl hover:bg-white hover:text-black font-oswald uppercase tracking-widest text-sm font-bold flex items-center justify-center gap-3 transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                                        <ShoppingBag className="w-4 h-4" />
                                        Agregar al carrito
                                    </button>
                                </div>
                            </div>

                            {/* Details Block */}
                            <div className="mt-6 flex flex-col px-1">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-[11px] text-zinc-500 font-medium font-oswald uppercase tracking-[0.2em]">{product.color}</p>
                                    <p className="text-orange-500 font-oswald font-bold tracking-wider text-lg">{product.price}</p>
                                </div>
                                <h3 className="text-2xl font-oswald uppercase font-black text-zinc-100 group-hover:text-white transition-colors tracking-tight leading-none">
                                    <Link href={`/producto/${product.id}`}>
                                        <span className="absolute inset-0 z-0" />
                                        {product.name}
                                    </Link>
                                </h3>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                <div className="mt-16 text-center md:hidden">
                    <Link href="#coleccion" className="inline-flex items-center justify-center px-8 py-4 text-sm tracking-widest uppercase font-oswald font-bold text-black bg-white rounded-full w-full shadow-xl">
                        Ver todo el catálogo
                    </Link>
                </div>
            </div>
        </section>
    );
}
