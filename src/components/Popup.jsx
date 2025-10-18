// src/components/Popup.jsx
import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Popup({ title, message, onClose }) {
  useEffect(() => {
    console.log("Popup mounted");
    return () => console.log("Popup unmounted");
  }, []);

  // Debug: cek apakah portal target ada
  if (typeof document === 'undefined') {
    return null; // Untuk SSR
  }

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[999999]">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-sm text-center">
        <h2 className="text-lg font-bold text-gray-800 mb-3">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
        >
          OK
        </button>
      </div>
    </div>,
    document.body
  );
}