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

export default function Continue() {
  const navigate  = useNavigate();
  const roadmap   = getActiveRoadmap();
  const completed = roadmap ? getCompleted(roadmap.goal) : [];

  if (!roadmap) {
    return (
      <div className="shell">
        <div className="empty">
          <div className="empty-icon">▶</div>
          <div className="empty-title">NOTHING TO CONTINUE</div>
          <p className="empty-desc">Generate a roadmap first to start learning.</p>
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
      subtopics: typeof t === "string" ? [] : (t.subtopics || []),
      week:      w.week || wi + 1,
      weekTitle: w.title || w.theme || "",
    }))
  );

  const next      = allTopics.find(t => !completed.includes(t.id));
  const doneCount = allTopics.filter(t => completed.includes(t.id)).length;
  const pct       = allTopics.length ? Math.round((doneCount / allTopics.length) * 100) : 0;
  const enc       = s => encodeURIComponent(s);

  if (!next) {
    return (
      <div className="shell">
        <div className="empty">
          <div className="empty-icon">🎉</div>
          <div className="empty-title">ALL DONE!</div>
          <p className="empty-desc">You've completed your entire roadmap. Outstanding work!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <div className="cont-page">
        <div className="cont-wrap">

          {/* UP NEXT spotlight card */}
          <div className="cont-spotlight">
            <div className="cont-status">
              <span className="cont-live-dot" /> Up next
            </div>
            <div className="cont-topic-name">{next.name.toUpperCase()}</div>
            <div className="cont-week-label">
              Week {next.week}{next.weekTitle ? ` — ${next.weekTitle}` : ""}
            </div>

            <div className="cont-action-row">
              <a href={`https://www.google.com/search?q=${enc(next.name + " tutorial notes")}`}
                target="_blank" rel="noreferrer" className="btn-icon tlink-notes">
                📘 Notes
              </a>
              <a href={`https://www.youtube.com/results?search_query=${enc(next.name)}`}
                target="_blank" rel="noreferrer" className="btn-icon tlink-videos">
                📺 Videos
              </a>
              <a href={`https://www.google.com/search?q=${enc(next.name + " practice problems")}`}
                target="_blank" rel="noreferrer" className="btn-icon tlink-practice">
                💻 Practice
              </a>
            </div>
          </div>

          {/* Subtopics */}
          {next.subtopics?.length > 0 && (
            <div className="cont-secondary">
              <div className="cont-secondary-title">Topics to cover</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginTop: "8px" }}>
                {next.subtopics.map((s, i) => (
                  <span key={i} className="subtopic-tag">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Overall progress */}
          <div className="cont-secondary">
            <div className="cont-secondary-title">Overall Progress</div>
            <div className="cont-prog-row">
              <span className="cont-prog-label">{doneCount} of {allTopics.length} topics done</span>
              <span className="cont-prog-val">{pct}%</span>
            </div>
            <div className="prog-track" style={{ marginTop: "12px" }}>
              <div className="prog-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* View roadmap */}
          <button className="btn-ghost" style={{ width: "100%", padding: "13px" }}
            onClick={() => navigate("/roadmap")}>
            View full roadmap →
          </button>

        </div>
      </div>
    </div>
  );
}
