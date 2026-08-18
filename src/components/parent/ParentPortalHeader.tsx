import { CopyIdButton } from "@/components/parent/CopyIdButton";

export function ParentPortalHeader({
  firstName,
  guardianId,
  signOutAction,
}: {
  firstName: string;
  guardianId: string;
  signOutAction: () => Promise<void>;
}) {
  return (
    <div className="border-b border-explore-charcoal/10 bg-white">
      <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-3 px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-explore-teal">Parent Portal</p>
          <h1 className="font-display text-xl text-explore-charcoal">Welcome Back, {firstName}!</h1>
          {guardianId && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-sm text-explore-charcoal/70">
                Parent/Guardian ID:{" "}
                <span className="font-mono font-semibold text-explore-charcoal">{guardianId}</span>
              </span>
              <CopyIdButton value={guardianId} />
            </div>
          )}
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-lg px-3 py-1.5 text-sm text-explore-charcoal/70 hover:bg-explore-sand"
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}
