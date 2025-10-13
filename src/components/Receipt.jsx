import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function Receipt() {
  const { state } = useLocation();
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!state?.id) return;
      const snap = await getDoc(doc(db, "transaksi", state.id));
      if (snap.exists()) setData(snap.data());
    };
    fetchData();
  }, [state]);

  const handleDownload = () => {
    const element = document.getElementById("receipt");
    html2canvas(element, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save(`struk-${state.id}.pdf`);
    });
  };

  if (!data) return <p className="text-center p-6">Memuat struk...</p>;

  return (
    <div
      id="receipt"
      className="p-6 max-w-sm mx-auto border rounded shadow bg-white text-sm"
    >
      <h2 className="text-center font-bold text-lg mb-1">🧾 WarungKula</h2>
      <p className="text-center text-gray-600 text-xs mb-4">
        Tanggal:{" "}
        {data.createdAt
          ? new Date(data.createdAt.toDate()).toLocaleString("id-ID")
          : "-"}
      </p>

      <div className="border-t border-b py-2 mb-3">
        {data.items?.map((item, i) => (
          <div key={i} className="flex justify-between">
            <span>
              {item.name} ({item.unit}) × {item.qty}
            </span>
            <span>Rp {item.subtotal.toLocaleString("id-ID")}</span>
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>Rp {data.subtotal.toLocaleString("id-ID")}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>Rp {data.total.toLocaleString("id-ID")}</span>
        </div>
        <div className="flex justify-between">
          <span>Tunai</span>
          <span>Rp {data.payment.toLocaleString("id-ID")}</span>
        </div>
        <div className="flex justify-between">
          <span>Kembalian</span>
          <span>Rp {data.change.toLocaleString("id-ID")}</span>
        </div>
        {data.note && (
          <p className="text-xs text-gray-600 mt-2">
            Catatan: {data.note}
          </p>
        )}
      </div>

      <button
        onClick={handleDownload}
        className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
      >
        📥 Download Struk (PDF)
      </button>

      <button
        onClick={() => window.print()}
        className="mt-2 w-full border py-2 rounded-lg hover:bg-gray-100 transition"
      >
        🖨️ Cetak Struk
      </button>
    </div>
  );
}
