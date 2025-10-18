// src/pages/Inventori.jsx
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faPlus,
  faEdit,
  faTrash,
  faPrint,
  faSearch,
  faBarcode,
  faBox,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { getItems, deleteItem } from "../services/inventoriService.js";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function Inventori() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [lowStockFilter, setLowStockFilter] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await getItems();
      setItems(data || []);
      setFilteredItems(data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Filter items based on search and stock filter
  useEffect(() => {
    let filtered = items;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Low stock filter
    if (lowStockFilter) {
      filtered = filtered.filter((item) =>
        item.units?.some((unit) => unit.stock <= 10)
      );
    }

    setFilteredItems(filtered);
  }, [items, searchTerm, lowStockFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus barang ini?")) return;
    try {
      await deleteItem(id);
      fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Gagal menghapus barang");
    }
  };

  // Calculate total items and low stock items
  const totalItems = items.length;
  const lowStockItems = items.filter((item) =>
    item.units?.some((unit) => unit.stock <= 10)
  ).length;

  const formatCurrency = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num || 0);
  };

  if (loading) {
    return (
      <section className="flex min-h-screen bg-gray-50">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data inventori...</p>
          </div>
        </main>
      </section>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar dengan fixed positioning */}
      <div className={`
        fixed lg:static
        inset-y-0 left-0
        md:w-[96px]
        w-64
        h-screen
        transform transition-transform duration-300 ease-in-out
        z-40
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        overflow-y-auto
      `}>
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Overlay untuk mobile */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <nav className="flex items-center justify-between bg-white shadow-sm px-4 py-3 sm:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-green-600 text-xl sm:text-2xl lg:hidden"
            >
              <FontAwesomeIcon icon={faBars} />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">
              Inventori Barang
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-500 hidden sm:block">
              {totalItems} barang
            </span>
            {lowStockItems > 0 && (
              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                {lowStockItems} stok rendah
              </span>
            )}
          </div>
        </nav>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Barang</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {totalItems}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FontAwesomeIcon icon={faBox} className="text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tampil</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {filteredItems.length}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <FontAwesomeIcon icon={faSearch} className="text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Stok Rendah</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {lowStockItems}
                  </p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    className="text-red-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon
                      icon={faSearch}
                      className="text-gray-400"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari nama barang atau barcode..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setLowStockFilter(!lowStockFilter)}
                    className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                      lowStockFilter
                        ? "bg-red-100 border-red-300 text-red-700"
                        : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <span className="hidden sm:inline">Stok Rendah</span>
                  </button>
                </div>
              </div>

              {/* Add Button */}
              <button
                onClick={() => navigate("/tambah-barang")}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium whitespace-nowrap"
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>Tambah Barang</span>
              </button>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-4">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  {/* Item Header */}
                  <div className="p-4 sm:p-6 border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-1">
                              {item.name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <FontAwesomeIcon
                                icon={faBarcode}
                                className="text-gray-400"
                              />
                              <span>Barcode: {item.barcode}</span>
                            </div>
                          </div>

                          {/* Low Stock Warning */}
                          {item.units?.some((unit) => unit.stock <= 10) && (
                            <div className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                              <FontAwesomeIcon icon={faExclamationTriangle} />
                              Stok Rendah
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Units Table */}
                  <div className="p-4 sm:p-6">
                    <h4 className="font-semibold text-gray-700 mb-3">
                      Detail Satuan
                    </h4>

                    {/* Mobile View - Cards */}
                    <div className="lg:hidden space-y-3">
                      {item.units?.map((unit, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border ${
                            unit.stock <= 10
                              ? "bg-red-50 border-red-200"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-600">Satuan</p>
                              <p className="font-semibold text-gray-800">
                                {unit.unit}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Stok</p>
                              <p
                                className={`font-semibold ${
                                  unit.stock <= 10
                                    ? "text-red-600"
                                    : "text-gray-800"
                                }`}
                              >
                                {unit.stock}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Harga Beli</p>
                              <p className="font-semibold text-gray-800">
                                {formatCurrency(unit.purchasePrice)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Harga Jual</p>
                              <p className="font-semibold text-green-600">
                                {formatCurrency(unit.sellPrice)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop View - Table */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="p-3 text-left font-semibold text-gray-700">
                              Satuan
                            </th>
                            <th className="p-3 text-left font-semibold text-gray-700">
                              Harga Beli
                            </th>
                            <th className="p-3 text-left font-semibold text-gray-700">
                              Harga Jual
                            </th>
                            <th className="p-3 text-left font-semibold text-gray-700">
                              Stok
                            </th>
                            <th className="p-3 text-left font-semibold text-gray-700">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.units?.map((unit, index) => (
                            <tr
                              key={index}
                              className="border-b border-gray-100 hover:bg-gray-50"
                            >
                              <td className="p-3 font-medium text-gray-800">
                                {unit.unit}
                              </td>
                              <td className="p-3">
                                {formatCurrency(unit.purchasePrice)}
                              </td>
                              <td className="p-3 font-semibold text-green-600">
                                {formatCurrency(unit.sellPrice)}
                              </td>
                              <td className="p-3">
                                <span
                                  className={`font-semibold ${
                                    unit.stock <= 10
                                      ? "text-red-600"
                                      : "text-gray-800"
                                  }`}
                                >
                                  {unit.stock}
                                </span>
                              </td>
                              <td className="p-3">
                                {unit.stock <= 10 ? (
                                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
                                    Stok Rendah
                                  </span>
                                ) : (
                                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                                    Stok Aman
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {(!item.units || item.units.length === 0) && (
                      <div className="text-center py-4 text-gray-500">
                        <FontAwesomeIcon
                          icon={faBox}
                          className="text-2xl mb-2 text-gray-300"
                        />
                        <p>Belum ada satuan untuk barang ini</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50">
                    <div className="flex flex-col sm:flex-row gap-2 justify-end">
                      <button
                        onClick={() => navigate(`/edit-barang/${item.id}`)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium flex-1 sm:flex-none"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() =>
                          navigate("/cetak-barcode", { state: { item } })
                        }
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 font-medium flex-1 sm:flex-none"
                      >
                        <FontAwesomeIcon icon={faPrint} />
                        <span>Cetak Barcode</span>
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-medium flex-1 sm:flex-none"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="text-gray-400 text-4xl mb-3">📦</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {searchTerm || lowStockFilter
                    ? "Barang tidak ditemukan"
                    : "Belum ada barang"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || lowStockFilter
                    ? "Coba ubah pencarian atau filter yang digunakan"
                    : "Mulai dengan menambahkan barang pertama Anda"}
                </p>
                <button
                  onClick={() => navigate("/tambah-barang")}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2 font-medium"
                >
                  <FontAwesomeIcon icon={faPlus} />
                  <span>Tambah Barang Pertama</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer Info */}
          {filteredItems.length > 0 && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Menampilkan {filteredItems.length} dari {totalItems} barang
                {lowStockFilter && " (stok rendah)"}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}