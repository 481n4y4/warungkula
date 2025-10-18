// src/pages/Inventori.jsx
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faPlus,
  faEdit,
  faTrash,
  faPrint,
} from "@fortawesome/free-solid-svg-icons";
import { getItems, deleteItem } from "../services/InventoriService.js";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function Inventori() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    <section className="flex min-h-screen">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex flex-9 flex-col">
        <nav className="flex items-center gap-3 bg-white shadow-md px-6 py-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-green-600 text-2xl flex md:hidden"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>

          <h1 className="text-xl font-bold text-gray-800">Inventori Barang</h1>
        </nav>

        <div className="p-4 sm:p-6 min-h-screen">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
            <button
              onClick={() => navigate("/tambah-barang")}
              className="bg-green-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded shadow hover:bg-green-600 transition text-sm sm:text-base w-full sm:w-auto"
            >
              <FontAwesomeIcon icon={faPlus} /> <span>Tambah Barang</span>
            </button>
          </div>

          <ul className="space-y-4">
            {items.map((item) => (
              <li
                key={item.id}
                className="bg-white rounded-xl shadow-md p-4 sm:p-5 flex flex-col"
              >
                <div className="flex-1">
                  <p className="font-semibold text-lg text-gray-800">
                    {item.name}
                  </p>
                  <p className="text-gray-600 text-sm break-all">
                    Barcode: {item.barcode}
                  </p>

                  {item.units && item.units.length > 0 ? (
                    <div className="mt-3">
                      <p className="font-semibold text-gray-700 mb-1">
                        Detail per Satuan:
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full border border-gray-300 text-sm min-w-[340px]">
                          <thead className="bg-green-50">
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
                    </div>
                  ) : (
                    <p className="text-gray-500 italic mt-2">
                      Belum ada satuan / harga jual.
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-4">
                  <button
                    onClick={() => navigate(`/edit-barang/${item.id}`)}
                    className="bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600 transition flex items-center justify-center gap-1 text-sm sm:text-base"
                  >
                    <FontAwesomeIcon icon={faEdit} /> Edit
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="bg-red-500 text-white px-3 py-1.5 rounded hover:bg-red-600 transition flex items-center justify-center gap-1 text-sm sm:text-base"
                  >
                    <FontAwesomeIcon icon={faTrash} /> Hapus
                  </button>

                  <button
                    onClick={() =>
                      navigate("/cetak-barcode", { state: { item } })
                    }
                    className="bg-purple-500 text-white px-3 py-1.5 rounded hover:bg-purple-600 transition flex items-center justify-center gap-1 text-sm sm:text-base"
                  >
                    <FontAwesomeIcon icon={faPrint} /> Cetak
                  </button>
                </div>
              </li>
            ))}

            {items.length === 0 && (
              <p className="text-gray-500 italic text-center">
                Belum ada barang.
              </p>
            )}
          </ul>
        </div>
      </main>
    </section>
  );
}
