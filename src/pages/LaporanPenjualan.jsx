// LaporanPenjualan.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilePdf,
  faMagnifyingGlass,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

export default function LaporanPenjualan() {
  const [transaksi, setTransaksi] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // 🔹 Ambil data transaksi dari Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        const transaksiRef = collection(db, "transaksi");
        const snapshot = await getDocs(
          query(transaksiRef, orderBy("createdAt", "desc"))
        );
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTransaksi(data);
        setFilteredData(data);
      } catch (err) {
        console.error("Gagal mengambil data transaksi:", err);
      }
    };
    fetchData();
  }, []);

  // 🔹 Filter tanggal & pencarian
  useEffect(() => {
    let data = [...transaksi];

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      data = data.filter((tx) => {
        const txDate = tx.createdAt?.toDate
          ? tx.createdAt.toDate()
          : new Date(tx.createdAt);
        return txDate >= start && txDate <= end;
      });
    }

    if (search) {
      data = data.filter(
        (tx) =>
          tx.items.some((item) =>
            item.name.toLowerCase().includes(search.toLowerCase())
          ) || tx.paymentMethod?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredData(data);
  }, [startDate, endDate, search, transaksi]);

  // 🔹 Data untuk grafik penjualan per hari
  const grafikData = Object.values(
    filteredData.reduce((acc, tx) => {
      const tgl = format(
        tx.createdAt?.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt),
        "dd/MM"
      );
      const total = tx.total || 0; // ubah dari tx.totalPrice ke tx.total
      if (!acc[tgl]) acc[tgl] = { tgl, total: 0 };
      acc[tgl].total += total;
      return acc;
    }, {})
  );

  // 🔹 Ekspor ke PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Laporan Penjualan", 14, 15);
    doc.autoTable({
      head: [["Tanggal", "Total Harga", "Jumlah Item", "Pembayaran"]],
      body: filteredData.map((tx) => [
        format(
          tx.createdAt?.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt),
          "dd/MM/yyyy HH:mm"
        ),
        "Rp " + (tx.total ? tx.total.toLocaleString() : "0"),
        tx.items.length,
        "Rp " + (tx.payment ? tx.payment.toLocaleString() : "0"),
      ]),
      startY: 20,
    });

    doc.save("Laporan_Penjualan.pdf");
  };

  return (
    <section>
      <div className="bg-white shadow-sm p-4 flex items-center">
              <button
                onClick={() => navigate("/dashboard")}
                className="text-gray-600 hover:text-gray-900 transition"
              >
                <FontAwesomeIcon icon={faArrowLeft} size="lg" />
              </button>
              <h1 className="flex-1 text-center text-xl font-bold text-gray-800">
                Laporan Penjualan
              </h1>
            </div>

      <div className="p-6">
        {/* Filter Section */}
        <div className="flex flex-wrap gap-3 mb-6 items-end">
          <div>
            <label className="block text-sm font-semibold">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border p-2 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border p-2 rounded-md"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold">
              Cari Transaksi
            </label>
            <div className="relative">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="absolute left-2 top-3 text-gray-400"
              />
              <input
                type="text"
                placeholder="Cari produk atau metode pembayaran..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border pl-8 p-2 w-full rounded-md"
              />
            </div>
          </div>
          <button
            onClick={exportToPDF}
            className="bg-red-600 text-white px-3 py-2 rounded-md flex items-center gap-2 hover:bg-red-700"
          >
            <FontAwesomeIcon icon={faFilePdf} /> Ekspor PDF
          </button>
        </div>

        {/* Grafik Penjualan */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-3">Grafik Penjualan</h2>
          {grafikData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={grafikData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tgl" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#4F46E5" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-10">
              Tidak ada data untuk rentang tanggal ini.
            </p>
          )}
        </div>

        {/* Tabel Transaksi */}
        <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
          <h2 className="text-lg font-semibold mb-3">Detail Transaksi</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Tanggal</th>
                <th className="p-2 border">Total Harga</th>
                <th className="p-2 border">Metode Pembayaran</th>
                <th className="p-2 border">Jumlah Item</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((tx) => (
                  <tr key={tx.id}>
                    <td className="p-2 border">
                      {format(
                        tx.createdAt?.toDate
                          ? tx.createdAt.toDate()
                          : new Date(tx.createdAt),
                        "dd/MM/yyyy HH:mm"
                      )}
                    </td>
                    <td className="p-2 border">
                      Rp {(tx.total ?? 0).toLocaleString()}
                    </td>
                    <td className="p-2 border">{tx.items.length}</td>
                    <td className="p-2 border">
                      Rp {(tx.payment ?? 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-3 text-center text-gray-500">
                    Tidak ada transaksi ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
