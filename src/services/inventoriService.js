// src/services/InventoriService.js
import {
  db,
  waitForUser,
} from "../firebase/firebase";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";

// Helper agar otomatis pakai path user
function userCollection(path, userId) {
  return collection(db, `users/${userId}/${path}`);
}

function userDoc(path, userId, id) {
  return doc(db, `users/${userId}/${path}/${id}`);
}

// ======================================================
// INVENTORI PER USER
// ======================================================

export const addItem = async (item) => {
  try {
    const user = await waitForUser();
    await addDoc(userCollection("inventori", user.uid), item);
  } catch (error) {
    console.error("❌ Gagal menambahkan barang:", error);
  }
};

export const getItems = async () => {
  try {
    const user = await waitForUser();
    const snapshot = await getDocs(userCollection("inventori", user.uid));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("❌ Gagal mengambil data inventori:", error);
    return [];
  }
};

export const getItemById = async (id) => {
  try {
    const user = await waitForUser();
    const ref = userDoc("inventori", user.uid, id);
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
    } else {
      console.warn("⚠️ Barang tidak ditemukan.");
      return null;
    }
  } catch (error) {
    console.error("❌ Gagal mengambil barang:", error);
    return null;
  }
};

export const updateItem = async (id, updatedData) => {
  try {
    const user = await waitForUser();
    const ref = userDoc("inventori", user.uid, id);
    await updateDoc(ref, updatedData);
    console.log("✅ Barang berhasil diperbarui!");
  } catch (error) {
    console.error("❌ Gagal memperbarui barang:", error);
  }
};

export const deleteItem = async (id) => {
  try {
    const user = await waitForUser();
    await deleteDoc(userDoc("inventori", user.uid, id));
  } catch (error) {
    console.error("❌ Gagal menghapus barang:", error);
  }
};
