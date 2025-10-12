import { useLocation, useNavigate } from "react-router-dom";
import JsBarcode from "jsbarcode";
import { useEffect, useRef } from "react";

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
          JsBarcode(canvas, item.barcode + "-" + unit.unit, {
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

  const handleDownload = (index, unit) => {
    const canvas = barcodeRefs.current[index];
    const link = document.createElement("a");
    link.download = `${item.name}-${unit.unit}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (!item) {
    return (
      <div className="p-6">
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
    <div className="p-6 print:p-0">
      <h1 className="text-2xl font-bold mb-4">Cetak Barcode - {item.name}</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 print:grid-cols-4">
        {item.units.map((unit, index) => (
          <div
            key={index}
            className="border p-3 rounded shadow-sm text-center print:shadow-none flex flex-col items-center"
          >
            <p className="font-semibold text-sm mb-1">
              {item.name} ({unit.unit})
            </p>
            <canvas
              ref={(el) => (barcodeRefs.current[index] = el)}
              width={250}
              height={100}
            />
            <button
              onClick={() => handleDownload(index, unit)}
              className="mt-2 bg-blue-500 text-white px-2 py-1 text-sm rounded hover:bg-blue-600 transition print:hidden"
            >
              Download
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600 transition"
        >
          Cetak Barcode
        </button>
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-500 text-white px-4 py-2 rounded shadow hover:bg-gray-600 transition"
        >
          Kembali
        </button>
      </div>
    </div>
  );
}
