import { ParentAccountForm } from "@/components/parent/ParentAccountForm";

export default function ParentAccountPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">My Profile / Account Settings</h2>
        <p className="mt-1 text-sm text-explore-charcoal/70">
          Update your contact information, emergency contacts, notification preferences, and password.
        </p>
      </div>
      <ParentAccountForm />
    </div>
  );
}
