import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faPlus,
  faTrash,
  faEdit,
  faSearch,
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
  const handleDelete = async (id) => {
    const adminPassword = prompt("Masukkan password admin untuk konfirmasi:");
    if (!adminPassword) return;
    try {
      await deleteOperator(id, adminPassword);
      fetchOperators();
    } catch (err) {
      alert("Gagal menghapus operator: " + err.message);
    }
  };

  // ===========================================================
  // 🔹 UI Render
  // ===========================================================
  return (
    <section className="flex min-h-screen">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 flex flex-col">
        {/* Navbar */}
        <nav className="flex items-center gap-3 bg-white shadow-md px-6 py-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-green-600 text-2xl flex md:hidden"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Kelola Operator</h1>
        </nav>

        {/* Konten */}
        <div className="p-4 max-w-5xl mx-auto w-full">
          {/* Search & Add */}
          <div className="flex justify-between mb-4">
            <div className="relative w-full sm:w-2/3 md:w-1/2">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-3 text-gray-400"
              />
              <input
                type="text"
                placeholder="Cari operator..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-blue-500"
              />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
            >
              <FontAwesomeIcon icon={faPlus} /> Tambah
            </button>
          </div>

          {/* Tabel */}
          {loading ? (
            <p className="text-center text-gray-500">Memuat data...</p>
          ) : filteredOperators.length === 0 ? (
            <p className="text-center text-gray-500">
              {search ? "Operator tidak ditemukan." : "Belum ada operator."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full rounded-lg mt-4 text-center border border-gray-200">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-2">No</th>
                    <th className="p-2">Username</th>
                    <th className="p-2">Role</th>
                    <th className="p-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOperators.map((op, i) => (
                    <tr
                      key={op.id}
                      className="bg-gray-50 hover:bg-gray-100 border-b"
                    >
                      <td className="p-2">{i + 1}</td>
                      <td className="p-2">{op.username}</td>
                      <td className="p-2">{op.role}</td>
                      <td className="p-2">
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
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={() => handleDelete(op.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            isEdit
          />
        )}
      </main>
    </section>
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
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-96 shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-600 hover:text-gray-900"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold text-center mb-4">{title}</h2>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              className="w-full border rounded-md p-2 mt-1 focus:outline-blue-500"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              {isEdit
                ? "Password Baru (kosongkan jika tidak diubah)"
                : "Password"}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border rounded-md p-2 mt-1 focus:outline-blue-500"
              {...(!isEdit ? { required: true } : {})}
            />
          </div>

          {/* Role */}
          <div>
            <label className="text-sm font-medium text-gray-700">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border rounded-md p-2 mt-1"
            >
              <option value="Kasir">Kasir</option>
              <option value="Manager">Manager</option>
            </select>
          </div>

          <hr />

          {/* Password Admin */}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Password Admin (konfirmasi)
            </label>
            <input
              type="password"
              value={form.adminPassword}
              onChange={(e) =>
                setForm({ ...form, adminPassword: e.target.value })
              }
              required
              className="w-full border rounded-md p-2 mt-1 focus:outline-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            {buttonLabel}
          </button>
        </form>
      </div>
    </div>
  );
}
