"use client";
import Link from "next/link";
import { ArrowRight, Star, ChevronDown } from "lucide-react";
import { motion, Variants, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function Hero() {
    const sectionRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end start"]
    });

    const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.3]);
    const imageOpacity = useTransform(scrollYProgress, [0, 0.8], [0.5, 0]);
    const textY = useTransform(scrollYProgress, [0, 1], [0, 150]);

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.15, delayChildren: 0.3 }
        }
    };

    const itemVariants: Variants = {
        hidden: { y: 60, opacity: 0, filter: "blur(12px)" },
        show: {
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            transition: { type: "spring", stiffness: 40, damping: 18, duration: 1.2 }
        }
    };

    return (
        <section ref={sectionRef} className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-black selection:bg-orange-600 selection:text-white">
            {/* Layered Background */}
            <div className="absolute inset-0 z-0">
                {/* Grain overlay */}
                <div className="absolute inset-0 z-30 opacity-[0.04] pointer-events-none animate-grain"
                    style={{
                        backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 256 256\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noise\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"4\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noise)\"/%3E%3C/svg%3E')",
                        backgroundSize: "128px 128px"
                    }}
                />

                {/* Dark overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-black via-black/60 to-black z-20" />

                {/* Color accent spots */}
                <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-orange-600/8 rounded-full blur-[120px] z-10" />
                <div className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] z-10" />

                {/* Hero background image with parallax */}
                <motion.img
                    style={{ scale: imageScale, opacity: imageOpacity }}
                    src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=2574&auto=format&fit=crop"
                    alt="Jotape Urban Wear"
                    className="w-full h-full object-cover object-center"
                />
            </div>

            {/* Main Content Grid */}
            <div className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="flex flex-col items-start"
                >
                    {/* Top badge */}
                    <motion.div variants={itemVariants} className="mb-8">
                        <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-zinc-800/80 bg-zinc-950/60 backdrop-blur-2xl">
                            <Star className="w-3 h-3 text-orange-500 fill-orange-500" />
                            <span className="text-[10px] md:text-xs font-oswald uppercase tracking-[0.3em] text-zinc-400 font-medium">
                                Colección Invierno 2026
                            </span>
                            <div className="w-1 h-1 rounded-full bg-orange-500" />
                            <span className="text-[10px] md:text-xs font-oswald uppercase tracking-[0.3em] text-orange-500 font-bold">
                                NEW
                            </span>
                        </div>
                    </motion.div>

                    {/* Giant Typography Block */}
                    <motion.div style={{ y: textY }} className="w-full">
                        <motion.h1 variants={itemVariants} className="relative mb-8">
                            {/* Line 1 — Outlined text */}
                            <span className="block text-[16vw] md:text-[9rem] lg:text-[11rem] leading-[0.82] font-oswald font-black uppercase tracking-[-0.04em] text-transparent"
                                style={{ WebkitTextStroke: "1.5px rgba(255,255,255,0.12)" }}>
                                URBAN
                            </span>
                            {/* Line 2 — Solid white with glow */}
                            <span className="block text-[16vw] md:text-[9rem] lg:text-[11rem] leading-[0.82] font-oswald font-black uppercase tracking-[-0.04em] text-white relative">
                                WEAR
                                <span className="absolute inset-0 text-white blur-2xl opacity-10" aria-hidden="true">WEAR</span>
                            </span>
                            {/* Line 3 — Rainbow gradient */}
                            <span className="block text-[16vw] md:text-[9rem] lg:text-[11rem] leading-[0.82] font-oswald font-black uppercase tracking-[-0.04em] text-transparent bg-clip-text"
                                style={{ backgroundImage: "linear-gradient(to right, #FFE600, #FF8B00, #86CB2D, #21A2FF, #D41C95, #E00B21)" }}>
                                JOTAPE.
                            </span>
                        </motion.h1>
                    </motion.div>

                    {/* Subtext and CTAs row */}
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between w-full gap-10 mt-4">
                        <motion.p variants={itemVariants} className="text-base md:text-lg text-zinc-500 font-light max-w-md leading-relaxed">
                            Poleras y joggers de franela <strong className="text-zinc-200 font-medium">100% reactiva</strong>.
                            Diseño pesado que no destiñe ni encoge. Streetwear que resiste todo.
                        </motion.p>

                        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <Link href="#categorias" className="group relative px-8 py-4 bg-white text-black font-oswald font-bold uppercase tracking-[0.15em] text-sm overflow-hidden rounded-full shadow-[0_0_50px_rgba(255,255,255,0.08)] hover:shadow-[0_0_50px_rgba(255,255,255,0.25)] transition-all duration-500">
                                <span className="relative z-10 flex items-center">
                                    Ver Colección
                                    <ArrowRight className="ml-3 w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-400 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 ease-out z-0" />
                                <span className="absolute inset-0 z-10 flex items-center justify-center font-oswald font-bold uppercase tracking-[0.15em] text-sm text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                    Ver Colección
                                    <ArrowRight className="ml-3 w-4 h-4" />
                                </span>
                            </Link>

                            <Link href="#nosotros" className="group flex items-center gap-3 px-6 py-4 text-zinc-500 font-oswald font-medium uppercase tracking-[0.15em] text-sm hover:text-white transition-colors duration-300">
                                <span>Sobre Nosotros</span>
                                <div className="w-8 h-px bg-zinc-800 group-hover:bg-orange-500 group-hover:w-14 transition-all duration-500" />
                            </Link>
                        </motion.div>
                    </div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2, duration: 1 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-30"
            >
                <span className="text-[9px] text-zinc-600 font-oswald uppercase tracking-[0.3em]">Scroll</span>
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                    <ChevronDown className="w-4 h-4 text-zinc-600" />
                </motion.div>
            </motion.div>

            {/* Bottom gradient fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-20" />
        </section>
    );
}
