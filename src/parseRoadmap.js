/**
 * The Groq backend returns plain text like:
 *
 * Week 1: Introduction to Python
 * • Variables and Data Types
 * • Control Flow
 * - Lists and Tuples
 *
 * Week 2: Functions and Modules
 * • Defining Functions
 * ...
 *
 * This parser converts that into:
 * [{ week: 1, title: "Introduction to Python", topics: [{ name, subtopics: [] }] }]
 */
export function parseRoadmapText(text) {
  if (!text) return [];

  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const weeks = [];
  let currentWeek = null;
  let currentTopic = null;

  for (const line of lines) {
    // Match "Week N" or "Week N: Title" or "**Week N**" patterns
    const weekMatch = line.match(/\*{0,2}week\s+(\d+)\*{0,2}[:\-–]?\s*(.*)/i);
    if (weekMatch) {
      if (currentWeek) weeks.push(currentWeek);
      currentTopic = null;
      currentWeek = {
        week: parseInt(weekMatch[1]),
        title: weekMatch[2].replace(/\*+/g, "").trim() || `Week ${weekMatch[1]}`,
        topics: [],
      };
      continue;
    }

    // If no week found yet, create a default
    if (!currentWeek) {
      currentWeek = { week: 1, title: "Getting Started", topics: [] };
    }

    // Topic lines: bold **Topic**, numbered "1. Topic", or plain lines without bullet chars
    const boldTopic   = line.match(/^\*\*(.+?)\*\*:?$/);
    const numberedTopic = line.match(/^\d+\.\s+(.+)/);
    const isBullet    = /^[-•*]\s+/.test(line);
    const isSubBullet = /^\s{2,}[-•*]\s+/.test(line) || /^[-•*]{2}\s+/.test(line);

    if (boldTopic) {
      currentTopic = { name: boldTopic[1].trim(), subtopics: [] };
      currentWeek.topics.push(currentTopic);
      continue;
    }

    if (numberedTopic && !isBullet) {
      currentTopic = { name: numberedTopic[1].trim(), subtopics: [] };
      currentWeek.topics.push(currentTopic);
      continue;
    }

    if (isBullet) {
      const content = line.replace(/^[-•*]\s+/, "").replace(/\*+/g, "").trim();
      if (!content) continue;

      if (isSubBullet && currentTopic) {
        // Sub-bullet → subtopic of current topic
        currentTopic.subtopics.push(content);
      } else {
        // Top-level bullet → new topic
        currentTopic = { name: content, subtopics: [] };
        currentWeek.topics.push(currentTopic);
      }
      continue;
    }

    // Plain line that looks like a topic (not too long, not a sentence)
    if (line.length < 80 && !line.includes(".") && currentWeek && !isBullet) {
      const clean = line.replace(/\*+/g, "").replace(/^#+\s*/, "").trim();
      if (clean.length > 2) {
        currentTopic = { name: clean, subtopics: [] };
        currentWeek.topics.push(currentTopic);
      }
    }
  }

  if (currentWeek) weeks.push(currentWeek);

  // Remove weeks with no topics
  return weeks.filter(w => w.topics.length > 0);
}
