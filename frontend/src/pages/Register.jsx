import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [nim, setNim] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), password, nim.trim() || undefined);
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
          <h1 className="text-xl font-semibold tracking-tight text-white">Create account</h1>
          <p className="mt-1 text-sm text-brand-muted">Register with email and NIM</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 border border-red-500/20" role="alert">
            {error}
          </div>
        )}

        <label className="block text-sm font-medium text-white mb-1">
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1 input-dark"
          />
        </label>

        <label className="block text-sm font-medium text-white mb-1 mt-4">
          Student NIM
          <input
            type="text"
            autoComplete="off"
            value={nim}
            onChange={(e) => setNim(e.target.value)}
            placeholder="e.g. 21515020... (optional)"
            className="mt-1 input-dark"
          />
        </label>

        <label className="block text-sm font-medium text-white mb-1 mt-4">
          Password
          <input
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="mt-1 input-dark"
          />
        </label>

        <label className="block text-sm font-medium text-white mb-1 mt-4">
          Confirm password
          <input
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat password"
            className="mt-1 input-dark"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full btn-primary disabled:opacity-50"
        >
          {loading ? (
            <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Creating…</>
          ) : (
            "Register"
          )}
        </button>

        <p className="mt-4 text-center text-sm text-brand-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-blue hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
