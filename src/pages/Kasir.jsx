// src/pages/Kasir.jsx
import React, { useState, useEffect, useRef } from "react";
import QrReader from "react-qr-reader-es6";
import {
  getProductByBarcode,
  searchProductsByName,
  createTransactionWithStockUpdate,
  getActiveStoreSession,
  auth,
} from "../firebase/firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "../components/Sidebar";

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
  const [paymentMethod, setPaymentMethod] = useState("");
  const [activeSession, setActiveSession] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScannerOpen, setScannerOpen] = useState(false);
  const navigate = useNavigate();
  
  // ✅ Gunakan ref untuk mencegah double scan
  const scanProcessed = useRef(false);

  const subtotal = cart.reduce((s, it) => s + it.qty * it.sellPrice, 0);
  const total = subtotal;

  // ✅ Cek apakah sesi toko aktif
  useEffect(() => {
    const checkSession = async () => {
      const session = await getActiveStoreSession();
      setActiveSession(session);
      if (!session) {
        navigate("/dashboard", { state: { storeClosed: true } });
      }
    };
    checkSession();
  }, [navigate]);

  // ✅ Fungsi untuk menambah ke cart
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

  // ✅ Fungsi pencarian produk yang DIPERBAIKI
  const performSearch = async (term, isFromScan = false) => {
    if (!term?.trim()) return;
    
    // Reset flag scan
    scanProcessed.current = false;
    setLoading(true);

    try {
      let results = [];

      // Cari berdasarkan barcode (untuk scan atau input manual)
      if (/^\d+$/.test(term) || term.startsWith("BR")) {
        const product = await getProductByBarcode(term);
        if (product) results = [product];
      } else {
        // Cari berdasarkan nama
        results = await searchProductsByName(term);
      }

      setProductResults(results);

      if (results.length === 0) {
        toast.info("Produk tidak ditemukan.");
      } 
      // ✅ PERBAIKAN: Auto-add ke cart jika hasil scan/pencarian hanya 1 produk dengan 1 unit
      else if (results.length === 1) {
        const product = results[0];
        
        // Jika produk hanya punya 1 unit, langsung tambah ke cart
        if (product.units?.length === 1) {
          const unit = product.units[0];
          addToCart(product, unit, 1);
          toast.success(`✅ ${product.name} ditambahkan ke keranjang!`);
          setSearchTerm(""); // Clear search term
          setProductResults([]); // Clear results
        }
        // Jika produk punya multiple units, tampilkan pilihan
        else {
          if (isFromScan) {
            toast.info("Produk memiliki beberapa satuan. Pilih satuan yang diinginkan.");
          } else {
            toast.info("Pilih satuan yang diinginkan.");
          }
        }
      }
      // Jika multiple products ditemukan, tampilkan semuanya
      else {
        if (isFromScan) {
          toast.info(`Ditemukan ${results.length} produk. Pilih yang sesuai.`);
        } else {
          toast.info(`Ditemukan ${results.length} produk. Pilih yang sesuai.`);
        }
      }
    } catch (err) {
      console.error("Error searching product:", err);
      toast.error("Gagal mencari produk!");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle input pencarian manual
  const handleSearch = async (e) => {
    e.preventDefault();
    await performSearch(searchTerm, false);
  };

  // ✅ Handle hasil scan barcode - DIPERBAIKI
  const handleScan = async (result) => {
    if (!result || scanProcessed.current) return;
    
    console.log("Scan result:", result);
    
    // Set flag untuk mencegah double processing
    scanProcessed.current = true;
    
    // Update last scanned
    setLastScanned(result);
    
    // Process scan dengan parameter isFromScan = true
    await performSearch(result, true);
    
    // Tutup scanner setelah berhasil scan
    setTimeout(() => {
      setScannerOpen(false);
    }, 500); // Beri sedikit delay agar toast terlihat
  };

  const handleError = (err) => {
    console.error("Scanner error:", err);
    toast.error("Gagal membaca QR Code/Barcode!");
  };

  // ✅ Ubah qty item
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

  // ✅ Hapus item dari keranjang
  const removeItem = (key) =>
    setCart((prev) => prev.filter((it) => it.key !== key));

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.warn("Keranjang masih kosong!");
    if (!paymentMethod) return toast.error("Pilih metode pembayaran!");

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
      totalPrice: total,
      payment: paid,
      change: paid - total,
      paymentMethod,
      note,
      storeSessionId: activeSession?.id || null,
    };

    console.log("Payload transaksi:", txPayload);
    console.log("User ID:", auth.currentUser?.uid);

    setLoading(true);
    try {
      const result = await createTransactionWithStockUpdate(txPayload);
      console.log("Transaksi berhasil, ID:", result.id);

      setCart([]);
      setPayment("");
      setNote("");
      setPaymentMethod("");
      setProductResults([]);
      setSearchTerm("");

      toast.success("Transaksi berhasil!");

      // Navigate ke receipt page dengan ID transaksi
      navigate("/receipt", { state: { id: result.id } });
    } catch (error) {
      console.error("Error checkout:", error);
      toast.error(`Gagal menyimpan transaksi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Reset scan flag ketika scanner dibuka/tutup
  useEffect(() => {
    if (isScannerOpen) {
      scanProcessed.current = false;
    }
  }, [isScannerOpen]);

  // ✅ Tampilan
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar dengan fixed positioning */}
      <div className={`
        fixed lg:static
        inset-y-0 left-0
        md:w-[96px]
        w-64
        h-screen
        transform transition-transform duration-300 ease-in-out
        z-40
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        overflow-y-auto
      `}>
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Overlay untuk mobile */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden lg:ml-0">
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
              Mode Kasir
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-500">
              {cart.length} item di keranjang
            </span>
          </div>
        </nav>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ========== SCANNER DAN CARI PRODUK ========== */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border space-y-4">
                <h2 className="font-semibold text-lg">Pemindai Barcode</h2>

                <button
                  onClick={() => {
                    setScannerOpen(true);
                    scanProcessed.current = false; // Reset flag
                  }}
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
                    className="w-full p-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
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
                        <div className="font-semibold text-gray-800">
                          {p.name}
                        </div>
                        <div className="text-xs text-gray-500">{p.barcode}</div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(p.units || []).map((u) => (
                          <button
                            key={u.unit}
                            onClick={() => {
                              addToCart(p, u, 1);
                              setProductResults([]); // Clear results setelah pilih
                              setSearchTerm(""); // Clear search term
                              toast.success(`✅ ${p.name} ditambahkan ke keranjang!`);
                            }}
                            className="px-2 py-1 text-xs rounded-lg border bg-white hover:bg-blue-50 transition"
                          >
                            {u.unit} — {formatCurrency(u.sellPrice)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Modal Scanner */}
                {isScannerOpen && (
                  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-white p-5 rounded-2xl shadow-lg w-[90%] max-w-md relative">
                      <h3 className="text-lg font-semibold mb-3">
                        Pindai Barcode
                      </h3>
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
                          onScan={handleScan}
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

              {/* ========== KERANJANG ========== */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border flex flex-col">
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
                          <td
                            colSpan="6"
                            className="p-4 text-center text-gray-500"
                          >
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
                                className="w-16 p-1 border rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-green-500"
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

                {/* RINGKASAN PEMBAYARAN */}
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
                    <label className="text-sm font-medium">
                      Metode Pembayaran
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full p-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent mt-1 text-sm"
                      required
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
                      className="w-full p-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min={total}
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
                      className="w-full p-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleCheckout}
                      disabled={loading || cart.length === 0}
                      className="flex-1 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold shadow-sm transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {loading ? "Memproses..." : "Checkout"}
                    </button>
                    <button
                      onClick={() => {
                        setCart([]);
                        setPayment("");
                        setPaymentMethod("");
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
        </div>

        <ToastContainer />
      </main>
    </div>
  );
}