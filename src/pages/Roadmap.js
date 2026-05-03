import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopicCard from "../components/TopicCard";
import { apiSaveProgress, apiLoadProgress } from "../api";
import { jsPDF } from "jspdf";

// ─── helpers ─────────────────────────────────────────────────────────────────

function roadmapsKey() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.email ? `roadmaps-${user.email}` : "roadmaps-guest";
  } catch { return "roadmaps-guest"; }
}

function normalizeTopics(raw) {
  return (raw || []).map(t =>
    typeof t === "string"
      ? { name: t, subtopics: [] }
      : { name: t.name || t.topic || "Topic", subtopics: t.subtopics || t.sub_topics || [] }
  );
}

// ─── component ───────────────────────────────────────────────────────────────

export default function Roadmap() {
  const navigate = useNavigate();

  // Load all roadmaps for this user
  const [roadmaps, setRoadmaps] = useState(() => {
    const raw = localStorage.getItem(roadmapsKey());
    return raw ? JSON.parse(raw) : [];
  });

  const [selectedId, setSelectedId] = useState(() => {
    const raw = localStorage.getItem(roadmapsKey());
    const list = raw ? JSON.parse(raw) : [];
    return list.length ? list[0].id : null;
  });

  // Search/filter text for selector
  const [search, setSearch] = useState("");

  // Delete-confirmation modal
  const [confirmDelete, setConfirmDelete] = useState(null); // roadmap id to delete

  const selectedRoadmap = roadmaps.find(r => r.id === selectedId)?.data || null;
  const roadmap = selectedRoadmap;

  // Progress per roadmap
  const [completed, setCompleted] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`completed-${roadmap?.goal}`)) || []; }
    catch { return []; }
  });

  useEffect(() => {
    if (roadmap) {
      localStorage.setItem(`completed-${roadmap.goal}`, JSON.stringify(completed));
    }
  }, [completed, roadmap]);

  // Reload completed when selected roadmap changes
  useEffect(() => {
    if (roadmap) {
      try {
        setCompleted(JSON.parse(localStorage.getItem(`completed-${roadmap.goal}`)) || []);
      } catch { setCompleted([]); }
    }
  }, [selectedId]);

  // Sync with server progress
  useEffect(() => {
    apiLoadProgress().then(serverProgress => {
      const serverIds = Object.entries(serverProgress).filter(([, v]) => v).map(([k]) => k);
      if (serverIds.length > 0) {
        setCompleted(prev => {
          const merged = [...new Set([...prev, ...serverIds])];
          if (roadmap) localStorage.setItem(`completed-${roadmap.goal}`, JSON.stringify(merged));
          return merged;
        });
      }
    });
  }, [roadmap]);

  // ── delete roadmap ──────────────────────────────────────────────────────────
  function deleteRoadmap(id) {
    const updated = roadmaps.filter(r => r.id !== id);
    setRoadmaps(updated);
    localStorage.setItem(roadmapsKey(), JSON.stringify(updated));
    if (selectedId === id) {
      setSelectedId(updated.length ? updated[0].id : null);
    }
    setConfirmDelete(null);
  }

  // ── filtered selector list ──────────────────────────────────────────────────
  const filteredRoadmaps = roadmaps.filter(r =>
    r.data.goal?.toLowerCase().includes(search.toLowerCase())
  );

  // ── no roadmap ──────────────────────────────────────────────────────────────
  if (!roadmap) {
    return (
      <div className="shell">
        <div className="empty">
          <div className="empty-icon">🗺</div>
          <div className="empty-title">NO ROADMAP YET</div>
          <p className="empty-desc">Head to Home to generate your personalized learning path.</p>
          <button className="btn-primary" style={{ width: "auto", marginTop: "16px" }}
            onClick={() => navigate("/home")}>
            Go to Home →
          </button>
        </div>
      </div>
    );
  }

  // ── roadmap structure ───────────────────────────────────────────────────────
  const weeks = roadmap.weeks || roadmap.roadmap || roadmap.plan || [];

  const allTopics = weeks.flatMap((w, wi) =>
    normalizeTopics(w.topics).map((t, ti) => ({
      id: `${wi}-${ti}`, flatIdx: wi * 100 + ti, ...t
    }))
  );

  const total = allTopics.length;
  const doneCount = allTopics.filter(t => completed.includes(t.id)).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  function toggle(id, flatIdx) {
    const nowDone = !completed.includes(id);
    setCompleted(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    apiSaveProgress(flatIdx, nowDone);
  }

  // ── PDF export ──────────────────────────────────────────────────────────────
  function downloadPDF() {
    const doc = new jsPDF();
    const PAGE_H = 280;
    let y = 20;

    const checkPage = (needed = 10) => {
      if (y + needed > PAGE_H) { doc.addPage(); y = 20; }
    };

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(roadmap.goal || "Learning Roadmap", 20, y);
    y += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Level: ${roadmap.level || "N/A"}   |   Weeks: ${weeks.length}   |   Topics: ${total}`, 20, y);
    y += 6;
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, y);
    y += 12;

    weeks.forEach((week, wi) => {
      checkPage(18);

      // Week header
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Week ${week.week || wi + 1}${week.title ? ": " + week.title : ""}`, 20, y);
      y += 8;

      const topics = normalizeTopics(week.topics);
      topics.forEach(topic => {
        checkPage(8);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`• ${topic.name}`, 24, y);
        y += 6;

        (topic.subtopics || []).forEach(sub => {
          checkPage(6);
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          const lines = doc.splitTextToSize(`  – ${sub}`, 160);
          lines.forEach(line => {
            checkPage(5);
            doc.text(line, 30, y);
            y += 5;
          });
        });

        y += 2;
      });

      y += 4;
    });

    doc.save(`${(roadmap.goal || "roadmap").replace(/[^a-z0-9]/gi, "_")}.pdf`);
  }

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="shell rm-page">

      {/* DELETE CONFIRMATION MODAL */}
      {confirmDelete !== null && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">🗑️</div>
            <div className="modal-title">Delete Roadmap?</div>
            <div className="modal-desc">
              Are you sure you want to delete <strong>
                {roadmaps.find(r => r.id === confirmDelete)?.data.goal}
              </strong>? This action cannot be undone.
            </div>
            <div className="modal-actions">
              <button className="modal-btn-cancel" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button className="modal-btn-delete" onClick={() => deleteRoadmap(confirmDelete)}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HERO */}
      <div className="rm-hero">
        <div className="rm-hero-inner">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="rm-breadcrumb">📍 Your Roadmap</div>
            <button className="btn-primary" style={{ width: "auto" }} onClick={downloadPDF}>
              ⬇ Download PDF
            </button>
          </div>

          <div className="rm-goal-title">{roadmap.goal || "LEARNING ROADMAP"}</div>

          <div className="rm-chips">
            {roadmap.level && (
              <span className="rm-chip">Level: <strong>{roadmap.level}</strong></span>
            )}
            <span className="rm-chip">Weeks: <strong>{weeks.length}</strong></span>
            <span className="rm-chip">Topics: <strong>{doneCount}/{total}</strong></span>
          </div>

          <div className="rm-progress-bar-wrap">
            <div className="rm-progress-track">
              <div className="rm-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="rm-progress-pct">{pct}%</span>
          </div>
        </div>
      </div>

      {/* ROADMAP SELECTOR */}
      {roadmaps.length > 0 && (
        <div className="roadmap-selector-wrap">
          {/* Search / filter text box */}
          <input
            className="roadmap-search-input"
            type="text"
            placeholder="🔍  Search roadmaps…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <div className="roadmap-selector">
            {filteredRoadmaps.length === 0 && (
              <span className="roadmap-no-match">No roadmaps match "{search}"</span>
            )}
            {filteredRoadmaps.map(r => (
              <div key={r.id} className="roadmap-switch-wrap">
                <button
                  className={`roadmap-switch ${selectedId === r.id ? "active" : ""}`}
                  onClick={() => setSelectedId(r.id)}
                >
                  {r.data.goal}
                </button>
                {/* Cancel / delete tag */}
                <button
                  className="roadmap-delete-btn"
                  title="Delete this roadmap"
                  onClick={e => { e.stopPropagation(); setConfirmDelete(r.id); }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ROADMAP CONTENT */}
      <div className="rm-body">
        {weeks.map((week, wi) => {
          const topics = normalizeTopics(week.topics).map((t, ti) => ({
            id: `${wi}-${ti}`, flatIdx: wi * 100 + ti, ...t
          }));
          const weekDone = topics.filter(t => completed.includes(t.id)).length;

          return (
            <div key={wi} className="week-block">
              <div className="week-header">
                <span className="week-num">WEEK {week.week || wi + 1}</span>
                {(week.title || week.theme) && (
                  <span className="week-title">{week.title || week.theme}</span>
                )}
                <span className="week-count">{weekDone}/{topics.length} done</span>
              </div>
              {topics.map(topic => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  completed={completed.includes(topic.id)}
                  onToggle={() => toggle(topic.id, topic.flatIdx)}
                />
              ))}
            </div>
          );
        })}
      </div>

    </div>
  );
}
