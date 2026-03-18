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
            const scheduleNext = (delay: number) => {
                timeoutRef.current = setTimeout(() => {
                    const isServerDown = document.getElementById("server-down-overlay");
                    if (isServerDown) {
                        // Try again in 5 seconds instead of redirecting
                        scheduleNext(5000);
                    } else {
                        router.push("/kiosk-management");
                    }
                }, delay);
            };

            scheduleNext(15000); // Start with 15 seconds
        }
    }, [pathname, router]);

    useEffect(() => {
        const events = [
            "mousedown",
            "mousemove",
            "keydown",
            "wheel",
            "scroll",
            "touchstart",
            "touchmove",
            "click",
            "input",
            "change",
            "focusin",
            "submit"
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
