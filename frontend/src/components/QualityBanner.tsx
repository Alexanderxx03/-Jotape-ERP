"use client";
import { motion } from "framer-motion";

const qualities = [
    "100% REACTIVA",
    "NO DESTIÑE",
    "NO ENCOGE",
    "FRANELA PREMIUM",
    "PRODUCCIÓN PROPIA",
    "CORTE URBANO",
    "CALIDAD TEXTIL",
    "DISEÑO PESADO",
];

export default function QualityBanner() {
    // Duplicate the array for seamless loop
    const marqueeItems = [...qualities, ...qualities];

    return (
        <section id="calidad" className="py-0 bg-black relative overflow-hidden border-y border-zinc-800/50">
            {/* Gradient background bar */}
            <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(to right, #FFE600, #FF8B00, #86CB2D, #21A2FF, #D41C95, #E00B21)" }} />

            {/* Marquee row 1 */}
            <div className="relative overflow-hidden py-6 md:py-8">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="flex whitespace-nowrap animate-marquee"
                >
                    {marqueeItems.map((item, idx) => (
                        <div key={`${item}-${idx}`} className="flex items-center shrink-0">
                            <span className="text-3xl md:text-5xl lg:text-6xl font-oswald font-black text-white/90 uppercase tracking-[-0.02em] mx-4 md:mx-6 select-none">
                                {item}
                            </span>
                            <span className="w-2 h-2 md:w-3 md:h-3 rounded-full shrink-0 mx-4 md:mx-6" style={{ background: "linear-gradient(135deg, #FF8B00, #E00B21)" }} />
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Marquee row 2 — reverse direction */}
            <div className="relative overflow-hidden py-6 md:py-8 border-t border-zinc-800/30">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="flex whitespace-nowrap"
                    style={{ animation: "marquee 25s linear infinite reverse" }}
                >
                    {marqueeItems.map((item, idx) => (
                        <div key={`rev-${item}-${idx}`} className="flex items-center shrink-0">
                            <span className="text-3xl md:text-5xl lg:text-6xl font-oswald font-black text-transparent uppercase tracking-[-0.02em] mx-4 md:mx-6 select-none"
                                style={{ WebkitTextStroke: "1px rgba(255,255,255,0.15)" }}>
                                {item}
                            </span>
                            <span className="w-2 h-2 md:w-3 md:h-3 rounded-full shrink-0 mx-4 md:mx-6 bg-zinc-800" />
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
