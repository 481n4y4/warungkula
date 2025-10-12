import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { addItem } from "../services/inventoriService";
import { useNavigate } from "react-router-dom";

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
  const generateBarcode = () => {
    return "BR" + Date.now();
  };

  // Tambah unit baru
  const handleAddUnit = () => {
    setUnits([
      ...units,
      { unit: "", purchasePrice: "", sellPrice: "", stock: "" },
    ]);
  };

  // Ubah data di tiap unit
  const handleUnitChange = (index, field, value) => {
    const updated = [...units];
    updated[index][field] = value;
    setUnits(updated);
  };

  // Hapus satu unit
  const handleRemoveUnit = (index) => {
    const updated = [...units];
    updated.splice(index, 1);
    setUnits(updated);
  };

  // Submit data
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
    };

    await addItem(newItem);
    navigate("/inventori");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => navigate("/inventori")}
          className="p-2 bg-green-500 rounded text-white hover:bg-green-600 transition"
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Kembali
        </button>
        <h1 className="text-2xl font-bold">Tambah Barang</h1>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-6 rounded shadow"
      >
        {/* Nama barang */}
        <div>
          <label className="block font-semibold mb-1">Nama Barang</label>
          <input
            type="text"
            className="border rounded w-full p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Barcode */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <input
              type="checkbox"
              checked={autoBarcode}
              onChange={() => setAutoBarcode(!autoBarcode)}
            />
            <label className="font-semibold">Barcode Otomatis</label>
          </div>

          {!autoBarcode && (
            <input
              type="text"
              placeholder="Masukkan Barcode"
              className="border rounded w-full p-2"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              required
            />
          )}
        </div>

        {/* Daftar satuan */}
        <div>
          <label className="block font-semibold mb-2">Detail per Satuan</label>

          {units.map((u, index) => (
            <div
              key={index}
              className="flex flex-wrap gap-2 mb-3 border p-3 rounded"
            >
              <input
                type="text"
                placeholder="Satuan (contoh: pcs, dus)"
                className="border rounded p-2 flex-1 min-w-[100px]"
                value={u.unit}
                onChange={(e) =>
                  handleUnitChange(index, "unit", e.target.value)
                }
                required
              />
              <input
                type="number"
                placeholder="Harga Beli"
                className="border rounded p-2 flex-1 min-w-[100px]"
                value={u.purchasePrice}
                onChange={(e) =>
                  handleUnitChange(index, "purchasePrice", e.target.value)
                }
                required
              />
              <input
                type="number"
                placeholder="Harga Jual"
                className="border rounded p-2 flex-1 min-w-[100px]"
                value={u.sellPrice}
                onChange={(e) =>
                  handleUnitChange(index, "sellPrice", e.target.value)
                }
                required
              />
              <input
                type="number"
                placeholder="Stok"
                className="border rounded p-2 flex-1 min-w-[100px]"
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
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddUnit}
            className="mt-2 flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
          >
            <FontAwesomeIcon icon={faPlus} /> Tambah Satuan
          </button>
        </div>

        {/* Keterangan */}
        <div>
          <label className="block font-semibold mb-1">Keterangan</label>
          <textarea
            className="border rounded w-full p-2"
            placeholder="Tulis catatan atau deskripsi barang..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
          />
        </div>

        {/* Tombol simpan */}
        <button
          type="submit"
          className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition font-semibold"
        >
          Simpan Barang
        </button>
      </form>
    </div>
  );
}
