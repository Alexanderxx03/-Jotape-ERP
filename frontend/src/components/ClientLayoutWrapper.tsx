"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { usePathname } from "next/navigation";

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdminArea = pathname?.startsWith("/admin");

    return (
        <>
            {!isAdminArea && <Navbar />}
            <main className="flex-grow">{children}</main>
            {!isAdminArea && <Footer />}
            {!isAdminArea && <WhatsAppButton />}
        </>
    );
}
