import { Suspense } from "react";
import { MembershipSuccessClient } from "@/components/membership/MembershipSuccessClient";
import { Loader } from "lucide-react";

export default function MembershipSuccessPage() {
  return (
    <Suspense
      fallback={
        <section className="flex min-h-[70vh] items-center justify-center bg-explore-cream pt-28">
          <Loader className="h-10 w-10 animate-spin text-explore-teal" />
        </section>
      }
    >
      <MembershipSuccessClient />
    </Suspense>
  );
}
