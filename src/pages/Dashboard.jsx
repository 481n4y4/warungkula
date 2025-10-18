import { useEffect, useState } from "react";
import {
  getDashboardStats,
  getActiveStoreSession,
  waitForUser,
} from "../firebase/firebase";
import StoreStatusWidget from "../components/StoreWidget";
import Sidebar from "../components/Sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { useLocation } from "react-router-dom";
import Popup from "../components/Popup";

export default function Dashboard() {
  const location = useLocation();
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const [stats, setStats] = useState({
    totalPemasukan: 0,
    totalTransaksi: 0,
    totalProduk: 0,
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        // ✅ Pastikan user sudah login sebelum akses data
        await waitForUser();

        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error("❌ Gagal memuat statistik:", err);
        setPopupMessage("Gagal memuat data. Pastikan Anda sudah login.");
        setShowPopup(true);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    if (location.state?.storeClosed) {
      setPopupMessage(
        "⚠️ Toko belum dibuka, silakan buka toko terlebih dahulu!"
      );
      setShowPopup(true);
    }
  }, [location.state]);

  const handleEnterCashier = async () => {
    console.log("🎯 handleEnterCashier dipanggil!");

    try {
      // ✅ Tunggu user login dulu sebelum ambil session
      await waitForUser();

      console.log("🔍 Mengecek active session...");
      const activeSession = await getActiveStoreSession();
      console.log("✅ Active session result:", activeSession);

      if (!activeSession) {
        console.log("🚫 No active session, harusnya show popup");
        setPopupMessage(
          "⚠️ Toko harus dibuka terlebih dahulu sebelum masuk ke kasir!"
        );
        setShowPopup(true);
        console.log("📢 setShowPopup(true) telah dipanggil");
        return;
      }

      console.log("✅ Ada active session, redirect ke kasir");
      window.location.href = "/kasir";
    } catch (err) {
      console.error("❌ Gagal memeriksa status toko:", err);
      setPopupMessage("Terjadi kesalahan saat memeriksa status toko.");
      setShowPopup(true);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex flex-9 flex-col">
        <nav className="flex items-center gap-3 bg-white shadow-md px-6 py-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-green-600 text-2xl flex md:hidden"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>

          <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        </nav>

        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div>
            <StoreStatusWidget onEnterCashier={handleEnterCashier} />
          </div>

          {/* Statistik Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow text-center border-l-4 border-green-500">
              <h3 className="text-gray-500">Total Pemasukan</h3>
              <p className="text-3xl font-bold text-green-600">
                Rp {stats.totalPemasukan.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow text-center border-l-4 border-green-500">
              <h3 className="text-gray-500">Total Transaksi</h3>
              <p className="text-3xl font-bold text-green-600">
                {stats.totalTransaksi}
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow text-center border-l-4 border-green-500">
              <h3 className="text-gray-500">Produk Terjual</h3>
              <p className="text-3xl font-bold text-green-600">
                {stats.totalProduk}
              </p>
            </div>
          </div>
        </div>
      </main>

      {showPopup && (
        <Popup
          title="Peringatan"
          message={popupMessage}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
}
