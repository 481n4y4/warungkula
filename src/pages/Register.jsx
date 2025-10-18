// src/pages/Register.jsx
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      console.error(err.message);
      setError("Gagal mendaftar! Pastikan email belum terdaftar.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-green-200 via-green-300 to-green-500">
      <div className="bg-white rounded-3xl shadow-2xl w-11/12 max-w-5xl flex overflow-hidden">
        {/* Kiri: Deskripsi */}
        <div className="hidden md:flex flex-col justify-center p-12 w-1/2 bg-gradient-to-tr from-green-700 via-green-600 to-green-500 text-white">
          <h1 className="text-4xl font-extrabold mb-6 leading-tight">
            Daftar Sekarang dan Mulai Kelola Warungmu!
          </h1>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                🛒 Atur Penjualan Lebih Cepat
              </h3>
              <p className="text-sm opacity-90 mt-1">
                Tambah produk, kelola stok, dan catat transaksi hanya dengan beberapa klik.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                📊 Lihat Laporan Otomatis
              </h3>
              <p className="text-sm opacity-90 mt-1">
                Dapatkan laporan penjualan otomatis untuk membantu ambil keputusan bisnis.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                ☁️ Akses dari Mana Saja
              </h3>
              <p className="text-sm opacity-90 mt-1">
                Login dari laptop atau HP, data warungmu tetap aman dan sinkron.
              </p>
            </div>
          </div>
        </div>

        {/* Kanan: Form Register */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
            Buat Akun WarungKula
          </h2>
          <p className="text-center text-gray-500 mb-6">
            Daftar sekarang untuk mulai mengelola usahamu
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-gray-600 mb-1">Email</label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-gray-600 mb-1">Password</label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
            >
              Daftar
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-4">
            Sudah punya akun?{" "}
            <Link to="/" className="text-green-600 font-semibold">
              Login di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
