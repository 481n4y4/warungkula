import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addItem } from "../services/inventoriService";

export default function TambahBarang() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    stock: "",
    barcode: "",
    note: "",
  });

  const [autoBarcode, setAutoBarcode] = useState(true);
  const [prices, setPrices] = useState([
    { unit: "", purchasePrice: "", sellPrice: "" },
  ]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePriceChange = (index, field, value) => {
    const updated = [...prices];
    updated[index][field] = value;
    setPrices(updated);
  };

  const handleAddPrice = () => {
    setPrices([...prices, { unit: "", purchasePrice: "", sellPrice: "" }]);
  };

  const handleRemovePrice = (index) => {
    const updated = [...prices];
    updated.splice(index, 1);
    setPrices(updated);
  };

  const generateBarcode = () => {
    return "BR" + Date.now();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newItem = {
      name: formData.name,
      stock: parseInt(formData.stock),
      note: formData.note,
      barcode: autoBarcode ? generateBarcode() : formData.barcode,
      prices: prices.filter(
        (p) => p.unit && p.purchasePrice && p.sellPrice
      ),
    };

    await addItem(newItem);
    navigate("/inventori");
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Tambah Barang</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Nama Barang"
          className="w-full p-2 border rounded"
        />

        <input
          name="stock"
          type="number"
          value={formData.stock}
          onChange={handleChange}
          placeholder="Stok Barang"
          className="w-full p-2 border rounded"
        />

        {/* Barcode */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoBarcode}
            onChange={() => setAutoBarcode(!autoBarcode)}
          />
          <label>Barcode Otomatis</label>
        </div>

        {!autoBarcode && (
          <input
            name="barcode"
            value={formData.barcode}
            onChange={handleChange}
            placeholder="Masukkan Barcode"
            className="w-full p-2 border rounded"
          />
        )}

        {/* Daftar harga per satuan */}
        <div className="border-t pt-4">
          <h2 className="font-semibold mb-2">Harga per Satuan</h2>

          {prices.map((p, i) => (
            <div key={i} className="flex gap-2 mb-2 flex-wrap">
              <input
                type="text"
                value={p.unit}
                onChange={(e) => handlePriceChange(i, "unit", e.target.value)}
                placeholder="Satuan (misal: 250gr / 1kg)"
                className="flex-1 p-2 border rounded"
              />
              <input
                type="number"
                value={p.purchasePrice}
                onChange={(e) =>
                  handlePriceChange(i, "purchasePrice", e.target.value)
                }
                placeholder="Harga Beli"
                className="flex-1 p-2 border rounded"
              />
              <input
                type="number"
                value={p.sellPrice}
                onChange={(e) =>
                  handlePriceChange(i, "sellPrice", e.target.value)
                }
                placeholder="Harga Jual"
                className="flex-1 p-2 border rounded"
              />
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemovePrice(i)}
                  className="text-red-500 font-bold"
                >
                  ×
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddPrice}
            className="text-green-600 hover:underline"
          >
            + Tambah Satuan Harga
          </button>
        </div>

        {/* Kolom keterangan */}
        <textarea
          name="note"
          value={formData.note}
          onChange={handleChange}
          placeholder="Keterangan (opsional)"
          className="w-full p-2 border rounded"
          rows={3}
        />

        {/* Tombol aksi */}
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={() => navigate("/inventori")}
            className="bg-gray-400 text-white px-4 py-2 rounded"
          >
            Batal
          </button>
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Simpan Barang
          </button>
        </div>
      </form>
    </div>
  );
}
