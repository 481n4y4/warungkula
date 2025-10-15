import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import {
  getAllOperators,
  addOperatorWithAdminAuth,
} from "../firebase/firebase";

export default function Operator() {
  const navigate = useNavigate();
  const [operators, setOperators] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "kasir",
    adminPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Ambil semua operator saat page dibuka
  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    const data = await getAllOperators();
    setOperators(data);
  };

  const handleInputChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddOperator = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await addOperatorWithAdminAuth(
        {
          username: form.username.trim(),
          password: form.password,
          role: form.role,
        },
        form.adminPassword
      );

      setSuccessMsg("Operator berhasil ditambahkan!");
      setForm({ username: "", password: "", role: "kasir", adminPassword: "" });
      await fetchOperators();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="p-4">
      {/* Header */}
      <nav className="bg-white shadow-md p-4 flex items-center sticky top-0 z-10">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-gray-600 hover:text-gray-900 transition"
        >
          <FontAwesomeIcon icon={faArrowLeft} size="lg" />
        </button>
        <h1 className="flex-1 text-center text-xl font-bold text-gray-800">
          Operator Kasir
        </h1>
      </nav>

      {/* Content */}
      <div className="mt-6 bg-white shadow-md rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-700">Daftar Operator</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-1" /> Tambah Operator
          </button>
        </div>

        {/* Table */}
        {operators.length === 0 ? (
          <p className="text-gray-500 text-sm">Belum ada operator.</p>
        ) : (
          <table className="w-full border text-sm text-left">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="p-2 border">Username</th>
                <th className="p-2 border">Role</th>
                <th className="p-2 border">Dibuat</th>
              </tr>
            </thead>
            <tbody>
              {operators.map((op) => (
                <tr key={op.id} className="hover:bg-gray-50">
                  <td className="p-2 border">{op.username}</td>
                  <td className="p-2 border capitalize">{op.role}</td>
                  <td className="p-2 border">
                    {op.createdAt?.toDate
                      ? new Date(op.createdAt.toDate()).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Tambah Operator */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
            <h2 className="text-lg font-semibold mb-4 text-center">
              Tambah Operator Baru
            </h2>

            <form onSubmit={handleAddOperator} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleInputChange}
                  required
                  className="w-full border p-2 rounded-md mt-1 focus:outline-blue-500"
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
                  onChange={handleInputChange}
                  required
                  className="w-full border p-2 rounded-md mt-1 focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Role</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded-md mt-1 focus:outline-blue-500"
                >
                  <option value="kasir">Kasir</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="border-t pt-3">
                <label className="text-sm font-medium text-gray-700">
                  Password Admin (untuk konfirmasi)
                </label>
                <input
                  type="password"
                  name="adminPassword"
                  value={form.adminPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full border p-2 rounded-md mt-1 focus:outline-blue-500"
                />
              </div>

              {errorMsg && (
                <p className="text-red-600 text-sm text-center">{errorMsg}</p>
              )}
              {successMsg && (
                <p className="text-green-600 text-sm text-center">{successMsg}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
              >
                {loading ? "Menyimpan..." : "Tambah Operator"}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
