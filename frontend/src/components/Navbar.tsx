"use client";
import { ShoppingCart, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";
import JotaPeLogo from "./JotaPeLogo";

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed top-0 w-full z-50 transition-colors duration-500 ${isScrolled ? 'bg-black/90 backdrop-blur-xl border-b border-zinc-900 py-3' : 'bg-transparent py-6'}`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <Link href="/" className="relative z-10 flex-shrink-0 flex items-center group">
                        <JotaPeLogo className="h-10 w-auto group-hover:scale-105 transition-transform duration-300 drop-shadow-md" />
                    </Link>

                    {/* Desktop Menu - Brutalist Pill */}
                    <nav className="hidden md:flex space-x-1 items-center bg-black/40 backdrop-blur-md px-2 py-1.5 rounded-full border border-zinc-800 shadow-2xl">
                        <Link href="#coleccion" className="px-5 py-2 text-xs font-oswald uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full transition-all">Colección</Link>
                        <Link href="#best-sellers" className="px-5 py-2 text-xs font-oswald uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full transition-all">Lo Más Vendido</Link>
                        <Link href="#calidad" className="px-5 py-2 text-xs font-oswald uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full transition-all">Calidad</Link>
                    </nav>

                    {/* Actions */}
                    <div className="hidden md:flex items-center space-x-6">
                        <Link href="/admin/login" className="text-xs font-oswald uppercase tracking-widest text-zinc-500 hover:text-orange-500 transition-colors">
                            Acceso Empleados
                        </Link>
                        <button className="p-3 bg-zinc-900 hover:bg-orange-600 rounded-full transition-colors relative group border border-zinc-800 hover:border-orange-500">
                            <ShoppingCart className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-black">
                                0
                            </span>
                        </button>
                        <ThemeToggle />
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center md:hidden z-10">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-3 bg-zinc-900 rounded-full text-white border border-zinc-800 active:scale-95 transition-transform"
                        >
                            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Fullscreen Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 bg-black z-0 flex flex-col justify-center px-6"
                    >
                        <div className="flex flex-col space-y-6 text-center">
                            <Link onClick={() => setIsMobileMenuOpen(false)} href="#coleccion" className="text-4xl font-oswald font-bold uppercase tracking-tighter text-zinc-400 hover:text-white transition-colors">Colección</Link>
                            <Link onClick={() => setIsMobileMenuOpen(false)} href="#best-sellers" className="text-4xl font-oswald font-bold uppercase tracking-tighter text-zinc-400 hover:text-white transition-colors">Lo Más Vendido</Link>
                            <Link onClick={() => setIsMobileMenuOpen(false)} href="#calidad" className="text-4xl font-oswald font-bold uppercase tracking-tighter text-zinc-400 hover:text-white transition-colors">Calidad</Link>
                            <div className="h-px bg-zinc-900 w-full my-4"></div>
                            <Link onClick={() => setIsMobileMenuOpen(false)} href="/admin/login" className="text-xl font-oswald text-orange-600 tracking-widest uppercase">Admin Login</Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
}
