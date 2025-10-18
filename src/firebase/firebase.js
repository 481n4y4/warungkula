import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  serverTimestamp,
  getDoc,
  updateDoc,
  setDoc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import bcrypt from "bcryptjs";

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyAtqfZw645PJ_5hJuqaid8zuRzFXPlYNHw",
  authDomain: "warungkula-54bf1.firebaseapp.com",
  projectId: "warungkula-54bf1",
  storageBucket: "warungkula-54bf1.appspot.com",
  messagingSenderId: "362575710267",
  appId: "1:362575710267:web:7cf748e11480680c43741e",
};

// --- Initialize ---
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);

// --- Helper untuk menunggu user login ---
export function waitForUser() {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (user) resolve(user);
      else reject(new Error("User belum login"));
    });
  });
}

// --- Helper untuk koleksi & dokumen user ---
async function userCollection(path) {
  const user = auth.currentUser || (await waitForUser());
  return collection(db, `users/${user.uid}/${path}`);
}

async function userDoc(path, id) {
  const user = auth.currentUser || (await waitForUser());
  return doc(db, `users/${user.uid}/${path}/${id}`);
}

// ======================================================
// Kasir & Transaksi
// ======================================================

export async function getProductByBarcode(barcode) {
  const colRef = await userCollection("inventori");
  const q = query(colRef, where("barcode", "==", barcode));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

export async function searchProductsByName(name) {
  const colRef = await userCollection("inventori");
  const snapshot = await getDocs(colRef);
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((p) => p.name.toLowerCase().includes(name.toLowerCase()));
}

export async function createTransactionWithStockUpdate(txPayload) {
  if (
    !txPayload ||
    !Array.isArray(txPayload.items) ||
    txPayload.items.length === 0
  ) {
    throw new Error("Invalid transaction payload");
  }

  console.log("Memulai transaksi dengan payload:", txPayload);

  const user = auth.currentUser;
  if (!user) throw new Error("User belum login");

  try {
    // 1. Update stok untuk setiap produk
    for (const item of txPayload.items) {
      const productRef = doc(db, `users/${user.uid}/inventori`, item.productId);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        throw new Error(`Produk ${item.name} tidak ditemukan`);
      }

      const productData = productSnap.data();
      const units = Array.isArray(productData.units) ? productData.units : [];
      const unitIndex = units.findIndex((u) => u.unit === item.unit);

      if (unitIndex === -1) {
        throw new Error(
          `Unit ${item.unit} tidak ditemukan untuk produk ${item.name}`
        );
      }

      if (units[unitIndex].stock < item.qty) {
        throw new Error(
          `Stok tidak cukup untuk ${item.name} (${item.unit}). Stok tersedia: ${units[unitIndex].stock}`
        );
      }

      // Kurangi stok
      units[unitIndex].stock -= item.qty;
      await updateDoc(productRef, { units });
      console.log(
        `Stok updated untuk ${item.name}: ${
          units[unitIndex].stock + item.qty
        } -> ${units[unitIndex].stock}`
      );
    }

    // 2. Simpan transaksi
    const transaksiRef = collection(db, `users/${user.uid}/transaksi`);
    const transactionData = {
      ...txPayload,
      totalPrice: txPayload.total,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(transaksiRef, transactionData);
    console.log("Transaksi berhasil dibuat dengan ID:", docRef.id);

    return { id: docRef.id };
  } catch (error) {
    console.error("Error dalam transaksi:", error);

    // Rollback stok jika transaksi gagal
    if (error.message.includes("Stok tidak cukup")) {
      throw error; // Jangan rollback untuk error stok
    }

    throw new Error(`Gagal membuat transaksi: ${error.message}`);
  }
}

export async function getTransactionById(transactionId) {
  const user = auth.currentUser;
  if (!user) throw new Error("User belum login");

  const docRef = doc(db, `users/${user.uid}/transaksi`, transactionId);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    throw new Error(`Transaksi dengan ID ${transactionId} tidak ditemukan`);
  }

  return { id: snap.id, ...snap.data() };
}

export async function getAllTransactions() {
  const user = auth.currentUser;
  if (!user) throw new Error("User belum login");

  const transaksiRef = collection(db, `users/${user.uid}/transaksi`);
  const snapshot = await getDocs(transaksiRef);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// ======================================================
// Operator & Admin Management
// ======================================================

export async function getAllOperators() {
  const colRef = await userCollection("operators");
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function verifyAdminPassword(inputPassword) {
  const colRef = await userCollection("admins");
  const snapshot = await getDocs(colRef);
  if (snapshot.empty) throw new Error("Data admin tidak ditemukan");

  const adminData = snapshot.docs[0].data();
  return await bcrypt.compare(inputPassword, adminData.password);
}

export async function addOperator(username, password, role, adminPassword) {
  const isAdminValid = await verifyAdminPassword(adminPassword);
  if (!isAdminValid) throw new Error("Password admin salah");

  if (!username || !password || !role)
    throw new Error("Data operator tidak lengkap");

  const hashedPassword = await bcrypt.hash(password, 10);
  const colRef = await userCollection("operators");
  await addDoc(colRef, {
    username,
    password: hashedPassword,
    role,
    createdAt: new Date(),
  });

  return true;
}

export async function deleteOperator(id, adminPassword) {
  const isAdminValid = await verifyAdminPassword(adminPassword);
  if (!isAdminValid) throw new Error("Password admin salah");

  const docRef = await userDoc("operators", id);
  await deleteDoc(docRef);
  return true;
}

export async function verifyOperatorLogin(username, password) {
  const colRef = await userCollection("operators");
  const q = query(colRef, where("username", "==", username));
  const snapshot = await getDocs(q);
  if (snapshot.empty) throw new Error("Operator tidak ditemukan");

  const operator = snapshot.docs[0].data();
  const isValid = await bcrypt.compare(password, operator.password);
  if (!isValid) throw new Error("Password salah");

  return { id: snapshot.docs[0].id, ...operator };
}

export async function updateOperator(id, updatedData, adminPassword) {
  const isAdminValid = await verifyAdminPassword(adminPassword);
  if (!isAdminValid) throw new Error("Password admin salah");

  const { username, password, role } = updatedData;
  const updatePayload = { username, role };

  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    updatePayload.password = hashedPassword;
  }

  const docRef = await userDoc("operators", id);
  await updateDoc(docRef, updatePayload);
  return true;
}

// ======================================================
// Admin Akun & Pengaturan
// ======================================================

export async function getAdminData() {
  const docRef = await userDoc("admins", "main_admin");
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function initAdminAccount(username, password) {
  const docRef = await userDoc("admins", "main_admin");
  const snap = await getDoc(docRef);

  if (snap.exists()) throw new Error("Akun admin sudah ada");

  const hashed = await bcrypt.hash(password, 10);
  await setDoc(docRef, {
    username,
    password: hashed,
    createdAt: new Date(),
  });
  return true;
}

export async function changeAdminPassword(oldPass, newPass) {
  const docRef = await userDoc("admins", "main_admin");
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error("Admin data tidak ditemukan");

  const admin = snap.data();
  const isValid = await bcrypt.compare(oldPass, admin.password);
  if (!isValid) throw new Error("Password lama salah");

  const hashedNew = await bcrypt.hash(newPass, 10);
  await updateDoc(docRef, { password: hashedNew });
  return true;
}

// ======================================================
// Membuka & Menutup Toko
// ======================================================

export async function openStoreSession(username, password, cashStart) {
  const operator = await verifyOperatorLogin(username, password);
  if (!operator) throw new Error("Username atau password salah");

  const active = await getActiveStoreSession();
  if (active) throw new Error("Toko sudah dibuka oleh " + active.operatorName);

  const colRef = await userCollection("store_sessions");
  await addDoc(colRef, {
    operatorId: operator.id,
    operatorName: operator.username,
    cashStart: parseInt(cashStart),
    openedAt: new Date(),
    isOpen: true,
  });

  return operator;
}

export async function closeStoreSession(adminPassword) {
  const active = await getActiveStoreSession();
  if (!active) throw new Error("Tidak ada toko yang sedang dibuka");

  const colRef = await userCollection("admins");
  const snapshot = await getDocs(colRef);
  const admin = snapshot.docs[0]?.data();
  const isMatch = await bcrypt.compare(adminPassword, admin.password);
  if (!isMatch) throw new Error("Password admin salah");

  const docRef = await userDoc("store_sessions", active.id);
  await updateDoc(docRef, {
    isOpen: false,
    closedAt: new Date(),
  });

  return true;
}

export async function getActiveStoreSession() {
  const colRef = await userCollection("store_sessions");
  const q = query(colRef, where("isOpen", "==", true));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
}

// ======================================================
// Statistik Dashboard
// ======================================================

export async function getDashboardStats() {
  const colRef = await userCollection("transaksi");
  const snapshot = await getDocs(colRef);

  let totalPemasukan = 0;
  let totalTransaksi = 0;
  let totalProduk = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    totalPemasukan += data.totalPrice || data.total || 0;
    totalTransaksi++;
    if (Array.isArray(data.items)) {
      data.items.forEach((item) => (totalProduk += item.qty || 0));
    }
  });

  return { totalPemasukan, totalTransaksi, totalProduk };
}
