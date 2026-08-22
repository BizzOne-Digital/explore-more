export default function ParentAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <p className="font-display text-xl font-semibold text-explore-charcoal">Explore More</p>
          <p className="mt-1 text-xs font-medium uppercase tracking-widest text-explore-teal">
            Parent Portal
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
