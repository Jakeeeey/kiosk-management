"use client";

import * as React from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface HanvinAttendanceModuleProps {
    url?: string;
}

export function HanvinAttendanceModule({ url }: HanvinAttendanceModuleProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(true);

    const displayUrl = url || "";

    const handleBack = () => {
        router.push("/kiosk-management");
    };

    const handleRefresh = () => {
        setIsLoading(true);
        const iframe = document.getElementById("hanvin-attendance-iframe") as HTMLIFrameElement;
        if (iframe) {
            iframe.src = iframe.src;
        }
    };

    return (
        <div className="flex flex-col h-screen max-h-[calc(100vh-2rem)] space-y-2 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl border border-border/40 bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-md hover:bg-muted transition-all"
                        onClick={handleBack}
                    >
                        <ArrowLeft className="h-5 w-5 text-foreground" />
                    </Button>
                    <div className="space-y-0.5">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Hanvin Attendance
                        </h1>
                        <p className="text-xs text-muted-foreground font-medium">
                             • Live system interface • 
                        </p>
                    </div>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-border/40 bg-background/50 backdrop-blur-sm hover:bg-muted font-semibold gap-2"
                    onClick={handleRefresh}
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Iframe Container */}
            <div className="flex-1 relative rounded-3xl border border-border/40 shadow-2xl overflow-hidden bg-muted/20 backdrop-blur-xl">
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md z-10 animate-in fade-in duration-300">
                        <div className="relative">
                            <div className="h-16 w-16 rounded-2xl border-2 border-primary/20 border-t-primary animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="h-8 w-8 rounded-full bg-primary/10 animate-pulse" />
                            </div>
                        </div>
                        <p className="mt-4 text-sm font-bold text-muted-foreground animate-pulse tracking-widest uppercase">
                            Establishing Connection...
                        </p>
                    </div>
                )}
                <iframe
                    id="hanvin-attendance-iframe"
                    src={displayUrl}
                    className="w-full h-full border-none"
                    onLoad={() => setIsLoading(false)}
                    title="Hanvin Attendance System"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                />
            </div>
        </div>
    );
}
