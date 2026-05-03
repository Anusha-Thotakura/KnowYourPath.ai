import { NavLink, useNavigate } from "react-router-dom";
import { apiLogout } from "../api";

function roadmapsKey() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.email ? `roadmaps-${user.email}` : "roadmaps-guest";
  } catch { return "roadmaps-guest"; }
}

export default function Navbar() {
  const navigate = useNavigate();
  const user = localStorage.getItem("user");

  // Check the per-user roadmaps key
  const hasRoadmap = (() => {
    try {
      const key = roadmapsKey();
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      return list.length > 0;
    } catch { return false; }
  })();

  async function logout() {
    await apiLogout();          // clear Flask session
    localStorage.removeItem("user");
    // NOTE: per-user roadmaps stay in localStorage keyed by email.
    // Legacy keys cleanup:
    localStorage.removeItem("roadmap");
    localStorage.removeItem("completed");
    navigate("/");
  }

  return (
    <nav className="nav">
      <div className="nav-brand">
        <span className="nav-brand-dot" />
        KnowYourPath.ai
      </div>

      {user && (
        <ul className="nav-links">
          <li><NavLink to="/home">Home</NavLink></li>
          {hasRoadmap && <li><NavLink to="/roadmap">Roadmap</NavLink></li>}
          {hasRoadmap && <li><NavLink to="/progress">Progress</NavLink></li>}
          {hasRoadmap && <li><NavLink to="/continue">Continue</NavLink></li>}
          <li>
            <button className="nav-logout" onClick={logout}>Logout</button>
          </li>
        </ul>
      )}
    </nav>
  );
}
