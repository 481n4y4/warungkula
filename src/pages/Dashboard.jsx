import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar"

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar/>

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
            onClick={() => navigate("/laporan")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Laporan Penjualan
          </button>

          <button
            onClick={() => navigate("/inventori")}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            Inventori Barang
          </button>
        </div>
      </div>
    </div>
  );
}
