import { useState, useEffect, useRef } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import jsQR from "jsqr";

export default function Kasir() {
  const navigate = useNavigate();
  const [produkList, setProdukList] = useState([]);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Ambil data produk dari Firestore
  useEffect(() => {
    const ambilProduk = async () => {
      const snapshot = await getDocs(collection(db, "produk"));
      setProdukList(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    ambilProduk();
  }, []);

  // Jalankan kamera untuk scan barcode
  useEffect(() => {
    const startCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    };
    startCamera();

    const scanLoop = () => {
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height);
        if (code) handleScan(code.data);
      }
      requestAnimationFrame(scanLoop);
    };
    scanLoop();
  }, []);

  const handleScan = (barcode) => {
    const produk = produkList.find((p) => p.barcode === barcode);
    if (produk) {
      setCart((prev) => [...prev, produk]);
      setTotal((prev) => prev + parseInt(produk.harga));
    }
  };

  const handleSelesai = async () => {
    if (cart.length === 0) return alert("Keranjang masih kosong!");
    const transaksiData = {
      tanggal: new Date().toISOString(),
      total,
      item: cart.map((item) => ({
        nama: item.nama,
        harga: item.harga,
        barcode: item.barcode,
      })),
    };
    await addDoc(collection(db, "transaksi"), transaksiData);
    alert("Transaksi berhasil disimpan!");
    setCart([]);
    setTotal(0);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <nav className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-700">Mode Kasir</h1>
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
        >
          Kembali
        </button>
      </nav>

      {/* Kamera untuk scan barcode */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="bg-white shadow-md rounded-lg p-4 flex-1">
          <h2 className="font-semibold mb-2">Scan Produk</h2>
          <video ref={videoRef} className="w-full rounded-lg shadow"></video>
          <canvas ref={canvasRef} className="hidden"></canvas>
        </div>

        {/* Daftar keranjang */}
        <div className="bg-white shadow-md rounded-lg p-4 flex-1">
          <h2 className="font-semibold mb-2">Keranjang</h2>
          <ul className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
            {cart.map((item, index) => (
              <li key={index} className="py-2 flex justify-between">
                <span>{item.nama}</span>
                <span className="font-semibold text-green-600">Rp {item.harga}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between text-lg font-semibold">
            <span>Total:</span>
            <span className="text-blue-700">Rp {total}</span>
          </div>
          <button
            onClick={handleSelesai}
            className="mt-4 w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
          >
            Selesai Transaksi
          </button>
        </div>
      </div>
    </div>
  );
}
