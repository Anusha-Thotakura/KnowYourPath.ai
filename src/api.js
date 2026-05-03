const BASE = "http://127.0.0.1:5000";

// All requests include credentials so Flask session cookies work
const opts = (method, body) => ({
  method,
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  ...(body ? { body: JSON.stringify(body) } : {}),
});

export async function apiSignup(email, password) {
  const res = await fetch(`${BASE}/signup`, opts("POST", { email, password }));
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Signup failed");
  return data;
}

export async function apiLogin(email, password) {
  const res = await fetch(`${BASE}/login`, opts("POST", { email, password }));
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data;
}

export async function apiLogout() {
  await fetch(`${BASE}/logout`, { credentials: "include" });
}

// Backend expects "hours" (not "hours_per_day")
// Backend returns { roadmap: "plain text string" }
export async function apiGenerateRoadmap(goal, level, weeks, hours) {
  const res = await fetch(`${BASE}/generate-roadmap`, opts("POST", { goal, level, weeks, hours }));
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to generate roadmap");
  return data; // { roadmap: "..." }
}

// Save a single topic completion to DB
export async function apiSaveProgress(topicIndex, completed) {
  try {
    await fetch(`${BASE}/save-progress`, opts("POST", { topic_index: topicIndex, completed }));
  } catch (e) {
    // non-blocking — progress still saved in localStorage
    console.warn("Could not sync progress to server:", e.message);
  }
}

// Load progress from DB — returns { "0": true, "3": true, ... }
export async function apiLoadProgress() {
  try {
    const res = await fetch(`${BASE}/load-progress`, { credentials: "include" });
    return await res.json();
  } catch (e) {
    return {};
  }
}
