import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faUserShield } from "@fortawesome/free-solid-svg-icons";
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchAdmin();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate("/");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

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

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

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

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
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
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden lg:ml-0">
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
              Pengaturan Akun
            </h1>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-md mx-auto">
            {loading ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Memuat data akun...</p>
              </div>
            ) : admin ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {/* Profile Section */}
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 relative">
                    <img
                      src={user.photoURL || "/default-avatar.png"}
                      alt="Admin"
                      className="w-full h-full rounded-full border-4 border-green-100 object-cover"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                      <FontAwesomeIcon icon={faUserShield} className="text-white text-xs" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">{admin.username}</h2>
                  <p className="text-green-600 font-medium">Administrator</p>
                </div>

                {/* Change Password Form */}
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={form.username}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password Lama
                    </label>
                    <input
                      type="password"
                      name="oldPassword"
                      value={form.oldPassword}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Masukkan password lama"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password Baru
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={form.newPassword}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Masukkan password baru"
                    />
                  </div>

                  {/* Message Alert */}
                  {msg.text && (
                    <div
                      className={`p-3 rounded-lg border text-sm ${
                        msg.type === "success"
                          ? "bg-green-50 border-green-200 text-green-800"
                          : "bg-red-50 border-red-200 text-red-800"
                      }`}
                    >
                      {msg.text}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Simpan Perubahan
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="px-6 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                    >
                      Logout
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {/* Profile Section */}
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto mb-4">
                    <img
                      src={user.photoURL || "/default-avatar.png"}
                      alt="User"
                      className="w-full h-full rounded-full border-4 border-blue-100 object-cover"
                    />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Setup Akun</h2>
                  <p className="text-gray-600">Buat akun administrator pertama</p>
                </div>

                {/* Create Admin Form */}
                <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username Admin
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Buat username admin"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password Admin
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={form.newPassword}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Buat password admin"
                    />
                  </div>

                  {/* Message Alert */}
                  {msg.text && (
                    <div
                      className={`p-3 rounded-lg border text-sm ${
                        msg.type === "success"
                          ? "bg-green-50 border-green-200 text-green-800"
                          : "bg-red-50 border-red-200 text-red-800"
                      }`}
                    >
                      {msg.text}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleInit}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Buat Akun Admin
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="px-6 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
                    >
                      Logout
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}