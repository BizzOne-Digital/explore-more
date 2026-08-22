import { sendRegistrationConfirmation } from "@/lib/email/templates/registration-confirmation";
import { sendAdminEventRegistrationNotification } from "@/lib/email/admin-notifications";
import type { EventRegistrationEmailData, EventEmailData } from "@/lib/email/admin-notifications";

export async function sendEventRegistrationEmails({
  registration,
  event,
}: {
  registration: EventRegistrationEmailData;
  event: EventEmailData & {
    instructions?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
}): Promise<void> {
  await Promise.all([
    sendRegistrationConfirmation({ registration, event }),
    sendAdminEventRegistrationNotification({ registration, event }),
  ]);
}
