import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // bersihkan listener saat komponen unmount
    return () => unsubscribe();
  }, []);

  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center top-0 z-50 sticky">
      <h1 className="text-2xl font-bold text-blue-700">WarungKula</h1>

      <div className="flex items-center gap-4">
        {user ? (
          <button
            onClick={() => navigate("/akun")}
            className="flex items-center gap-2"
          >
            <img
              src={user.photoURL || "/default-avatar.png"}
              alt="User"
              className="w-10 h-10 rounded-full border-2 border-blue-400 shadow-md"
            />
          </button>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="text-blue-600 font-medium"
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
}
