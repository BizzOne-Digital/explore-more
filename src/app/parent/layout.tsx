import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import { GuardianStudentLink, User } from "@/models";

export const dynamic = "force-dynamic";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/parent");

  await connectDB();

  const links = await GuardianStudentLink.find({
    guardianId: session.user.id,
    status: "approved",
  }).populate("studentId", "name email");

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-explore-cream">
      <div className="border-b border-explore-charcoal/10 bg-explore-white">
        <div className="mx-auto flex w-full min-w-0 max-w-7xl items-center justify-between px-3 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-explore-teal">
              Parent Portal
            </p>
            <h1 className="font-display text-xl text-explore-charcoal">
              Welcome, {session.user.name}
            </h1>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-sm text-explore-charcoal/70 hover:bg-explore-sand"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto w-full min-w-0 max-w-7xl px-3 py-8 sm:px-6">
        {links.length > 0 && (
          <nav className="mb-8">
            <p className="mb-3 text-sm font-semibold text-explore-charcoal/60">Linked Students</p>
            <ul className="flex flex-wrap gap-2">
              {links.map((link) => {
                const student = link.studentId as unknown as InstanceType<typeof User> | null;
                if (!student) return null;
                return (
                  <li key={link._id.toString()}>
                    <Link
                      href={`/parent/students/${student._id.toString()}`}
                      className="block rounded-lg bg-explore-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-explore-sand"
                    >
                      {student.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
        <main>{children}</main>
      </div>
    </div>
  );
}
