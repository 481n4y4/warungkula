# 🏆 WarungKula – Sistem Kasir & Inventori Online untuk UMKM
***

## 🎯 Masalah yang Diselesaikan

* Pencatatan pemasukan/pengeluaran toko masih manual → rawan hilang & tidak rapi.
* Inventori/restock barang masih pakai catatan → bikin ribet & bisa salah hitung.
* Kasir butuh alat yang lebih praktis → scanning barcode bikin transaksi lebih cepat.

***

## 💡 Solusi Aplikasi

Website yang berfungsi sebagai **kasir digital + manajemen inventori online**, dengan fitur:

### 1. Pencatatan Transaksi Otomatis

* Input penjualan & pembelian barang.
* Laporan pemasukan & pengeluaran otomatis (harian, mingguan, bulanan).

### 2. Barcode Scanner

* Scan produk pakai **kamera HP/laptop** (tanpa mesin kasir mahal).
* Bisa *generate* barcode otomatis untuk produk baru.

### 3. Inventori Online

* Catat stok barang masuk/keluar.
* Notifikasi jika stok menipis.
* Laporan restock barang langsung dari *web*.

### 4. Dashboard Analitik Sederhana

* Grafik penjualan.
* Produk terlaris.
* Total profit per periode.

***

## 🔧 Teknologi yang Bisa Dipakai

* **Frontend**: React.js (untuk *web* interaktif) atau Vue.js.
* **Backend**: Firebase (biar cepat, tanpa *server* ribet).
* **Database**: Firestore (real-time).
* **Barcode**:
    * *Library* JS seperti **QuaggaJS** atau **JsBarcode**.
    * Bisa *scan* pakai kamera HP/laptop.

***

## 📱 Alur Pengguna

1.  Login → masuk ke *dashboard*.
2.  Tambah produk baru → otomatis dibuatkan barcode.
3.  Kasir *scan* barcode produk → transaksi tercatat otomatis.
4.  Laporan keuangan & stok barang bisa dilihat di *dashboard*.
5.  Saat stok menipis → *user* dapat notifikasi restock.

***

## 🎨 Mockup Tampilan (gambaran)

* **Dashboard**: grafik penjualan + ringkasan pemasukan/pengeluaran.
* **Halaman Kasir**: *form* input + kamera untuk *scan* barcode.
* **Halaman Inventori**: daftar produk, jumlah stok, tombol “Restock”.
* **Halaman Laporan**: tabel transaksi, filter tanggal.

***