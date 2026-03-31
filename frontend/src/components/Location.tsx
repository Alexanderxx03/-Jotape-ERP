import { MapPin, Building2, FileText } from "lucide-react";

export default function Location() {
    return (
        <section className="bg-zinc-950 py-32 relative overflow-hidden border-t border-zinc-900" id="ubicacion">
            {/* Glow effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-600/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col items-center mb-20">
                    <h2 className="text-5xl md:text-7xl font-oswald font-black text-white uppercase tracking-tighter text-center leading-[0.9]">
                        NUESTRA <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(to right, #FFE600, #FF8B00, #86CB2D, #21A2FF, #D41C95, #E00B21)" }}>UBICACIÓN</span>
                    </h2>
                    <div className="w-24 h-1.5 mt-8 mb-8 duration-500 hover:w-40 transition-all rounded-full" style={{ background: "linear-gradient(to right, #FFE600, #FF8B00, #86CB2D, #21A2FF, #D41C95, #E00B21)" }}></div>
                    <p className="text-zinc-400 max-w-2xl text-center text-lg md:text-xl font-light">
                        Visítanos en nuestra tienda física para sentir de cerca la calidad premium de nuestros tejidos y diseños.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Company Info - Premium Glass Card */}
                    <div className="space-y-10 bg-black/40 backdrop-blur-3xl p-8 md:p-14 rounded-[2rem] border border-zinc-800/80 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-orange-500/20 transition-colors duration-700 z-0"></div>

                        <div className="relative z-10">
                            <div className="flex items-start gap-6 group/item">
                                <div className="bg-zinc-900 p-4 rounded-2xl text-zinc-400 group-hover/item:text-orange-500 group-hover/item:bg-orange-500/10 transition-all duration-300 shrink-0 border border-zinc-800">
                                    <Building2 size={26} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-oswald font-bold text-zinc-500 mb-1.5 tracking-[0.2em] uppercase">Empresa</h3>
                                    <p className="text-zinc-100 text-xl font-medium tracking-tight">DISTRIBUIDOR TEXTIL JOTAPE E.I.R.L.</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-start gap-6 group/item">
                                <div className="bg-zinc-900 p-4 rounded-2xl text-zinc-400 group-hover/item:text-orange-500 group-hover/item:bg-orange-500/10 transition-all duration-300 shrink-0 border border-zinc-800">
                                    <FileText size={26} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-oswald font-bold text-zinc-500 mb-1.5 tracking-[0.2em] uppercase">RUC</h3>
                                    <p className="text-zinc-300 text-xl tracking-tight">20612487171</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-start gap-6 group/item">
                                <div className="bg-zinc-900 p-4 rounded-2xl text-zinc-400 group-hover/item:text-orange-500 group-hover/item:bg-orange-500/10 transition-all duration-300 shrink-0 border border-zinc-800">
                                    <MapPin size={26} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-oswald font-bold text-zinc-500 mb-1.5 tracking-[0.2em] uppercase">Dirección</h3>
                                    <p className="text-zinc-300 text-lg leading-relaxed">
                                        JR. ICA NRO. 137 INT. 72 <br />
                                        <span className="text-zinc-500">HUANCAYO CERCADO, JUNIN</span><br />
                                        HUANCAYO - HUANCAYO
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Map Embed - Elegant Presentation */}
                    <div className="h-[500px] lg:h-full w-full min-h-[500px] rounded-[2rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-zinc-800/80 relative group bg-zinc-900">
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-700 z-10 pointer-events-none"></div>
                        <iframe
                            src="https://maps.google.com/maps?q=Distribuidor+Textil+JotaPe,-12.068636558239431,-75.20474559025389&t=&z=20&ie=UTF8&iwloc=&output=embed"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen={false}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000 ease-in-out"
                        ></iframe>
                    </div>
                </div>
            </div>
        </section>
    );
}
