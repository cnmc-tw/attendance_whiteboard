export default async function LoginPage({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-surface font-body-md text-on-surface antialiased">
        <main className="w-full">
            <div className="flex flex-col w-full items-center justify-center p-gutter md:p-gutter-desktop relative overflow-hidden">
                {/* Decorative background geometry */}
                <div
                    aria-hidden="true"
                    className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-surface-container-high/40 blur-3xl pointer-events-none"
                />
                <div
                    aria-hidden="true"
                    className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-secondary-container/30 blur-3xl pointer-events-none"
                />

                {/* Primary Authentication Container */}
                <div className="relative w-full max-w-120 bg-surface-container-lowest shadow-xl rounded-xl p-6 sm:p-10 transition-all duration-300">

                    {children}

                    {/* Footer Inside Card */}
                    <div className="mt-8 pt-4 bg-surface-container-high/30 -mx-6 sm:-mx-10 -mb-6 sm:-mb-10 p-4 rounded-b-xl flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-2">
                        <span className="font-label-sm text-label-sm text-secondary tracking-wider">
                            國立臺灣師範大學附屬高級中學
                        </span>
                        <span className="font-label-sm text-label-sm text-secondary">
                            生活輔導組
                        </span>
                    </div>
                </div>
            </div>
        </main>
        </div>
    );
}
