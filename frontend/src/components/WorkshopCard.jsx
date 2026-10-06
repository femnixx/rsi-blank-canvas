import { Link } from "react-router-dom";

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
    <div className="card-accent flex flex-col">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-white">{workshop.title}</h3>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isUpcoming
              ? "bg-brand-blue/20 text-brand-blue"
              : "bg-zinc-500/20 text-zinc-400"
          }`}
        >
          {isUpcoming ? "Upcoming" : "Past"}
        </span>
      </div>

      <p className="mb-4 line-clamp-2 text-sm text-brand-muted">{workshop.description || "No description provided."}</p>

      {workshop.speaker_name && (
        <p className="mb-2 text-sm text-brand-muted">
          <span className="font-medium text-white">Speaker:</span> {workshop.speaker_name}
        </p>
      )}

      <div className="mb-3 flex items-center gap-2 text-sm text-brand-muted">
        <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        <span>{dateStr}</span>
        {workshop.location && (
          <>
            <span className="text-brand-border">·</span>
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
            <span className="truncate">{workshop.location}</span>
          </>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-brand-border pt-4">
        <span className="inline-flex items-center rounded-full bg-brand-blue/20 px-2.5 py-0.5 text-xs font-medium text-brand-blue">
          {workshop.registration_count} {workshop.registration_count === 1 ? "participant" : "participants"}
        </span>

        <div className="flex gap-2">
          {isAdmin && onDelete && (
            <>
              <button
                onClick={() => onDelete(workshop.id)}
                disabled={deletingId === workshop.id}
                className="rounded-lg bg-white/5 p-2 text-xs text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                title="Delete"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
              <Link
                to={`/admin/create-workshop/${workshop.id}/edit`}
                className="rounded-lg bg-white/5 p-2 text-xs text-brand-muted transition hover:bg-white/10"
                title="Edit"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </Link>
            </>
          )}
          {!isAdmin && onRegister && (
            <button
              onClick={() => onRegister(workshop)}
              className="btn-primary !py-1.5 !text-xs"
            >
              Register
            </button>
          )}
          <Link
            to={`/workshops/${workshop.id}`}
            className="btn-ghost !py-1.5 !text-xs"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
