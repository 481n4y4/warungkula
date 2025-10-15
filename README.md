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
## Struktur Proyek WARUNGKULA

Proyek ini memiliki struktur direktori yang terorganisir untuk memisahkan aset, komponen, halaman, dan layanan.

```

WARUNGKULA/
├── public/                  
├── src/                     
│   ├── assets/              
│   │   ├── css/             
│   │   │     └── index.css  
│   │   └── img/             
│   │        └── WarungKula.png
│   ├── components/          
│   │   ├── Navbar.jsx
│   │   └── Receipt.jsx
│   ├── firebase/            
│   │   └── firebase.js      
│   ├── pages/               
│   │   ├── BarcodePrint.jsx   
│   │   ├── Dashboard.jsx     
│   │   ├── EditBarang.jsx    
│   │   ├── Inventori.jsx     
│   │   ├── Kasir.jsx         
│   │   ├── Login.jsx        
│   │   ├── Register.jsx  
│   │   ├── LaporanPenjualan.jsx
│   │   └── TambahBarang.jsx  
│   ├── services/             
│   │   └── inventoriService.js  
│   ├── App.jsx               
│   └── main.jsx              
├── .gitignore                
├── eslint.config.js          
├── index.html               
├── package.json              
├── README.md                 
└── vite.config.js           

```
***

## Penjelasan Singkat Direktori Kunci

* **`src/pages/`**: Menyimpan komponen utama yang bertindak sebagai halaman yang memiliki rute dalam aplikasi.
* **`src/components/`**: Berisi komponen UI yang lebih kecil dan dapat digunakan kembali (misalnya: tombol, kartu, modal).
* **`src/services/`**: Tempat untuk logika bisnis dan fungsi yang berinteraksi dengan data atau API, memisahkannya dari komponen UI.
* **`src/assets/`**: Digunakan untuk menyimpan aset statis seperti gambar, ikon, dan gaya khusus.