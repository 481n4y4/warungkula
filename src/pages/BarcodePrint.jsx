import { useLocation, useNavigate } from "react-router-dom";
import JsBarcode from "jsbarcode";
import { useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

export default function BarcodePrint() {
  const location = useLocation();
  const navigate = useNavigate();
  const { item } = location.state || {};

  const barcodeRefs = useRef([]);

  // Generate barcode
  useEffect(() => {
    if (item?.units) {
      item.units.forEach((unit, index) => {
        const canvas = barcodeRefs.current[index];
        if (canvas) {
          JsBarcode(canvas, item.barcode, {
            format: "CODE128",
            displayValue: true,
            lineColor: "#000",
            fontSize: 14,
            width: 2,
            height: 60,
            margin: 10,
          });
        }
      });
    }
  }, [item]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = (index) => {
    const canvas = barcodeRefs.current[index];
    const link = document.createElement("a");
    link.download = `${item.name}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
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
            Cetak Barcode - {item.name}
          </h1>
        </div>
      </div>

      {/* Grid responsif */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 print:grid-cols-4">
        <div
          className="border p-3 sm:p-4 rounded-lg shadow-sm bg-white text-center 
               flex flex-col items-center justify-between 
               print:shadow-none print:border-0 print:p-0"
        >
          <p className="font-semibold text-sm sm:text-base mb-2">{item.name}</p>

          <div className="w-full flex justify-center">
            <canvas
              ref={(el) => (barcodeRefs.current[0] = el)}
              className="w-full max-w-[250px] h-auto"
            />
          </div>

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
          Cetak Barcode
        </button>
      </div>
    </div>
  );
}
