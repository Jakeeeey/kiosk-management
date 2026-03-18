"use client";

import { useEffect, useState } from "react";

export function FullscreenHandler() {
    const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
    const [showAlert, setShowAlert] = useState(false);
    const [alertTimeout, setAlertTimeout] = useState<NodeJS.Timeout | null>(null);

    const triggerAlert = () => {
        setShowAlert(true);
        if (alertTimeout) clearTimeout(alertTimeout);
        const timeout = setTimeout(() => setShowAlert(false), 3000);
        setAlertTimeout(timeout);
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            if (document.fullscreenElement) {
                // Call lock() without arguments to capture ALL keys (including Ctrl+N, Ctrl+T, Alt+Tab etc.)
                // This is only supported in Chromium-based browsers (Chrome/Edge/Opera)
                if ("keyboard" in navigator && (navigator as any).keyboard?.lock) {
                    (navigator as any).keyboard.lock().catch((err: any) => {
                        console.warn("Keyboard lock failed:", err);
                    });
                }
            } else {
                if ("keyboard" in navigator && (navigator as any).keyboard?.unlock) {
                    (navigator as any).keyboard.unlock();
                }
            }
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            if (alertTimeout) clearTimeout(alertTimeout);
        };
    }, [alertTimeout]);

    useEffect(() => {
        const blockKeys = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const ctrl = e.ctrlKey || e.metaKey;
            const shift = e.shiftKey;
            const alt = e.altKey;

            // Block common browser system keys
            // Escape, F11, F12 (DevTools), F5 (Reload)
            if (
                e.key === "Escape" || 
                e.key === "F11" || 
                e.key === "F12" || 
                e.key === "F5" ||
                e.keyCode === 122 || // F11
                e.keyCode === 27  || // Esc
                e.keyCode === 123 || // F12
                e.keyCode === 116    // F5
            ) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                triggerAlert();
                return false;
            }

            // Aggressively block all Ctrl combinations that lead to browser navigation
            // (T, N, W, S, P, O, U, etc.)
            if (ctrl && !alt) {
                const allowedEditing = ["c", "v", "x", "a"];
                if (!allowedEditing.includes(key)) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    triggerAlert();
                    return false;
                }
            }

            // Block Alt+Enter (Fullscreen toggle), Alt+F4 (handled by OS usually)
            if (alt && (e.key === "Enter" || e.key === "F4")) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                triggerAlert();
                return false;
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (blockKeys(e) === false) return;

            const key = e.key.toLowerCase();
            
            // Track A, S, D keys
            if (key === "a" || key === "s" || key === "d") {
                setPressedKeys((prev) => {
                    const next = new Set(prev);
                    next.add(key);
                    return next;
                });
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (blockKeys(e) === false) return;

            const key = e.key.toLowerCase();
            if (key === "a" || key === "s" || key === "d") {
                setPressedKeys((prev) => {
                    const next = new Set(prev);
                    next.delete(key);
                    return next;
                });
            }
        };

        // Aggressive blocking on capture phase
        window.addEventListener("keydown", handleKeyDown, true);
        window.addEventListener("keyup", handleKeyUp, true);
        window.addEventListener("keypress", blockKeys, true);
        
        document.addEventListener("keydown", blockKeys, true);

        return () => {
            window.removeEventListener("keydown", handleKeyDown, true);
            window.removeEventListener("keyup", handleKeyUp, true);
            window.removeEventListener("keypress", blockKeys, true);
            document.removeEventListener("keydown", blockKeys, true);
        };
    }, [alertTimeout]); // Need alertTimeout in deps to call triggerAlert correctly if it uses closure

    useEffect(() => {
        // Toggle fullscreen when A, S, and D are all pressed
        if (pressedKeys.has("a") && pressedKeys.has("s") && pressedKeys.has("d")) {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch((err) => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message}`);
                });
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
            // Clear keys to prevent rapid toggling
            setPressedKeys(new Set());
        }
    }, [pressedKeys]);

    return (
        <>
            {showAlert && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-red-600/90 backdrop-blur-md animate-in fade-in zoom-in duration-200">
                    <div className="text-center p-12 border-8 border-white rounded-[4rem] bg-red-700 shadow-[0_0_100px_rgba(220,38,38,0.8)]">
                        <h1 className="text-7xl md:text-9xl font-black text-white tracking-tighter uppercase italic leading-none mb-6">
                            SECURITY ALERT
                        </h1>
                        <p className="text-3xl md:text-5xl font-extrabold text-white tracking-tight uppercase leading-snug">
                            UNFULLSCREENING IS NOT ALLOWED <br />
                            ON THIS DEVICE
                        </p>
                        <div className="mt-12 h-4 w-full bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-white animate-[shrink_3s_linear_forwards]" />
                        </div>
                    </div>
                    <style jsx>{`
                        @keyframes shrink {
                            from { width: 100%; }
                            to { width: 0%; }
                        }
                    `}</style>
                </div>
            )}
        </>
    );
}
