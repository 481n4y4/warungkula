// src/pages/Kasir.jsx
import React, { useState } from "react";
import QrReader from "react-qr-reader-es6";
import {
  getProductByBarcode,
  searchProductsByName,
  createTransactionWithStockUpdate,
  db,
} from "../firebase/firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

function formatCurrency(num = 0) {
  return new Intl.NumberFormat("id-ID").format(num);
}

export default function Kasir() {
  const [lastScanned, setLastScanned] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [payment, setPayment] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [isScannerOpen, setScannerOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(""); 


  const subtotal = cart.reduce((s, it) => s + it.qty * it.sellPrice, 0);
  const total = subtotal;

  // FUNGSI UTAMA UNTUK PENCARIAN PRODUK (manual + scan)
  const performSearch = async (term) => {
    if (!term?.trim()) return;
    setLoading(true);

    try {
      let results = [];

      if (/^\d+$/.test(term) || term.startsWith("BR")) {
        // Cari berdasarkan barcode
        const product = await getProductByBarcode(term);
        if (product) results = [product];
      } else {
        // Cari berdasarkan nama produk
        results = await searchProductsByName(term);
      }

      setProductResults(results);

      if (results.length === 0) {
        toast.info("Produk tidak ditemukan.");
      } else if (results.length === 1 && results[0].units?.length === 1) {
        // Jika hasil hanya 1 dan 1 satuan → langsung masukkan ke keranjang
        const product = results[0];
        const unit = product.units[0];
        addToCart(product, unit, 1);
        toast.success(`✅ ${product.name} ditambahkan ke keranjang!`);
      } else {
        toast.info("Pilih produk atau satuan yang sesuai.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal mencari produk!");
    } finally {
      setLoading(false);
    }
  };

  // HANDLE SEARCH (manual)
  const handleSearch = async (e) => {
    e.preventDefault();
    performSearch(searchTerm);
  };

  // HANDLE SCAN (QR Code)
  const handleScan = async (result) => {
    if (result && result !== lastScanned) {
      console.log("QR Code:", result);
      setLastScanned(result);
      performSearch(result); // panggil fungsi yang sama
    }
  };

  const handleError = (err) => {
    console.error(err);
    toast.error("Gagal membaca QR Code!");
  };

  // CART HELPERS
  const addToCart = (product, unitObj, qty = 1) => {
    if (!product || !unitObj) return;
    const key = `${product.id}|${unitObj.unit}`;
    setCart((prev) => {
      const exists = prev.find((p) => p.key === key);
      if (exists) {
        return prev.map((p) =>
          p.key === key
            ? { ...p, qty: Math.min(p.qty + qty, unitObj.stock || 0) }
            : p
        );
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          name: product.name,
          barcode: product.barcode,
          unit: unitObj.unit,
          sellPrice: unitObj.sellPrice,
          qty: Math.min(qty, unitObj.stock || 0),
          stock: unitObj.stock || 0,
        },
      ];
    });
  };

  const updateQty = (key, newQty) => {
    setCart((prev) =>
      prev
        .map((it) =>
          it.key === key
            ? { ...it, qty: Math.max(0, Math.min(newQty, it.stock)) }
            : it
        )
        .filter((it) => it.qty > 0)
    );
  };

  const removeItem = (key) =>
    setCart((prev) => prev.filter((it) => it.key !== key));

  // ===== CHECKOUT =====
  const handleCheckout = async () => {
    if (cart.length === 0) return toast.warn("Keranjang masih kosong!");
    const paid = Number(payment);
    if (isNaN(paid) || paid < total)
      return toast.error("Pembayaran tidak cukup atau tidak valid!");

    const txPayload = {
      items: cart.map((it) => ({
        productId: it.productId,
        name: it.name,
        barcode: it.barcode,
        unit: it.unit,
        qty: it.qty,
        sellPrice: it.sellPrice,
        subtotal: it.qty * it.sellPrice,
      })),
      subtotal,
      total,
      payment: paid,
      change: paid - total,
      paymentMethod,
      note,
      createdAt: serverTimestamp(),
    };

    setLoading(true);
    try {
      // 1️⃣ Simpan transaksi ke Firestore
      const docRef = await addDoc(collection(db, "transaksi"), txPayload);

      // 2️⃣ Kurangi stok lewat function existing (kalau kamu pakai)
      await createTransactionWithStockUpdate(txPayload);

      // 3️⃣ Bersihkan keranjang
      setCart([]);
      setPayment("");
      setNote("");

      // 4️⃣ Arahkan ke halaman struk dengan membawa ID transaksi
      navigate("/receipt", { state: { id: docRef.id } });
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan transaksi!");
    } finally {
      setLoading(false);
    }
  };

  // ====================== UI ===========================
  return (
    <section>
      <div className="bg-white shadow-sm p-4 flex items-center">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-gray-600 hover:text-gray-900 transition"
        >
          <FontAwesomeIcon icon={faArrowLeft} size="lg" />
        </button>
        <h1 className="flex-1 text-center text-xl font-bold text-gray-800">
          Mode Kasir
        </h1>
      </div>

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        <ToastContainer position="top-right" autoClose={2500} />
        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Scanner + Search */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              Pemindai Barcode
            </h2>

            {/* Tombol untuk membuka scanner */}
            <button
              onClick={() => setScannerOpen(true)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow transition"
            >
              Buka Pemindai
            </button>

            <div className="text-sm text-gray-600">
              Hasil terakhir: <strong>{lastScanned || "-"}</strong>
            </div>

            <form onSubmit={handleSearch}>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔎 Cari nama produk atau barcode lalu tekan Enter"
                className="w-full p-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </form>

            <div className="max-h-56 overflow-y-auto border rounded-xl divide-y bg-gray-50">
              {loading && (
                <div className="p-3 text-sm text-gray-500">Loading...</div>
              )}
              {productResults.map((p) => (
                <div
                  key={p.id}
                  className="p-3 flex justify-between items-center hover:bg-white transition"
                >
                  <div>
                    <div className="font-semibold text-gray-800">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.barcode}</div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(p.units || []).map((u) => (
                      <button
                        key={u.unit}
                        onClick={() => addToCart(p, u, 1)}
                        className="px-2 py-1 text-xs rounded-lg border bg-white hover:bg-blue-50 transition"
                      >
                        {u.unit} — {formatCurrency(u.sellPrice)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* ===== Modal Scanner ===== */}
            {isScannerOpen && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                <div className="bg-white p-5 rounded-2xl shadow-lg w-[90%] max-w-md relative">
                  <h3 className="text-lg font-semibold mb-3">Pindai Barcode</h3>
                  <button
                    onClick={() => setScannerOpen(false)}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </button>

                  <div className="rounded-xl overflow-hidden border">
                    <QrReader
                      delay={300}
                      onError={handleError}
                      onScan={(result) => {
                        handleScan(result);
                        if (result) setScannerOpen(false);
                      }}
                      style={{ width: "100%" }}
                    />
                  </div>

                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Arahkan kamera ke barcode produk
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Cart */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <h2 className="font-semibold text-lg mb-3">Keranjang</h2>

            <div className="overflow-x-auto mb-3">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b text-gray-600">
                    <th className="py-2 text-left">Produk</th>
                    <th>Unit</th>
                    <th>Harga</th>
                    <th>Qty</th>
                    <th>Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-4 text-center text-gray-500">
                        Keranjang masih kosong
                      </td>
                    </tr>
                  ) : (
                    cart.map((it) => (
                      <tr
                        key={it.key}
                        className="border-b hover:bg-gray-50 transition"
                      >
                        <td className="py-2">
                          <div className="font-medium text-gray-800">
                            {it.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {it.barcode}
                          </div>
                        </td>
                        <td>{it.unit}</td>
                        <td>{formatCurrency(it.sellPrice)}</td>
                        <td className="text-center">
                          <input
                            type="number"
                            value={it.qty}
                            min={1}
                            max={it.stock}
                            onChange={(e) =>
                              updateQty(it.key, Number(e.target.value))
                            }
                            className="w-16 p-1 border rounded-lg text-center"
                          />
                          <div className="text-xs text-gray-500">
                            stok: {it.stock}
                          </div>
                        </td>
                        <td>{formatCurrency(it.qty * it.sellPrice)}</td>
                        <td>
                          <button
                            onClick={() => removeItem(it.key)}
                            className="px-2 py-1 rounded-lg border text-xs hover:bg-red-50 transition"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="w-full p-4 border rounded-2xl bg-gray-50 mt-auto space-y-3">
              <div className="flex justify-between text-sm text-gray-700">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex justify-between text-lg font-semibold text-gray-900 border-t pt-2">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>

              <div>
                <label className="text-sm font-medium">Metode Pembayaran</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2 border rounded-xl focus:ring-2 focus:ring-blue-500 mt-1 text-sm"
                >
                  <option value="">Pilih metode...</option>
                  <option value="Tunai">Tunai</option>
                  <option value="QRIS">QRIS</option>
                  <option value="Transfer">Transfer</option>
                  <option value="Debit">Debit</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Bayar</label>
                <input
                  type="number"
                  value={payment}
                  onChange={(e) => setPayment(e.target.value)}
                  className="w-full p-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
                <div className="text-sm text-gray-700">
                  Kembalian:{" "}
                  <strong>
                    {payment
                      ? formatCurrency(Math.max(0, Number(payment) - total))
                      : "-"}
                  </strong>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Catatan (opsional)
                </label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full p-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="flex-1 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold shadow-sm transition"
                >
                  {loading ? "Memproses..." : "Checkout"}
                </button>
                <button
                  onClick={() => {
                    setCart([]);
                    setPayment("");
                  }}
                  className="py-2 px-4 rounded-xl border font-semibold hover:bg-gray-100 transition"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
