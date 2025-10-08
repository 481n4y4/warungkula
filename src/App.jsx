import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Inventori from "./pages/Inventori";
import Kasir from "./pages/Kasir";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventori" element={<Inventori />}/>
        <Route path="/kasir" element={<Kasir />} />
      </Routes>
    </Router>
  );
}
