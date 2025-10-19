import { useLocation, useNavigate } from "react-router-dom";
import { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPrint,
  faDownload,
  faQrcode,
  faBarcode,
} from "@fortawesome/free-solid-svg-icons";
import { QRCodeCanvas } from "qrcode.react";

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
      link.download = `${item.name || "produk"}_${
        item.barcode || "nobarcode"
      }.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  const handleDownloadAll = () => {
    qrRefs.current.forEach((ref, index) => {
      const canvas = ref?.querySelector("canvas");
      if (canvas) {
        setTimeout(() => {
          const link = document.createElement("a");
          link.download = `${item.name || "produk"}_${
            item.barcode || "nobarcode"
          }_${index + 1}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
        }, index * 100);
      }
    });
  };

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center max-w-md">
          <div className="text-red-400 text-4xl mb-3">❌</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Data Barang Tidak Ditemukan
          </h3>
          <p className="text-gray-500 mb-4">
            Tidak ada data barang yang dipilih untuk dicetak.
          </p>
          <button
            onClick={() => navigate("/inventori")}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2 font-medium"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Kembali ke Inventori
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/inventori")}
                className="text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Cetak QR Code
                </h1>
                <p className="text-sm text-gray-500">{item.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FontAwesomeIcon icon={faQrcode} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Info Barang */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                Informasi Barang
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Nama Barang:</span>
                  <p className="font-medium text-gray-800">{item.name}</p>
                </div>
                <div>
                  <span className="text-gray-600">Barcode:</span>
                  <p className="font-medium text-gray-800 flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={faBarcode}
                      className="text-blue-600"
                    />
                    {item.barcode || "Tidak ada barcode"}
                  </p>
                </div>
                {item.description && (
                  <div className="md:col-span-2">
                    <span className="text-gray-600">Keterangan:</span>
                    <p className="font-medium text-gray-800">
                      {item.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 print:hidden">
              <button
                onClick={handleDownloadAll}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <FontAwesomeIcon icon={faDownload} />
                Download
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <FontAwesomeIcon icon={faPrint} />
                Cetak
              </button>
            </div>
          </div>
        </div>

        {/* QR Codes Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              Kode QR Tersedia
            </h2>
            <span className="text-sm text-gray-500">
              {item.units?.length || 1} versi satuan
            </span>
          </div>

          {/* Grid QR Codes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {/* Default QR Code for Item */}
            <div
              ref={(el) => (qrRefs.current[0] = el)}
              className="border-2 border-gray-200 rounded-xl p-4 bg-white text-center 
                         flex flex-col items-center justify-between 
                         print:shadow-none print:border print:border-gray-300 print:p-2
                         hover:shadow-md transition-shadow"
            >
              <div className="flex-1 w-full">
                <p className="font-semibold text-gray-800 text-sm mb-2 truncate">
                  {item.name}
                </p>
                <p className="text-xs text-gray-500 mb-3 font-mono">
                  {item.barcode || "NO_BARCODE"}
                </p>

                <div className="flex justify-center mb-3">
                  <QRCodeCanvas
                    value={item.barcode || "NO_BARCODE"}
                    size={120}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                <p className="text-xs text-gray-600 mt-2">
                  Scan untuk info produk
                </p>
              </div>

              <button
                onClick={() => handleDownload(0)}
                className="mt-4 w-full bg-blue-600 text-white px-3 py-2 text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 print:hidden"
              >
                <FontAwesomeIcon icon={faDownload} />
                Download
              </button>
            </div>
          </div>

          {/* Print Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200 print:hidden">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <FontAwesomeIcon icon={faPrint} />
              Petunjuk Cetak
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                • Klik tombol <strong>"Cetak Semua"</strong> untuk mencetak
                semua QR Code
              </li>
              <li>• Pastikan printer siap dan kertas cukup</li>
              <li>• Untuk hasil terbaik, gunakan kertas label sticker</li>
              <li>• QR Code dapat discan menggunakan aplikasi scanner biasa</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .print\\:p-0,
            .print\\:p-0 * {
              visibility: visible;
            }
            .print\\:p-0 {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0 !important;
            }
            .print\\:grid-cols-4 {
              grid-template-columns: repeat(4, minmax(0, 1fr));
            }
            .print\\:shadow-none {
              box-shadow: none;
            }
            .print\\:border {
              border: 1px solid #d1d5db !important;
            }
            .print\\:border-gray-300 {
              border-color: #d1d5db !important;
            }
            button {
              display: none !important;
            }
          }
        `}
      </style>
    </div>
  );
}
