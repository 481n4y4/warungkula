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
} from "firebase/firestore";
import bcrypt from "bcryptjs"

const firebaseConfig = {
  apiKey: "AIzaSyAtqfZw645PJ_5hJuqaid8zuRzFXPlYNHw",
  authDomain: "warungkula-54bf1.firebaseapp.com",
  projectId: "warungkula-54bf1",
  storageBucket: "warungkula-54bf1.appspot.com",
  messagingSenderId: "362575710267",
  appId: "1:362575710267:web:7cf748e11480680c43741e",
};

// init
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);


// Inventori
// --- collection name constants (penting: didefinisikan) ---
const PRODUCTS_COL = "inventori";
const TRANSACTIONS_COL = "transaksi";


// Kasir
/**
 * Cari satu produk berdasarkan barcode (mengembalikan objek { id, ...data } atau null)
 */
export async function getProductByBarcode(barcode) {
  const q = query(
    collection(db, PRODUCTS_COL),
    where("barcode", "==", barcode)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

/**
 * Cari produk berdasarkan nama/term (simple client-side filter)
 * returns array of { id, ...data }
 */
export async function searchProductsByName(name) {
  const snapshot = await getDocs(collection(db, "inventori"));
  const results = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .filter((p) => p.name.toLowerCase().includes(name.toLowerCase()));
  console.log("Search results:", results);
  return results;
}

/**
 * Create a transaction and atomically update product units' stock.
 * txPayload example:
 * {
 *   items: [{ productId, barcode, name, unit, qty, sellPrice, subtotal }, ...],
 *   subtotal, tax, total, payment, change, note
 * }
 */
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
    // 1️⃣ Siapkan semua ref produk
    const productRefs = txPayload.items.map((it) =>
      doc(db, PRODUCTS_COL, it.productId)
    );

    // 2️⃣ Baca semua produk
    const productSnaps = await Promise.all(
      productRefs.map((ref) => t.get(ref))
    );

    // 3️⃣ Validasi & update stok
    const updatedUnitsList = [];

    for (let i = 0; i < txPayload.items.length; i++) {
      const it = txPayload.items[i];
      const pSnap = productSnaps[i];

      if (!pSnap.exists()) throw new Error(`Produk ${it.name} tidak ditemukan`);

      const pData = pSnap.data();
      const units = Array.isArray(pData.units) ? pData.units : [];
      const idx = units.findIndex((u) => u.unit === it.unit);
      if (idx === -1)
        throw new Error(`Unit ${it.unit} tidak ditemukan untuk ${it.name}`);

      const currentStock = units[idx].stock || 0;
      if (currentStock < it.qty) {
        throw new Error(
          `Stok tidak cukup untuk ${it.name} (${it.unit}). Sisa: ${currentStock}`
        );
      }

      units[idx] = { ...units[idx], stock: currentStock - it.qty };
      updatedUnitsList.push({ ref: productRefs[i], units });
    }

    // 4️⃣ Update semua stok
    for (const { ref, units } of updatedUnitsList) {
      t.update(ref, { units });
    }

    // 5️⃣ Hitung total harga & tambahkan field penting
    const totalPrice = txPayload.items.reduce(
      (sum, it) => sum + (it.sellPrice || 0) * (it.qty || 0),
      0
    );

    const newTxRef = doc(transactionsRef);
    t.set(newTxRef, {
      ...txPayload,
      totalPrice,
      paymentMethod: txPayload.paymentMethod || "Tunai",
      createdAt: serverTimestamp(),
    });
  });
}


// Operator
// 1️⃣ Ambil semua operator
export async function getAllOperators() {
  const snapshot = await getDocs(collection(db, "operators"));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// 2️⃣ Verifikasi password admin
export async function verifyAdminPassword(inputPassword) {
  const q = query(collection(db, "admins"));
  const snapshot = await getDocs(q);
  if (snapshot.empty) throw new Error("Admin data not found");

  const adminData = snapshot.docs[0].data();
  const isValid = await bcrypt.compare(inputPassword, adminData.password);
  return isValid;
}

// 3️⃣ Tambah operator dengan verifikasi admin
export async function addOperatorWithAdminAuth(newOperator, adminPassword) {
  const isAdminValid = await verifyAdminPassword(adminPassword);
  if (!isAdminValid) throw new Error("Invalid admin password");

  const { username, password, role } = newOperator;

  if (!username || !password || !role) {
    throw new Error("Missing operator data");
  }

  // Hash password operator sebelum simpan
  const hashedPassword = await bcrypt.hash(password, 10);

  await addDoc(collection(db, "operators"), {
    username,
    password: hashedPassword,
    role,
    createdAt: new Date(),
  });

  return true;
}

// 4️⃣ Verifikasi operator login (nanti buat "Buka Toko")
export async function verifyOperatorLogin(username, password) {
  const q = query(collection(db, "operators"), where("username", "==", username));
  const snapshot = await getDocs(q);
  if (snapshot.empty) throw new Error("Operator not found");

  const operator = snapshot.docs[0].data();
  const isValid = await bcrypt.compare(password, operator.password);

  if (!isValid) throw new Error("Invalid password");

  return {
    id: snapshot.docs[0].id,
    ...operator,
  };
}


// Akun
// Ambil data admin
export async function getAdminData() {
  const adminRef = doc(db, "admins", "main_admin"); // misal pakai ID tetap
  const snap = await getDoc(adminRef);
  if (!snap.exists()) {
    return null;
  }
  return { id: snap.id, ...snap.data() };
}

// Inisialisasi admin baru (kalau belum ada)
export async function initAdminAccount(username, password) {
  const adminRef = doc(db, "admins", "main_admin");
  const hashed = await bcrypt.hash(password, 10);
  await setDoc(adminRef, {
    username,
    password: hashed,
    createdAt: new Date(),
  });
  return true;
}

// Ubah password admin (dengan verifikasi password lama)
export async function changeAdminPassword(oldPass, newPass) {
  const adminRef = doc(db, "admins", "main_admin");
  const snap = await getDoc(adminRef);
  if (!snap.exists()) throw new Error("Admin data not found");

  const admin = snap.data();
  const isValid = await bcrypt.compare(oldPass, admin.password);
  if (!isValid) throw new Error("Password lama salah");

  const hashedNew = await bcrypt.hash(newPass, 10);
  await updateDoc(adminRef, { password: hashedNew });
  return true;
}