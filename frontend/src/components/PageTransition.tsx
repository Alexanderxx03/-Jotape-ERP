"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { usePathname } from "next/navigation";
import JotaPeLogo from "./JotaPeLogo";

export default function PageTransition({ children }: { children: React.ReactNode }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const logoRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const [isAnimating, setIsAnimating] = useState(true);

    useEffect(() => {
        setIsAnimating(true);
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                onComplete: () => setIsAnimating(false)
            });

            // 1. Initial State: overlay covers the screen
            gsap.set(containerRef.current, { yPercent: 0, borderBottomLeftRadius: "0%", borderBottomRightRadius: "0%" });
            
            // 2. Letters stagger in
            if (textRef.current && textRef.current.children) {
                gsap.set(textRef.current.children, { y: -50, opacity: 0 });
                tl.to(textRef.current.children, {
                    y: 0,
                    opacity: 1,
                    duration: 0.4,
                    stagger: 0.05,
                    ease: "back.out(1.7)"
                });
            }

            // 3. Logo pulses/scales
            tl.fromTo(logoRef.current, 
                { scale: 0.8, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.5, ease: "elastic.out(1, 0.5)" },
                "-=0.2"
            );

            // 4. Short pause
            tl.to({}, { duration: 0.2 });

            // 5. Overlay slides UP, revealing the new page
            tl.to(containerRef.current, {
                yPercent: -100,
                duration: 0.6,
                ease: "power4.inOut",
                borderBottomLeftRadius: "50%",
                borderBottomRightRadius: "50%"
            });

        });

        return () => ctx.revert();
    }, [pathname]);

    return (
        <>
            {isAnimating && (
                <div 
                    ref={containerRef}
                    className="fixed inset-0 z-[9999] bg-white dark:bg-black flex flex-col items-center justify-center pointer-events-none"
                    style={{ transformOrigin: "top" }}
                >
                    <div className="flex flex-col items-center gap-6">
                        <div ref={logoRef} className="opacity-0">
                            <JotaPeLogo className="w-24 h-24" />
                        </div>
                        <div ref={textRef} className="flex gap-1 text-2xl md:text-4xl font-black text-orange-500 tracking-widest uppercase overflow-hidden">
                            {"JOTAPE".split("").map((letter, index) => (
                                <span key={index} className="inline-block">
                                    {letter}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {children}
        </>
    );
}
