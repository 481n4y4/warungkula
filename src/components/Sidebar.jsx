// Sidebar.jsx
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faCashRegister,
  faChartLine,
  faBoxes,
  faUsers,
  faHome,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useLocation } from "react-router-dom";
import warungkula from "../assets/img/logo.png";

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/dashboard", icon: faHome, label: "Dashboard" },
    { path: "/kasir", icon: faCashRegister, label: "Kasir" },
    { path: "/laporan", icon: faChartLine, label: "Laporan" },
    { path: "/inventori", icon: faBoxes, label: "Inventori" },
    { path: "/operator", icon: faUsers, label: "Operator" },
    { path: "/akun", icon: faUser, label: "Akun" },
  ];

  return (
    <>
      {/* Overlay untuk mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 h-screen bg-green-100 text-green-900 shadow-lg 
          transform transition-transform duration-300 ease-in-out z-50
          ${isOpen ? "translate-x-0" : "-translate-x-full"} 
          md:translate-x-0 w-20 md:w-24 flex flex-col items-center py-6
          overflow-hidden`} // Tambahkan overflow-hidden di sini
      >
        {/* Logo Section */}
        <div className="flex-shrink-0 mb-8">
          <img
            src={warungkula}
            alt="logo"
            className="w-10 h-10 object-contain"
          />
        </div>

        {/* Navigation Items - Container dengan fixed height dan no scroll */}
        <div className="flex-1 flex flex-col items-center w-full overflow-hidden">
          <nav className="flex flex-col gap-4 w-full px-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  onClose?.(); // tutup sidebar di mobile
                }}
                title={item.label}
                className={`p-3 rounded-xl hover:bg-green-200 transition-all duration-200 flex items-center justify-center
                  ${
                    location.pathname === item.path
                      ? "bg-green-300 text-green-800 shadow-inner"
                      : "text-green-700"
                  }`}
              >
                <FontAwesomeIcon
                  icon={item.icon}
                  size="lg"
                  className="flex-shrink-0"
                />
              </button>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
