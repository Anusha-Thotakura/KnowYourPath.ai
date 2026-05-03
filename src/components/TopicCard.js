import { useState } from "react";

export default function TopicCard({ topic, completed, onToggle }) {
  const [open, setOpen] = useState(false);
  const enc = s => encodeURIComponent(s);

  return (
    <div className={`topic-card ${completed ? "done" : ""} ${open ? "expanded" : ""}`}>
      <div className="topic-head" onClick={() => setOpen(o => !o)}>
        {/* Custom checkbox */}
        <label className="check-wrap" onClick={e => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={completed}
            onChange={onToggle}
          />
          <span className="check-box">{completed && "✓"}</span>
        </label>

        <span className="topic-name">{topic.name}</span>

        {(topic.subtopics?.length > 0) && (
          <span className="topic-toggle">▾</span>
        )}
      </div>

      {open && (
        <div className="topic-body">
          {topic.subtopics?.length > 0 && (
            <div className="subtopic-wrap">
              {topic.subtopics.map((s, i) => (
                <span key={i} className="subtopic-tag">{s}</span>
              ))}
            </div>
          )}
          <div className="topic-links">
            <a
              href={`https://www.google.com/search?q=${enc(topic.name + " tutorial")}`}
              target="_blank" rel="noreferrer"
              className="btn-icon tlink-notes"
            >📘 Notes</a>
            <a
              href={`https://www.youtube.com/results?search_query=${enc(topic.name)}`}
              target="_blank" rel="noreferrer"
              className="btn-icon tlink-videos"
            >📺 Videos</a>
            <a
              href={`https://www.google.com/search?q=${enc(topic.name + " practice problems")}`}
              target="_blank" rel="noreferrer"
              className="btn-icon tlink-practice"
            >💻 Practice</a>
          </div>
        </div>
      )}
    </div>
  );
}
