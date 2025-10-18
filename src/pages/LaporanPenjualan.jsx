// src/pages/LaporanPenjualan.jsx
import React, { useEffect, useState, useRef } from "react";
import { format, isSameDay } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import Sidebar from "../components/Sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { getAllTransactions } from "../firebase/firebase"; // 🔹 gunakan fungsi yang sudah ada di firebase.js

export default function LaporanPenjualan() {
  const [transaksi, setTransaksi] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const laporanRef = useRef();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 🔹 Ambil data transaksi dari firebase.js
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllTransactions(); // 🔹 ambil dari fungsi Firebase.js
        if (Array.isArray(data)) {
          setTransaksi(data);
          setFilteredData(data);
        }
      } catch (err) {
        console.error("Gagal mengambil data transaksi:", err);
      }
    };
    fetchData();
  }, []);

  const now = new Date();

  // 🔹 Grafik 30 Hari Terakhir
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 29);

  const last30DaysData = filteredData.filter((tx) => {
    const txDate = tx.createdAt?.toDate
      ? tx.createdAt.toDate()
      : new Date(tx.createdAt);
    return txDate >= thirtyDaysAgo && txDate <= now;
  });

  const grafikData = Object.values(
    last30DaysData.reduce((acc, tx) => {
      const dateObj = tx.createdAt?.toDate
        ? tx.createdAt.toDate()
        : new Date(tx.createdAt);
      const tgl = format(dateObj, "dd/MM");
      const total = Number(tx.total) || 0;
      if (!acc[tgl]) acc[tgl] = { tgl, total: 0 };
      acc[tgl].total += total;
      return acc;
    }, {})
  );

  // 🔹 Lengkapi hari kosong agar tetap tampil di grafik
  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo);
    date.setDate(thirtyDaysAgo.getDate() + i);
    const label = format(date, "dd/MM");
    if (!grafikData.find((d) => d.tgl === label)) {
      grafikData.push({ tgl: label, total: 0 });
    }
  }

  grafikData.sort((a, b) => {
    const [da, ma] = a.tgl.split("/").map(Number);
    const [db, mb] = b.tgl.split("/").map(Number);
    return ma * 100 + da - (mb * 100 + db);
  });

  // 🔹 7 Hari Terakhir
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 6);
  const last7Days = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    const dayTx = filteredData.filter((tx) => {
      const txDate = tx.createdAt?.toDate
        ? tx.createdAt.toDate()
        : new Date(tx.createdAt);
      return isSameDay(txDate, date);
    });
    const totalHarian = dayTx.reduce(
      (sum, tx) => sum + (Number(tx.total) || 0),
      0
    );
    last7Days.push({
      tanggal: format(date, "EEEE, dd/MM"),
      total: totalHarian,
      jumlah: dayTx.length,
    });
  }

  const total7Hari = last7Days.reduce((acc, d) => acc + d.total, 0);

  // 🔹 Berdasarkan tanggal pilihan
  const chosenDate = new Date(selectedDate);
  const chosenDayData = filteredData.filter((tx) => {
    const txDate = tx.createdAt?.toDate
      ? tx.createdAt.toDate()
      : new Date(tx.createdAt);
    return isSameDay(txDate, chosenDate);
  });
  const totalChosenSales = chosenDayData.reduce(
    (sum, tx) => sum + (Number(tx.total) || 0),
    0
  );

  const rupiahFormatter = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);

  return (
    <section className="flex min-h-screen bg-gray-50 overflow-x-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex flex-9 flex-col">
        <nav className="flex items-center gap-3 bg-white shadow-md px-6 py-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-green-600 text-2xl flex md:hidden"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
          <h1 className="text-xl font-bold text-gray-800">
            Laporan Penjualan
          </h1>
        </nav>

        <div ref={laporanRef} className="p-4 sm:p-6 space-y-6">
          {/* 📈 Grafik */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-base sm:text-lg font-semibold mb-3">
              Grafik Penjualan 30 Hari Terakhir
            </h2>

            <div className="w-full h-[250px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={grafikData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="tgl" />
                  <YAxis
                    tickFormatter={(v) => (v >= 1000 ? v / 1000 + "k" : v)}
                    width={60}
                  />
                  <Tooltip
                    formatter={(v) => rupiahFormatter(v)}
                    labelFormatter={(l) => `Tanggal: ${l}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#4F46E5"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 📊 7 Hari Terakhir */}
          <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
            <h2 className="text-base sm:text-lg font-semibold mb-3">
              Penjualan 7 Hari Terakhir
            </h2>
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-gray-100 text-sm sm:text-base">
                  <th className="p-2">Tanggal</th>
                  <th className="p-2">Jumlah Transaksi</th>
                  <th className="p-2">Total Penjualan</th>
                </tr>
              </thead>
              <tbody>
                {last7Days.map((d) => (
                  <tr key={d.tanggal} className="text-sm sm:text-base">
                    <td className="p-2">{d.tanggal}</td>
                    <td className="p-2">{d.jumlah}</td>
                    <td className="p-2">{rupiahFormatter(d.total)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold text-sm sm:text-base">
                  <td colSpan="2" className="p-2 text-right">
                    Total 7 Hari:
                  </td>
                  <td className="p-2">{rupiahFormatter(total7Hari)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 📅 Tabel per tanggal */}
          <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
            <h2 className="text-base sm:text-lg font-semibold mb-3 flex flex-col sm:flex-row sm:items-center gap-2">
              Penjualan Tanggal
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border rounded px-2 py-1"
              />
            </h2>
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-100 text-sm sm:text-base">
                  <th className="p-2">Jam</th>
                  <th className="p-2">Total Harga</th>
                  <th className="p-2">Metode Pembayaran</th>
                  <th className="p-2">Jumlah Item</th>
                </tr>
              </thead>
              <tbody>
                {chosenDayData.length > 0 ? (
                  chosenDayData.map((tx) => {
                    const paymentLabels = ["Tunai", "QRIS", "Transfer", "Debit"];
                    const paymentMethod = isNaN(tx.paymentMethod)
                      ? tx.paymentMethod
                      : paymentLabels[tx.paymentMethod] || "Tidak Diketahui";
                    return (
                      <tr key={tx.id} className="text-sm sm:text-base">
                        <td className="p-2">
                          {format(
                            tx.createdAt?.toDate
                              ? tx.createdAt.toDate()
                              : new Date(tx.createdAt),
                            "HH:mm"
                          )}
                        </td>
                        <td className="p-2">
                          {rupiahFormatter(tx.total ?? 0)}
                        </td>
                        <td className="p-2">{paymentMethod}</td>
                        <td className="p-2">{tx.items?.length ?? 0}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="p-3 text-center text-gray-500">
                      Tidak ada transaksi pada tanggal ini.
                    </td>
                  </tr>
                )}
                <tr className="bg-gray-50 font-semibold text-sm sm:text-base">
                  <td colSpan="3" className="p-2 text-right">
                    Total Penjualan:
                  </td>
                  <td className="p-2">{rupiahFormatter(totalChosenSales)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </section>
  );
}
