"use client";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { motion, Variants } from "framer-motion";

export default function Hero() {
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.2, delayChildren: 0.4 }
        }
    };

    const itemVariants: Variants = {
        hidden: { y: 50, opacity: 0, filter: "blur(10px)" },
        show: {
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            transition: { type: "spring", stiffness: 50, damping: 20 }
        }
    };

    return (
        <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden bg-zinc-950 selection:bg-orange-600 selection:text-white">
            {/* Dark & Gritty Background Layer */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black z-10" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/20 via-transparent to-transparent z-10" />

                {/* Animated Image with Scale */}
                <motion.img
                    initial={{ scale: 1.15, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.6 }}
                    transition={{ duration: 2.5, ease: [0.33, 1, 0.68, 1] }}
                    src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=2574&auto=format&fit=crop"
                    alt="Jotape Urban Wear Background"
                    className="w-full h-full object-cover object-center grayscale mix-blend-luminosity"
                />
            </div>

            {/* Typography & Content */}
            <div className="relative z-20 w-full px-4 sm:px-6 lg:px-8 pt-32 pb-20 flex flex-col items-center justify-center text-center">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="max-w-5xl mx-auto flex flex-col items-center"
                >
                    <motion.div variants={itemVariants} className="mb-6 flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
                        <Star className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                        <span className="text-[10px] md:text-xs font-oswald uppercase tracking-[0.25em] text-zinc-300 font-medium">
                            Colección Invierno 2026
                        </span>
                    </motion.div>

                    <motion.h1 variants={itemVariants} className="text-[12vw] md:text-[8.5rem] leading-[0.8] font-oswald font-black uppercase tracking-tighter text-white mb-8 relative">
                        <span className="block text-transparent" style={{ WebkitTextStroke: "1.5px rgba(255,255,255,0.15)" }}>FRANELA</span>
                        <span className="block relative z-10 text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.2)]">PREMIUM</span>
                        <span className="block text-transparent bg-clip-text mt-2" style={{ backgroundImage: "linear-gradient(to right, #FFE600, #FF8B00, #86CB2D, #21A2FF, #D41C95, #E00B21)" }}>URBANA.</span>
                    </motion.h1>

                    <motion.p variants={itemVariants} className="text-base md:text-xl text-zinc-400 font-light max-w-xl mx-auto leading-relaxed mb-12">
                        Poleras y joggers <strong className="text-white font-medium">100% reactivos</strong>.
                        No destiñe. No encoge. Rendimiento brutal diseñado para la comodidad absoluta.
                    </motion.p>

                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-5 items-center w-full justify-center">
                        <Link href="#coleccion" className="group relative px-8 py-4 bg-white text-black font-oswald font-bold uppercase tracking-widest text-lg overflow-hidden rounded-full w-full sm:w-auto shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-300">
                            <span className="relative z-10 flex items-center justify-center">
                                Comprar Ahora
                                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                            <div className="absolute inset-0 bg-zinc-200 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 ease-out z-0"></div>
                        </Link>

                        <Link href="#calidad" className="group px-8 py-4 text-zinc-300 font-oswald font-medium uppercase tracking-widest text-lg hover:text-white transition-colors w-full sm:w-auto flex items-center justify-center gap-2">
                            <span>Saber Más</span>
                            <div className="w-8 h-px bg-zinc-700 group-hover:bg-orange-500 group-hover:w-12 transition-all duration-300"></div>
                        </Link>
                    </motion.div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8, duration: 1 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-20"
            >
                <div className="text-[10px] text-zinc-500 font-oswald uppercase tracking-[0.2em]">Descubre</div>
                <div className="w-0.5 h-16 bg-zinc-800/50 relative overflow-hidden rounded-full">
                    <motion.div
                        animate={{ y: ["-100%", "200%"] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="w-full h-1/2 bg-orange-500 absolute top-0 rounded-full blur-[1px]"
                    />
                </div>
            </motion.div>
        </section>
    );
}
