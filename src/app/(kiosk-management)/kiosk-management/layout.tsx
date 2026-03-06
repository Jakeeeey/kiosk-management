export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-dvh bg-background text-foreground">
            <main className="min-h-[calc(100dvh-64px)]">{children}</main>
        </div>
    )
}
