# IKY STORE

Proyek website katalog IKY STORE untuk dijalankan di Render. API key disimpan sebagai Environment Variable di Render, bukan di file proyek.

## Cara paling singkat

1. Upload **isi folder ini** ke repository GitHub bernama `iky-store` (jangan upload ZIP sebagai satu file; ekstrak dulu).
2. Buka https://dashboard.render.com/ lalu pilih **New → Blueprint** dan pilih repository `iky-store` yang berisi `render.yaml`.
3. Saat Render meminta `DRIP_API_KEY`, masukkan API key BARU milikmu. Jangan bagikan key ke siapa pun atau masukkan ke GitHub.
4. Deploy. Setelah selesai, buka URL `.onrender.com` yang diberikan Render.

Konfigurasi API sudah memakai `https://dripclientofficial.dev/api/v1`. Jangan ubah `ALLOW_ORDERS=false` sebelum katalog dan API key diuji. Membuat order dapat memotong saldo wallet provider.

Catatan: website ini menampilkan katalog dari API provider. Pembayaran pelanggan seperti QRIS/DANA belum terintegrasi; itu membutuhkan payment gateway tersendiri. GitHub Pages saja tidak bisa menjalankan backend Node.js atau menyimpan API key dengan aman.
