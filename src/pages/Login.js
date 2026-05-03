import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiLogin } from "../api";

export default function Login() {
  const [email, setEmail]     = useState("");
  const [pass, setPass]       = useState("");
  const [err, setErr]         = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!email || !pass) return setErr("Please fill in all fields.");
    setLoading(true);
    try {
      await apiLogin(email, pass);
      localStorage.setItem("user", JSON.stringify({ email }));
      navigate("/home");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-scene">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-eyebrow">AI-Powered Learning</div>
        <h1 className="auth-headline">
          BUILD YOUR
          <em>FUTURE</em>
          SKILL SET
        </h1>
        <p className="auth-desc">
          Generate personalized learning roadmaps tailored to your goals,
          level, and schedule. Track your progress and never lose momentum.
        </p>
        <div className="auth-stat-row">
         
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-title">SIGN IN</div>
          <div className="auth-card-sub">Welcome back — let's continue learning</div>

          {err && <div className="error-banner">{err}</div>}

          <form onSubmit={submit}>
            <div className="field">
              <label className="field-label">Email address</label>
              <input
                className="field-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label">Password</label>
              <input
                className="field-input"
                type="password"
                placeholder="••••••••"
                value={pass}
                onChange={e => setPass(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <><span className="loading-spinner" /> Signing in...</> : "Sign in →"}
            </button>
          </form>

          <p className="auth-switch">
            No account? <Link to="/signup">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
