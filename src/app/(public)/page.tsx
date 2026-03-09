"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScanLine, Activity, Loader2, ShieldCheck } from "lucide-react";

export default function PublicKioskLoginPage() {
    const router = useRouter();
    const [rfidValue, setRfidValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
    const [particles, setParticles] = useState<{ left: string; delay: string; duration: string }[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    // Draggable / Interactive Icon State
    const [iconPos, setIconPos] = useState({ x: 0, y: 0 });
    const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - iconPos.x,
            y: e.clientY - iconPos.y
        });
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        setIsDragging(true);
        setDragOffset({
            x: touch.clientX - iconPos.x,
            y: touch.clientY - iconPos.y
        });
    };

    useEffect(() => {
        const handleMove = (x: number, y: number) => {
            if (isDragging) {
                setIconPos({
                    x: x - dragOffset.x,
                    y: y - dragOffset.y
                });
            } else {
                // Subtle magnetic follow effect
                const centerX = window.innerWidth / 2;
                const centerY = 200; // Approximate initial vertical center of the icon
                const distX = (x - centerX) * 0.05;
                const distY = (y - centerY) * 0.05;
                setHoverPos({ x: distX, y: distY });
            }
        };

        const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
        const handleTouchMove = (e: TouchEvent) => {
            if (isDragging) {
                const touch = e.touches[0];
                handleMove(touch.clientX, touch.clientY);
            }
        };

        const handleEnd = () => setIsDragging(false);

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("touchstart", () => {
            // Check if we started on the icon handled by handleTouchStart
        }, { passive: false });
        window.addEventListener("touchmove", handleTouchMove, { passive: false });
        window.addEventListener("touchend", handleEnd);
        window.addEventListener("mouseup", handleEnd);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleEnd);
            window.removeEventListener("mouseup", handleEnd);
        };
    }, [isDragging, dragOffset]);

    const createRipple = (x: number, y: number) => {
        const id = Date.now();
        setRipples(prev => [...prev, { id, x, y }]);
        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== id));
        }, 1500);
    };

    const handleBackgroundInteraction = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) {
            let x, y;
            if ("clientX" in e) {
                x = e.clientX;
                y = e.clientY;
            } else {
                x = e.touches[0].clientX;
                y = e.touches[0].clientY;
            }
            createRipple(x, y);
        }
    };

    useEffect(() => {
        const generatedParticles = [...Array(15)].map(() => ({
            left: `${Math.random() * 100}%`,
            delay: `${Math.random() * 15}s`,
            duration: `${10 + Math.random() * 20}s`
        }));
        // Use requestAnimationFrame to avoid synchronous setState in effect
        requestAnimationFrame(() => {
            setParticles(generatedParticles);
        });
    }, []);

    // Kiosk Lockdown: Disable right-click and maintain focus
    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();
        const focusInput = () => {
            if (!loading && inputRef.current) {
                inputRef.current.focus();
            }
        };

        focusInput();
        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("click", focusInput);

        const intervalId = setInterval(focusInput, 2000);

        return () => {
            clearInterval(intervalId);
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("click", focusInput);
        };
    }, [loading]);

    const handleRfidScan = async (code: string) => {
        if (!code.trim() || loading) return;

        setLoading(true);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const res = await fetch("/api/auth/kiosk-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rfidCode: code.trim() }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const data = await res.json() as { success: boolean; message?: string; user?: { firstName: string; lastName: string } };

            if (res.ok && data.success) {
                toast.success(`Welcome, ${data.user?.firstName || 'User'}!`, {
                    description: "Authorization successful. Redirecting...",
                    duration: 3000,
                });

                // Direct router push handles the client-side app navigation nicely
                router.push("/kiosk-management");
                router.refresh(); // Tells Next.js to revalidate the path and apply middleware checks immediately
            } else {
                toast.error("Access Denied", {
                    description: data.message ?? "Invalid RFID or unauthorized department.",
                    duration: 5000,
                });
                setRfidValue("");
                setLoading(false);
            }
        } catch {
            toast.error("Server is down please contact Administrator", {
                duration: 5000,
            });
            setRfidValue("");
            setLoading(false);
        }
    };

    return (
        <div
            onMouseDown={handleBackgroundInteraction}
            onTouchStart={handleBackgroundInteraction}
            onContextMenu={(e) => e.preventDefault()}
            className="flex min-h-screen w-full flex-col items-center justify-center bg-[#020617] p-8 text-slate-50 relative overflow-hidden [perspective:1200px] select-none"
        >
            {/* Extreme WOW - Advanced Terminal Animations */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes float {
                    0% { transform: translate(0, 0) scale(1) rotate(0deg); }
                    33% { transform: translate(10vw, -15vh) scale(1.2) rotate(5deg); }
                    66% { transform: translate(-5vw, 10vh) scale(0.8) rotate(-5deg); }
                    100% { transform: translate(0, 0) scale(1) rotate(0deg); }
                }
                @keyframes float-alt {
                    0% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(-8vw, 12vh) scale(1.1); }
                    66% { transform: translate(12vw, -8vh) scale(0.9); }
                    100% { transform: translate(0, 0) scale(1); }
                }
                @keyframes shimmer {
                    0% { opacity: 0.3; }
                    50% { opacity: 0.6; }
                    100% { opacity: 0.3; }
                }
                @keyframes mesh {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes particle {
                    0% { transform: translateY(110vh) translateX(0) scale(0.5); opacity: 0; }
                    20% { opacity: 0.4; }
                    80% { opacity: 0.4; }
                    100% { transform: translateY(-20vh) translateX(40px) scale(1.2); opacity: 0; }
                }
                @keyframes scanline {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }
                @keyframes sweep {
                    0% { left: -100%; opacity: 0; }
                    10% { opacity: 0.4; }
                    90% { opacity: 0.4; }
                    100% { left: 200%; opacity: 0; }
                }
                @keyframes terminal-flicker {
                    0% { opacity: 0.95; }
                    2% { opacity: 0.8; }
                    4% { opacity: 1; }
                    70% { opacity: 1; }
                    72% { opacity: 0.85; }
                    74% { opacity: 1; }
                    100% { opacity: 1; }
                }
                @keyframes float-mini {
                    0% { transform: translate(0, 0) rotate(0deg); }
                    33% { transform: translate(3px, -5px) rotate(2deg); }
                    66% { transform: translate(-3px, 3px) rotate(-2deg); }
                    100% { transform: translate(0, 0) rotate(0deg); }
                }
                @keyframes ripple {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 0.6; }
                    100% { transform: translate(-50%, -50%) scale(15); opacity: 0; }
                }
                .animate-ripple { animation: ripple 2.5s cubic-bezier(0, 0, 0.2, 1) forwards; }
                .animate-ripple-delayed { animation: ripple 2.5s cubic-bezier(0, 0, 0.2, 1) 0.2s forwards; }
                .animate-float-mini { animation: float-mini 6s infinite ease-in-out; }
                .animate-float { animation: float 20s infinite ease-in-out; }
                .animate-float-slow { animation: float-alt 25s infinite ease-in-out; }
                .animate-shimmer { animation: shimmer 8s infinite alternate ease-in-out; }
                .animate-particle { animation: particle 15s infinite linear; }
                .animate-scanline { animation: scanline 8s infinite linear; }
                .animate-sweep { animation: sweep 3s infinite ease-in-out; }
                .animate-flicker { animation: terminal-flicker 4s infinite linear; }
                
                .bg-mesh {
                    background: radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), 
                                radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), 
                                radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%);
                    background-size: 200% 200%;
                    animation: mesh 15s infinite ease-in-out;
                }
                .scanline-overlay {
                    background: repeating-linear-gradient(
                        0deg,
                        rgba(0, 0, 0, 0.1),
                        rgba(0, 0, 0, 0.1) 1px,
                        transparent 1px,
                        transparent 2px
                    );
                }
            `}} />

            {/* Layer 1: Base Mesh Gradient */}
            <div className="absolute inset-0 z-0 bg-mesh opacity-50 shrink-0" />

            {/* Layer 2: Cyber Scanlines */}
            <div className="absolute inset-0 z-0 scanline-overlay pointer-events-none opacity-20" />
            <div className="absolute inset-0 z-0 h-2 bg-blue-500/10 blur-sm animate-scanline pointer-events-none" />

            {/* Layer 3: Neural Particles */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {particles.map((particle, i) => (
                    <div
                        key={i}
                        className="absolute w-2 h-2 bg-blue-400 rounded-full blur-[2px] animate-particle"
                        style={{
                            left: particle.left,
                            animationDelay: particle.delay,
                            animationDuration: particle.duration
                        }}
                    />
                ))}
            </div>

            {/* Layer 4: Moving Blobs */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/15 rounded-full blur-[120px] animate-float" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] bg-purple-600/15 rounded-full blur-[120px] animate-float-slow" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[40vw] bg-indigo-500/10 rounded-full blur-[100px] animate-shimmer" />
            </div>

            {/* Layer 5: Depth Overlays */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_50%,rgba(2,6,23,0)_0%,rgba(2,6,23,0.9)_100%)] pointer-events-none" />
            <div className="absolute inset-0 z-0 backdrop-blur-[2px] pointer-events-none" />

            {/* Ripples Layer */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                {ripples.map(ripple => (
                    <div key={ripple.id} className="absolute overflow-visible pointer-events-none" style={{ left: ripple.x, top: ripple.y }}>
                        <div
                            className="absolute border-[3px] border-blue-400/40 rounded-full animate-ripple"
                            style={{ width: '100px', height: '100px' }}
                        />
                        <div
                            className="absolute border-2 border-indigo-500/30 rounded-full animate-ripple-delayed"
                            style={{ width: '100px', height: '100px' }}
                        />
                        <div
                            className="absolute border border-purple-500/20 rounded-full animate-ripple"
                            style={{ width: '100px', height: '100px', animationDelay: '0.4s' }}
                        />
                    </div>
                ))}
            </div>

            {/* TOP LAYER: Interactive Draggable Icon */}
            <div
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onContextMenu={(e) => e.preventDefault()}
                style={{
                    transform: `translate3d(${iconPos.x + hoverPos.x}px, ${iconPos.y + hoverPos.y}px, 0) scale(1.05)`,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    willChange: 'transform',
                    touchAction: 'none',
                    position: 'absolute',
                    top: '15%', // Initial starting position
                    left: '50%',
                    marginLeft: '-48px', // Center the 96px width icon
                    zIndex: 9999
                }}
                className="rounded-[2.5rem] bg-gradient-to-br from-white/20 to-white/5 p-6 ring-1 ring-white/40 backdrop-blur-3xl shadow-[0_0_80px_rgba(59,130,246,0.4)] select-none"
            >
                <div className="animate-float-mini">
                    <ShieldCheck className="h-16 w-16 text-blue-200 pointer-events-none" strokeWidth={0.8} />
                </div>
            </div>

            {/* Main Terminal UI Container */}
            <div className="z-10 w-full max-w-lg relative group [transform:rotateX(5deg)_rotateY(-5deg)] hover:[transform:rotateX(0deg)_rotateY(0deg)] transition-all duration-1000">

                {/* Aura Glow */}
                <div className="absolute -inset-6 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-blue-500/30 rounded-[3.5rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000 animate-shimmer" />

                <div className="flex flex-col items-center justify-center mb-12 gap-5 relative animate-flicker">
                    {/* Placeholder div to maintain layout spacing where the icon used to be */}
                    <div className="h-28 w-28 scale-105 pointer-events-none" />

                    <div className="text-center space-y-3">
                        <h1 className="text-6xl font-black tracking-[-0.05em] text-white mt-4 drop-shadow-[0_0_20px_rgba(59,130,246,0.6)] uppercase italic">
                            KIOSK TERMINAL
                        </h1>
                        <div className="text-sm text-blue-300/40 font-black tracking-[0.4em] uppercase flex items-center justify-center gap-4">
                            <span className="h-[2px] w-12 bg-gradient-to-r from-transparent to-blue-500/40" />
                            Security Protocol Alpha-9
                            <span className="h-[2px] w-12 bg-gradient-to-l from-transparent to-blue-500/40" />
                        </div>
                    </div>
                </div>

                <Card className="border-0 bg-white/[0.02] shadow-[0_0_120px_rgba(0,0,0,0.8)] backdrop-blur-[60px] ring-1 ring-white/10 overflow-hidden relative rounded-[3rem] transition-all duration-1000 hover:ring-white/30 group/card">
                    {/* Dynamic edge highlight & Scan sweep */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-40" />
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 shadow-[0_0_30px_rgba(59,130,246,0.6)] animate-sweep" />

                    {/* Interior Scan Stripe */}
                    <div className="absolute top-0 bottom-0 w-[150px] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent -skew-x-12 animate-sweep pointer-events-none" />

                    <CardHeader className="flex flex-col items-center gap-2 pt-12 pb-8 relative z-10">
                        <div className={`flex h-28 w-28 shrink-0 items-center justify-center rounded-[2.5rem] shadow-inner mb-6 ring-2 transition-all duration-500 ${loading
                            ? "bg-amber-500/20 text-amber-400 ring-amber-500/40 shadow-[0_0_40px_rgba(245,158,11,0.3)] animate-pulse"
                            : "bg-blue-500/10 text-blue-300 ring-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.3)] group-hover/card:scale-105"
                            }`}>
                            {loading
                                ? <Loader2 className="h-14 w-14 animate-spin" strokeWidth={1.5} />
                                : <ScanLine className="h-14 w-14 opacity-90 animate-shimmer" strokeWidth={1.5} />
                            }
                        </div>
                        <CardTitle className="text-3xl font-black tracking-[-0.03em] text-center px-4 text-white uppercase italic animate-flicker">
                            {loading ? "Verifying..." : "RFID Scan"}
                        </CardTitle>
                        <CardDescription className="text-center text-base font-bold px-10 text-blue-200/40 uppercase tracking-[0.2em] mt-1">
                            {loading
                                ? "Verifying authorized credentials"
                                : "Awaiting RFID Hardware Interface"
                            }
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-col items-center gap-8 px-12 pb-16 w-full relative z-10">
                        {/* RFID Input Area */}
                        <div className="relative w-full max-w-[340px] group/input">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl blur opacity-20 group-hover/input:opacity-40 transition duration-500" />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none z-20">
                                <span className="flex h-4 w-4 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500" />
                                </span>
                            </div>

                            <Input
                                ref={inputRef}
                                type="password"
                                value={rfidValue}
                                onChange={(e) => setRfidValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        void handleRfidScan(rfidValue);
                                    }
                                }}
                                placeholder="[ INPUT REQUIRED ]"
                                disabled={loading}
                                autoComplete="off"
                                className="pl-16 text-center h-20 bg-black/60 hover:bg-black/70 border-white/10 border-2 border-dashed font-mono text-2xl rounded-2xl focus-visible:ring-blue-500 focus-visible:ring-offset-0 focus-visible:border-blue-400 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] transition-all duration-500 disabled:opacity-50 text-blue-100 placeholder:text-blue-900/50 tracking-[0.2em]"
                            />
                        </div>

                        <div className={`flex items-center gap-3 text-xs font-black tracking-[0.3em] uppercase transition-colors duration-500 ${loading ? "text-amber-400 animate-pulse" : "text-blue-400/60"
                            }`}>
                            <Activity className="h-4 w-4" />
                            {loading ? "Decrypting..." : "Hardware Interface Online"}
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-between items-center mt-10 px-4 animate-flicker">
                    <p className="text-[10px] font-black text-blue-500/30 uppercase tracking-[0.5em]">
                        VOS-WEB Terminal // Core v1.0
                    </p>
                    <p className="text-[10px] font-black text-blue-500/30 uppercase tracking-[0.5em]">
                        {new Date().getFullYear()} © Men2 Marketing
                    </p>
                </div>
            </div>
        </div>
    );
}
