// src/pages/Login.jsx
import { useState } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, provider } from "../firebase/firebase";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      console.error(err.message);
      setError("Email atau password salah!");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-green-200 via-green-300 to-green-500">
      <div className="bg-white rounded-3xl shadow-2xl w-11/12 max-w-5xl flex overflow-hidden">
        {/* Kiri: Deskripsi */}
        <div className="hidden md:flex flex-col justify-center p-12 w-1/2 bg-gradient-to-tr from-green-700 via-green-600 to-green-500 text-white">
          <h1 className="text-4xl font-extrabold mb-6 leading-tight">
            WarungKula — Cepat, Mudah, dan Aman.
          </h1>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                🌿 Kelola Warungmu dengan Mudah
              </h3>
              <p className="text-sm opacity-90 mt-1">
                Pantau penjualan, stok, dan keuangan langsung dari satu dashboard yang praktis.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                💡 Analisis Otomatis
              </h3>
              <p className="text-sm opacity-90 mt-1">
                Dapatkan wawasan penjualan harian dan saran untuk meningkatkan keuntunganmu.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                🔒 Aman dan Terpercaya
              </h3>
              <p className="text-sm opacity-90 mt-1">
                Semua data tersimpan dengan aman di server kami, jadi kamu bisa fokus berjualan.
              </p>
            </div>
          </div>
        </div>

        {/* Kanan: Form Login */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
            Selamat Datang di WarungKula
          </h2>
          <p className="text-center text-gray-500 mb-6">
            Masuk ke akunmu untuk mulai mengelola penjualan
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
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
              Masuk
            </button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-grow h-px bg-gray-200"></div>
            <span className="mx-3 text-gray-400 text-sm">atau</span>
            <div className="flex-grow h-px bg-gray-200"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-100 flex justify-center items-center gap-2 transition"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Login dengan Google
          </button>

          <p className="text-center text-gray-500 text-sm mt-4">
            Belum punya akun?{" "}
            <Link to="/register" className="text-green-600 font-semibold">
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
