import Link from "next/link";
import { format } from "date-fns";
import { StatusBadge } from "@/components/admin/StatusBadge";

export interface GradeEventRow {
  _id: string;
  title: string;
  startDate?: string;
  status: string;
  registrationCount?: number;
}

interface EventsGradeListProps {
  events: GradeEventRow[];
  grade: string;
  basePath: string;
}

export function EventsGradeList({ events, grade, basePath }: EventsGradeListProps) {
  if (events.length === 0) {
    return <p className="text-sm text-white/50">No events found for this grade.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/5 text-white/60">
          <tr>
            <th className="px-4 py-3 font-medium">Event</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Registrations</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event._id} className="border-t border-white/10 hover:bg-white/5">
              <td className="px-4 py-3 font-medium text-white">{event.title}</td>
              <td className="px-4 py-3 text-white/70">
                {event.startDate
                  ? format(new Date(event.startDate), "MMM d, yyyy")
                  : "—"}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={event.status} />
              </td>
              <td className="px-4 py-3 text-white/70">{event.registrationCount ?? 0}</td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`${basePath}?grade=${encodeURIComponent(grade)}&event=${encodeURIComponent(event._id)}`}
                  className="text-explore-teal hover:underline"
                >
                  View registrations
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
