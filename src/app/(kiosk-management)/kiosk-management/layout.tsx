import { FullscreenHandler } from "@/modules/kiosk-management/fullscreen/FullscreenHandler";
import { IdleTimeoutHandler } from "@/modules/kiosk-management/fullscreen/IdleTimeoutHandler";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-dvh bg-background text-foreground">
            <FullscreenHandler />
            <IdleTimeoutHandler />
            <main className="min-h-[calc(100dvh-64px)]">{children}</main>
        </div>
    )
}
