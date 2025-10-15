import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getItemById, updateItem } from "../services/inventoriService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";

export default function EditBarang() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [description, setDescription] = useState("");
  const [units, setUnits] = useState([
    { unit: "", purchasePrice: "", sellPrice: "", stock: "" },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getItemById(id);
      if (data) {
        setName(data.name || "");
        setBarcode(data.barcode || "");
        setDescription(data.description || "");
        setUnits(
          data.units && data.units.length > 0
            ? data.units.map((u) => ({
                unit: u.unit || "",
                purchasePrice: u.purchasePrice || "",
                sellPrice: u.sellPrice || "",
                stock: u.stock || "",
              }))
            : [{ unit: "", purchasePrice: "", sellPrice: "", stock: "" }]
        );
      }
    };
    fetchData();
  }, [id]);

  const handleUnitChange = (index, field, value) => {
    const updated = [...units];
    updated[index][field] = value;
    setUnits(updated);
  };

  const handleAddUnit = () => {
    setUnits([
      ...units,
      { unit: "", purchasePrice: "", sellPrice: "", stock: "" },
    ]);
  };

  const handleRemoveUnit = (index) => {
    const updated = [...units];
    updated.splice(index, 1);
    setUnits(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validUnits = units.filter(
      (u) => u.unit && u.purchasePrice && u.sellPrice && u.stock
    );

    const updatedItem = {
      name,
      barcode,
      description,
      units: validUnits.map((u) => ({
        unit: u.unit,
        purchasePrice: Number(u.purchasePrice),
        sellPrice: Number(u.sellPrice),
        stock: Number(u.stock),
      })),
    };

    await updateItem(id, updatedItem);
    alert("Barang berhasil diperbarui!");
    navigate("/inventori");
  };

  return (
    <section>
      <nav className="bg-white shadow-md p-4 flex items-center top-0 z-50 sticky">
        <button
          onClick={() => navigate("/inventori")}
          className="text-gray-600 hover:text-gray-900 transition"
        >
          <FontAwesomeIcon icon={faArrowLeft} size="lg" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-gray-800">
          Edit Barang
        </h1>
      </nav>
    <div>
      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="p-4 sm:p-6 space-y-5 max-w-2xl mx-auto"
      >
        {/* Nama barang */}
        <div>
          <label className="block font-semibold text-gray-700 mb-1">
            Nama Barang
          </label>
          <input
            type="text"
            className="border border-gray-300 rounded-lg w-full p-2 focus:ring-2 focus:ring-green-400 outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Barcode */}
        <div>
          <label className="block font-semibold text-gray-700 mb-1">
            Barcode
          </label>
          <input
            type="text"
            className="border border-gray-300 rounded-lg w-full p-2 bg-gray-100 text-gray-600"
            value={barcode}
            readOnly
          />
        </div>

        {/* Detail per Satuan */}
        <div>
          <label className="block font-semibold text-gray-700 mb-2">
            Detail per Satuan
          </label>

          {units.map((u, index) => (
            <div
              key={index}
              className="flex flex-wrap gap-2 mb-3 border border-gray-200 p-3 rounded-lg bg-gray-50"
            >
              <input
                type="text"
                placeholder="Satuan (contoh: pcs, dus)"
                className="border border-gray-300 rounded-lg p-2 flex-1 min-w-[100px] focus:ring-2 focus:ring-green-400 outline-none"
                value={u.unit}
                onChange={(e) => handleUnitChange(index, "unit", e.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Harga Beli"
                className="border border-gray-300 rounded-lg p-2 flex-1 min-w-[100px] focus:ring-2 focus:ring-green-400 outline-none"
                value={u.purchasePrice}
                onChange={(e) =>
                  handleUnitChange(index, "purchasePrice", e.target.value)
                }
                required
              />
              <input
                type="number"
                placeholder="Harga Jual"
                className="border border-gray-300 rounded-lg p-2 flex-1 min-w-[100px] focus:ring-2 focus:ring-green-400 outline-none"
                value={u.sellPrice}
                onChange={(e) =>
                  handleUnitChange(index, "sellPrice", e.target.value)
                }
                required
              />
              <input
                type="number"
                placeholder="Stok"
                className="border border-gray-300 rounded-lg p-2 flex-1 min-w-[100px] focus:ring-2 focus:ring-green-400 outline-none"
                value={u.stock}
                onChange={(e) => handleUnitChange(index, "stock", e.target.value)}
                required
              />
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => handleRemoveUnit(index)}
                  className="text-red-500 hover:text-red-700 ml-2 mt-2 sm:mt-0"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddUnit}
            className="mt-2 flex items-center justify-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition w-full sm:w-auto"
          >
            <FontAwesomeIcon icon={faPlus} /> Tambah Satuan
          </button>
        </div>

        {/* Keterangan */}
        <div>
          <label className="block font-semibold text-gray-700 mb-1">
            Keterangan
          </label>
          <textarea
            className="border border-gray-300 rounded-lg w-full p-2 focus:ring-2 focus:ring-green-400 outline-none"
            placeholder="Tulis catatan atau deskripsi barang..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
          />
        </div>

        {/* Tombol Simpan */}
        <button
          type="submit"
          className="bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition w-full font-semibold"
        >
          Simpan Perubahan
        </button>
      </form>
    </div>
    </section>
  );
}
