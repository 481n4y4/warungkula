// src/pages/LaporanPenjualan.jsx
import React, { useEffect, useState, useRef } from "react";
import { format, isSameDay, parseISO, subDays } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Sidebar from "../components/Sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faCalendar,
  faChartLine,
  faReceipt,
  faShoppingCart,
  faFilePdf,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { getAllTransactions, auth } from "../firebase/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function LaporanPenjualan() {
  const [transaksi, setTransaksi] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("30days");
  const laporanRef = useRef();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // 🔹 Cek status autentikasi
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setAuthLoading(false);

      if (user) {
        await fetchData();
      } else {
        setLoading(false);
        setTransaksi([]);
        setFilteredData([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // 🔹 Ambil data transaksi dari firebase.js
  const fetchData = async () => {
    try {
      setLoading(true);

      const data = await getAllTransactions();

      if (Array.isArray(data) && data.length > 0) {
        // Filter dan validasi data
        const validData = data
          .filter((tx) => {
            const isValid =
              tx && (tx.total > 0 || tx.totalPrice > 0) && tx.createdAt;
            if (!isValid) {
              console.warn("Transaksi tidak valid:", tx);
            }
            return isValid;
          })
          .map((tx) => ({
            ...tx,
            // Normalisasi data
            total: Number(tx.total) || Number(tx.totalPrice) || 0,
            paymentMethod: tx.paymentMethod || "Tunai",
            items: tx.items || [],
          }));

        
        setTransaksi(validData);
        setFilteredData(validData);
      } else {
        console.warn("⚠️ Tidak ada data transaksi atau data bukan array");
        setTransaksi([]);
        setFilteredData([]);
      }
    } catch (err) {
      console.error("❌ Gagal mengambil data transaksi:", err);
      // Jika error karena auth, set data kosong
      if (err.message.includes("User belum login")) {
        setTransaksi([]);
        setFilteredData([]);
      } else {
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setTransaksi([]);
      setFilteredData([]);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // 🔹 Helper function untuk mendapatkan tanggal transaksi
  const getTransactionDate = (tx) => {
    if (!tx.createdAt) {
      console.warn("Transaksi tanpa createdAt:", tx);
      return new Date();
    }

    try {
      // Handle Firestore timestamp object
      if (tx.createdAt && typeof tx.createdAt.toDate === "function") {
        return tx.createdAt.toDate();
      }

      // Handle Firestore timestamp dengan seconds/nanoseconds
      if (tx.createdAt.seconds) {
        return new Date(tx.createdAt.seconds * 1000);
      }

      // Handle string date
      if (typeof tx.createdAt === "string") {
        return parseISO(tx.createdAt);
      }

      // Handle Date object
      if (tx.createdAt instanceof Date) {
        return tx.createdAt;
      }

      console.warn("Format createdAt tidak dikenali:", tx.createdAt);
      return new Date();
    } catch (error) {
      console.error("Error parsing date:", error, tx);
      return new Date();
    }
  };

  // 🔹 Helper function untuk mendapatkan total transaksi
  const getTransactionTotal = (tx) => {
    const total = Number(tx.total) || Number(tx.totalPrice) || 0;
    if (total === 0) {
      console.warn("Transaksi dengan total 0:", tx);
    }
    return total;
  };

  // 🔹 Jika sedang loading auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memeriksa autentikasi...</p>
        </div>
      </div>
    );
  }

  // 🔹 Jika belum login, tampilkan halaman login
  if (!user) {
    return <Login onLoginSuccess={fetchData} />;
  }

  const now = new Date();

  // 🔹 Data untuk grafik berdasarkan time range
  const getChartData = () => {
    let daysAgo;
    switch (timeRange) {
      case "7days":
        daysAgo = 7;
        break;
      case "14days":
        daysAgo = 14;
        break;
      case "30days":
      default:
        daysAgo = 30;
        break;
    }

    const startDate = subDays(now, daysAgo - 1);

    const chartData = filteredData.filter((tx) => {
      try {
        const txDate = getTransactionDate(tx);
        const isInRange = txDate >= startDate && txDate <= now;
        return isInRange;
      } catch (error) {
        console.error("Error filtering transaction:", error, tx);
        return false;
      }
    });


    // Group by date
    const groupedData = {};

    // Initialize all dates in range with 0
    for (let i = 0; i < daysAgo; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const label = format(date, "dd/MM");
      groupedData[label] = { tgl: label, total: 0, count: 0 };
    }

    // Add actual transaction data
    chartData.forEach((tx) => {
      try {
        const txDate = getTransactionDate(tx);
        const label = format(txDate, "dd/MM");
        const total = getTransactionTotal(tx);

        if (groupedData[label]) {
          groupedData[label].total += total;
          groupedData[label].count += 1;
        }
      } catch (error) {
        console.error("Error processing transaction for chart:", error, tx);
      }
    });

    const result = Object.values(groupedData);

    // Sort by date
    result.sort((a, b) => {
      const [da, ma] = a.tgl.split("/").map(Number);
      const [db, mb] = b.tgl.split("/").map(Number);
      return new Date(2024, ma - 1, da) - new Date(2024, mb - 1, db);
    });

    return result;
  };

  const chartData = getChartData();

  // 🔹 Data metode pembayaran
  const paymentMethodData = filteredData.reduce((acc, tx) => {
    try {
      const method = tx.paymentMethod || "Tunai";
      const total = getTransactionTotal(tx);

      if (!acc[method]) {
        acc[method] = { name: method, value: 0, count: 0, color: "" };
      }
      acc[method].value += total;
      acc[method].count += 1;

      // Assign colors
      const colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];
      const colorIndex = Object.keys(acc).length - 1;
      acc[method].color = colors[colorIndex % colors.length];

      return acc;
    } catch (error) {
      console.error("Error processing payment method:", error, tx);
      return acc;
    }
  }, {});

  const paymentMethods = Object.values(paymentMethodData);
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  // 🔹 7 Hari Terakhir untuk tabel
  const getLast7DaysData = () => {
    const last7Days = [];

    for (let i = 6; i >= 0; i--) {
      const date = subDays(now, i);
      const dayTx = filteredData.filter((tx) => {
        try {
          const txDate = getTransactionDate(tx);
          return isSameDay(txDate, date);
        } catch (error) {
          console.error("Error filtering daily transaction:", error, tx);
          return false;
        }
      });

      const totalHarian = dayTx.reduce(
        (sum, tx) => sum + getTransactionTotal(tx),
        0
      );

      last7Days.push({
        tanggal: format(date, "EEEE, dd/MM"),
        shortTanggal: format(date, "dd/MM"),
        total: totalHarian,
        jumlah: dayTx.length,
      });
    }

    return last7Days;
  };

  const last7Days = getLast7DaysData();
  const total7Hari = last7Days.reduce((acc, d) => acc + d.total, 0);

  // 🔹 Data untuk tanggal yang dipilih
  const getChosenDateData = () => {
    const chosenDate = new Date(selectedDate);
    const chosenDayData = filteredData.filter((tx) => {
      try {
        const txDate = getTransactionDate(tx);
        return isSameDay(txDate, chosenDate);
      } catch (error) {
        console.error("Error filtering chosen date transaction:", error, tx);
        return false;
      }
    });

    return chosenDayData;
  };

  const chosenDayData = getChosenDateData();
  const totalChosenSales = chosenDayData.reduce(
    (sum, tx) => sum + getTransactionTotal(tx),
    0
  );

  const rupiahFormatter = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value || 0);

  // Custom Tooltip untuk grafik
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg max-w-[200px]">
          <p className="font-semibold text-sm mb-1">{`Tanggal: ${label}`}</p>
          <p className="text-blue-600 text-sm">{`Total: ${rupiahFormatter(
            payload[0].value
          )}`}</p>
          <p className="text-gray-600 text-xs">{`Transaksi: ${
            payload[0].payload.count || 0
          }`}</p>
        </div>
      );
    }
    return null;
  };

  // 🔹 Fungsi untuk validasi sebelum ekspor
  const validateDataBeforeExport = () => {
    const totalPenjualan = transaksi.reduce(
      (sum, tx) => sum + getTransactionTotal(tx),
      0
    );

    if (transaksi.length === 0) {
      return {
        isValid: false,
        message: "Tidak ada data transaksi untuk diekspor",
      };
    }

    if (totalPenjualan === 0) {
      return {
        isValid: false,
        message:
          "Total penjualan adalah 0, tidak ada data yang berarti untuk diekspor",
      };
    }

    return { isValid: true, message: "Data valid" };
  };

  // handleExportPDF
  const handleExportPDF = () => {

    // Validasi setiap item transaksi
    transaksi.forEach((tx, index) => {
      console.log(`Transaksi ${index}:`, {
        id: tx.id,
        total: getTransactionTotal(tx),
        paymentMethod: tx.paymentMethod,
        items: tx.items,
      });
    });

    const validation = validateDataBeforeExport();
    if (!validation.isValid) {
      alert(validation.message);
      return;
    }

    exportToPDF();
  };

  // 🔹 Fungsi untuk ekspor PDF - DIPERBAIKI dengan validasi data
const exportToPDF = () => {
  try {

    const doc = new jsPDF("p", "mm", "a4");
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    const lineHeight = 6;
    const sectionSpacing = 12;

    // ===== HEADER =====
    doc.setFillColor(34, 197, 94); // Green
    doc.rect(0, 0, pageWidth, 30, "F");

    // Judul utama
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("LAPORAN PENJUALAN", pageWidth / 2, 15, { align: "center" });

    // Subtitle
    doc.setFontSize(11);
    doc.setTextColor(240, 253, 244);
    doc.text(
      `Dibuat: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
      pageWidth / 2,
      22,
      { align: "center" }
    );
    doc.text(`Oleh: ${user?.email || "User"}`, pageWidth / 2, 27, {
      align: "center",
    });

    yPosition = 40;

    // ===== STATISTIK UTAMA =====
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 197, 94); // Green
    doc.text("STATISTIK UTAMA", margin, yPosition);
    yPosition += 8;

    // Garis bawah judul
    doc.setDrawColor(34, 197, 94);
    doc.line(margin, yPosition, margin + 60, yPosition);
    yPosition += 10;

    const totalPenjualan = transaksi.reduce(
      (sum, tx) => sum + getTransactionTotal(tx),
      0
    );
    const rataTransaksi =
      transaksi.length > 0 ? totalPenjualan / transaksi.length : 0;

    const stats = [
      {
        label: "Total Penjualan",
        value: rupiahFormatter(totalPenjualan),
      },
      { label: "Total Transaksi", value: `${transaksi.length} transaksi` },
      {
        label: "Rata-rata per Transaksi",
        value: rupiahFormatter(rataTransaksi),
      },
      {
        label: "7 Hari Terakhir",
        value: rupiahFormatter(total7Hari),
      },
      {
        label: "Hari Ini",
        value: rupiahFormatter(totalChosenSales),
      },
    ];

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    stats.forEach((stat, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 30;
      }

      // Background alternatif untuk baris
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, yPosition - 4, contentWidth, 8, "F");
      }
      
      doc.text(stat.label, margin + 5, yPosition);
      doc.text(stat.value, pageWidth - margin - 5, yPosition, {
        align: "right",
      });

      yPosition += lineHeight + 2;
    });

    yPosition += sectionSpacing;

    // ===== 7 HARI TERAKHIR =====
    const validLast7Days = last7Days.filter((day) => day && day.total > 0);

    if (validLast7Days.length > 0) {
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 30;
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(59, 130, 246); // Blue
      doc.text("7 HARI TERAKHIR", margin, yPosition);
      yPosition += 8;

      // Garis bawah judul
      doc.setDrawColor(59, 130, 246);
      doc.line(margin, yPosition, margin + 70, yPosition);
      yPosition += 12;

      // Header Tabel
      doc.setFillColor(59, 130, 246);
      doc.rect(margin, yPosition, contentWidth, 10, "F");

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      
      // Kolom TANGGAL - lebih lebar
      doc.text("TANGGAL", margin + 10, yPosition + 7);
      // Kolom TRANSAKSI - di tengah
      doc.text("TRANSAKSI", margin + contentWidth * 0.7, yPosition + 7, {
        align: "center",
      });
      // Kolom TOTAL - di kanan
      doc.text("TOTAL", pageWidth - margin - 5, yPosition + 7, {
        align: "right",
      });

      yPosition += 12;

      // Data Rows
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);

      validLast7Days.forEach((day, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 30;
          // Header ulang di halaman baru
          doc.setFillColor(59, 130, 246);
          doc.rect(margin, yPosition, contentWidth, 10, "F");
          doc.setFont("helvetica", "bold");
          doc.setTextColor(255, 255, 255);
          doc.text("TANGGAL", margin + 10, yPosition + 7);
          doc.text("TRANSAKSI", margin + contentWidth * 0.7, yPosition + 7, {
            align: "center",
          });
          doc.text("TOTAL", pageWidth - margin - 5, yPosition + 7, {
            align: "right",
          });
          yPosition += 12;
          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 0);
        }

        // Background alternatif
        if (index % 2 === 0) {
          doc.setFillColor(249, 250, 251);
          doc.rect(margin, yPosition - 3, contentWidth, 8, "F");
        }

        doc.text(day.tanggal, margin + 10, yPosition + 2);
        doc.text(
          day.jumlah.toString(),
          margin + contentWidth * 0.7,
          yPosition + 2,
          { align: "center" }
        );
        doc.text(
          rupiahFormatter(day.total),
          pageWidth - margin - 5,
          yPosition + 2,
          { align: "right" }
        );

        yPosition += 8;
      });

      // Total Row
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 30;
      }

      yPosition += 5;
      const totalJumlah = validLast7Days.reduce(
        (sum, day) => sum + day.jumlah,
        0
      );
      const totalHari = validLast7Days.reduce(
        (sum, day) => sum + day.total,
        0
      );

      doc.setFillColor(219, 234, 254);
      doc.rect(margin, yPosition, contentWidth, 10, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 64, 175);

      doc.text("TOTAL", margin + 10, yPosition + 7);
      doc.text(
        totalJumlah.toString(),
        margin + contentWidth * 0.7,
        yPosition + 7,
        { align: "center" }
      );
      doc.text(
        rupiahFormatter(totalHari),
        pageWidth - margin - 5,
        yPosition + 7,
        { align: "right" }
      );

      yPosition += 15;
    }

    // ===== METODE PEMBAYARAN =====
    const validPaymentMethods = paymentMethods.filter(
      (method) => method && method.value > 0
    );

    if (validPaymentMethods.length > 0) {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 30;
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(139, 92, 246); // Purple
      doc.text("METODE PEMBAYARAN", margin, yPosition);
      yPosition += 8;

      // Garis bawah judul
      doc.setDrawColor(139, 92, 246);
      doc.line(margin, yPosition, margin + 100, yPosition);
      yPosition += 12;

      // Header Tabel
      doc.setFillColor(139, 92, 246);
      doc.rect(margin, yPosition, contentWidth, 10, "F");

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      
      // Kolom METODE PEMBAYARAN - lebih lebar
      doc.text("METODE PEMBAYARAN", margin + 10, yPosition + 7);
      // Kolom TOTAL - di tengah-kanan
      doc.text("TOTAL", margin + contentWidth * 0.6, yPosition + 7, {
        align: "right",
      });
      // Kolom TRANSAKSI - di kanan
      doc.text("TRANSAKSI", pageWidth - margin - 5, yPosition + 7, {
        align: "right",
      });

      yPosition += 12;

      // Data Rows
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);

      validPaymentMethods.forEach((method, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 30;
          // Header ulang di halaman baru
          doc.setFillColor(139, 92, 246);
          doc.rect(margin, yPosition, contentWidth, 10, "F");
          doc.setFont("helvetica", "bold");
          doc.setTextColor(255, 255, 255);
          doc.text("METODE PEMBAYARAN", margin + 10, yPosition + 7);
          doc.text("TOTAL", margin + contentWidth * 0.6, yPosition + 7, {
            align: "right",
          });
          doc.text("TRANSAKSI", pageWidth - margin - 5, yPosition + 7, {
            align: "right",
          });
          yPosition += 12;
          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 0);
        }

        // Background alternatif
        if (index % 2 === 0) {
          doc.setFillColor(245, 243, 255);
          doc.rect(margin, yPosition - 3, contentWidth, 8, "F");
        }

        doc.text(method.name, margin + 10, yPosition + 2);
        doc.text(
          rupiahFormatter(method.value),
          margin + contentWidth * 0.6,
          yPosition + 2,
          { align: "right" }
        );
        doc.text(
          `${method.count} transaksi`,
          pageWidth - margin - 5,
          yPosition + 2,
          { align: "right" }
        );

        yPosition += 8;
      });

      yPosition += 10;
    }

    // ===== FOOTER =====
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Garis footer
      doc.setDrawColor(226, 232, 240);
      doc.line(
        margin,
        doc.internal.pageSize.getHeight() - 15,
        pageWidth - margin,
        doc.internal.pageSize.getHeight() - 15
      );

      // Text footer
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Halaman ${i} dari ${pageCount} • Warung Kula • ${format(
          new Date(),
          "dd/MM/yyyy HH:mm"
        )}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    // ===== SIMPAN PDF =====
    const fileName = `Laporan_Penjualan_${format(
      new Date(),
      "dd-MM-yyyy_HH-mm"
    )}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error("❌ Gagal mengekspor PDF:", error);
    console.error("Error details:", error.message);
    alert("Gagal mengekspor PDF. Silakan coba lagi.");
  }
};

  const DebugInfo = () => (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h3 className="font-semibold text-yellow-800 mb-2">Debug Info:</h3>
      <p className="text-sm text-yellow-700">
        Total Transaksi: {transaksi.length}
      </p>
      <p className="text-sm text-yellow-700">
        Filtered Data: {filteredData.length}
      </p>
      <p className="text-sm text-yellow-700">
        Chart Data Points: {chartData.length}
      </p>
      <p className="text-sm text-yellow-700">
        Total 7 Hari: {rupiahFormatter(total7Hari)}
      </p>
      <p className="text-sm text-yellow-700">
        Hari Ini: {rupiahFormatter(totalChosenSales)}
      </p>
    </div>
  );

  if (loading) {
    return (
      <section className="flex min-h-screen bg-gray-50">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data transaksi...</p>
          </div>
        </main>
      </section>
    );
  }

  return (
    <section className="flex h-screen bg-gray-50 overflow-hidden">
      <div
        className={`
              fixed lg:static
              inset-y-0 left-0
              md:w-[96px]
              w-64
              h-screen
              transform transition-transform duration-300 ease-in-out
              z-40
              ${
                isSidebarOpen
                  ? "translate-x-0"
                  : "-translate-x-full lg:translate-x-0"
              }
              overflow-y-auto
            `}
      >
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          user={user}
          onLogout={handleLogout}
        />
      </div>

      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
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
              Laporan Penjualan
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* User Info */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <FontAwesomeIcon
                  icon={faUser}
                  className="text-green-600 text-sm"
                />
              </div>
              <span>{user?.email}</span>
            </div>
            {/* Tombol Export PDF */}
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FontAwesomeIcon icon={faFilePdf} />
              <span className="hidden sm:inline">Export PDF Lengkap</span>
            </button>
          </div>
        </nav>

        {/* Navigation Tabs */}
        <div className="bg-white border-b top-0 z-10">
          <div className="flex overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2 px-4 py-3 whitespace-nowrap border-b-2 transition-colors ${
                activeTab === "overview"
                  ? "border-green-600 text-green-600 bg-green-50"
                  : "border-transparent text-gray-600 hover:text-green-600"
              }`}
            >
              <FontAwesomeIcon icon={faChartLine} className="text-sm" />
              <span className="text-sm font-medium">Overview</span>
            </button>

            <button
              onClick={() => setActiveTab("transactions")}
              className={`flex items-center gap-2 px-4 py-3 whitespace-nowrap border-b-2 transition-colors ${
                activeTab === "transactions"
                  ? "border-green-600 text-green-600 bg-green-50"
                  : "border-transparent text-gray-600 hover:text-green-600"
              }`}
            >
              <FontAwesomeIcon icon={faReceipt} className="text-sm" />
              <span className="text-sm font-medium">Transaksi</span>
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-2 px-4 py-3 whitespace-nowrap border-b-2 transition-colors ${
                activeTab === "analytics"
                  ? "border-green-600 text-green-600 bg-green-50"
                  : "border-transparent text-gray-600 hover:text-green-600"
              }`}
            >
              <FontAwesomeIcon icon={faShoppingCart} className="text-sm" />
              <span className="text-sm font-medium">Analisis</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div
          ref={laporanRef}
          className="flex-1 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 overflow-auto"
        >
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-4 sm:space-y-6">
              {/* Statistik Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Penjualan</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-800 mt-1">
                        {rupiahFormatter(
                          transaksi.reduce(
                            (sum, tx) => sum + getTransactionTotal(tx),
                            0
                          )
                        )}
                      </p>
                    </div>
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FontAwesomeIcon
                        icon={faChartLine}
                        className="text-green-600 text-sm"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {transaksi.length} transaksi
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        Rata-rata/Transaksi
                      </p>
                      <p className="text-lg sm:text-xl font-bold text-gray-800 mt-1">
                        {transaksi.length > 0
                          ? rupiahFormatter(
                              transaksi.reduce(
                                (sum, tx) => sum + getTransactionTotal(tx),
                                0
                              ) / transaksi.length
                            )
                          : rupiahFormatter(0)}
                      </p>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FontAwesomeIcon
                        icon={faReceipt}
                        className="text-blue-600 text-sm"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Harian</p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Hari Ini</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-800 mt-1">
                        {rupiahFormatter(totalChosenSales)}
                      </p>
                    </div>
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FontAwesomeIcon
                        icon={faCalendar}
                        className="text-purple-600 text-sm"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {chosenDayData.length} transaksi
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">7 Hari Terakhir</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-800 mt-1">
                        {rupiahFormatter(total7Hari)}
                      </p>
                    </div>
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <FontAwesomeIcon
                        icon={faShoppingCart}
                        className="text-orange-600 text-sm"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {last7Days.reduce((sum, day) => sum + day.jumlah, 0)}{" "}
                    transaksi
                  </p>
                </div>
              </div>

              {/* Grafik Utama */}
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Grafik Penjualan
                  </h2>
                  <div className="flex gap-2">
                    <select
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value)}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="7days">7 Hari</option>
                      <option value="14days">14 Hari</option>
                      <option value="30days">30 Hari</option>
                    </select>
                  </div>
                </div>

                {chartData.length > 0 &&
                chartData.some((item) => item.total > 0) ? (
                  <div className="h-[300px] sm:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="tgl"
                          interval="preserveStartEnd"
                          tick={{ fontSize: 11 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis
                          tickFormatter={(v) =>
                            v >= 1000000
                              ? `Rp${(v / 1000000).toFixed(0)}Jt`
                              : v >= 1000
                              ? `Rp${(v / 1000).toFixed(0)}Rb`
                              : `Rp${v}`
                          }
                          width={60}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="#10B981"
                          strokeWidth={3}
                          dot={{ fill: "#10B981", strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5, fill: "#10B981" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-3">📊</div>
                      <p>Tidak ada data penjualan untuk periode ini</p>
                      <p className="text-sm mt-1">
                        Data akan muncul setelah ada transaksi
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Tabel 7 Hari Terakhir */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-800">
                    7 Hari Terakhir
                  </h2>
                </div>

                {/* Mobile View - Cards */}
                <div className="p-4 sm:p-6 lg:hidden space-y-3">
                  {last7Days.map((day, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-gray-800 text-sm">
                          {day.shortTanggal}
                        </span>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          {day.jumlah} transaksi
                        </span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {rupiahFormatter(day.total)}
                      </p>
                    </div>
                  ))}
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-green-800">
                        Total 7 Hari
                      </span>
                      <span className="text-lg font-bold text-green-800">
                        {rupiahFormatter(total7Hari)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Desktop View - Table */}
                <div className="hidden lg:block p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="p-3 text-left font-semibold text-gray-700">
                            Tanggal
                          </th>
                          <th className="p-3 text-center font-semibold text-gray-700">
                            Jumlah Transaksi
                          </th>
                          <th className="p-3 text-right font-semibold text-gray-700">
                            Total Penjualan
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {last7Days.map((day, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="p-3">{day.tanggal}</td>
                            <td className="p-3 text-center">{day.jumlah}</td>
                            <td className="p-3 text-right font-medium">
                              {rupiahFormatter(day.total)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-green-50 font-semibold">
                          <td colSpan="2" className="p-3 text-right">
                            Total 7 Hari:
                          </td>
                          <td className="p-3 text-right text-green-700">
                            {rupiahFormatter(total7Hari)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === "transactions" && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-gray-800">
                      Detail Transaksi
                    </h2>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 w-full sm:w-auto"
                    />
                  </div>
                </div>

                {chosenDayData.length > 0 ? (
                  <>
                    {/* Mobile View - Cards */}
                    <div className="p-4 sm:p-6 lg:hidden space-y-3">
                      {chosenDayData.map((tx) => {
                        const txDate = getTransactionDate(tx);
                        const totalItems = tx.items
                          ? tx.items.reduce(
                              (sum, item) => sum + (item.qty || 0),
                              0
                            )
                          : 0;

                        return (
                          <div
                            key={tx.id}
                            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-medium text-gray-800 text-sm">
                                  {format(txDate, "HH:mm")}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  ID: {tx.id?.substring(0, 8) || "N/A"}...
                                </p>
                              </div>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  tx.paymentMethod === "Tunai"
                                    ? "bg-blue-100 text-blue-800"
                                    : tx.paymentMethod === "QRIS"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {tx.paymentMethod || "Tunai"}
                              </span>
                            </div>

                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-lg font-bold text-gray-900">
                                  {rupiahFormatter(getTransactionTotal(tx))}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {totalItems} item
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop View - Table */}
                    <div className="hidden lg:block p-6">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="p-3 text-left font-semibold text-gray-700">
                                Waktu
                              </th>
                              <th className="p-3 text-left font-semibold text-gray-700">
                                ID Transaksi
                              </th>
                              <th className="p-3 text-right font-semibold text-gray-700">
                                Total
                              </th>
                              <th className="p-3 text-center font-semibold text-gray-700">
                                Metode Bayar
                              </th>
                              <th className="p-3 text-center font-semibold text-gray-700">
                                Jumlah Item
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {chosenDayData.map((tx) => {
                              const txDate = getTransactionDate(tx);
                              const totalItems = tx.items
                                ? tx.items.reduce(
                                    (sum, item) => sum + (item.qty || 0),
                                    0
                                  )
                                : 0;

                              return (
                                <tr
                                  key={tx.id}
                                  className="border-b border-gray-100 hover:bg-gray-50"
                                >
                                  <td className="p-3">
                                    {format(txDate, "HH:mm:ss")}
                                  </td>
                                  <td className="p-3 font-mono text-xs">
                                    {tx.id?.substring(0, 8) || "N/A"}...
                                  </td>
                                  <td className="p-3 text-right font-medium">
                                    {rupiahFormatter(getTransactionTotal(tx))}
                                  </td>
                                  <td className="p-3 text-center">
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs ${
                                        tx.paymentMethod === "Tunai"
                                          ? "bg-blue-100 text-blue-800"
                                          : tx.paymentMethod === "QRIS"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-purple-100 text-purple-800"
                                      }`}
                                    >
                                      {tx.paymentMethod || "Tunai"}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center">
                                    {totalItems}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="p-4 sm:p-6 border-t border-gray-100 bg-green-50">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-green-800">
                          Total Penjualan{" "}
                          {format(new Date(selectedDate), "dd/MM/yyyy")}
                        </span>
                        <span className="text-lg font-bold text-green-800">
                          {rupiahFormatter(totalChosenSales)}
                        </span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        {chosenDayData.length} transaksi
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center">
                    <div className="text-gray-400 text-4xl mb-3">📊</div>
                    <p className="text-gray-500">
                      Tidak ada transaksi pada tanggal ini
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Pilih tanggal lain atau pastikan sudah ada transaksi
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="space-y-4 sm:space-y-6">
              {/* Metode Pembayaran */}
              {paymentMethods.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Metode Pembayaran
                    </h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentMethods}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {paymentMethods.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => rupiahFormatter(value)}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Distribusi Pembayaran
                    </h3>
                    <div className="space-y-3">
                      {paymentMethods.map((method, index) => (
                        <div
                          key={method.name}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            ></div>
                            <span className="font-medium text-gray-700">
                              {method.name}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-800">
                              {rupiahFormatter(method.value)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {method.count} transaksi
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
                  <div className="text-gray-400 text-4xl mb-3">💳</div>
                  <p className="text-gray-500">
                    Belum ada data metode pembayaran
                  </p>
                </div>
              )}

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Transaksi Tertinggi
                  </h4>
                  {transaksi.length > 0 ? (
                    <p className="text-2xl font-bold text-green-600">
                      {rupiahFormatter(
                        Math.max(
                          ...transaksi.map((tx) => getTransactionTotal(tx))
                        )
                      )}
                    </p>
                  ) : (
                    <p className="text-gray-500">-</p>
                  )}
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Transaksi Terendah
                  </h4>
                  {transaksi.length > 0 ? (
                    <p className="text-2xl font-bold text-blue-600">
                      {rupiahFormatter(
                        Math.min(
                          ...transaksi.map((tx) => getTransactionTotal(tx))
                        )
                      )}
                    </p>
                  ) : (
                    <p className="text-gray-500">-</p>
                  )}
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Hari Terbaik
                  </h4>
                  {last7Days.length > 0 &&
                  Math.max(...last7Days.map((day) => day.total)) > 0 ? (
                    <div>
                      <p className="text-lg font-bold text-purple-600">
                        {rupiahFormatter(
                          Math.max(...last7Days.map((day) => day.total))
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {
                          last7Days.find(
                            (day) =>
                              day.total ===
                              Math.max(...last7Days.map((d) => d.total))
                          )?.shortTanggal
                        }
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500">-</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </section>
  );
}
