import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGenerateRoadmap } from "../api";
import { parseRoadmapText } from "../parseRoadmap";

/** Return the localStorage key for the current user's roadmaps list. */
function roadmapsKey() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.email ? `roadmaps-${user.email}` : "roadmaps-guest";
  } catch {
    return "roadmaps-guest";
  }
}

export default function Home() {
  const [goal, setGoal]   = useState("");
  const [level, setLevel] = useState("Beginner");
  const [weeks, setWeeks] = useState("");
  const [hours, setHours] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const name = user.email?.split("@")[0] || "Learner";

  async function generate(e) {
    e.preventDefault();
    setErr("");
    if (!goal.trim()) return setErr("Please enter your learning goal.");
    if (!weeks || isNaN(weeks) || +weeks < 1) return setErr("Enter a valid duration (weeks).");
    if (!hours || isNaN(hours) || +hours < 1) return setErr("Enter valid hours per day.");

    setLoading(true);
    try {
      const data = await apiGenerateRoadmap(goal, level, +weeks, +hours);

      let roadmapObj;
      if (data.weeks && Array.isArray(data.weeks)) {
        roadmapObj = { goal, level, weeks: data.weeks };
      } else if (data.roadmap) {
        const parsedWeeks = parseRoadmapText(data.roadmap);
        roadmapObj = { goal, level, raw: data.roadmap, weeks: parsedWeeks };
      } else {
        throw new Error("Unexpected response format from server");
      }

      // Store roadmap under the current user's key (not a shared key)
      const key = roadmapsKey();
      const existing = JSON.parse(localStorage.getItem(key)) || [];
      existing.push({ id: Date.now(), createdAt: new Date().toISOString(), data: roadmapObj });
      localStorage.setItem(key, JSON.stringify(existing));

      navigate("/roadmap");
    } catch (e) {
      setErr(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shell">
      <div className="home-wrap">
        <div className="home-left">
          <div className="home-kicker">Dashboard</div>
          <h1 className="home-headline">
            HELLO, {name.toUpperCase()}
            <span className="accent">LET'S BUILD</span>
          </h1>
          <p className="home-desc">
            Tell us what you want to learn and we'll generate a week-by-week
            AI-powered roadmap personalized to your pace.
          </p>
          <div className="home-features">
            <div className="home-feature"><span className="home-feature-icon">🗺</span>Structured weekly learning plan</div>
            <div className="home-feature"><span className="home-feature-icon">📊</span>Real-time progress tracking</div>
            <div className="home-feature"><span className="home-feature-icon">▶</span>Curated videos &amp; practice problems</div>
            <div className="home-feature"><span className="home-feature-icon">✨</span>Adapts to your experience level</div>
          </div>
        </div>

        <div className="home-right">
          <div className="home-form-box">
            <div className="form-section-title">GENERATE ROADMAP</div>
            <div className="form-section-sub">Fill in your goal and preferences below</div>

            {err && <div className="error-banner">{err}</div>}

            <form onSubmit={generate}>
              <div className="field">
                <label className="field-label">Learning goal</label>
                <input className="field-input" type="text" placeholder="e.g. Learn Python for Data Science"
                  value={goal} onChange={e => setGoal(e.target.value)} />
              </div>

              <div className="field">
                <label className="field-label">Experience level</label>
                <div className="level-grid">
                  {["Beginner", "Intermediate", "Advanced"].map(l => (
                    <button key={l} type="button"
                      className={`level-btn ${level === l ? "selected" : ""}`}
                      onClick={() => setLevel(l)}>
                      {l === "Beginner" && "🌱 "}{l === "Intermediate" && "⚡ "}{l === "Advanced" && "🔥 "}{l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label className="field-label">Duration (weeks)</label>
                  <input className="field-input" type="number" placeholder="e.g. 8" min="1" max="52"
                    value={weeks} onChange={e => setWeeks(e.target.value)} />
                </div>
                <div className="field">
                  <label className="field-label">Hours</label>
                  <input className="field-input" type="number" placeholder="e.g. 2" min="1" max="12"
                    value={hours} onChange={e => setHours(e.target.value)} />
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <><span className="loading-spinner" /> Generating...</> : "Generate my roadmap →"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
