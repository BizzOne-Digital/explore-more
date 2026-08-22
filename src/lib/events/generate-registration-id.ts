export function generateEventRegistrationId(): string {
  return `REG-${Date.now()}-${Math.random().toString(36).slice(2, 11).toUpperCase()}`;
}
