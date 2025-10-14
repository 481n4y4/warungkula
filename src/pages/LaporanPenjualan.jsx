// src/pages/LaporanPenjualan.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/firebase";
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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

export default function LaporanPenjualan() {
  const [transaksi, setTransaksi] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
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

  const now = new Date();

  // 🔹 Grafik Penjualan 30 Hari Terakhir
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

  // 🔹 Tabel 7 Hari Terakhir (per hari)
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

  // 🔹 Data Hari Ini
  const today = new Date();
  const todayData = filteredData.filter((tx) => {
    const txDate = tx.createdAt?.toDate
      ? tx.createdAt.toDate()
      : new Date(tx.createdAt);
    return isSameDay(txDate, today);
  });
  const totalTodaySales = todayData.reduce(
    (sum, tx) => sum + (Number(tx.total) || 0),
    0
  );

  // 🔹 Formatter Rupiah
  const rupiahFormatter = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);

  return (
    <section>
      {/* Header */}
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
        {/* 📈 Grafik Penjualan 30 Hari Terakhir */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-3">
            Grafik Penjualan 30 Hari Terakhir
          </h2>
          {grafikData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={grafikData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="tgl" />
                <YAxis
                  tickFormatter={(value) =>
                    value >= 1000 ? value / 1000 + "k" : value
                  }
                  width={70}
                />
                <Tooltip
                  formatter={(value) => rupiahFormatter(value)}
                  labelFormatter={(label) => `Tanggal: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#4F46E5"
                  strokeWidth={3}
                  dot={{
                    r: 5,
                    stroke: "#4F46E5",
                    strokeWidth: 2,
                    fill: "#fff",
                  }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-10">
              Tidak ada data penjualan dalam 30 hari terakhir.
            </p>
          )}
        </div>

        {/* 📊 Tabel Penjualan 7 Hari Terakhir */}
        <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto mb-6">
          <h2 className="text-lg font-semibold mb-3">
            Penjualan 7 Hari Terakhir
          </h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">Tanggal</th>
                <th className="p-2">Jumlah Transaksi</th>
                <th className="p-2">Total Penjualan</th>
              </tr>
            </thead>
            <tbody>
              {last7Days.map((d) => (
                <tr key={d.tanggal}>
                  <td className="p-2">{d.tanggal}</td>
                  <td className="p-2">{d.jumlah}</td>
                  <td className="p-2">{rupiahFormatter(d.total)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td colSpan="2" className="p-2 text-right">
                  Total 7 Hari:
                </td>
                <td className="p-2">{rupiahFormatter(total7Hari)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 📅 Tabel Penjualan Hari Ini */}
        <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
          <h2 className="text-lg font-semibold mb-3">
            Penjualan Hari Ini ({format(today, "dd/MM/yyyy")})
          </h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">Jam</th>
                <th className="p-2">Total Harga</th>
                <th className="p-2">Metode Pembayaran</th>
                <th className="p-2">Jumlah Item</th>
              </tr>
            </thead>
            <tbody>
              {todayData.length > 0 ? (
                todayData.map((tx) => {
                  const paymentLabels = ["Tunai", "QRIS", "Transfer", "Debit"];
                  const paymentMethod = isNaN(tx.paymentMethod)
                    ? tx.paymentMethod
                    : paymentLabels[tx.paymentMethod] || "Tidak Diketahui";
                  return (
                    <tr key={tx.id}>
                      <td className="p-2">
                        {format(
                          tx.createdAt?.toDate
                            ? tx.createdAt.toDate()
                            : new Date(tx.createdAt),
                          "HH:mm"
                        )}
                      </td>
                      <td className="p-2">
                        Rp {(tx.total ?? 0).toLocaleString()}
                      </td>
                      <td className="p-2">{paymentMethod}</td>
                      <td className="p-2">{tx.items?.length ?? 0}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" className="p-3 text-center text-gray-500">
                    Belum ada transaksi hari ini.
                  </td>
                </tr>
              )}
              <tr className="bg-gray-50 font-semibold">
                <td colSpan="3" className="p-2 text-right">
                  Total Penjualan Hari Ini:
                </td>
                <td className="p-2">{rupiahFormatter(totalTodaySales)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
