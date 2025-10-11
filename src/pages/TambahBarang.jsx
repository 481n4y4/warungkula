import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addItem } from "../services/inventoriService";

export default function TambahBarang() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    stock: "",
    purchasePrice: "",
    barcode: "",
  });

  const [autoBarcode, setAutoBarcode] = useState(true);
  const [sellPrices, setSellPrices] = useState([
    { unit: "", price: "" },
  ]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSellChange = (index, field, value) => {
    const updated = [...sellPrices];
    updated[index][field] = value;
    setSellPrices(updated);
  };

  const handleAddSellPrice = () => {
    setSellPrices([...sellPrices, { unit: "", price: "" }]);
  };

  const handleRemoveSellPrice = (index) => {
    const updated = [...sellPrices];
    updated.splice(index, 1);
    setSellPrices(updated);
  };

  const generateBarcode = () => {
    return "BR" + Date.now();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newItem = {
      name: formData.name,
      stock: parseInt(formData.stock),
      purchasePrice: parseInt(formData.purchasePrice),
      barcode: autoBarcode ? generateBarcode() : formData.barcode,
      sellPrices: sellPrices.filter((sp) => sp.unit && sp.price),
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

        <input
          name="purchasePrice"
          type="number"
          value={formData.purchasePrice}
          onChange={handleChange}
          placeholder="Harga Beli"
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

        {/* Harga jual */}
        <div className="border-t pt-4">
          <h2 className="font-semibold mb-2">Harga Jual (per satuan)</h2>

          {sellPrices.map((sp, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                type="text"
                value={sp.unit}
                onChange={(e) => handleSellChange(i, "unit", e.target.value)}
                placeholder="Satuan (misal: 250gr / 1kg)"
                className="w-1/2 p-2 border rounded"
              />
              <input
                type="number"
                value={sp.price}
                onChange={(e) => handleSellChange(i, "price", e.target.value)}
                placeholder="Harga jual"
                className="w-1/2 p-2 border rounded"
              />
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemoveSellPrice(i)}
                  className="text-red-500 font-bold"
                >
                  ×
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddSellPrice}
            className="text-green-600 hover:underline"
          >
            + Tambah Harga Jual
          </button>
        </div>

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
