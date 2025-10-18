// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  runTransaction,
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

// --- Collection Constants ---
const PRODUCTS_COL = "inventori";
const TRANSACTIONS_COL = "transaksi";
const OPERATORS_COL = "operators";
const ADMINS_COL = "admins";
const STORE_SESSIONS_COL = "store_sessions";

// ======================================================
// Kasir & Transaksi
// ======================================================

export async function getProductByBarcode(barcode) {
  const q = query(
    collection(db, PRODUCTS_COL),
    where("barcode", "==", barcode)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

export async function searchProductsByName(name) {
  const snapshot = await getDocs(collection(db, PRODUCTS_COL));
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

  const transactionsRef = collection(db, TRANSACTIONS_COL);

  await runTransaction(db, async (t) => {
    const productRefs = txPayload.items.map((it) =>
      doc(db, PRODUCTS_COL, it.productId)
    );

    const productSnaps = await Promise.all(
      productRefs.map((ref) => t.get(ref))
    );

    for (let i = 0; i < txPayload.items.length; i++) {
      const it = txPayload.items[i];
      const pSnap = productSnaps[i];
      if (!pSnap.exists()) throw new Error(`Produk ${it.name} tidak ditemukan`);

      const pData = pSnap.data();
      const units = Array.isArray(pData.units) ? pData.units : [];
      const idx = units.findIndex((u) => u.unit === it.unit);
      if (idx === -1) throw new Error(`Unit ${it.unit} tidak ditemukan`);

      if (units[idx].stock < it.qty) {
        throw new Error(`Stok tidak cukup untuk ${it.name} (${it.unit})`);
      }

      units[idx].stock -= it.qty;
      t.update(productRefs[i], { units });
    }

    const totalPrice = txPayload.items.reduce(
      (sum, it) => sum + (it.sellPrice || 0) * (it.qty || 0),
      0
    );

    t.set(doc(transactionsRef), {
      ...txPayload,
      totalPrice,
      paymentMethod: txPayload.paymentMethod || "Tunai",
      createdAt: serverTimestamp(),
    });
  });
}

// ======================================================
// Operator & Admin Management
// ======================================================

// Ambil semua operator
export async function getAllOperators() {
  const snapshot = await getDocs(collection(db, OPERATORS_COL));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// Verifikasi password admin
export async function verifyAdminPassword(inputPassword) {
  const q = query(collection(db, ADMINS_COL));
  const snapshot = await getDocs(q);
  if (snapshot.empty) throw new Error("Data admin tidak ditemukan");

  const adminData = snapshot.docs[0].data();
  return await bcrypt.compare(inputPassword, adminData.password);
}

// Tambah operator
export async function addOperator(username, password, role, adminPassword) {
  const isAdminValid = await verifyAdminPassword(adminPassword);
  if (!isAdminValid) throw new Error("Password admin salah");

  if (!username || !password || !role)
    throw new Error("Data operator tidak lengkap");

  const hashedPassword = await bcrypt.hash(password, 10);
  await addDoc(collection(db, OPERATORS_COL), {
    username,
    password: hashedPassword,
    role,
    createdAt: new Date(),
  });

  return true;
}

// Hapus operator
export async function deleteOperator(id, adminPassword) {
  const isAdminValid = await verifyAdminPassword(adminPassword);
  if (!isAdminValid) throw new Error("Password admin salah");

  await deleteDoc(doc(db, OPERATORS_COL, id));
  return true;
}

// Verifikasi login operator (untuk fitur "Buka Toko")
export async function verifyOperatorLogin(username, password) {
  const q = query(
    collection(db, OPERATORS_COL),
    where("username", "==", username)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) throw new Error("Operator tidak ditemukan");

  const operator = snapshot.docs[0].data();
  const isValid = await bcrypt.compare(password, operator.password);
  if (!isValid) throw new Error("Password salah");

  return { id: snapshot.docs[0].id, ...operator };
}

// Edit operator (verifikasi password admin)
export async function updateOperator(id, updatedData, adminPassword) {
  const isAdminValid = await verifyAdminPassword(adminPassword);
  if (!isAdminValid) throw new Error("Password admin salah");

  const { username, password, role } = updatedData;

  const updatePayload = { username, role };

  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    updatePayload.password = hashedPassword;
  }

  await updateDoc(doc(db, "operators", id), updatePayload);
  return true;
}

// ======================================================
// Admin Akun & Pengaturan
// ======================================================

export async function getAdminData() {
  const adminRef = doc(db, ADMINS_COL, "main_admin");
  const snap = await getDoc(adminRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function initAdminAccount(username, password) {
  const adminRef = doc(db, ADMINS_COL, "main_admin");
  const snap = await getDoc(adminRef);

  if (snap.exists()) {
    throw new Error("Akun admin sudah ada");
  }

  const hashed = await bcrypt.hash(password, 10);
  await setDoc(adminRef, {
    username,
    password: hashed,
    createdAt: new Date(),
  });
  return true;
}

export async function changeAdminPassword(oldPass, newPass) {
  const adminRef = doc(db, ADMINS_COL, "main_admin");
  const snap = await getDoc(adminRef);
  if (!snap.exists()) throw new Error("Admin data tidak ditemukan");

  const admin = snap.data();
  const isValid = await bcrypt.compare(oldPass, admin.password);
  if (!isValid) throw new Error("Password lama salah");

  const hashedNew = await bcrypt.hash(newPass, 10);
  await updateDoc(adminRef, { password: hashedNew });
  return true;
}

// ======================================================
// Membuka Toko Baru
// ======================================================
export async function openStoreSession(username, password, cashStart) {
  // verifikasi login operator
  const operator = await verifyOperatorLogin(username, password);
  if (!operator) {
    throw new Error("Username atau password salah");
  }

  // cek apakah sudah ada toko yang sedang dibuka
  const active = await getActiveStoreSession();
  if (active) {
    throw new Error("Toko sudah dibuka oleh " + active.operatorName);
  }

  // buat session baru
  const ref = collection(db, STORE_SESSIONS_COL);
  await addDoc(ref, {
    operatorId: operator.id,
    operatorName: operator.username,
    cashStart: parseInt(cashStart),
    openedAt: new Date(),
    isOpen: true,
  });

  return operator; // return operator untuk langsung diarahkan ke mode kasir
}

/**
 * Menutup toko yang sedang aktif
 */
export async function closeStoreSession(adminPassword) {
  // ambil session aktif
  const active = await getActiveStoreSession();

  if (!active) {
    throw new Error("Tidak ada toko yang sedang dibuka");
  }

  // verifikasi password admin (opsional, bisa pakai operator juga)
  // misalnya ambil dokumen admin utama
  const adminDoc = await getDocs(collection(db, "admins"));
  const admin = adminDoc.docs[0]?.data();
  const isMatch = await bcrypt.compare(adminPassword, admin.password);
  if (!isMatch) throw new Error("Password admin salah");

  // update session
  const sessionDoc = doc(db, STORE_SESSIONS_COL, active.id);
  await updateDoc(sessionDoc, {
    isOpen: false,
    closedAt: new Date(),
  });

  return true;
}

/**
 * Mengecek apakah toko sedang aktif
 */
export async function getActiveStoreSession() {
  const q = query(
    collection(db, STORE_SESSIONS_COL),
    where("isOpen", "==", true)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
}

// ======================================================
// Statistik Dashboard
// ======================================================
export async function getDashboardStats() {
  const transaksiRef = collection(db, "transaksi");
  const snapshot = await getDocs(transaksiRef);

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
