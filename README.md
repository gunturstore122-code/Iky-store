# Website Toko Digital — Drip API

Starter website responsif untuk menampilkan katalog produk dari endpoint publik Drip Client Official.

## Yang sudah berfungsi
- Mengambil katalog dari `GET https://dripclientofficial.dev/api/v1/products` melalui server.
- Menampilkan nama produk, kode API, harga, dan status stok.
- Pencarian produk dan tombol muat ulang.
- API key tidak ditaruh di HTML/frontend.

## Menjalankan di komputer/server
Perlu Node.js 18 atau lebih baru.

1. Ekstrak ZIP.
2. Jalankan `npm start`.
3. Buka `http://localhost:3000`.

Katalog publik tidak memerlukan API key. Jika ingin mencoba harga tier akun, salin `.env.example` menjadi `.env`, masukkan API key BARU ke `DRIP_API_KEY`, lalu jalankan server dengan environment variable tersebut. Jangan upload file `.env` ke repositori publik.

## Deploy
Deploy aplikasi Node.js ini ke hosting yang mendukung Node.js. Set start command ke `npm start`. Jika perlu key, tambahkan `DRIP_API_KEY` melalui menu Environment Variables/Secrets di hosting, bukan di kode website.

## Batasan
Ini baru katalog produk. Belum ada checkout, pembayaran, pembuatan order, atau pengiriman lisensi otomatis. Sebelum menambahkan order, periksa schema request resmi untuk `POST /api/v1/orders`, aturan SKU, dan alur pembayaran di dokumentasi penyedia API.

Jika katalog gagal dimuat, cek status API dan log server. Error `Failed to fetch` di playground browser dapat disebabkan oleh CORS; website ini memanggil API dari server untuk menghindari masalah CORS browser.
