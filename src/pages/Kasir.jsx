// src/pages/Kasir.jsx
import React, { useEffect, useRef, useState } from "react";
import Quagga from "@ericblade/quagga2";
import {
  getProductByBarcode,
  searchProductsByName,
  createTransactionWithStockUpdate,
} from "../firebase/firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

function formatCurrency(num = 0) {
  return new Intl.NumberFormat("id-ID").format(num);
}

export default function Kasir() {
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [payment, setPayment] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const subtotal = cart.reduce((s, it) => s + it.qty * it.sellPrice, 0);
  const tax = 0;
  const total = subtotal + tax;

  // Cleanup saat unmount
  useEffect(() => {
    return () => {
      Quagga.stop();
      Quagga.offDetected();
    };
  }, []);

  // ======== FUNGSI SCANNER =========
  function startScanner() {
    if (scanning) return;

    setScanning(true);

    const target = scannerRef.current;
    if (!target) {
      console.error("Scanner container tidak ditemukan!");
      alert("Elemen scanner tidak ditemukan di halaman.");
      setScanning(false);
      return;
    }

    Quagga.init(
      {
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target,
          constraints: {
            width: 640,
            height: 480,
            facingMode: "environment", // kamera belakang
          },
        },
        decoder: {
          readers: ["ean_reader", "code_128_reader", "upc_reader"],
        },
      },
      (err) => {
        if (err) {
          console.error("Quagga init error:", err);
          alert(
            "Gagal mengakses kamera. Pastikan izin kamera aktif dan tidak digunakan aplikasi lain."
          );
          setScanning(false);
          return;
        }

        console.log("Quagga initialized successfully!");
        Quagga.start();
      }
    );

    // pastikan tidak duplikat listener
    Quagga.offDetected();
    Quagga.onDetected((data) => {
      const code = data?.codeResult?.code;
      if (!code) return;
      console.log("Barcode detected:", code);
      setLastScanned(code);
      handleBarcodeDetected(code);
      stopScanner(); // otomatis berhenti setelah scan
    });
  }

  function stopScanner() {
    Quagga.stop();
    Quagga.offDetected();
    setScanning(false);
    console.log("Scanner stopped.");
  }

  async function handleBarcodeDetected(code) {
    try {
      const product = await getProductByBarcode(code);
      if (product) {
        console.log("Produk ditemukan:", product);
        // tambahkan unit pertama default
        const unit = (product.units || [])[0];
        if (unit) addToCart(product, unit, 1);
        else alert("Produk tidak memiliki unit yang valid!");
      } else {
        alert("Produk tidak ditemukan di database.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat mencari produk.");
    }
  }

  // ===== Cart helpers =====
  function addToCart(product, unitObj, qty = 1) {
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
      } else {
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
      }
    });
  }

  function updateQty(key, newQty) {
    setCart((prev) =>
      prev
        .map((it) =>
          it.key === key
            ? { ...it, qty: Math.max(0, Math.min(newQty, it.stock)) }
            : it
        )
        .filter((it) => it.qty > 0)
    );
  }

  function removeItem(key) {
    setCart((prev) => prev.filter((it) => it.key !== key));
  }

  // ===== Search products =====
  async function handleSearch(e) {
    e && e.preventDefault();
    if (!searchTerm) return;
    setLoading(true);
    try {
      const results = await searchProductsByName(searchTerm);
      setProductResults(results);
    } catch (err) {
      console.error(err);
      alert("Gagal mencari produk");
    } finally {
      setLoading(false);
    }
  }

  // ===== Checkout =====
  async function handleCheckout() {
    if (cart.length === 0) {
      alert("Keranjang kosong");
      return;
    }
    const paid = Number(payment);
    if (isNaN(paid) || paid < total) {
      alert("Pembayaran tidak cukup atau tidak valid");
      return;
    }

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
      tax,
      total,
      payment: paid,
      change: paid - total,
      note,
    };

    setLoading(true);
    try {
      await createTransactionWithStockUpdate(txPayload);
      alert("Transaksi berhasil dicatat!");
      setCart([]);
      setPayment("");
      setNote("");
      setProductResults([]);
    } catch (err) {
      console.error(err);
      alert("Gagal checkout: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  }

  // ======== UI ========
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <FontAwesomeIcon icon={faArrowLeft} /> <span>Kembali</span>
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
          Mode Kasir
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-6 items-start">
        {/* ===== KIRI: Scanner & Pencarian ===== */}
        <div className="bg-white p-5 rounded-2xl shadow-md">
          <h2 className="font-semibold text-lg mb-3">📷 Scanner</h2>
          <div
            id="scanner-container"
            ref={scannerRef}
            className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg mb-3 flex items-center justify-center text-gray-400"
          >
            {scanning
              ? "🔍 Memindai..."
              : "Tampilan kamera akan muncul di sini"}
          </div>

          <div className="flex gap-2 mb-3">
            {!scanning ? (
              <button
                onClick={startScanner}
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                Mulai Scan
              </button>
            ) : (
              <button
                onClick={stopScanner}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium"
              >
                Stop Scan
              </button>
            )}
            <button
              onClick={() => {
                setLastScanned("");
                setSearchTerm("");
              }}
              className="px-4 py-2 rounded-lg border font-medium"
            >
              Reset
            </button>
          </div>

          <div className="text-sm mb-3 text-gray-600">
            Hasil terakhir: <strong>{lastScanned || "-"}</strong>
          </div>

          <form onSubmit={handleSearch} className="mb-3">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama produk atau barcode lalu tekan Enter"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>

          <div className="max-h-56 overflow-y-auto border rounded-lg divide-y">
            {loading && (
              <div className="text-sm text-gray-500 p-2">Loading...</div>
            )}
            {productResults.map((p) => (
              <div
                key={p.id}
                className="p-3 flex justify-between items-center hover:bg-gray-50"
              >
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.barcode}</div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(p.units || []).map((u) => (
                    <button
                      key={u.unit}
                      onClick={() => addToCart(p, u, 1)}
                      className="px-2 py-1 text-xs border rounded-lg bg-white hover:bg-blue-50"
                    >
                      {u.unit} — {formatCurrency(u.sellPrice)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== KANAN: Keranjang & Checkout ===== */}
        <div className="bg-white p-5 rounded-2xl shadow-md flex flex-col">
          <h2 className="font-semibold text-lg mb-3">🛒 Keranjang</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm mb-4 border-collapse">
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
                {cart.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-gray-500">
                      Keranjang kosong
                    </td>
                  </tr>
                )}
                {cart.map((it) => (
                  <tr key={it.key} className="border-b">
                    <td className="py-2">
                      <div className="font-medium">{it.name}</div>
                      <div className="text-xs text-gray-500">{it.barcode}</div>
                    </td>
                    <td>{it.unit}</td>
                    <td>{formatCurrency(it.sellPrice)}</td>
                    <td>
                      <input
                        type="number"
                        value={it.qty}
                        min={1}
                        max={it.stock}
                        onChange={(e) =>
                          updateQty(it.key, Number(e.target.value))
                        }
                        className="w-20 p-1 border rounded-lg text-center"
                      />
                      <div className="text-xs text-gray-500">
                        stok: {it.stock}
                      </div>
                    </td>
                    <td>{formatCurrency(it.qty * it.sellPrice)}</td>
                    <td>
                      <button
                        onClick={() => removeItem(it.key)}
                        className="px-2 py-1 rounded-lg border text-xs hover:bg-red-50"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ===== Checkout Box ===== */}
          <div className="w-full p-4 border rounded-xl bg-gray-50 mt-auto">
            <div className="flex justify-between mb-1 text-sm">
              <div>Subtotal</div>
              <div>{formatCurrency(subtotal)}</div>
            </div>
            <div className="flex justify-between mb-1 text-sm">
              <div>Pajak</div>
              <div>{formatCurrency(tax)}</div>
            </div>
            <div className="flex justify-between font-semibold text-lg mt-2 border-t pt-2">
              <div>Total</div>
              <div>{formatCurrency(total)}</div>
            </div>

            <div className="mt-3 space-y-2">
              <label className="text-sm">Bayar</label>
              <input
                type="number"
                value={payment}
                onChange={(e) => setPayment(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-sm">
                Kembalian:{" "}
                <strong>
                  {payment
                    ? formatCurrency(Math.max(0, Number(payment) - total))
                    : "-"}
                </strong>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-sm">Catatan (opsional)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                Checkout
              </button>
              <button
                onClick={() => {
                  setCart([]);
                  setPayment("");
                }}
                className="py-2 px-4 rounded-lg border font-semibold hover:bg-gray-100"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
