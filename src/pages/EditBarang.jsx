import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getItemById, updateItem } from "../services/inventoriService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";

export default function EditBarang() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    stock: "",
    purchasePrice: "",
    barcode: "",
    sellPrices: [],
  });

  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const data = await getItemById(id);
      if (data) setFormData(data);
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addSellPrice = () => {
    if (!unit || !price) return;
    setFormData({
      ...formData,
      sellPrices: [...formData.sellPrices, { unit, price: parseInt(price) }],
    });
    setUnit("");
    setPrice("");
  };

  const removeSellPrice = (index) => {
    const updated = formData.sellPrices.filter((_, i) => i !== index);
    setFormData({ ...formData, sellPrices: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateItem(id, {
      ...formData,
      stock: parseInt(formData.stock),
      purchasePrice: parseInt(formData.purchasePrice),
    });
    alert("Barang berhasil diperbarui!");
    navigate("/inventory");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button
        onClick={() => navigate("/inventori")}
        className="mb-4 flex items-center gap-2 text-green-600 hover:underline"
      >
        <FontAwesomeIcon icon={faArrowLeft} /> Kembali ke Inventori
      </button>

      <h1 className="text-2xl font-bold mb-6">Edit Barang</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Nama Barang"
          className="w-full p-2 border rounded"
          required
        />

        <input
          name="stock"
          type="number"
          value={formData.stock}
          onChange={handleChange}
          placeholder="Stok"
          className="w-full p-2 border rounded"
          required
        />

        <input
          name="purchasePrice"
          type="number"
          value={formData.purchasePrice}
          onChange={handleChange}
          placeholder="Harga Beli"
          className="w-full p-2 border rounded"
          required
        />

        <input
          name="barcode"
          value={formData.barcode}
          onChange={handleChange}
          placeholder="Barcode"
          className="w-full p-2 border rounded"
          readOnly
        />

        {/* Harga Jual */}
        <div className="border-t pt-4">
          <h2 className="font-semibold text-lg mb-2">Harga Jual per Satuan</h2>

          <div className="flex gap-2 mb-3">
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Contoh: 250gr"
              className="flex-1 p-2 border rounded"
            />
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Harga (Rp)"
              type="number"
              className="flex-1 p-2 border rounded"
            />
            <button
              type="button"
              onClick={addSellPrice}
              className="bg-green-500 text-white px-3 rounded hover:bg-green-600 transition"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>

          {formData.sellPrices.length > 0 && (
            <ul className="space-y-2">
              {formData.sellPrices.map((sp, i) => (
                <li
                  key={i}
                  className="flex justify-between items-center bg-gray-50 p-2 rounded border"
                >
                  <span>
                    {sp.unit} — Rp {sp.price.toLocaleString("id-ID")}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSellPrice(i)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition w-full"
        >
          Simpan Perubahan
        </button>
      </form>
    </div>
  );
}
