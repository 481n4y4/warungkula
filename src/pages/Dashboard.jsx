import { useEffect, useState } from "react";
import {
  getDashboardStats,
  getActiveStoreSession,
  waitForUser,
  getAllTransactions,
} from "../firebase/firebase";
import StoreStatusWidget from "../components/StoreWidget";
import Sidebar from "../components/Sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faChartLine,
  faReceipt,
  faShoppingCart,
  faMoneyBillWave,
  faCalendar,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import { useLocation, useNavigate } from "react-router-dom";
import Popup from "../components/Popup";

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalPemasukan: 0,
    totalTransaksi: 0,
    totalProduk: 0,
  });

  const [recentTransactions, setRecentTransactions] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        // ✅ Pastikan user sudah login sebelum akses data
        await waitForUser();

        const [statsData, transactionsData] = await Promise.all([
          getDashboardStats(),
          getAllTransactions(),
        ]);

        setStats(statsData);

        // Get 5 most recent transactions
        const sortedTransactions = transactionsData
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate
              ? a.createdAt.toDate()
              : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate
              ? b.createdAt.toDate()
              : new Date(b.createdAt);
            return dateB - dateA;
          })
          .slice(0, 5);

        setRecentTransactions(sortedTransactions);
      } catch (err) {
        console.error("❌ Gagal memuat data dashboard:", err);
        setPopupMessage("Gagal memuat data. Pastikan Anda sudah login.");
        setShowPopup(true);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
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
      navigate("/kasir");
    } catch (err) {
      console.error("❌ Gagal memeriksa status toko:", err);
      setPopupMessage("Terjadi kesalahan saat memeriksa status toko.");
      setShowPopup(true);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch (error) {
      console.log(`message: ${error}`);
      return "-";
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        <div className={`
          fixed lg:static
          inset-y-0 left-0
          md:w-[96px]
          w-64
          h-screen
          transform transition-transform duration-300 ease-in-out
          z-40
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          overflow-y-auto
        `}>
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar dengan fixed positioning */}
      <div
        className={`
          fixed lg:static
          inset-y-0 left-0
          md:w-[96px]
          w-64
          h-screen
          transform transition-transform duration-300 ease-in-out
          z-40
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          overflow-y-auto
        `}
      >
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Overlay untuk mobile */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden lg:ml-0">
        {/* Header */}
        <nav className="flex items-center justify-between bg-white shadow-sm px-4 py-3 sm:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-green-600 text-xl sm:text-2xl lg:hidden"
            >
              <FontAwesomeIcon icon={faBars} />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">
              Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-500 hidden sm:block">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </nav>

        {/* Scrollable Content - UBAH DI SINI */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-6">
          {/* Store Status Widget */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <StoreStatusWidget onEnterCashier={handleEnterCashier} />
          </div>

          {/* Statistik Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Total Pemasukan */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    Total Pemasukan
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">
                    {formatCurrency(stats.totalPemasukan)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Semua waktu</p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <FontAwesomeIcon
                    icon={faMoneyBillWave}
                    className="text-green-600 text-xl"
                  />
                </div>
              </div>
            </div>

            {/* Total Transaksi */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    Total Transaksi
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1">
                    {stats.totalTransaksi}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Semua transaksi</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <FontAwesomeIcon
                    icon={faReceipt}
                    className="text-blue-600 text-xl"
                  />
                </div>
              </div>
            </div>

            {/* Produk Terjual */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    Produk Terjual
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-600 mt-1">
                    {stats.totalProduk}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Total item terjual
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <FontAwesomeIcon
                    icon={faShoppingCart}
                    className="text-purple-600 text-xl"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FontAwesomeIcon icon={faClock} className="text-gray-400" />
                    Transaksi Terbaru
                  </h2>
                  <button
                    onClick={() => navigate("/laporan-penjualan")}
                    className="text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Lihat Semua
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                {recentTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {recentTransactions.map((transaction, index) => (
                      <div
                        key={transaction.id || index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-sm font-medium text-gray-800">
                              {formatCurrency(
                                transaction.total || transaction.totalPrice || 0
                              )}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                transaction.paymentMethod === "Tunai"
                                  ? "bg-blue-100 text-blue-700"
                                  : transaction.paymentMethod === "QRIS"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-purple-100 text-purple-700"
                              }`}
                            >
                              {transaction.paymentMethod || "Tunai"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {formatDate(transaction.createdAt)}
                          </p>
                          {transaction.items && (
                            <p className="text-xs text-gray-600 mt-1">
                              {transaction.items.length} item
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FontAwesomeIcon
                      icon={faReceipt}
                      className="text-3xl mb-3 text-gray-300"
                    />
                    <p>Belum ada transaksi</p>
                    <p className="text-sm mt-1">
                      Transaksi akan muncul di sini
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={faChartLine}
                    className="text-gray-400"
                  />
                  Akses Cepat
                </h2>
              </div>

              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => navigate("/kasir")}
                    className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-center group"
                  >
                    <FontAwesomeIcon
                      icon={faShoppingCart}
                      className="text-green-600 text-xl mb-2"
                    />
                    <p className="font-medium text-green-700 text-sm">
                      Mode Kasir
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Transaksi Baru
                    </p>
                  </button>

                  <button
                    onClick={() => navigate("/inventori")}
                    className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-center group"
                  >
                    <FontAwesomeIcon
                      icon={faChartLine}
                      className="text-blue-600 text-xl mb-2"
                    />
                    <p className="font-medium text-blue-700 text-sm">
                      Inventori
                    </p>
                    <p className="text-xs text-blue-600 mt-1">Kelola Barang</p>
                  </button>

                  <button
                    onClick={() => navigate("/laporan-penjualan")}
                    className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-center group"
                  >
                    <FontAwesomeIcon
                      icon={faReceipt}
                      className="text-purple-600 text-xl mb-2"
                    />
                    <p className="font-medium text-purple-700 text-sm">
                      Laporan
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      Lihat Penjualan
                    </p>
                  </button>

                  <button
                    onClick={() => navigate("/operator")}
                    className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors text-center group"
                  >
                    <FontAwesomeIcon
                      icon={faCalendar}
                      className="text-orange-600 text-xl mb-2"
                    />
                    <p className="font-medium text-orange-700 text-sm">
                      Operator
                    </p>
                    <p className="text-xs text-orange-600 mt-1">Kelola Staff</p>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FontAwesomeIcon icon={faChartLine} className="text-gray-400" />
                Ringkasan Performa
              </h2>
            </div>

            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.totalTransaksi}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Total Transaksi</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.totalTransaksi > 0
                      ? formatCurrency(
                          stats.totalPemasukan / stats.totalTransaksi
                        )
                      : formatCurrency(0)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Rata-rata/Transaksi
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.totalProduk}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Total Item Terjual
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-800">
                    {stats.totalTransaksi > 0
                      ? (stats.totalProduk / stats.totalTransaksi).toFixed(1)
                      : 0}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Item/Transaksi</p>
                </div>
              </div>
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