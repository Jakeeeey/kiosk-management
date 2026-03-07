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
    const inputRef = useRef<HTMLInputElement>(null);

    // Keep the input focused at all times so hardware scanners can type seamlessly
    useEffect(() => {
        const focusInput = () => {
            if (!loading && inputRef.current) {
                inputRef.current.focus();
            }
        };

        focusInput();

        // Refocus if user clicks away
        const intervalId = setInterval(focusInput, 2000);
        document.addEventListener("click", focusInput);

        return () => {
            clearInterval(intervalId);
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
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 p-8 text-slate-50 relative overflow-hidden">

            {/* Decorative background elements */}
            <div className="absolute top-1/4 left-1/4 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl opacity-50" />
            <div className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl opacity-50" />

            <div className="z-10 w-full max-w-lg">
                <div className="flex flex-col items-center justify-center mb-8 gap-3">
                    <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur-md shadow-2xl">
                        <ShieldCheck className="h-12 w-12 text-blue-400" strokeWidth={1.5} />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white mt-4 drop-shadow-md">
                        Kiosk Terminal
                    </h1>
                    <p className="text-lg text-slate-400 font-medium">
                        System Access Control
                    </p>
                </div>

                <Card className="border-0 bg-white/10 shadow-2xl backdrop-blur-xl ring-1 ring-white/20 overflow-hidden relative">
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                    <CardHeader className="flex flex-col items-center gap-2 pt-10 pb-6">
                        <div className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-[2rem] shadow-inner mb-4 ring-1 transition-all duration-300 ${loading
                            ? "bg-amber-500/20 text-amber-400 ring-amber-500/30"
                            : "bg-blue-500/20 text-blue-400 ring-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.2)]"
                            }`}>
                            {loading
                                ? <Loader2 className="h-12 w-12 animate-spin" strokeWidth={2} />
                                : <ScanLine className="h-12 w-12 opacity-90" strokeWidth={2} />
                            }
                        </div>
                        <CardTitle className="text-2xl font-black tracking-tight text-center px-4 text-white">
                            {loading ? "Authenticating..." : "Scan Your ID"}
                        </CardTitle>
                        <CardDescription className="text-center text-base font-medium px-8 text-slate-300">
                            {loading
                                ? "Verifying credentials with the server. Please wait."
                                : "Place your RFID badge on the scanner to securely log in to the kiosk."
                            }
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-col items-center gap-6 px-10 pb-12 w-full">
                        {/* RFID Input Area */}
                        <div className="relative w-full max-w-[320px]">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                <span className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
                                </span>
                            </div>

                            {/* We use input type password so onlookers cannot copy the RFID payload visually */}
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
                                placeholder="Awaiting scanner input..."
                                disabled={loading}
                                autoComplete="off"
                                className="pl-14 text-center h-16 bg-black/40 hover:bg-black/50 border-white/20 border-2 border-dashed font-mono text-xl rounded-2xl focus-visible:ring-blue-500 focus-visible:ring-offset-0 focus-visible:border-blue-500 shadow-inner transition-all duration-300 disabled:opacity-50 text-white placeholder:text-slate-500"
                            />
                        </div>

                        <div className={`flex items-center gap-2 text-sm font-semibold tracking-wide ${loading ? "text-amber-400" : "text-blue-400 animate-pulse"
                            }`}>
                            <Activity className="h-4 w-4" />
                            {loading ? "Validating Session..." : "Scanner Online & Ready"}
                        </div>
                    </CardContent>
                </Card>

                <p className="text-center text-xs font-medium text-slate-500 mt-8">
                    VOS-WEB Terminal © {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}
