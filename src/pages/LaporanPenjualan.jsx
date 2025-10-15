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

export default function LaporanPenjualan() {
  const [transaksi, setTransaksi] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const laporanRef = useRef();
  const navigate = useNavigate();

  // 🔹 Ambil data transaksi
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

  const exportPDF = async () => {
    const element = laporanRef.current;
    if (!element) return;

    // 🔍 Cari SVG Recharts
    const svg = element.querySelector("svg");
    let svgImg = null;

    if (svg) {
      // Ambil ukuran SVG
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const svgUrl = URL.createObjectURL(svgBlob);

      // Buat image dari SVG
      svgImg = document.createElement("img");
      svgImg.src = svgUrl;
      svgImg.style.width = svg.getBoundingClientRect().width + "px";
      svgImg.style.height = svg.getBoundingClientRect().height + "px";
      svgImg.style.display = "block";
      svgImg.style.margin = "0 auto";
    }

    // 🔹 Clone tampilan laporan agar tetap mode desktop
    const clone = element.cloneNode(true);
    clone.style.width = "1024px";
    clone.style.background = "white";
    clone.style.padding = "24px";
    clone.style.color = "black";
    clone.style.position = "fixed";
    clone.style.top = "0";
    clone.style.left = "0";
    clone.style.zIndex = "9999";
    clone.style.visibility = "visible";
    clone.style.opacity = "1";
    clone.style.transform = "none";

    // 🔄 Ganti SVG asli di clone dengan versi gambar
    const svgInClone = clone.querySelector("svg");
    if (svgInClone && svgImg) {
      svgInClone.replaceWith(svgImg);
    }

    document.body.appendChild(clone);

    try {
      // 🔧 Tunggu render <img> selesai
      await new Promise((res) => setTimeout(res, 800));

      // 🔧 Perbaiki warna OKLCH (kadang error)
      clone.querySelectorAll("*").forEach((el) => {
        const style = window.getComputedStyle(el);
        if (style.color.includes("oklch")) el.style.color = "#000000";
        if (style.backgroundColor.includes("oklch"))
          el.style.backgroundColor = "#ffffff";
      });

      // 📸 Render clone jadi canvas
      const canvas = await html2canvas(clone, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        foreignObjectRendering: true,
        windowWidth: 1280,
        windowHeight: 800,
      });

      // 💾 Masukkan ke PDF
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(
        `laporan-penjualan-${new Date().toLocaleDateString("id-ID")}.pdf`
      );
    } catch (err) {
      console.error("Gagal ekspor PDF:", err);
    } finally {
      document.body.removeChild(clone);
    }
  };

  return (
    <section className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* 🧭 Sticky Navbar */}
      <div className="bg-white shadow-sm p-4 flex items-center sticky top-0 z-50">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-gray-600 hover:text-gray-900 transition"
        >
          <FontAwesomeIcon icon={faArrowLeft} size="lg" />
        </button>
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-gray-800">
          Laporan Penjualan
        </h1>
      </div>

      {/* 📄 Konten */}
      <div ref={laporanRef} className="p-4 sm:p-6 space-y-6">
        {/* 📈 Grafik */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
            <h2 className="text-base sm:text-lg font-semibold">
              Grafik Penjualan 30 Hari Terakhir
            </h2>
            <button
              onClick={exportPDF}
              style={{
                backgroundColor: "#ef4444", // ini warna rgb dari bg-red-500
                color: "white",
              }}
              className="px-3 py-2 rounded-md hover:opacity-90 flex items-center justify-center text-center gap-2 text-sm sm:text-base"
            >
              <FontAwesomeIcon icon={faFilePdf} />
              Ekspor PDF
            </button>
          </div>

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
    </section>
  );
}
