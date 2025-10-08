import { useState, useEffect, useRef } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import JsBarcode from "jsbarcode";
import { useReactToPrint } from "react-to-print";
import { useNavigate } from "react-router-dom";

export default function Inventori() {
  const [nama, setNama] = useState("");
  const [harga, setHarga] = useState("");
  const [stok, setStok] = useState("");
  const [produkList, setProdukList] = useState([]);
  const barcodeRefs = useRef({});
  const navigate = useNavigate();

  const produkCollection = collection(db, "produk");

  // Ambil data produk dari Firestore
  useEffect(() => {
    const ambilData = async () => {
      const data = await getDocs(produkCollection);
      setProdukList(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    };
    ambilData();
  }, []);

  // Generate barcode setiap kali produkList berubah
  useEffect(() => {
    produkList.forEach((produk) => {
      if (barcodeRefs.current[produk.id]) {
        JsBarcode(barcodeRefs.current[produk.id], produk.barcode, {
          format: "CODE128",
          width: 2,
          height: 50,
          displayValue: true,
        });
      }
    });
  }, [produkList]);

  // Tambah produk baru
  const tambahProduk = async (e) => {
    e.preventDefault();
    if (!nama || !harga || !stok) return;

    // Generate kode unik untuk barcode
    const kode = "PRD-" + Date.now().toString().slice(-6);

    await addDoc(produkCollection, {
      nama,
      harga: parseInt(harga),
      stok: parseInt(stok),
      barcode: kode,
    });

    setNama("");
    setHarga("");
    setStok("");

    const data = await getDocs(produkCollection);
    setProdukList(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
  };

  // Hapus produk
  const hapusProduk = async (id) => {
    await deleteDoc(doc(db, "produk", id));
    setProdukList(produkList.filter((p) => p.id !== id));
  };

  // Cetak barcode
  const handlePrint = useReactToPrint({
    content: () => document.getElementById("print-area"),
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <nav className="bg-white shadow-md p-4 mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-700">Inventori WarungGw</h1>
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg"
        >
          ⬅ Kembali
        </button>
      </nav>

      {/* Form tambah produk */}
      <form
        onSubmit={tambahProduk}
        className="bg-white shadow-md rounded-xl p-6 mb-8 max-w-lg mx-auto"
      >
        <h2 className="text-xl font-semibold mb-4">Tambah Produk</h2>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Nama Produk"
            className="border rounded-lg px-3 py-2"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
          />
          <input
            type="number"
            placeholder="Harga"
            className="border rounded-lg px-3 py-2"
            value={harga}
            onChange={(e) => setHarga(e.target.value)}
          />
          <input
            type="number"
            placeholder="Stok"
            className="border rounded-lg px-3 py-2"
            value={stok}
            onChange={(e) => setStok(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 transition"
          >
            Tambah Produk
          </button>
        </div>
      </form>

      {/* Daftar Produk */}
      <div className="bg-white shadow-md rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Daftar Produk</h2>
        {produkList.length === 0 ? (
          <p className="text-gray-500">Belum ada produk ditambahkan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="p-2 border">Nama</th>
                  <th className="p-2 border">Harga</th>
                  <th className="p-2 border">Stok</th>
                  <th className="p-2 border">Barcode</th>
                  <th className="p-2 border">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {produkList.map((produk) => (
                  <tr key={produk.id} className="text-center">
                    <td className="border p-2">{produk.nama}</td>
                    <td className="border p-2">Rp {produk.harga.toLocaleString()}</td>
                    <td className="border p-2">{produk.stok}</td>
                    <td className="border p-2">
                      <svg
                        ref={(el) => (barcodeRefs.current[produk.id] = el)}
                        className="mx-auto"
                      ></svg>
                    </td>
                    <td className="border p-2">
                      <button
                        onClick={() => hapusProduk(produk.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tombol cetak semua barcode */}
      {produkList.length > 0 && (
        <div className="text-center mt-6">
          <button
            onClick={handlePrint}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Cetak Semua Barcode
          </button>
        </div>
      )}

      {/* Area print barcode */}
      <div id="print-area" className="hidden">
        {produkList.map((produk) => (
          <div key={produk.id} className="p-4">
            <svg
              ref={(el) => JsBarcode(el, produk.barcode, { format: "CODE128", displayValue: true })}
            ></svg>
            <p>{produk.nama}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
