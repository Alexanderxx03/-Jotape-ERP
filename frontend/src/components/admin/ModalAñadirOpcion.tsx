import { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";

type ModalAñadirOpcionProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (valor: string) => void;
    title: string;
    description?: string;
    placeholder?: string;
    initialValue?: string;
    isDelete?: boolean;
    isSubmitting?: boolean;
};

export default function ModalAñadirOpcion({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    placeholder,
    initialValue = "",
    isDelete = false,
    isSubmitting = false
}: ModalAñadirOpcionProps) {
    const [valor, setValor] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setValor(initialValue);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, initialValue]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        
        if (isDelete) {
            onConfirm(initialValue);
        } else if (valor.trim()) {
            onConfirm(valor.trim());
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-950 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-200 border border-stone-200 dark:border-zinc-800">
                <div className="p-6 border-b border-stone-100 dark:border-zinc-800 flex justify-between items-center bg-stone-50/50 dark:bg-zinc-900/50">
                    <h2 className="text-xl font-bold text-stone-900 dark:text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="rounded-full p-2 hover:bg-stone-200 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-500">
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {description && (
                        <p className={`mb-4 text-sm ${isDelete ? 'text-red-600 dark:text-red-400 font-medium' : 'text-stone-600 dark:text-stone-400'}`}>
                            {description}
                        </p>
                    )}
                    
                    {!isDelete && (
                        <div className="mb-6">
                            {placeholder && (
                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                                    {placeholder}
                                </label>
                            )}
                            <input
                                ref={inputRef}
                                type="text"
                                value={valor}
                                onChange={(e) => setValor(e.target.value)}
                                placeholder="Escribe aquí..."
                                disabled={isSubmitting}
                                className="w-full px-4 py-3 rounded-lg border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:ring-2 focus:ring-orange-500 text-lg transition-colors disabled:bg-stone-100 dark:disabled:bg-zinc-800"
                                required={!isDelete}
                            />
                        </div>
                    )}

                    <div className="flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-5 py-2.5 rounded-lg border border-stone-300 dark:border-zinc-700 text-stone-700 dark:text-stone-300 font-medium hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={(!isDelete && !valor.trim()) || isSubmitting}
                            className={`px-5 py-2.5 rounded-lg flex items-center font-bold text-white transition-colors disabled:opacity-50 shadow-lg ${
                                isDelete 
                                    ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' 
                                    : 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/20'
                            }`}
                        >
                            {isSubmitting ? (
                                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> {isDelete ? 'Eliminando...' : 'Guardando...'}</>
                            ) : (
                                isDelete ? "Eliminar" : "Aceptar"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
