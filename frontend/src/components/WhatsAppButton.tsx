import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
    const whatsappNumber = "51999999999"; // Cambiar por el número real
    const message = "Hola! Vengo desde la página web de Jotape, me gustaría pedir información y hacer un pedido.";
    const href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:bg-[#1EBE5D] hover:scale-110 transition-all duration-300 group flex items-center justify-center animate-bounce-slow"
            aria-label="Chat on WhatsApp"
        >
            <MessageCircle className="w-8 h-8" />
            <span className="absolute right-full mr-4 bg-white text-stone-900 text-sm py-2 px-4 rounded-xl shadow-lg font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none origin-right scale-95 group-hover:scale-100">
                ¡Haz tu pedido aquí!
            </span>
        </a>
    );
}
