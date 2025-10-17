import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import StoreWidget from "../components/StoreWidget";
import {
  getAllOperators,
  getActiveStoreSession,
  openStoreSession,
} from "../firebase/firebase";

export default function Dashboard() {
  const navigate = useNavigate();
  const [operators, setOperators] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    operator: "",
    password: "",
    cashStart: "",
  });
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOperators();
    fetchActiveSession();
  }, []);

  const fetchOperators = async () => {
    const data = await getAllOperators();
    setOperators(data);
  };

  const fetchActiveSession = async () => {
    const session = await getActiveStoreSession();
    setActiveSession(session);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleOpenStore = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({});

    try {
      await openStoreSession(form.operator, form.password, form.cashStart);
      setMsg({ type: "success", text: "Toko berhasil dibuka!" });
      setShowModal(false);
      fetchActiveSession();
      navigate("/kasir");
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="p-8 flex flex-col gap-4">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Dashboard</h2>

        <div>
          <StoreWidget onEnterCashier={() => navigate("/kasir")} />
          {/* widget lain seperti laporan, inventori, dll */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-md text-center">
            <h3 className="text-gray-500">Total Pemasukan</h3>
            <p className="text-3xl font-bold text-green-600">Rp 2.500.000</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md text-center">
            <h3 className="text-gray-500">Total Pengeluaran</h3>
            <p className="text-3xl font-bold text-red-500">Rp 1.200.000</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md text-center">
            <h3 className="text-gray-500">Jumlah Produk</h3>
            <p className="text-3xl font-bold text-blue-600">87</p>
          </div>
        </div>

        <div className="mt-10 flex gap-4 flex-wrap">
          {activeSession ? (
            <>
              <button
                onClick={async () => {
                  const session = await getActiveStoreSession();
                  if (session) {
                    navigate("/kasir");
                  } else {
                    setMsg({ type: "error", text: "Toko belum dibuka!" });
                  }
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Masuk Mode Kasir ({activeSession.operatorName})
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
            >
              Buka Toko
            </button>
          )}

          <button
            onClick={() => navigate("/laporan")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Laporan Penjualan
          </button>

          <button
            onClick={() => navigate("/inventori")}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            Inventori Barang
          </button>

          <button
            onClick={() => navigate("/operator")}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            Operator Kasir
          </button>
        </div>
      </div>

      {/* Modal Buka Toko */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-lg relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-4 text-gray-600 hover:text-gray-900"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-center mb-4">Buka Toko</h2>
            <form onSubmit={handleOpenStore} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Pilih Operator
                </label>
                <select
                  name="operator"
                  value={form.operator}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-md p-2 mt-1"
                >
                  <option value="">-- Pilih Operator --</option>
                  {operators.map((op) => (
                    <option key={op.id} value={op.username}>
                      {op.username}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Password Operator
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
                <label className="text-sm font-medium text-gray-700">
                  Kas Awal
                </label>
                <input
                  type="number"
                  name="cashStart"
                  value={form.cashStart}
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
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
              >
                {loading ? "Membuka..." : "Konfirmasi & Masuk Kasir"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
