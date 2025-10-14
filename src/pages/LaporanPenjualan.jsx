import React, { useEffect, useState, useRef } from "react";
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
import { faArrowLeft, faFilePdf } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
const laporanRef = useRef();

export default function LaporanPenjualan() {
  const [transaksi, setTransaksi] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const laporanRef = useRef();
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

  // 🔹 Tambah tanggal kosong
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

  // 🔹 Tabel 7 Hari Terakhir
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

  // 🔹 Data Berdasarkan Tanggal Pilihan
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

  const exportPDF = async () => {
    const element = laporanRef.current;
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: "#ffffff", // hindari error warna okLCH
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`laporan-penjualan-${new Date().toLocaleDateString("id-ID")}.pdf`);
  };

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

      {/* Semua konten laporan dibungkus ref ini */}
      <div className="p-6 space-y-6 bg-gray-50" ref={laporanRef}>
        {/* 📈 Grafik */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold mb-3">
              Grafik Penjualan 30 Hari Terakhir
            </h2>
            <button
              onClick={exportPDF}
              className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faFilePdf} />
              Ekspor PDF
            </button>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={grafikData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="tgl" />
              <YAxis
                tickFormatter={(v) => (v >= 1000 ? v / 1000 + "k" : v)}
                width={70}
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

        {/* 📊 Tabel 7 Hari Terakhir */}
        <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
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

        {/* 📅 Pilih Tanggal */}
        <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
          <h2 className="text-lg font-semibold mb-3">
            Penjualan Tanggal{" "}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border rounded px-2 py-1 ml-2"
            />
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
              {chosenDayData.length > 0 ? (
                chosenDayData.map((tx) => {
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
                      <td className="p-2">{rupiahFormatter(tx.total ?? 0)}</td>
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
              <tr className="bg-gray-50 font-semibold">
                <td colSpan="3" className="p-2 text-right">
                  Total Penjualan:
                </td>
                <td className="p-2">{rupiahFormatter(totalChosenSales)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
