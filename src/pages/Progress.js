import { useNavigate } from "react-router-dom";

// ─── helpers ─────────────────────────────────────────────────────────────────

function roadmapsKey() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.email ? `roadmaps-${user.email}` : "roadmaps-guest";
  } catch { return "roadmaps-guest"; }
}

function getActiveRoadmap() {
  try {
    const list = JSON.parse(localStorage.getItem(roadmapsKey())) || [];
    return list.length ? list[0].data : null;
  } catch { return null; }
}

function getCompleted(goal) {
  try {
    return JSON.parse(localStorage.getItem(`completed-${goal}`)) || [];
  } catch { return []; }
}

// ─── component ───────────────────────────────────────────────────────────────

export default function Progress() {
  const navigate = useNavigate();
  const roadmap  = getActiveRoadmap();
  const completed = roadmap ? getCompleted(roadmap.goal) : [];

  if (!roadmap) {
    return (
      <div className="shell">
        <div className="empty">
          <div className="empty-icon">📊</div>
          <div className="empty-title">NO DATA YET</div>
          <p className="empty-desc">Generate a roadmap first to track your progress.</p>
          <button className="btn-primary" style={{ width: "auto", marginTop: "16px" }}
            onClick={() => navigate("/home")}>
            Get Started →
          </button>
        </div>
      </div>
    );
  }

  const weeks = roadmap.weeks || roadmap.roadmap || roadmap.plan || [];

  const allTopics = weeks.flatMap((w, wi) =>
    (w.topics || []).map((t, ti) => ({
      id:        `${wi}-${ti}`,
      name:      typeof t === "string" ? t : (t.name || "Topic"),
      week:      w.week || wi + 1,
      weekTitle: w.title || w.theme || "",
    }))
  );

  const total      = allTopics.length;
  const doneTopics = allTopics.filter(t => completed.includes(t.id));
  const pct        = total ? Math.round((doneTopics.length / total) * 100) : 0;

  return (
    <div className="shell">
      <div className="prog-page">
        <div className="prog-wrap">
          <div className="page-eyebrow">Progress Overview</div>
          <h1 className="page-title">YOUR STATS</h1>

          <div className="prog-stats-grid">
            <div className="stat-card s-amber animate-up">
              <div className="stat-val">{pct}%</div>
              <div className="stat-label">Complete</div>
            </div>
            <div className="stat-card s-electric animate-up-1">
              <div className="stat-val">{doneTopics.length}</div>
              <div className="stat-label">Topics done</div>
            </div>
            <div className="stat-card s-green animate-up-2">
              <div className="stat-val">{total - doneTopics.length}</div>
              <div className="stat-label">Remaining</div>
            </div>
          </div>

          <div className="prog-bar-card">
            <div className="prog-bar-label">
              <span className="prog-bar-title">Overall Progress</span>
              <span className="prog-bar-pct">{pct}%</span>
            </div>
            <div className="prog-track">
              <div className="prog-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {doneTopics.length > 0 ? (
            <div className="completed-card">
              <div className="completed-section-title">Completed Topics</div>
              {doneTopics.map(t => (
                <div key={t.id} className="completed-row">
                  <span className="done-badge">✓</span>
                  <span className="done-name">{t.name}</span>
                  <span className="done-meta">
                    Week {t.week}{t.weekTitle ? ` · ${t.weekTitle}` : ""}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="completed-card" style={{ textAlign: "center", color: "var(--text-3)", padding: "48px" }}>
              No topics completed yet. Head to your{" "}
              <span style={{ color: "var(--amber)", cursor: "pointer" }}
                onClick={() => navigate("/roadmap")}>
                roadmap
              </span>{" "}
              to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
