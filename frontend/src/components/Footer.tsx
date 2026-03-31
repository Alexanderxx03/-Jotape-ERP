import JotaPeLogo from "./JotaPeLogo";

export default function Footer() {
    return (
        <footer className="bg-black text-zinc-400 py-20 border-t border-zinc-900 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid md:grid-cols-4 gap-12 lg:gap-8">
                    <div className="md:col-span-2">
                        <JotaPeLogo className="h-16 w-auto mb-6 drop-shadow-[0_4px_20px_rgba(255,255,255,0.1)]" />
                        <p className="max-w-sm mb-8 text-lg">
                            Poleras y joggers de franela premium. Diseño urbano pesado para el día a día sin reglas.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-white font-oswald text-xl uppercase tracking-widest mb-6">Explore</h4>
                        <ul className="space-y-4 font-oswald tracking-widest uppercase text-sm">
                            <li><a href="#coleccion" className="hover:text-orange-500 transition-colors">Colección</a></li>
                            <li><a href="#best-sellers" className="hover:text-orange-500 transition-colors">Lo Más Vendido</a></li>
                            <li><a href="#nosotros" className="hover:text-orange-500 transition-colors">Acerca de nosotros</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-oswald text-xl uppercase tracking-widest mb-6">Support</h4>
                        <ul className="space-y-4 font-oswald tracking-widest uppercase text-sm">
                            <li><a href="#" className="hover:text-orange-500 transition-colors">Contacto</a></li>
                            <li><a href="#" className="hover:text-orange-500 transition-colors">Envíos & Devoluciones</a></li>
                            <li><a href="#" className="hover:text-orange-500 transition-colors">Guía de tallas</a></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-20 pt-8 border-t border-zinc-900 text-xs font-oswald uppercase tracking-widest text-zinc-600 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p>&copy; {new Date().getFullYear()} JOTAPE URBAN WEAR. ALL RIGHTS RESERVED.</p>
                    <div className="space-x-8">
                        <a href="#" className="hover:text-white transition-colors">Términos</a>
                        <a href="#" className="hover:text-white transition-colors">Privacidad</a>
                    </div>
                </div>
            </div>

            {/* Massive Background Text watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center opacity-[0.02] pointer-events-none whitespace-nowrap overflow-hidden">
                <span className="text-[25vw] font-oswald font-black tracking-tighter leading-none select-none">JOTAPE</span>
            </div>
        </footer>
    );
}
