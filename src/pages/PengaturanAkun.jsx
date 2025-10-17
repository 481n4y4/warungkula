import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import {
  getAdminData,
  initAdminAccount,
  changeAdminPassword,
} from "../firebase/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebase";

export default function PengaturanAkun() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    username: "",
    oldPassword: "",
    newPassword: "",
  });
  const [msg, setMsg] = useState({ type: "", text: "" });

  //SideBar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Ambil data admin saat pertama kali
  useEffect(() => {
    fetchAdmin();
  }, []);

  const fetchAdmin = async () => {
    setLoading(true);
    try {
      const data = await getAdminData();
      if (data) {
        setAdmin(data);
        setForm((f) => ({ ...f, username: data.username }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle perubahan input
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // Simpan perubahan password admin
  const handleSave = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    try {
      await changeAdminPassword(form.oldPassword, form.newPassword);
      setMsg({ type: "success", text: "Password berhasil diubah!" });
      setForm((f) => ({ ...f, oldPassword: "", newPassword: "" }));
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
  };

  // Inisialisasi akun admin pertama kali
  const handleInit = async () => {
    if (!form.username || !form.newPassword) {
      setMsg({
        type: "error",
        text: "Isi username dan password terlebih dahulu",
      });
      return;
    }

    try {
      await initAdminAccount(form.username, form.newPassword);
      setMsg({ type: "success", text: "Akun admin berhasil dibuat!" });
      await fetchAdmin();
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    }
  };
  const [user, setUser] = useState(null);

  // Mengecek apakah user sudah login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate("/");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  if (!user) return null;

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <section className="flex flex-col md:flex-row">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex flex-9 flex-col">
        <nav className="flex items-center gap-3 bg-white shadow-md px-6 py-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-green-600 text-2xl flex md:hidden"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>

          <h1 className="text-xl font-bold text-gray-800">Pengaturan Akun</h1>
        </nav>

        <div className="mt-6 max-w-md mx-auto flex flex-col items-center">
          {loading ? (
            <p className="text-center text-gray-500">Memuat...</p>
          ) : admin ? (
            <>
              <img
                src={user.photoURL || "/default-avatar.png"}
                alt="User"
                className="w-20 h-20 rounded-full border-2 border-blue-400 shadow-md"
              />

              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition mt-3 mb-4"
              >
                Logout
              </button>
              <h2 className="text-lg font-semibold mb-4 text-center">
                Ubah Password Admin
              </h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    type="text"
                    value={form.username}
                    disabled
                    className="w-full border p-2 rounded-md mt-1 bg-gray-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Password Lama
                  </label>
                  <input
                    type="password"
                    name="oldPassword"
                    value={form.oldPassword}
                    onChange={handleChange}
                    required
                    className="w-full border p-2 rounded-md mt-1 focus:outline-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Password Baru
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={form.newPassword}
                    onChange={handleChange}
                    required
                    className="w-full border p-2 rounded-md mt-1 focus:outline-blue-500"
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
            </>
          ) : (
            <>
              <img
                src={user.photoURL || "/default-avatar.png"}
                alt="User"
                className="w-20 h-20 rounded-full border-2 border-blue-400 shadow-md"
              />

              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition mt-3 mb-4"
              >
                Logout
              </button>
              <h2 className="text-lg font-semibold mb-4 text-center">
                Buat Akun Admin
              </h2>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    className="w-full border p-2 rounded-md mt-1 focus:outline-blue-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={form.newPassword}
                    onChange={handleChange}
                    className="w-full border p-2 rounded-md mt-1 focus:outline-blue-500"
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
                  type="button"
                  onClick={handleInit}
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
                >
                  Buat Akun Admin
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </section>
  );
}
