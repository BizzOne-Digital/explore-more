import { Suspense } from "react";
import { ParentSidebar } from "@/components/parent/ParentSidebar";
import { ParentHeader } from "@/components/parent/ParentHeader";
import type { MembershipFeature } from "@/lib/membership/entitlements";
import type { ParentBillingAlert } from "@/lib/billing/parent-billing-alert";
import { BillingAttentionBanner } from "@/components/parent/BillingAttentionBanner";

interface ParentShellProps {
  children: React.ReactNode;
  firstName: string;
  guardianId?: string;
  unreadMessages?: number;
  unreadNotifications?: number;
  showAllNav?: boolean;
  membershipFeatures?: MembershipFeature[];
  billingAlert?: ParentBillingAlert | null;
  signOutAction: () => Promise<void>;
}

export function ParentShell({
  children,
  firstName,
  guardianId,
  unreadMessages,
  unreadNotifications,
  showAllNav,
  membershipFeatures,
  billingAlert,
  signOutAction,
}: ParentShellProps) {
  return (
    <div className="fixed inset-0 z-[100] flex h-dvh overflow-hidden bg-gray-50">
      <Suspense fallback={null}>
        <ParentSidebar
          guardianId={guardianId}
          unreadMessages={unreadMessages}
          unreadNotifications={unreadNotifications}
          showAllNav={showAllNav}
          membershipFeatures={membershipFeatures}
        />
      </Suspense>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <ParentHeader firstName={firstName} signOutAction={signOutAction} />
        <main
          id="parent-main-scroll"
          className="min-h-0 flex-1 overflow-x-clip overflow-y-auto overscroll-y-contain bg-gray-50 p-4 lg:p-6"
          data-lenis-prevent
        >
          <div className="mx-auto w-full min-w-0 max-w-6xl">
            {billingAlert ? <BillingAttentionBanner alert={billingAlert} /> : null}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
