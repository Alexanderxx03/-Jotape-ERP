"use client";
import { motion } from "framer-motion";
import { Factory, Users, Shirt, Award } from "lucide-react";

const stats = [
    { label: "Años en el Mercado", value: "5+", icon: Award },
    { label: "Clientes Satisfechos", value: "2K+", icon: Users },
    { label: "Prendas Producidas", value: "50K+", icon: Shirt },
    { label: "Producción Propia", value: "100%", icon: Factory },
];

export default function BrandStory() {
    return (
        <section id="nosotros" className="py-28 md:py-36 bg-black relative overflow-hidden">
            {/* Top line */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-zinc-800/50 to-transparent" />

            {/* Background elements */}
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-500/[0.03] rounded-full blur-[150px] pointer-events-none translate-y-1/2 -translate-x-1/3" />
            <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-amber-600/[0.03] rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                    {/* Left — Text block */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-px bg-orange-500" />
                            <span className="text-[11px] font-oswald uppercase tracking-[0.3em] text-orange-500 font-bold">Nuestra Historia</span>
                        </div>

                        <h2 className="text-5xl md:text-6xl lg:text-7xl font-oswald font-black text-white uppercase tracking-[-0.03em] leading-[0.9] mb-8">
                            NACIDOS{" "}
                            <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right, #FFE600, #FF8B00)" }}>
                                EN LA
                            </span>
                            <br />
                            <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right, #86CB2D, #21A2FF, #D41C95)" }}>
                                SIERRA
                            </span>{" "}
                            CENTRAL.
                        </h2>

                        <div className="space-y-5 text-zinc-400 text-base md:text-lg font-light leading-relaxed">
                            <p>
                                <strong className="text-zinc-200 font-medium">Distribuidor Textil JOTAPE E.I.R.L.</strong> nace en Huancayo con una misión clara:
                                crear prendas urbanas de calidad premium a precio justo.
                            </p>
                            <p>
                                Con producción 100% propia — desde el corte de tela hasta la costura final — controlamos cada paso del proceso para garantizar que cada pieza cumpla con nuestros estándares de
                                <strong className="text-orange-400 font-medium"> calidad reactiva</strong>.
                            </p>
                            <p>
                                No tercerizamos. No comprometemos. Cada polera, cada jogger, cada hoodie lleva el sello de la dedicación artesanal combinada con técnicas industriales modernas.
                            </p>
                        </div>

                        {/* CTA */}
                        <div className="mt-10 flex items-center gap-6">
                            <a href="#ubicacion" className="inline-flex items-center px-7 py-3.5 bg-zinc-900 text-white rounded-full font-oswald uppercase tracking-[0.12em] text-xs font-bold hover:bg-white hover:text-black transition-all duration-500 border border-zinc-800 hover:border-white">
                                Visítanos
                            </a>
                            <div className="flex items-center gap-2 text-zinc-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-oswald uppercase tracking-[0.2em] font-bold">Huancayo, Junín</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right — Stats grid */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-80px" }}
                        transition={{ duration: 0.8, delay: 0.15 }}
                        className="grid grid-cols-2 gap-4 md:gap-5"
                    >
                        {stats.map((stat, idx) => {
                            const Icon = stat.icon;
                            return (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 + idx * 0.1, duration: 0.5 }}
                                    className="group bg-zinc-950/80 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-6 md:p-8 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all duration-500 relative overflow-hidden"
                                >
                                    {/* Ambient corner glow */}
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-500/10 transition-colors duration-700" />

                                    <div className="relative z-10">
                                        <Icon className="w-5 h-5 text-zinc-600 group-hover:text-orange-500 transition-colors duration-500 mb-5" strokeWidth={1.5} />
                                        <p className="text-4xl md:text-5xl font-oswald font-black text-white tracking-tight leading-none mb-2">
                                            {stat.value}
                                        </p>
                                        <p className="text-[10px] font-oswald text-zinc-500 uppercase tracking-[0.2em] font-bold leading-tight">
                                            {stat.label}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
