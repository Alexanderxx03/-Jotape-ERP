"use client";
import { ShoppingBag, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { useRef } from "react";

const products = [
    {
        id: 1,
        name: "Jogger Essential",
        type: "Franela Reactiva",
        price: "S/ 65.00",
        color: "Gris Jaspeado",
        image: "https://images.unsplash.com/photo-1548883354-7622d03aca27?q=80&w=1982&auto=format&fit=crop",
        isNew: true,
        tag: "BESTSELLER",
    },
    {
        id: 2,
        name: "Polera Oversize",
        type: "Premium 100% Reactiva",
        price: "S/ 85.00",
        color: "Negro Ónix",
        image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=2574&auto=format&fit=crop",
        isNew: false,
        tag: "CLÁSICO",
    },
    {
        id: 3,
        name: "Set Urban Comfort",
        type: "Polera + Jogger",
        price: "S/ 140.00",
        color: "Beige Arena",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1920&auto=format&fit=crop",
        isNew: true,
        tag: "PACK",
    },
    {
        id: 4,
        name: "Hoodie Térmico",
        type: "Franela Pesada 400gsm",
        price: "S/ 120.00",
        color: "Carbón",
        image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1972&auto=format&fit=crop",
        isNew: true,
        tag: "NUEVO",
    },
    {
        id: 5,
        name: "Baggy Parachute",
        type: "Corte Wide Leg",
        price: "S/ 75.00",
        color: "Negro Lavado",
        image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=2080&auto=format&fit=crop",
        isNew: false,
        tag: "TRENDING",
    },
];

export default function FeaturedProducts() {
    const scrollRef = useRef<HTMLDivElement>(null);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const cardVariants: Variants = {
        hidden: { y: 40, opacity: 0 },
        show: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 60, damping: 18 }
        }
    };

    return (
        <section id="productos" className="py-28 md:py-36 bg-black relative overflow-hidden">
            {/* Top border */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-800/50 to-transparent" />

            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-500/[0.04] rounded-full blur-[150px] pointer-events-none -translate-y-1/2" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-8 mb-16 md:mb-20">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <Sparkles className="w-4 h-4 text-orange-500" />
                            <span className="text-[11px] font-oswald uppercase tracking-[0.3em] text-orange-500 font-bold">Lo Más Vendido</span>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-oswald font-black text-white uppercase tracking-[-0.03em] leading-[0.9]">
                            DESTACADOS
                            <span className="block text-transparent bg-clip-text mt-1" style={{ backgroundImage: "linear-gradient(to right, #FFE600, #FF8B00, #86CB2D, #21A2FF, #D41C95, #E00B21)" }}>
                                DE LA SEMANA.
                            </span>
                        </h2>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                    >
                        <Link href="#categorias" className="hidden md:inline-flex items-center gap-3 px-7 py-3.5 bg-zinc-900/80 backdrop-blur-md text-white rounded-full font-oswald uppercase tracking-[0.12em] text-xs font-bold hover:bg-white hover:text-black transition-all duration-500 border border-zinc-800 hover:border-white shadow-xl">
                            Explorar Todo
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </motion.div>
                </div>

                {/* Horizontal scrollable gallery on mobile, grid on desktop */}
                <div
                    ref={scrollRef}
                    className="flex lg:grid lg:grid-cols-3 gap-5 md:gap-6 overflow-x-auto lg:overflow-visible scrollbar-hide scroll-snap-x pb-4 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0"
                >
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-50px" }}
                        className="contents"
                    >
                        {products.slice(0, 3).map((product) => (
                            <motion.div
                                variants={cardVariants}
                                key={product.id}
                                className="group relative flex-shrink-0 w-[80vw] sm:w-[55vw] lg:w-auto scroll-snap-center"
                            >
                                {/* Card */}
                                <div className="relative w-full aspect-[3/4] bg-zinc-950 overflow-hidden rounded-2xl border border-zinc-800/50 transition-all duration-700 group-hover:border-zinc-700 group-hover:shadow-[0_25px_60px_rgba(0,0,0,0.8)]">
                                    {/* Tag */}
                                    <div className="absolute top-4 left-4 z-20">
                                        <div className="px-3 py-1.5 bg-black/50 backdrop-blur-xl rounded-full border border-orange-500/20">
                                            <span className="text-[9px] font-oswald tracking-[0.2em] font-bold text-orange-400 uppercase">
                                                {product.tag}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Image gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-70 group-hover:opacity-40 transition-opacity duration-700 z-10" />

                                    {/* Image */}
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover object-center scale-100 group-hover:scale-110 transition-transform duration-1000 ease-out"
                                    />

                                    {/* Quick add button */}
                                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[88%] translate-y-[150%] group-hover:translate-y-0 transition-transform duration-500 ease-out z-20">
                                        <button className="w-full py-3.5 bg-white/10 backdrop-blur-2xl border border-white/15 text-white rounded-xl hover:bg-white hover:text-black font-oswald uppercase tracking-[0.12em] text-xs font-bold flex items-center justify-center gap-2.5 transition-all duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
                                            <ShoppingBag className="w-3.5 h-3.5" />
                                            Agregar al carrito
                                        </button>
                                    </div>
                                </div>

                                {/* Product info */}
                                <div className="mt-5 flex flex-col px-1">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <p className="text-[10px] text-zinc-600 font-oswald uppercase tracking-[0.2em] font-bold">{product.type}</p>
                                        <p className="text-orange-500 font-oswald font-bold tracking-wider text-base">{product.price}</p>
                                    </div>
                                    <h3 className="text-xl font-oswald uppercase font-black text-zinc-200 group-hover:text-white transition-colors tracking-tight leading-tight">
                                        {product.name}
                                    </h3>
                                    <p className="text-[10px] text-zinc-600 font-oswald uppercase tracking-[0.15em] mt-1">{product.color}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {/* Second row — 2 cards */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6 mt-5 md:mt-6"
                >
                    {products.slice(3).map((product) => (
                        <motion.div
                            variants={cardVariants}
                            key={product.id}
                            className="group relative"
                        >
                            {/* Wide Card */}
                            <div className="relative w-full aspect-[16/9] sm:aspect-[5/3] bg-zinc-950 overflow-hidden rounded-2xl border border-zinc-800/50 transition-all duration-700 group-hover:border-zinc-700 group-hover:shadow-[0_25px_60px_rgba(0,0,0,0.8)]">
                                <div className="absolute top-4 left-4 z-20">
                                    <div className="px-3 py-1.5 bg-black/50 backdrop-blur-xl rounded-full border border-orange-500/20">
                                        <span className="text-[9px] font-oswald tracking-[0.2em] font-bold text-orange-400 uppercase">{product.tag}</span>
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-60 group-hover:opacity-30 transition-opacity duration-700 z-10" />
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover object-center scale-100 group-hover:scale-110 transition-transform duration-1000 ease-out"
                                />

                                {/* Inline info on wide cards */}
                                <div className="absolute bottom-0 left-0 right-0 p-5 z-20 flex justify-between items-end">
                                    <div>
                                        <p className="text-[9px] text-zinc-500 font-oswald uppercase tracking-[0.2em] font-bold mb-1">{product.type}</p>
                                        <h3 className="text-2xl font-oswald uppercase font-black text-white tracking-tight leading-none">{product.name}</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-orange-500 font-oswald font-bold text-lg">{product.price}</p>
                                        <p className="text-[9px] text-zinc-600 font-oswald uppercase tracking-[0.15em]">{product.color}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Mobile CTA */}
                <div className="mt-12 text-center lg:hidden">
                    <Link href="#categorias" className="inline-flex items-center justify-center px-8 py-4 text-xs tracking-[0.12em] uppercase font-oswald font-bold text-black bg-white rounded-full w-full shadow-xl">
                        Ver todo el catálogo
                        <ArrowRight className="w-4 h-4 ml-3" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
