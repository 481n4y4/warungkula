// src/components/Receipt.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getTransactionById } from "../firebase/firebase";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

export default function Receipt() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!state?.id) {
        navigate("/kasir");
        return;
      }
      
      try {
        setLoading(true);
        const transactionData = await getTransactionById(state.id);
        setData(transactionData);
      } catch (error) {
        console.error("Error fetching receipt:", error);
        alert("Gagal memuat data struk");
        navigate("/kasir");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [state, navigate]);

  const handleDownload = () => {
    const element = document.getElementById("receipt");
    html2canvas(element, { 
      scale: 2,
      useCORS: true,
      logging: false 
    }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 190;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`struk-${state.id}.pdf`);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600 text-sm">
        Memuat struk...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600 text-sm">
        Struk tidak ditemukan
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <nav className="bg-white shadow-sm p-4 flex items-center top-0 z-50 sticky">
        <button
          onClick={() => navigate("/kasir")}
          className="text-gray-600 hover:text-gray-900 transition"
        >
          <FontAwesomeIcon icon={faArrowLeft} size="lg" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-800">
          Struk Transaksi
        </h1>
      </nav>

      {/* Body */}
      <div className="flex justify-center py-6 px-4">
        <div
          id="receipt"
          className="w-full max-w-md bg-white rounded-2xl shadow-md p-6 text-sm"
        >
          <h2 className="text-center font-bold text-xl text-green-700 mb-1">
            WarungKula
          </h2>
          <p className="text-center text-gray-500 text-xs mb-4">
            {data.createdAt && data.createdAt.toDate 
              ? new Date(data.createdAt.toDate()).toLocaleString("id-ID")
              : new Date().toLocaleString("id-ID")}
          </p>

          <div className="border-t border-b border-gray-200 py-2 mb-4">
            {data.items?.map((item, i) => (
              <div key={i} className="flex justify-between py-0.5">
                <span className="text-gray-700">
                  {item.name} ({item.unit}) × {item.qty}
                </span>
                <span className="text-gray-800 font-medium">
                  Rp {item.subtotal.toLocaleString("id-ID")}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-1 text-gray-700">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Rp {data.subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900">
              <span>Total</span>
              <span>Rp {data.total.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between">
              <span>Bayar ({data.paymentMethod})</span>
              <span>Rp {data.payment.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between">
              <span>Kembalian</span>
              <span>Rp {data.change.toLocaleString("id-ID")}</span>
            </div>
            {data.note && (
              <p className="text-xs text-gray-500 mt-2 italic">
                Catatan: {data.note}
              </p>
            )}
          </div>

          <div className="mt-6 space-y-2">
            <button
              onClick={handleDownload}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
            >
              Download Struk (PDF)
            </button>
            <button
              onClick={() => navigate("/kasir")}
              className="w-full text-white py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition"
            >
              Kembali ke Kasir
            </button>
            <button
              onClick={() => window.print()}
              className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-100 transition"
            >
              Cetak Struk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}