// src/components/StoreStatusWidget.jsx
import React, { useEffect, useState } from "react";
import { getActiveStoreSession, openStoreSession, closeStoreSession } from "../firebase/firebase";
import { auth } from "../firebase/firebase";

export default function StoreStatusWidget({ onEnterCashier }) {
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", cashStart: "" });

  const userEmail = auth.currentUser?.email || "User";

  useEffect(() => {
    async function fetchSession() {
      const session = await getActiveStoreSession();
      setActiveSession(session);
      setLoading(false);
    }
    fetchSession();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleOpenStore = async () => {
    try {
      await openStoreSession(form.username, form.password, form.cashStart);
      alert("Toko berhasil dibuka!");
      setShowForm(false);
      onEnterCashier?.(); // arahkan ke mode kasir
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCloseStore = async () => {
    const adminPassword = prompt("Masukkan password admin untuk menutup toko:");
    if (!adminPassword) return;
    try {
      await closeStoreSession(adminPassword);
      alert("Toko ditutup!");
      setActiveSession(null);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-4 bg-white rounded-xl shadow">Memuat...</div>;

  return (
    <div className="bg-white shadow-md rounded-xl p-6 flex flex-col gap-3">
      {!activeSession ? (
        <>
          <h2 className="text-lg font-semibold">
            Hi, {userEmail} 👋 Mau buka toko hari ini?
          </h2>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md w-fit"
            >
              Buka Toko
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <input
                name="username"
                placeholder="Username Operator"
                className="border p-2 rounded"
                onChange={handleChange}
              />
              <input
                name="password"
                placeholder="Password"
                type="password"
                className="border p-2 rounded"
                onChange={handleChange}
              />
              <input
                name="cashStart"
                placeholder="Modal awal kas (Rp)"
                className="border p-2 rounded"
                onChange={handleChange}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleOpenStore}
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md"
                >
                  Konfirmasi
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 py-2 px-4 rounded-md"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <h2 className="text-lg font-semibold text-green-700">
            Toko sedang dibuka oleh <span className="font-bold">{activeSession.operatorName}</span>
          </h2>
          <p className="text-gray-600 text-sm">
            Dibuka pada: {new Date(activeSession.openedAt.seconds * 1000).toLocaleString()}
          </p>
          <button
            onClick={handleCloseStore}
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md w-fit"
          >
            Tutup Toko
          </button>
        </>
      )}
    </div>
  );
}
