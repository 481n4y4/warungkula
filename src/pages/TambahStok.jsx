// src/pages/TambahStok.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPlus,
  faSearch,
  faBox,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import { getItems, updateItem } from "../services/inventoriService";

export default function TambahStok() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [stockUpdates, setStockUpdates] = useState({});

  // Fetch items dari Firebase
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

  // Filter items berdasarkan pencarian
  useEffect(() => {
    let filtered = items;

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  }, [items, searchTerm]);

  // Handle perubahan stok
  const handleStockChange = (itemId, unitIndex, newStock) => {
    setStockUpdates(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [unitIndex]: parseInt(newStock) || 0
      }
    }));
  };

  // Tambah stok untuk item tertentu
  const addStockToItem = async (itemId) => {
    const itemUpdates = stockUpdates[itemId];
    if (!itemUpdates) return;

    const item = items.find(item => item.id === itemId);
    if (!item) return;

    try {
      const updatedUnits = item.units.map((unit, index) => {
        const additionalStock = itemUpdates[index] || 0;
        return {
          ...unit,
          stock: unit.stock + additionalStock
        };
      });

      await updateItem(itemId, {
        ...item,
        units: updatedUnits
      });

      // Reset form untuk item ini
      setStockUpdates(prev => {
        const newUpdates = { ...prev };
        delete newUpdates[itemId];
        return newUpdates;
      });

      // Refresh data
      fetchItems();
      
      alert("Stok berhasil ditambahkan!");
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("Gagal menambahkan stok");
    }
  };

  // Format currency
  const formatCurrency = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num || 0);
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
                <h1 className="text-xl font-bold text-gray-900">Tambah Stok Barang</h1>
                <p className="text-sm text-gray-500">Kelola dan tambah stok barang yang ada</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {items.length} barang
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cari nama barang atau barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FontAwesomeIcon icon={faBox} />
              <span>{filteredItems.length} barang ditemukan</span>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-6">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Item Header */}
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-1">
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>Barcode: {item.barcode}</span>
                            {item.description && (
                              <>
                                <span>•</span>
                                <span>{item.description}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Low Stock Warning */}
                        {item.units?.some((unit) => unit.stock <= 10) && (
                          <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                            Ada Stok Rendah
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Units Table */}
                <div className="p-6">
                  <h4 className="font-semibold text-gray-700 mb-4 text-lg">
                    Tambah Stok per Satuan
                  </h4>

                  {/* Desktop View - Table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="p-4 text-left font-semibold text-gray-700">
                            Satuan
                          </th>
                          <th className="p-4 text-left font-semibold text-gray-700">
                            Stok Saat Ini
                          </th>
                          <th className="p-4 text-left font-semibold text-gray-700">
                            Tambah Stok
                          </th>
                          <th className="p-4 text-left font-semibold text-gray-700">
                            Stok Baru
                          </th>
                          <th className="p-4 text-left font-semibold text-gray-700">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.units?.map((unit, index) => {
                          const additionalStock = stockUpdates[item.id]?.[index] || 0;
                          const newStock = unit.stock + additionalStock;

                          return (
                            <tr
                              key={index}
                              className="border-b border-gray-100 hover:bg-gray-50"
                            >
                              <td className="p-4 font-medium text-gray-800">
                                {unit.unit}
                              </td>
                              <td className="p-4">
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
                              <td className="p-4">
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={additionalStock}
                                  onChange={(e) => 
                                    handleStockChange(item.id, index, e.target.value)
                                  }
                                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                              </td>
                              <td className="p-4">
                                <span
                                  className={`font-semibold ${
                                    newStock <= 10
                                      ? "text-red-600"
                                      : "text-green-600"
                                  }`}
                                >
                                  {newStock}
                                </span>
                              </td>
                              <td className="p-4">
                                <button
                                  onClick={() => addStockToItem(item.id)}
                                  disabled={additionalStock <= 0}
                                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    additionalStock > 0
                                      ? "bg-green-600 text-white hover:bg-green-700"
                                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  }`}
                                >
                                  Tambah
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile View - Cards */}
                  <div className="lg:hidden space-y-4">
                    {item.units?.map((unit, index) => {
                      const additionalStock = stockUpdates[item.id]?.[index] || 0;
                      const newStock = unit.stock + additionalStock;

                      return (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border ${
                            unit.stock <= 10
                              ? "bg-red-50 border-red-200"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-gray-800">
                                {unit.unit}
                              </span>
                              {unit.stock <= 10 && (
                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">
                                  Stok Rendah
                                </span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Stok Saat Ini</p>
                                <p className="font-semibold text-gray-800">
                                  {unit.stock}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Stok Baru</p>
                                <p className={`font-semibold ${
                                  newStock <= 10 ? "text-red-600" : "text-green-600"
                                }`}>
                                  {newStock}
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-2 items-end">
                              <div className="flex-1">
                                <label className="block text-sm text-gray-600 mb-1">
                                  Tambah Stok
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={additionalStock}
                                  onChange={(e) => 
                                    handleStockChange(item.id, index, e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                              </div>
                              <button
                                onClick={() => addStockToItem(item.id)}
                                disabled={additionalStock <= 0}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors flex-shrink-0 ${
                                  additionalStock > 0
                                    ? "bg-green-600 text-white hover:bg-green-700"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                }`}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {(!item.units || item.units.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <FontAwesomeIcon
                        icon={faBox}
                        className="text-4xl mb-3 text-gray-300"
                      />
                      <p>Belum ada satuan untuk barang ini</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="text-gray-400 text-4xl mb-3">📦</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {searchTerm ? "Barang tidak ditemukan" : "Belum ada barang"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm
                  ? "Coba ubah kata kunci pencarian"
                  : "Tambahkan barang terlebih dahulu di halaman inventori"}
              </p>
              <button
                onClick={() => navigate("/inventori")}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2 font-medium"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                <span>Kembali ke Inventori</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Info */}
        {filteredItems.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Menampilkan {filteredItems.length} barang
            </p>
          </div>
        )}
      </div>
    </div>
  );
}