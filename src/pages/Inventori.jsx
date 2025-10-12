import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPlus,
  faEdit,
  faTrash,
  faPrint,
} from "@fortawesome/free-solid-svg-icons";
import { getItems, deleteItem } from "../services/inventoriService";
import { useNavigate } from "react-router-dom";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  const fetchItems = async () => {
    const data = await getItems();
    setItems(data || []);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus barang ini?")) return;
    await deleteItem(id);
    fetchItems();
  };

  return (
    <div className="p-6 relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 bg-green-500 rounded text-white hover:bg-green-600 transition"
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Kembali
          </button>
          <h1 className="text-2xl font-bold">Inventori Barang</h1>
        </div>

        <button
          onClick={() => navigate("/tambah-barang")}
          className="bg-green-500 text-white px-4 py-2 rounded shadow hover:bg-green-600 transition"
        >
          <FontAwesomeIcon icon={faPlus} /> Tambah Barang
        </button>
      </div>

      {/* Daftar Barang */}
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex justify-between items-start bg-white border p-4 rounded shadow-sm"
          >
            <div className="flex-1">
              <p className="font-semibold text-lg">{item.name}</p>
              <p className="text-gray-700">Barcode: {item.barcode}</p>

              {/* Daftar satuan */}
              {item.units && item.units.length > 0 ? (
                <div className="mt-3">
                  <p className="font-semibold text-gray-700">
                    Detail per Satuan:
                  </p>
                  <table className="w-full mt-1 border border-gray-300 text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-1 text-left">Satuan</th>
                        <th className="border p-1 text-left">Harga Beli</th>
                        <th className="border p-1 text-left">Harga Jual</th>
                        <th className="border p-1 text-left">Stok</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.units.map((u, i) => (
                        <tr key={i}>
                          <td className="border p-1">{u.unit}</td>
                          <td className="border p-1">
                            Rp {u.purchasePrice?.toLocaleString("id-ID")}
                          </td>
                          <td className="border p-1">
                            Rp {u.sellPrice?.toLocaleString("id-ID")}
                          </td>
                          <td className="border p-1">{u.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 italic mt-2">
                  Belum ada satuan / harga jual.
                </p>
              )}
            </div>

            {/* Tombol aksi */}
            <div className="flex flex-col gap-2 ml-4">
              <button
                onClick={() => navigate(`/edit-barang/${item.id}`)}
                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition flex items-center gap-1"
              >
                <FontAwesomeIcon icon={faEdit} /> Edit
              </button>

              <button
                onClick={() => handleDelete(item.id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition flex items-center gap-1"
              >
                <FontAwesomeIcon icon={faTrash} /> Hapus
              </button>
              <button
                onClick={() => navigate("/cetak-barcode", { state: { item } })}
                className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 transition flex items-center gap-1"
              >
                <FontAwesomeIcon icon={faPrint}/> Cetak
              </button>
            </div>
          </li>
        ))}

        {items.length === 0 && (
          <p className="text-gray-500 italic">Belum ada barang.</p>
        )}
      </ul>
    </div>
  );
}
