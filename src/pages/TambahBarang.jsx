// src/pages/TambahBarang.jsx
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { db, waitForUser } from "../firebase/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function TambahBarang() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [autoBarcode, setAutoBarcode] = useState(true);
  const [description, setDescription] = useState("");
  const [units, setUnits] = useState([
    { unit: "", purchasePrice: "", sellPrice: "", stock: "" },
  ]);

  // Fungsi generate barcode otomatis
  const generateBarcode = () => "BR" + Date.now();

  // Tambah satuan baru
  const handleAddUnit = () => {
    setUnits([
      ...units,
      { unit: "", purchasePrice: "", sellPrice: "", stock: "" },
    ]);
  };

  // Ubah nilai di input satuan
  const handleUnitChange = (index, field, value) => {
    const updated = [...units];
    updated[index][field] = value;
    setUnits(updated);
  };

  // Hapus satuan
  const handleRemoveUnit = (index) => {
    const updated = [...units];
    updated.splice(index, 1);
    setUnits(updated);
  };

  // Fungsi untuk simpan ke Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validUnits = units.filter(
      (u) => u.unit && u.purchasePrice && u.sellPrice && u.stock
    );

    const newItem = {
      name,
      barcode: autoBarcode ? generateBarcode() : barcode,
      description,
      units: validUnits.map((u) => ({
        unit: u.unit,
        purchasePrice: Number(u.purchasePrice),
        sellPrice: Number(u.sellPrice),
        stock: Number(u.stock),
      })),
      createdAt: new Date(),
    };

    try {
      // Pastikan user sudah login
      const user = await waitForUser();

      // Simpan ke koleksi user
      await addDoc(collection(db, `users/${user.uid}/inventori`), newItem);

      alert("Barang berhasil ditambahkan!");
      navigate("/inventori");
    } catch (err) {
      console.error("❌ Gagal menambahkan barang:", err);
      alert("Gagal menambahkan barang: " + err.message);
    }
  };

  return (
    <section>
      {/* Navbar */}
      <nav className="bg-white shadow-sm p-4 flex items-center top-0 z-50 sticky">
        <button
          onClick={() => navigate("/inventori")}
          className="text-gray-600 hover:text-gray-900 transition"
        >
          <FontAwesomeIcon icon={faArrowLeft} size="lg" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-800">
          Tambah Barang
        </h1>
      </nav>

      {/* Form */}
      <div>
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto p-6 space-y-6"
        >
          {/* Nama Barang */}
          <div>
            <label className="block font-medium text-gray-700 mb-2">
              Nama Barang
            </label>
            <input
              type="text"
              className="border border-gray-300 rounded-lg w-full p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Masukkan nama barang"
            />
          </div>

          {/* Barcode */}
          <div>
            <label className="block font-medium text-gray-700 mb-2">
              Pengaturan Barcode
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={autoBarcode}
                onChange={() => setAutoBarcode(!autoBarcode)}
                className="accent-green-600"
              />
              <span className="text-sm text-gray-600">Barcode Otomatis</span>
            </div>

            {!autoBarcode && (
              <input
                type="text"
                placeholder="Masukkan barcode manual"
                className="border border-gray-300 rounded-lg w-full p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                required
              />
            )}
          </div>

          {/* Detail per satuan */}
          <div>
            <label className="block font-medium text-gray-700 mb-3">
              Detail per Satuan
            </label>

            <div className="space-y-3">
              {units.map((u, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 sm:grid-cols-5 gap-3 border border-gray-200 p-3 rounded-lg bg-gray-50"
                >
                  <input
                    type="text"
                    placeholder="Satuan (contoh: pcs, dus)"
                    className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={u.unit}
                    onChange={(e) =>
                      handleUnitChange(index, "unit", e.target.value)
                    }
                    required
                  />
                  <input
                    type="number"
                    placeholder="Harga Beli"
                    className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={u.purchasePrice}
                    onChange={(e) =>
                      handleUnitChange(index, "purchasePrice", e.target.value)
                    }
                    required
                  />
                  <input
                    type="number"
                    placeholder="Harga Jual"
                    className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={u.sellPrice}
                    onChange={(e) =>
                      handleUnitChange(index, "sellPrice", e.target.value)
                    }
                    required
                  />
                  <input
                    type="number"
                    placeholder="Stok"
                    className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={u.stock}
                    onChange={(e) =>
                      handleUnitChange(index, "stock", e.target.value)
                    }
                    required
                  />
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveUnit(index)}
                      className="text-red-500 hover:text-red-700 transition flex items-center justify-center"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddUnit}
              className="mt-3 flex items-center gap-2 text-sm bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
            >
              <FontAwesomeIcon icon={faPlus} />
              Tambah Satuan
            </button>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block font-medium text-gray-700 mb-2">
              Keterangan
            </label>
            <textarea
              className="border border-gray-300 rounded-lg w-full p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              placeholder="Tulis deskripsi atau catatan barang..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
            />
          </div>

          {/* Tombol simpan */}
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Simpan Barang
          </button>
        </form>
      </div>
    </section>
  );
}
