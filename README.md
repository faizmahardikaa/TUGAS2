# Tugas 2 - Keamanan Backend Sistem Terdistribusi

Backend praktikum dengan JWT, bcrypt dan AES-256-GCM. Tidak memerlukan database atau frontend. Akun dan data sintetis, bukan data pribadi nyata. Aplikasi ini mendemonstrasikan keamanan komunikasi client-server, bukan deployment terdistribusi multi-node.

## Mulai di laptop

1. Instal Node.js versi 22 atau lebih baru dan Postman desktop.
2. Ekstrak ZIP, buka folder `tugas2` melalui VS Code, lalu buka Terminal di folder yang memuat `package.json`.
3. Jalankan berurutan:

```sh
npm install
npm run setup
npm test
npm start
```

Jika Windows PowerShell menolak `npm.ps1`, gunakan `npm.cmd install`, `npm.cmd run setup`, `npm.cmd test`, dan `npm.cmd start`, atau gunakan terminal Command Prompt. Tidak perlu melonggarkan execution policy.

Server: `http://127.0.0.1:3000`. Biarkan terminal server tetap menyala. Akun demo: username `mahasiswa`, password `Praktikum@2026`. Kredensial ini hanya untuk praktikum lokal.

`npm run setup` membuat `.env` dengan hash bcrypt cost 12, secret JWT acak, serta kunci AES acak yang terpisah. File konfigurasi yang sudah ada tidak ditimpa. Password plaintext tidak disimpan di `.env`; password contoh di skrip setup sengaja bersifat publik sebagai akun latihan.

## Uji di Postman

Import `postman/Tugas2.postman_collection.json`. Jalankan request sesuai urutan. Base URL dan akun sudah tersedia sebagai collection variables. Tidak perlu mengetik atau menyalin token: request login berhasil menyimpannya melalui skrip setelah respons.

| Urutan | Request | Hasil yang diharapkan |
| --- | --- | --- |
| 01 | GET /protected-data, tanpa token | 401, Token diperlukan. |
| 02 | GET /protected-data, token invalid | 401, Token tidak valid atau kedaluwarsa. |
| 03 | POST /login, password salah | 401, Username atau password salah. |
| 04 | POST /login, password benar | 200, token JWT |
| 05 | GET /protected-data, token hasil login | 200, encryptedData |

Jika memakai request manual, POST `/login` -> Body -> raw -> JSON:

```json
{"username":"mahasiswa","password":"Praktikum@2026"}
```

Untuk endpoint terproteksi, gunakan header `Authorization: Bearer <token>`. Pada skenario tanpa token, pilih No Auth dan pastikan tidak ada header Authorization manual. Pada skenario invalid gunakan `Bearer invalid.token.demo`. Pada skenario valid, tempel JWT dari login setelah spasi Bearer.

Ambil screenshot yang memperlihatkan metode, URL, konfigurasi yang relevan, status HTTP dan body respons. Boleh menyamarkan JWT sebelum membagikan screenshot. Jangan menampilkan `.env`, JWT secret atau kunci AES. Bila login terkena 429, tunggu satu menit. Token kedaluwarsa setelah 15 menit; login ulang.

## Demonstrasi enkripsi/dekripsi

Saat server hidup, buka terminal kedua di folder yang sama:

```sh
npm run demo
```

Skrip login, mengambil ciphertext, lalu mendekripsinya secara lokal dengan kunci dari `.env`. Kunci tidak dikirim lewat API. Ini simulasi klien tepercaya pada mesin yang sama; distribusi kunci antar mesin belum diterapkan. Postman hanya melihat ciphertext, bukan plaintext data sensitif.

## Isi proyek

- `src/app.js`: endpoint, validasi, middleware JWT, rate limiting.
- `src/encryption.js`: AES-256-GCM dan dekripsi untuk demo/test.
- `src/config.js`: validasi konfigurasi.
- `src/server.js`: menjalankan HTTP server lokal.
- `scripts/setup.js`: membuat konfigurasi lokal tanpa menimpa file.
- `scripts/demo.js`: demonstrasi round-trip data terenkripsi.
- `test/security.test.js`: 15 pengujian otomatis.
- `postman/Tugas2.postman_collection.json`: 5 skenario Postman dengan assertion.
- `docs/Laporan.md`: naskah laporan yang dapat disunting.
- `docs/Laporan_Tugas2.pdf`: draf laporan; lengkapi identitas dan screenshot asli.
- `docs/Hasil_Uji_Otomatis.txt`: keluaran pengujian aktual, bukan bukti Postman.
- `scripts/build_report.py`: pembuat ulang PDF dari naskah dan gambar bukti.

## Lengkapi laporan PDF

Isi identitas dan URL GitHub di `docs/Laporan.md`. Tambahkan screenshot asli ke `docs/screenshots` menggunakan nama `01-tanpa-token.png`, `02-token-invalid.png`, `03-password-salah.png`, `04-login-berhasil.png`, dan `05-token-valid.png`. Setelah pengujian Postman benar-benar dilakukan, ubah status pelaksanaannya pada naskah, jangan mengklaim pengujian yang belum dilakukan.

Opsional, untuk membangun ulang PDF dengan Python:

```sh
python -m pip install reportlab
python scripts/build_report.py
```

Skrip akan menambahkan screenshot yang tersedia ke lampiran. Alternatif: salin naskah Markdown ke Word, sisipkan screenshot lalu ekspor PDF.

## Unggah ke GitHub

Repositori belum dibuat atau diunggah dari lingkungan pengerjaan ini. Buat repositori kosong pada akun GitHub sendiri. Jangan centang penambahan README jika akan push proyek ini. Di terminal folder proyek:

```sh
git init
git add .
git status
git commit -m "Implementasi JWT bcrypt dan AES-256-GCM"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

Ganti URL contoh dengan URL repositorimu. Sebelum commit, pastikan `.env` dan `node_modules` tidak terdaftar pada `git status`. Jangan gunakan `git add -f .env`. Setelah menambahkan screenshot dan memperbarui laporan, commit/push perubahan tersebut. Gunakan mekanisme sign-in resmi GitHub; jangan menempelkan token akun ke kode atau laporan.

## Catatan teknis dan batasan

JWT ditandatangani HS256, bukan dienkripsi; payload tidak boleh memuat password atau kunci. Verifikasi membatasi algoritma, issuer, audience, subject dan expiry. bcrypt dipakai sesuai tugas; batas input 72 byte mencegah pemotongan password diam-diam. AES-256-GCM menggunakan kunci 32 byte, nonce acak 12 byte dan authentication tag 16 byte. IV dan tag boleh dikirim bersama ciphertext, tetapi kunci tidak.

HTTP hanya dipakai pada loopback untuk praktikum. Deployment nyata wajib HTTPS, pengelolaan/rotasi kunci, akun nyata dengan hash tersimpan aman, logging yang tidak membocorkan rahasia dan mekanisme pencabutan token. Rate limiter sekarang berada di memori satu proses; deployment multi-instance membutuhkan penyimpanan bersama. Penerima kunci AES harus tepercaya dan diprovisi melalui mekanisme aman. Enkripsi payload tidak menggantikan TLS.

## Referensi implementasi

- Node.js. (n.d.). Crypto. https://nodejs.org/api/crypto.html
- Auth0. (n.d.). node-jsonwebtoken. https://github.com/auth0/node-jsonwebtoken
- Kelektiv. (n.d.). node.bcrypt.js. https://github.com/kelektiv/node.bcrypt.js
