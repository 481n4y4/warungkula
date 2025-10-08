import { useEffect, useState } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Mengecek apakah user sudah login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate("/");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-700">WarungGw</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">{user.email}</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Konten Dashboard */}
      <div className="p-8">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-md text-center">
            <h3 className="text-gray-500">Total Pemasukan</h3>
            <p className="text-3xl font-bold text-green-600">Rp 2.500.000</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md text-center">
            <h3 className="text-gray-500">Total Pengeluaran</h3>
            <p className="text-3xl font-bold text-red-500">Rp 1.200.000</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md text-center">
            <h3 className="text-gray-500">Jumlah Produk</h3>
            <p className="text-3xl font-bold text-blue-600">87</p>
          </div>
        </div>

        <div className="mt-10 flex gap-4">
          <button
            onClick={() => navigate("/kasir")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Mode Kasir
          </button>

          <button
            onClick={() => navigate("/inventori")}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            Inventori
          </button>
        </div>
      </div>
    </div>
  );
}
