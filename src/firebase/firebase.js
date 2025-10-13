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
} from "firebase/firestore";

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

// --- collection name constants (penting: didefinisikan) ---
const PRODUCTS_COL = "inventori";
const TRANSACTIONS_COL = "transactions";

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
    // 🧩 1️⃣ Siapkan semua ref produk
    const productRefs = txPayload.items.map((it) =>
      doc(db, PRODUCTS_COL, it.productId)
    );

    // 🧩 2️⃣ Baca semua produk dulu
    const productSnaps = await Promise.all(
      productRefs.map((ref) => t.get(ref))
    );

    // 🧩 3️⃣ Validasi & hitung stok baru
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

    // 🧩 4️⃣ Setelah semua read selesai, baru update
    for (const { ref, units } of updatedUnitsList) {
      t.update(ref, { units });
    }

    // 🧩 5️⃣ Terakhir, buat dokumen transaksi
    const newTxRef = doc(transactionsRef); // auto id
    t.set(newTxRef, {
      ...txPayload,
      createdAt: serverTimestamp(),
    });
  });
}
