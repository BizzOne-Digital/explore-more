import { Suspense } from "react";

export function AuthFormShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-h-screen w-full items-center overflow-x-clip bg-explore-cream pt-28 pb-16">
      <div className="mx-auto w-full min-w-0 max-w-md px-3 sm:px-4">
        <div className="rounded-2xl border border-explore-charcoal/10 bg-white p-6 shadow-lg sm:p-8">
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl font-bold text-explore-charcoal">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-explore-charcoal/60">{subtitle}</p>}
          </div>
          <Suspense fallback={<p className="text-center text-sm text-explore-charcoal/50">Loading...</p>}>
            {children}
          </Suspense>
        </div>
      </div>
    </section>
  );
}
