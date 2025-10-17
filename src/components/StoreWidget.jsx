import React, { useEffect, useState } from "react";
import {
  getActiveStoreSession,
  openStoreSession,
  closeStoreSession,
  getAllOperators,
  auth,
} from "../firebase/firebase";

export default function StoreStatusWidget({ onEnterCashier }) {
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [operators, setOperators] = useState([]);
  const [form, setForm] = useState({
    username: "",
    password: "",
    cashStart: "",
  });
  const [operatorPassword, setOperatorPassword] = useState("");

  const userEmail = auth.currentUser?.email || "User";

  // 🔹 Load sesi toko aktif
  useEffect(() => {
    async function fetchSession() {
      const session = await getActiveStoreSession();
      setActiveSession(session);
      setLoading(false);
    }
    fetchSession();
  }, []);

  // 🔹 Load data operator
  useEffect(() => {
    async function fetchOperators() {
      try {
        const ops = await getAllOperators();
        setOperators(ops);
      } catch (err) {
        console.error("Gagal memuat operator:", err);
      }
    }
    fetchOperators();
  }, []);

  // 🔹 Input handler
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // 🔹 Buka toko
  const handleOpenStore = async () => {
    try {
      await openStoreSession(form.username, form.password, form.cashStart);
      alert("✅ Toko berhasil dibuka!");
      setShowOpenModal(false);
      setActiveSession(await getActiveStoreSession());
      onEnterCashier?.();
    } catch (err) {
      alert(err.message);
    }
  };

  // 🔹 Tutup toko
  const handleCloseStore = async () => {
    try {
      if (!operatorPassword) throw new Error("Masukkan password operator!");
      await closeStoreSession(operatorPassword);
      alert("✅ Toko berhasil ditutup!");
      setShowCloseModal(false);
      setActiveSession(null);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-4 rounded-xl shadow text-white bg-gradient-to-r from-[#1CB5E0] to-[#000851]">
        Memuat...
      </div>
    );
  }

  return (
    <>
      {/* 🔹 Widget status toko */}
      <div className="bg-gradient-to-r from-[#1CB5E0] to-[#000851] shadow-md rounded-xl p-6 flex flex-col gap-3 text-white">
        {!activeSession ? (
          <>
            <h2 className="text-lg font-semibold">
              Hi, {userEmail} 👋 Mau buka toko hari ini?
            </h2>
            <button
              onClick={() => setShowOpenModal(true)}
              className="bg-white text-[#000851] hover:bg-gray-100 font-semibold py-2 px-4 rounded-md w-fit transition"
            >
              Buka Toko
            </button>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold">
              🏪 Toko sedang dibuka oleh{" "}
              <span className="font-bold">{activeSession.operatorName}</span>
            </h2>
            <p className="text-sm opacity-90">
              Dibuka pada:{" "}
              {activeSession.openedAt?.seconds
                ? new Date(
                    activeSession.openedAt.seconds * 1000
                  ).toLocaleString()
                : "-"}
            </p>
            <button
              onClick={() => setShowCloseModal(true)}
              className="bg-white text-red-600 hover:bg-gray-100 font-semibold py-2 px-4 rounded-md w-fit transition"
            >
              Tutup Toko
            </button>
          </>
        )}
      </div>

      {/* 🔹 Modal Buka Toko */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[90%] max-w-md shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Buka Toko
            </h3>
            <div className="flex flex-col gap-3">
              {/* Pilih Operator */}
              <select
                name="username"
                value={form.username}
                onChange={handleChange}
                className="border p-2 rounded"
                required
              >
                <option value="">Pilih operator...</option>
                {operators.map((op) => (
                  <option key={op.id} value={op.username}>
                    {op.username} ({op.role})
                  </option>
                ))}
              </select>

              {/* Modal awal kas */}
              <input
                name="cashStart"
                placeholder="Masukkan modal kas awal hari ini (Rp)"
                className="border p-2 rounded"
                onChange={handleChange}
              />

              {/* Password operator */}
              <input
                name="password"
                type="password"
                placeholder="Masukkan password operator"
                className="border p-2 rounded"
                onChange={handleChange}
              />

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowOpenModal(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md"
                >
                  Batal
                </button>
                <button
                  onClick={handleOpenStore}
                  className="bg-[#1CB5E0] hover:bg-[#1699c2] text-white font-semibold py-2 px-4 rounded-md"
                >
                  Konfirmasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 Modal Tutup Toko */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[90%] max-w-sm shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Masukkan password operator untuk menutup toko:
            </h3>
            <input
              type="password"
              value={operatorPassword}
              onChange={(e) => setOperatorPassword(e.target.value)}
              className="border p-2 rounded w-full"
              placeholder="Password operator"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowCloseModal(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md"
              >
                Batal
              </button>
              <button
                onClick={handleCloseStore}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md"
              >
                Tutup Toko
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
