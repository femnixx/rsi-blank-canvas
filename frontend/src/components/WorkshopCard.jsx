import { Link } from "react-router-dom";

/**
 * WorkshopCard — displays a single workshop summary.
 * Uses brand colors: dark navy headers, orange status pills, blue CTA buttons.
 * @param {{ workshop, onRegister?: (workshop) => void, isAdmin?: boolean, onDelete?: (id) => void, deletingId?: number }} props
 */
export default function WorkshopCard({ workshop, onRegister, isAdmin, onDelete, deletingId }) {
  const eventDate = workshop.event_date ? new Date(workshop.event_date) : null;
  const dateStr = eventDate
    ? eventDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "TBD";

  const isUpcoming = eventDate ? eventDate > new Date() : false;

  return (
    <div className="card-accent flex flex-col p-6 transition-transform hover:scale-[1.02]">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-brand-navy">{workshop.title}</h3>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isUpcoming
              ? "bg-orange-100 text-brand-orange"
              : "bg-zinc-100 text-zinc-600"
          }`}
        >
          {isUpcoming ? "Upcoming" : "Past"}
        </span>
      </div>

      <p className="mb-4 line-clamp-2 text-sm text-zinc-600">{workshop.description || "No description provided."}</p>

      {workshop.speaker_name && (
        <p className="mb-2 text-sm text-zinc-700">
          <span className="font-medium text-brand-navy">Speaker:</span> {workshop.speaker_name}
        </p>
      )}

      <div className="mb-3 flex items-center gap-2 text-sm text-zinc-700">
        <span>📅</span>
        <span>{dateStr}</span>
        {workshop.location && (
          <>
            <span className="text-zinc-400">·</span>
            <span>📍</span>
            <span>{workshop.location}</span>
          </>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-4">
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-brand-blue">
          {workshop.registration_count} {workshop.registration_count === 1 ? "participant" : "participants"}
        </span>

        <div className="flex gap-2">
          {isAdmin && onDelete && (
            <>
              <button
                onClick={() => onDelete(workshop.id)}
                disabled={deletingId === workshop.id}
                className="rounded-md bg-white p-1 text-xs text-red-600 shadow ring-1 ring-zinc-200 transition hover:bg-zinc-50 disabled:opacity-50"
                title="Delete"
              >
                🗑️
              </button>
              <Link
                to={`/admin/create-workshop/${workshop.id}/edit`}
                className="rounded-md bg-white p-1 text-xs text-zinc-600 shadow ring-1 ring-zinc-200 transition hover:bg-zinc-50"
                title="Edit"
              >
                ✏️
              </Link>
            </>
          )}
          <button
            onClick={() => onRegister && onRegister(workshop)}
            className="rounded-lg bg-brand-blue px-4 py-1.5 text-sm font-medium text-white transition hover:bg-sky-600"
          >
            Register
          </button>
          <Link
            to={`/workshops/${workshop.id}`}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-1.5 text-sm font-medium text-brand-navy transition hover:bg-zinc-50"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
