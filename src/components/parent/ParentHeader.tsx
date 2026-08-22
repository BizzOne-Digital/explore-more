interface ParentHeaderProps {
  firstName: string;
  signOutAction: () => Promise<void>;
}

export function ParentHeader({ firstName, signOutAction }: ParentHeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:px-6">
      <div className="pl-10 lg:pl-0">
        <p className="text-xs font-medium text-gray-400 lg:hidden">Parent Portal</p>
        <h1 className="font-display text-lg text-explore-charcoal sm:text-xl">
          Welcome, {firstName}
        </h1>
      </div>
      <form action={signOutAction}>
        <button
          type="submit"
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-explore-charcoal"
        >
          Sign out
        </button>
      </form>
    </header>
  );
}
