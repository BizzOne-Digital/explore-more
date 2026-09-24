import { getSchoolYearOptions } from "@/lib/portfolio/constants";

export function currentSchoolYear(): string {
  return getSchoolYearOptions()[0] ?? `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
}
