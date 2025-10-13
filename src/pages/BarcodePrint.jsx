import { useLocation, useNavigate } from "react-router-dom";
import { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { QRCodeCanvas } from "qrcode.react"; // ✅ pakai qrcode.react

export default function BarcodePrint() {
  const location = useLocation();
  const navigate = useNavigate();
  const { item } = location.state || {};
  const qrRefs = useRef([]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = (index) => {
    const canvas = qrRefs.current[index]?.querySelector("canvas");
    if (canvas) {
      const link = document.createElement("a");
      link.download = `${item.name || "produk"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  if (!item) {
    return (
      <div className="p-6 text-center">
        <p>Data barang tidak ditemukan.</p>
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-500 text-white px-4 py-2 rounded mt-3"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto print:p-0">
      {/* Tombol kembali di atas */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/inventori")}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition flex items-center gap-2 text-sm sm:text-base"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Kembali</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold mb-4 text-center sm:text-left">
            Cetak QR Code - {item.name}
          </h1>
        </div>
      </div>

      {/* Grid responsif untuk QR code */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 print:grid-cols-4">
        <div
          ref={(el) => (qrRefs.current[0] = el)}
          className="border p-3 sm:p-4 rounded-lg shadow-sm bg-white text-center 
               flex flex-col items-center justify-between 
               print:shadow-none print:border-0 print:p-0"
        >
          <p className="font-semibold text-sm sm:text-base mb-2">{item.name}</p>

          {/* ✅ Generate QR Code */}
          <QRCodeCanvas
            value={JSON.stringify({
              id: item.id,
              name: item.name,
              barcode: item.barcode,
              unit: item.units?.[0]?.unit || "",
            })}
            size={180}
            level="H"
            includeMargin={true}
          />

          <button
            onClick={() => handleDownload(0)}
            className="mt-3 bg-blue-500 text-white px-3 py-1.5 text-sm rounded hover:bg-blue-600 transition print:hidden w-full sm:w-auto"
          >
            Download
          </button>
        </div>
      </div>

      {/* Tombol cetak di bawah */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center sm:justify-start print:hidden">
        <button
          onClick={handlePrint}
          className="bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600 transition w-full sm:w-auto"
        >
          Cetak QR Code
        </button>
      </div>
    </div>
  );
}
