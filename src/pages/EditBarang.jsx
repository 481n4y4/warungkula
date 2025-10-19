import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getItemById, updateItem } from "../services/inventoriService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowLeft, 
  faPlus, 
  faTrash, 
  faBox, 
  faBarcode,
  faEdit 
} from "@fortawesome/free-solid-svg-icons";

export default function EditBarang() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [description, setDescription] = useState("");
  const [units, setUnits] = useState([
    { unit: "", purchasePrice: "", sellPrice: "", stock: "" },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
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
      } catch (error) {
        console.error("Error fetching item:", error);
        alert("Gagal memuat data barang");
      } finally {
        setLoading(false);
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
    if (units.length <= 1) {
      alert("Barang harus memiliki minimal satu satuan!");
      return;
    }
    
    const updated = [...units];
    updated.splice(index, 1);
    setUnits(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validUnits = units.filter(
      (u) => u.unit && u.purchasePrice && u.sellPrice && u.stock
    );

    if (validUnits.length === 0) {
      alert("Harap tambahkan minimal satu satuan dengan data lengkap!");
      return;
    }

    try {
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
        updatedAt: new Date(),
      };

      await updateItem(id, updatedItem);
      alert("Barang berhasil diperbarui!");
      navigate("/inventori");
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Gagal memperbarui barang");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data barang...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/inventori")}
                className="text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Edit Barang</h1>
                <p className="text-sm text-gray-500">Perbarui informasi barang</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FontAwesomeIcon icon={faEdit} className="text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informasi Dasar Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FontAwesomeIcon icon={faBox} className="text-green-600" />
                Informasi Dasar Barang
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Nama Barang */}
              <div>
                <label className="block font-medium text-gray-700 mb-2">
                  Nama Barang *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Masukkan nama barang"
                />
              </div>

              {/* Barcode */}
              <div>
                <label className="block font-medium text-gray-700 mb-3">
                  <FontAwesomeIcon icon={faBarcode} className="mr-2 text-blue-600" />
                  Kode Barcode
                </label>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Kode barcode saat ini:</p>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 focus:outline-none"
                    value={barcode}
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    * Kode barcode tidak dapat diubah untuk menjaga konsistensi data
                  </p>
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block font-medium text-gray-700 mb-2">
                  Keterangan
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none"
                  placeholder="Tulis deskripsi atau catatan tentang barang ini..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                />
              </div>
            </div>
          </div>

          {/* Detail Satuan Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">
                Detail Satuan dan Harga
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Kelola satuan dan harga untuk barang ini
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {units.map((u, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-800">
                        Satuan #{index + 1}
                      </h3>
                      {units.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveUnit(index)}
                          className="text-red-600 hover:text-red-700 transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                          Hapus
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Satuan *
                        </label>
                        <input
                          type="text"
                          placeholder="pcs, dus, pack, etc."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          value={u.unit}
                          onChange={(e) =>
                            handleUnitChange(index, "unit", e.target.value)
                          }
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Harga Beli *
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          value={u.purchasePrice}
                          onChange={(e) =>
                            handleUnitChange(index, "purchasePrice", e.target.value)
                          }
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Harga Jual *
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          value={u.sellPrice}
                          onChange={(e) =>
                            handleUnitChange(index, "sellPrice", e.target.value)
                          }
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Stok *
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          value={u.stock}
                          onChange={(e) =>
                            handleUnitChange(index, "stock", e.target.value)
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddUnit}
                className="mt-4 flex items-center gap-2 text-green-600 hover:text-green-700 font-medium transition-colors"
              >
                <FontAwesomeIcon icon={faPlus} />
                Tambah Satuan Lainnya
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => navigate("/inventori")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faEdit} />
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}