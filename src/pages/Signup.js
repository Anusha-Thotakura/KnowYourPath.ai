import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiSignup, apiLogin } from "../api";

export default function Signup() {
  const [email, setEmail]     = useState("");
  const [pass, setPass]       = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr]         = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!email || !pass || !confirm) return setErr("Please fill in all fields.");
    if (pass.length < 6)             return setErr("Password must be at least 6 characters.");
    if (pass !== confirm)            return setErr("Passwords do not match.");
    setLoading(true);
    try {
      await apiSignup(email, pass);
      // Auto-login after signup so session cookie is set
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
      <div className="auth-left">
        <div className="auth-eyebrow">Get started free</div>
        <h1 className="auth-headline">
          YOUR
          <em>JOURNEY</em>
          STARTS NOW
        </h1>
        <p className="auth-desc">
          Join thousands of learners who use AI to plan smarter,
          learn faster, and track every step of their progress.
        </p>
        <div className="auth-stat-row">
         
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-card-title">CREATE ACCOUNT</div>
          <div className="auth-card-sub">Start your personalized learning journey</div>

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
                placeholder="Min. 6 characters"
                value={pass}
                onChange={e => setPass(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label">Confirm password</label>
              <input
                className="field-input"
                type="password"
                placeholder="Repeat your password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <><span className="loading-spinner" /> Creating account...</> : "Create account →"}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
