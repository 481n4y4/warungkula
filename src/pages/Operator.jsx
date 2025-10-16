// src/pages/Operator.jsx
import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faPlus,
  faTrash,
  faEdit,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import {
  getAllOperators,
  addOperator,
  deleteOperator,
  updateOperator,
} from "../firebase/firebase";

export default function Operator() {
  const navigate = useNavigate();
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

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
    <section className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-md p-3 sm:p-4 flex items-center sticky top-0 z-50">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-gray-600 hover:text-gray-900 transition"
        >
          <FontAwesomeIcon icon={faArrowLeft} size="lg" />
        </button>
        <h1 className="flex-1 text-center text-lg sm:text-xl font-bold text-gray-800">
          Data Operator
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center gap-1 sm:gap-2 hover:bg-blue-700 transition text-sm sm:text-base"
        >
          <FontAwesomeIcon icon={faPlus} /> Tambah
        </button>
      </nav>

      {/* Tabel Data */}
      <div className="p-3 sm:p-6">
        {loading ? (
          <p className="text-center text-gray-500">Memuat data...</p>
        ) : operators.length === 0 ? (
          <p className="text-center text-gray-500">Belum ada operator.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full rounded-lg mt-4 text-center border border-gray-200 text-sm sm:text-base">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2">No</th>
                  <th className="p-2">Username</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {operators.map((op, i) => (
                  <tr
                    key={op.id}
                    className="bg-gray-50 hover:bg-gray-100 border-b"
                  >
                    <td className="p-2">{i + 1}</td>
                    <td className="p-2">{op.username}</td>
                    <td className="p-2">{op.role}</td>
                    <td className="p-2 flex justify-center gap-3">
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
                        className="text-blue-600 hover:text-blue-800"
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

      {/* ===== Modal Tambah ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-3">
          <div className="bg-white p-6 rounded-lg w-full max-w-sm sm:max-w-md shadow-lg relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-4 text-gray-600 hover:text-gray-900"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-center mb-4">
              Tambah Operator Baru
            </h2>
            <form onSubmit={handleAdd} className="space-y-4 text-sm sm:text-base">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-md p-2 mt-1 focus:outline-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-md p-2 mt-1 focus:outline-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Role</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2 mt-1"
                >
                  <option>Kasir</option>
                  <option>Admin</option>
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
                  onChange={handleChange}
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
                Tambah Operator
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===== Modal Edit ===== */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-3">
          <div className="bg-white p-6 rounded-lg w-full max-w-sm sm:max-w-md shadow-lg relative">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-3 right-4 text-gray-600 hover:text-gray-900"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-center mb-4">Edit Operator</h2>
            <form onSubmit={handleEdit} className="space-y-4 text-sm sm:text-base">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  type="text"
                  value={editData.username}
                  onChange={(e) =>
                    setEditData({ ...editData, username: e.target.value })
                  }
                  required
                  className="w-full border rounded-md p-2 mt-1 focus:outline-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Password Baru (kosongkan jika tidak diubah)
                </label>
                <input
                  type="password"
                  value={editData.password}
                  onChange={(e) =>
                    setEditData({ ...editData, password: e.target.value })
                  }
                  className="w-full border rounded-md p-2 mt-1 focus:outline-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Role</label>
                <select
                  value={editData.role}
                  onChange={(e) =>
                    setEditData({ ...editData, role: e.target.value })
                  }
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
                  value={editData.adminPassword}
                  onChange={(e) =>
                    setEditData({ ...editData, adminPassword: e.target.value })
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
                Simpan Perubahan
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
