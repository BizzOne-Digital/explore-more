export function canEditCampaign(status: string | undefined): boolean {
  return status === "draft" || status === "failed";
}

export function canSendCampaign(status: string | undefined): boolean {
  return status === "draft" || status === "failed";
}

export function audienceAllowsEmptyRecipients(
  audience: string,
  deliveryMethod: string
): boolean {
  return (
    audience === "all_parents" &&
    (deliveryMethod === "notification" || deliveryMethod === "both")
  );
}
