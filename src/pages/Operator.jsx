// src/pages/Operator.jsx
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faPlus,
  faTrash,
  faEdit,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import {
  getAllOperators,
  addOperator,
  deleteOperator,
  updateOperator,
} from "../firebase/firebase";
import Sidebar from "../components/Sidebar";

export default function Operator() {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "Kasir",
    adminPassword: "",
  });
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    id: "",
    username: "",
    password: "",
    role: "",
    adminPassword: "",
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    setLoading(true);
    try {
      const data = await getAllOperators();
      setOperators(data);
    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: "Gagal memuat data operator" });
    } finally {
      setLoading(false);
    }
  };

  const filteredOperators = operators.filter((op) =>
    op.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

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
      setShowModal(false);
      await fetchOperators();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    try {
      await updateOperator(
        editData.id,
        {
          username: editData.username,
          password: editData.password,
          role: editData.role,
        },
        editData.adminPassword
      );
      setMsg({ type: "success", text: "Data operator berhasil diubah!" });
      setShowEditModal(false);
      await fetchOperators();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
  };

  const handleDelete = async (id) => {
    const adminPassword = prompt("Masukkan password admin untuk konfirmasi:");
    if (!adminPassword) return;

    try {
      await deleteOperator(id, adminPassword);
      await fetchOperators();
    } catch (err) {
      alert("Gagal menghapus operator: " + err.message);
    }
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

          <h1 className="text-xl font-bold text-gray-800">Operator</h1>
        </nav>

        <div>
          {/* Konten utama */}
          <div className="p-4 max-w-5xl mx-auto">
            {/* Search Bar */}
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
                onClick={() => setShowModal(true)}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
              >
                <FontAwesomeIcon icon={faPlus} /> Tambah
              </button>
            </div>

            {/* Tabel data */}
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
                              setEditData({
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

          {/* Modal Tambah Operator */}
          {showModal && (
            <Modal
              title="Tambah Operator Baru"
              form={form}
              setForm={setForm}
              msg={msg}
              onSubmit={handleAdd}
              onClose={() => setShowModal(false)}
              buttonLabel="Tambah Operator"
            />
          )}

          {/* Modal Edit Operator */}
          {showEditModal && (
            <Modal
              title="Edit Operator"
              form={editData}
              setForm={setEditData}
              msg={msg}
              onSubmit={handleEdit}
              onClose={() => setShowEditModal(false)}
              buttonLabel="Simpan Perubahan"
              isEdit
            />
          )}
        </div>
      </main>
    </section>
  );
}

/* 🔹 Reusable Modal Component */
function Modal({
  title,
  form,
  setForm,
  msg,
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
          <div>
            <label className="text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              className="w-full border rounded-md p-2 mt-1 focus:outline-blue-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              {isEdit
                ? "Password Baru (kosongkan jika tidak diubah)"
                : "Password"}
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border rounded-md p-2 mt-1 focus:outline-blue-500"
              {...(!isEdit ? { required: true } : {})}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border rounded-md p-2 mt-1"
            >
              <option>Kasir</option>
              <option>Manager</option>
            </select>
          </div>
          <hr />
          <div>
            <label className="text-sm font-medium text-gray-700">
              Password Admin (untuk konfirmasi)
            </label>
            <input
              type="password"
              name="adminPassword"
              value={form.adminPassword}
              onChange={(e) =>
                setForm({ ...form, adminPassword: e.target.value })
              }
              required
              className="w-full border rounded-md p-2 mt-1 focus:outline-blue-500"
            />
          </div>

          {msg.text && (
            <p
              className={`text-center text-sm ${
                msg.type === "error" ? "text-red-600" : "text-green-600"
              }`}
            >
              {msg.text}
            </p>
          )}

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
