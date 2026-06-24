"use client";
import { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { getOpcionesFormulario } from "@/lib/firestoreUtils";

// Default category images (local assets)
const CATEGORY_IMAGES: Record<string, string> = {
    Poleras: "/poleras.png",
    Buzos: "/buzos.png",
    Shorts: "/shorts.png",
};

// Fallback gradient colors per category
const CATEGORY_ACCENTS: Record<string, { from: string; to: string }> = {
    Poleras: { from: "from-orange-600/30", to: "to-amber-500/10" },
    Buzos: { from: "from-blue-600/30", to: "to-cyan-500/10" },
    Shorts: { from: "from-emerald-600/30", to: "to-teal-500/10" },
};

const DEFAULT_ACCENT = { from: "from-purple-600/30", to: "to-fuchsia-500/10" };

export default function CategoriesShowcase() {
    const [categorias, setCategorias] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [hoveredCat, setHoveredCat] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const data: any = await getOpcionesFormulario();
                setCategorias(data.categorias || {});
            } catch {
                // Fallback estático
                setCategorias({
                    Poleras: ["Reactiva", "Oversize", "Hoodie"],
                    Buzos: ["Joggers", "Baggy", "Parachute"],
                    Shorts: ["Urbano", "Deportivo"],
                });
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    const cardVariants: Variants = {
        hidden: { y: 50, opacity: 0, scale: 0.95 },
        show: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: { type: "spring", stiffness: 50, damping: 20 }
        }
    };

    const catEntries = Object.entries(categorias);

    return (
        <section id="categorias" className="py-28 md:py-36 bg-black relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-800/50 to-transparent" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-orange-600/[0.03] rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mb-16 md:mb-24"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-px bg-orange-500" />
                        <span className="text-[11px] font-oswald uppercase tracking-[0.3em] text-orange-500 font-bold">Nuestro Catálogo</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl lg:text-8xl font-oswald font-black text-white uppercase tracking-[-0.03em] leading-[0.9]">
                        EXPLORA POR{" "}
                        <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right, #FFE600, #FF8B00, #86CB2D, #21A2FF, #D41C95, #E00B21)" }}>
                            CATEGORÍA
                        </span>
                    </h2>
                    <p className="text-zinc-500 text-base md:text-lg mt-6 max-w-xl font-light leading-relaxed">
                        Cada pieza diseñada con precisión textil. Encuentra tu estilo entre nuestras líneas de producción propia.
                    </p>
                </motion.div>

                {/* Loading state */}
                {isLoading ? (
                    <div className="flex justify-center py-32">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-50px" }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6"
                    >
                        {catEntries.map(([catName, tipos], idx) => {
                            const accent = CATEGORY_ACCENTS[catName] || DEFAULT_ACCENT;
                            const image = CATEGORY_IMAGES[catName] || CATEGORY_IMAGES.Poleras;
                            const isHovered = hoveredCat === catName;

                            return (
                                <motion.div
                                    variants={cardVariants}
                                    key={catName}
                                    className={`group relative cursor-pointer ${idx === 0 ? "md:col-span-2 lg:col-span-1 lg:row-span-2" : ""}`}
                                    onMouseEnter={() => setHoveredCat(catName)}
                                    onMouseLeave={() => setHoveredCat(null)}
                                >
                                    <div className={`relative w-full overflow-hidden rounded-3xl border border-zinc-800/60 bg-zinc-950 transition-all duration-700 group-hover:border-zinc-700/80 group-hover:shadow-[0_30px_80px_rgba(0,0,0,0.8)] ${idx === 0 ? "lg:h-full lg:min-h-[600px] aspect-[4/5] lg:aspect-auto" : "aspect-[4/5]"}`}>
                                        {/* Gradient accent overlay */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${accent.from} ${accent.to} opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10`} />

                                        {/* Dark overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20 z-10 transition-all duration-700 group-hover:from-black/90 group-hover:via-black/40 group-hover:to-transparent" />

                                        {/* Category Image */}
                                        <img
                                            src={image}
                                            alt={catName}
                                            className="w-full h-full object-cover object-center scale-100 group-hover:scale-110 transition-transform duration-1000 ease-out"
                                        />

                                        {/* Content overlay */}
                                        <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 md:p-8">
                                            {/* Top — Category number */}
                                            <div className="flex justify-between items-start">
                                                <span className="text-[10px] font-oswald text-zinc-600 tracking-[0.2em] uppercase font-bold">
                                                    {String(idx + 1).padStart(2, "0")}
                                                </span>
                                                <div className="w-10 h-10 rounded-full border border-zinc-700/50 bg-black/30 backdrop-blur-md flex items-center justify-center group-hover:bg-white group-hover:border-white transition-all duration-500">
                                                    <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-black group-hover:rotate-45 transition-all duration-500" />
                                                </div>
                                            </div>

                                            {/* Bottom — Category info */}
                                            <div>
                                                {/* Subtypes — revealed on hover */}
                                                <div className={`flex flex-wrap gap-2 mb-5 transition-all duration-500 ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                                                    {tipos.map((tipo, tIdx) => (
                                                        <span
                                                            key={tipo}
                                                            className="px-3 py-1.5 text-[10px] font-oswald uppercase tracking-[0.15em] font-bold text-white/80 bg-white/10 backdrop-blur-md rounded-full border border-white/10"
                                                            style={{ transitionDelay: `${tIdx * 60}ms` }}
                                                        >
                                                            {tipo}
                                                        </span>
                                                    ))}
                                                </div>

                                                <h3 className="text-4xl md:text-5xl font-oswald font-black text-white uppercase tracking-[-0.02em] leading-[0.9] mb-2">
                                                    {catName}
                                                </h3>
                                                <p className="text-xs font-oswald text-zinc-500 uppercase tracking-[0.2em] font-medium">
                                                    {tipos.length} {tipos.length === 1 ? "estilo" : "estilos"} disponibles
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </div>
        </section>
    );
}
