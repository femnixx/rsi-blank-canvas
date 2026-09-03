import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Home page — protected. Any authenticated user can access.
 * Admins see workshop management shortcuts; students see dashboard link.
 * Requirement: main tag with "Welcome, This is a Blank Canvas", white bg, black text.
 */
export default function Home() {
  const { isAdmin } = useAuth();

  return (
    <main className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center bg-white px-6">
      <h1 className="text-center text-2xl font-medium tracking-tight text-black sm:text-3xl">
        Welcome, This is a Blank Canvas
      </h1>

      <div className="mt-6 flex gap-3">
        {isAdmin ? (
          <>
            <Link
              to="/workshops"
              className="rounded-lg bg-brand-blue px-6 py-2.5 text-sm font-medium text-white transition hover:bg-sky-600"
            >
              Manage Workshops
            </Link>
            <Link
              to="/admin/create-workshop"
              className="rounded-lg border border-zinc-200 bg-white px-6 py-2.5 text-sm font-medium text-brand-navy transition hover:bg-zinc-50"
            >
              Create New Workshop
            </Link>
          </>
        ) : (
          <Link
            to="/dashboard"
            className="rounded-lg bg-brand-blue px-6 py-2.5 text-sm font-medium text-white transition hover:bg-sky-600"
          >
            Go to My Dashboard
          </Link>
        )}
        <Link
          to="/workshops"
          className="rounded-lg border border-zinc-200 bg-white px-6 py-2.5 text-sm font-medium text-brand-navy transition hover:bg-zinc-50"
        >
          Browse All Workshops
        </Link>
      </div>
    </main>
  );
}
