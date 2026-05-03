import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Roadmap from "./pages/Roadmap";
import Progress from "./pages/Progress";
import Continue from "./pages/Continue";

function Private({ children }) {
  return localStorage.getItem("user") ? children : <Navigate to="/" replace />;
}
function Auth({ children }) {
  return localStorage.getItem("user") ? <Navigate to="/home" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"        element={<Auth><Login /></Auth>} />
        <Route path="/signup"  element={<Auth><Signup /></Auth>} />
        <Route path="/home"    element={<Private><Home /></Private>} />
        <Route path="/roadmap" element={<Private><Roadmap /></Private>} />
        <Route path="/progress" element={<Private><Progress /></Private>} />
        <Route path="/continue" element={<Private><Continue /></Private>} />
        <Route path="*"        element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
