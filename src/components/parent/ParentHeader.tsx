interface ParentHeaderProps {
  firstName: string;
  signOutAction: () => Promise<void>;
}

export function ParentHeader({ firstName, signOutAction }: ParentHeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-3 py-2.5 sm:px-4 lg:px-6 lg:py-3">
      <div className="min-w-0 pl-11 lg:pl-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 lg:hidden">
          Parent Portal
        </p>
        <h1 className="truncate font-display text-base text-explore-charcoal sm:text-lg lg:text-xl">
          Welcome, {firstName}
        </h1>
      </div>
      <form action={signOutAction} className="shrink-0">
        <button
          type="submit"
          className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-explore-charcoal sm:px-3 sm:text-xs"
        >
          Sign out
        </button>
      </form>
    </header>
  );
}
