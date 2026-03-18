"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

export function IdleTimeoutHandler() {
    const router = useRouter();
    const pathname = usePathname();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Only start timer if we are NOT on the main kiosk page
        if (pathname !== "/kiosk-management") {
            timeoutRef.current = setTimeout(() => {
                // DON'T redirect if server-down overlay is visible
                const isServerDown = document.getElementById("server-down-overlay");
                if (isServerDown) {
                    // Try again in 5 seconds instead of redirecting
                    resetTimeout(); 
                } else {
                    router.push("/kiosk-management");
                }
            }, 15000); // 15 seconds (User updated this)
        }
    }, [pathname, router]);

    useEffect(() => {
        const events = [
            "mousedown",
            "mousemove",
            "keypress",
            "scroll",
            "touchstart",
            "click"
        ];

        const handleActivity = () => {
            resetTimeout();
        };

        // Initialize timeout
        resetTimeout();

        // Add listeners
        events.forEach((event) => {
            window.addEventListener(event, handleActivity);
        });

        return () => {
            // Clean up
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [resetTimeout]);

    return null;
}
