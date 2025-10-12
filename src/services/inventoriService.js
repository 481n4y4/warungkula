import { db } from "../firebase/firebase";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";

const COLLECTION_NAME = "inventori";

export const addItem = async (item) => {
  try {
    await addDoc(collection(db, COLLECTION_NAME), item);
  } catch (error) {
    console.error("Gagal menambahkan barang:", error);
  }
};

export const getItems = async () => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Gagal mengambil data:", error);
    return [];
  }
};

export const getItemById = async (id) => {
  try {
    const ref = doc(db, COLLECTION_NAME, id);
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
    } else {
      console.warn("Barang tidak ditemukan.");
      return null;
    }
  } catch (error) {
    console.error("Gagal mengambil barang:", error);
    return null;
  }
};

export const updateItem = async (id, updatedData) => {
  try {
    const ref = doc(db, COLLECTION_NAME, id);
    await updateDoc(ref, updatedData);
    console.log("Barang berhasil diperbarui!");
  } catch (error) {
    console.error("Gagal memperbarui barang:", error);
  }
};

export const deleteItem = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error("Gagal menghapus barang:", error);
  }
};
