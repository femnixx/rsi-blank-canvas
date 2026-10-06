import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!identifier || !password) {
      setError("Email/NIM and password are required.");
      return;
    }
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg px-4 py-12">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-brand-border bg-brand-card backdrop-blur-glass p-8 shadow-xl"
      >
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blue text-lg font-bold text-white shadow-lg shadow-blue-500/30">
            RSI
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-brand-muted">Sign in with your email or NIM</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 border border-red-500/20" role="alert">
            {error}
          </div>
        )}

        <label className="block text-sm font-medium text-white mb-1">
          Email or NIM
          <input
            type="text"
            autoComplete="username"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@example.com or 21515020..."
            className="mt-1 input-dark"
          />
        </label>

        <label className="block text-sm font-medium text-white mb-1 mt-4">
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1 input-dark"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full btn-primary disabled:opacity-50"
        >
          {loading ? (
            <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Signing in…</>
          ) : (
            "Login"
          )}
        </button>

        <p className="mt-4 text-center text-sm text-brand-muted">
          No account?{" "}
          <Link to="/register" className="font-medium text-brand-blue hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}
