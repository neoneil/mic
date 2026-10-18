"use client";

import { FormEvent, useState } from "react";

export function AuthControls({ email }: { email?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Login failed.");
      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed.");
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.reload();
  }

  if (email) {
    return <div className="signed-in"><span>{email}</span><button onClick={logout} disabled={loading}>{loading ? "Signing out…" : "Log out"}</button></div>;
  }

  return (
    <details className="auth-menu">
      <summary>Log in</summary>
      <form onSubmit={login}>
        <strong>MIC staff login</strong>
        <label><span>Email</span><input name="email" type="email" autoComplete="email" defaultValue="neilmaaustralia@gmail.com" required /></label>
        <label><span>Password</span><input name="password" type="password" autoComplete="current-password" required /></label>
        {error && <div className="auth-error">{error}</div>}
        <button disabled={loading}>{loading ? "Logging in…" : "Log in"}</button>
      </form>
    </details>
  );
}
