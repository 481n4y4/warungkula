import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faTrash,
  faEdit,
  faSearch,
  faUserPlus,
  faUsers,
  faShieldAlt,
  faKey,
  faExclamationCircle,
  faXmark // ✅ TAMBAHKAN INI
} from "@fortawesome/free-solid-svg-icons";
import Sidebar from "../components/Sidebar";
import {
  getAllOperators,
  addOperator,
  updateOperator,
  deleteOperator,
} from "../firebase/firebase";
import { auth } from "../firebase/firebase";

export default function Operator() {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Form data
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "Kasir",
    adminPassword: "",
  });

  const [editForm, setEditForm] = useState({
    id: "",
    username: "",
    password: "",
    role: "",
    adminPassword: "",
  });

  // ===========================================================
  // 🔹 Fetch Data
  // ===========================================================
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) fetchOperators();
    });
    return () => unsub();
  }, []);

  const fetchOperators = async () => {
    setLoading(true);
    try {
      const data = await getAllOperators();
      setOperators(data);
    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: "Gagal memuat data operator." });
    } finally {
      setLoading(false);
    }
  };

  // ===========================================================
  // 🔹 Filter pencarian
  // ===========================================================
  const filteredOperators = operators.filter((op) =>
    op.username.toLowerCase().includes(search.toLowerCase())
  );

  // ===========================================================
  // 🔹 Tambah Operator
  // ===========================================================
  const handleAdd = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    try {
      await addOperator(
        form.username,
        form.password,
        form.role,
        form.adminPassword
      );
      setMsg({ type: "success", text: "Operator berhasil ditambahkan!" });
      setForm({ username: "", password: "", role: "Kasir", adminPassword: "" });
      setShowAddModal(false);
      fetchOperators();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
  };

  // ===========================================================
  // 🔹 Edit Operator
  // ===========================================================
  const handleEdit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    try {
      await updateOperator(
        editForm.id,
        {
          username: editForm.username,
          password: editForm.password,
          role: editForm.role,
        },
        editForm.adminPassword
      );
      setMsg({ type: "success", text: "Data operator berhasil diperbarui!" });
      setShowEditModal(false);
      fetchOperators();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
  };

  // ===========================================================
  // 🔹 Hapus Operator
  // ===========================================================
  const handleDelete = async (id, username) => {
    if (!window.confirm(`Yakin ingin menghapus operator "${username}"?`))
      return;

    const adminPassword = prompt("Masukkan password admin untuk konfirmasi:");
    if (!adminPassword) return;

    try {
      await deleteOperator(id, adminPassword);
      setMsg({ type: "success", text: "Operator berhasil dihapus!" });
      fetchOperators();
    } catch (err) {
      setMsg({
        type: "error",
        text: "Gagal menghapus operator: " + err.message,
      });
    }
  };

  // Statistik
  const totalOperators = operators.length;
  const kasirCount = operators.filter((op) => op.role === "Kasir").length;
  const managerCount = operators.filter((op) => op.role === "Manager").length;

  // ===========================================================
  // 🔹 UI Render
  // ===========================================================
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden"> {/* ✅ UBAH DARI section KE div */}
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
        {/* Header - TAMBAHKAN flex-shrink-0 */}
        <nav className="flex items-center justify-between bg-white shadow-sm px-4 py-3 sm:px-6 flex-shrink-0"> {/* ✅ TAMBAHKAN flex-shrink-0 */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-green-600 text-xl sm:text-2xl lg:hidden"
            >
              <FontAwesomeIcon icon={faBars} />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">
              Kelola Operator
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-gray-500 hidden sm:block">
              {totalOperators} operator
            </span>
          </div>
        </nav>

        {/* Message Alert */}
        {msg.text && (
          <div
            className={`mx-4 mt-4 p-4 rounded-lg border flex-shrink-0 ${
              msg.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <FontAwesomeIcon
                icon={
                  msg.type === "success" ? faShieldAlt : faExclamationCircle
                }
              />
              <span className="text-sm font-medium">{msg.text}</span>
            </div>
          </div>
        )}

        {/* Main Content - HAPUS overflow-hidden DI SINI */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6"> {/* ✅ UBAH overflow-hidden MENJADI overflow-y-auto */}
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Operator</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {totalOperators}
                  </p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FontAwesomeIcon icon={faUsers} className="text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Kasir</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {kasirCount}
                  </p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <FontAwesomeIcon
                    icon={faUserPlus}
                    className="text-green-600"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Manager</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {managerCount}
                  </p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FontAwesomeIcon
                    icon={faShieldAlt}
                    className="text-purple-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1 max-w-md">
                {/* Search Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon
                      icon={faSearch}
                      className="text-gray-400"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari operator..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Add Button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium whitespace-nowrap"
              >
                <FontAwesomeIcon icon={faUserPlus} />
                <span>Tambah Operator</span>
              </button>
            </div>
          </div>

          {/* Operators List */}
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Memuat data operator...</p>
              </div>
            ) : filteredOperators.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="text-gray-400 text-4xl mb-3">👥</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {search ? "Operator tidak ditemukan" : "Belum ada operator"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {search
                    ? "Coba ubah kata kunci pencarian"
                    : "Mulai dengan menambahkan operator pertama"}
                </p>
                {!search && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2 font-medium"
                  >
                    <FontAwesomeIcon icon={faUserPlus} />
                    <span>Tambah Operator Pertama</span>
                  </button>
                )}
              </div>
            ) : (
              filteredOperators.map((op, i) => (
                <div
                  key={op.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  {/* Operator Header */}
                  <div className="p-4 sm:p-6 border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-1">
                              {op.username}
                            </h3>
                            <div className="flex items-center gap-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  op.role === "Manager"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {op.role}
                              </span>
                              <span className="text-sm text-gray-500">
                                Dibuat:{" "}
                                {op.createdAt
                                  ? new Date(
                                      op.createdAt.seconds * 1000
                                    ).toLocaleDateString("id-ID")
                                  : "N/A"}
                              </span>
                            </div>
                          </div>

                          {/* Desktop Actions */}
                          <div className="hidden sm:flex gap-2">
                            <button
                              onClick={() => {
                                setEditForm({
                                  id: op.id,
                                  username: op.username,
                                  password: "",
                                  role: op.role,
                                  adminPassword: "",
                                });
                                setShowEditModal(true);
                              }}
                              className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(op.id, op.username)}
                              className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm font-medium"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 sm:hidden">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setEditForm({
                            id: op.id,
                            username: op.username,
                            password: "",
                            role: op.role,
                            adminPassword: "",
                          });
                          setShowEditModal(true);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                        <span>Edit Operator</span>
                      </button>
                      <button
                        onClick={() => handleDelete(op.id, op.username)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-medium"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                        <span>Hapus Operator</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Info */}
          {filteredOperators.length > 0 && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Menampilkan {filteredOperators.length} dari {totalOperators}{" "}
                operator
              </p>
            </div>
          )}
        </div>

        {/* Modal Tambah */}
        {showAddModal && (
          <Modal
            title="Tambah Operator Baru"
            form={form}
            setForm={setForm}
            onSubmit={handleAdd}
            onClose={() => setShowAddModal(false)}
            buttonLabel="Tambah Operator"
            isEdit={false}
          />
        )}

        {/* Modal Edit */}
        {showEditModal && (
          <Modal
            title="Edit Data Operator"
            form={editForm}
            setForm={setEditForm}
            onSubmit={handleEdit}
            onClose={() => setShowEditModal(false)}
            buttonLabel="Simpan Perubahan"
            isEdit={true}
          />
        )}
      </main>
    </div>
  );
}

// ===========================================================
// 🔹 Komponen Modal
// ===========================================================
function Modal({
  title,
  form,
  setForm,
  onSubmit,
  onClose,
  buttonLabel,
  isEdit,
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
            >
              <FontAwesomeIcon icon={faXmark} className="text-lg" /> {/* ✅ PERBAIKI ICON CLOSE */}
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Masukkan username"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isEdit
                ? "Password Baru (kosongkan jika tidak diubah)"
                : "Password"}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder={isEdit ? "Password baru..." : "Masukkan password"}
              {...(!isEdit ? { required: true } : {})}
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="Kasir">Kasir</option>
              <option value="Manager">Manager</option>
            </select>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <FontAwesomeIcon icon={faKey} className="text-orange-500" />
              <span className="text-sm font-medium text-gray-700">
                Konfirmasi Admin
              </span>
            </div>

            {/* Password Admin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password Admin
              </label>
              <input
                type="password"
                value={form.adminPassword}
                onChange={(e) =>
                  setForm({ ...form, adminPassword: e.target.value })
                }
                required
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Masukkan password admin"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <FontAwesomeIcon icon={isEdit ? faEdit : faUserPlus} />
            <span>{buttonLabel}</span>
          </button>
        </form>
      </div>
    </div>
  );
}