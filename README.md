# WhatsApp AI Companion Bot

Bot WhatsApp pribadi yang otomatis membalas chat dari satu nomor spesifik
menggunakan AI, lengkap dengan simulasi delay mengetik.

## Struktur folder

```
whatsapp-ai-companion/
├── .env.example       # template, salin jadi .env
├── .gitignore
├── package.json
├── README.md
└── src/
    ├── config.js       # baca & validasi environment variable
    ├── systemPrompt.js # karakter/persona bot
    ├── aiService.js    # pemanggilan OpenAI / Gemini
    └── index.js        # koneksi WhatsApp & logic utama
```

## 1. Prasyarat

- Node.js versi 18 ke atas (cek dengan `node -v`)
- Nomor WhatsApp kedua (khusus buat bot) — **jangan pakai nomor utama kamu**,
  supaya kalau ada masalah, nomor pribadimu tidak ikut kena dampak
- API key Gemini dari Google AI Studio (https://aistudio.google.com/apikey)

## 2. Instalasi

```bash
# 1. buat folder & masuk ke dalamnya (kalau belum, salin semua file di atas ke sini)
cd whatsapp-ai-companion

# 2. install semua dependency
npm install
```

## 3. Konfigurasi

```bash
# salin template .env
cp .env.example .env
```

Lalu buka `.env` dan isi:
- `GEMINI_API_KEY` → API key dari Google AI Studio
- `GEMINI_MODEL` → nama model Gemini. **Nama model ini cukup sering berubah**
  (Google rutin merilis versi baru & meng-retire versi lama), jadi cek dulu
  model yang masih aktif di https://ai.google.dev/gemini-api/docs/models
  sebelum menjalankan bot — jangan asal salin nilai default.
- `ALLOWED_WA_NUMBER` → nomor WA pacarmu, format `62xxxxxxxxxx` (kode negara,
  tanpa `+`, tanpa `0` di depan)

## 4. Menjalankan bot pertama kali

```bash
npm start
```

- Terminal akan menampilkan **QR code**.
- Buka WhatsApp di HP (nomor kedua yang kamu siapkan) → **Perangkat Tertaut**
  → **Tautkan Perangkat** → scan QR di terminal.
- Kalau berhasil, muncul log `✅ bot whatsapp berhasil terhubung!`.
- Sesi login tersimpan di folder `auth_info_baileys/`, jadi lain kali
  `npm start` tidak perlu scan ulang selama folder ini tidak dihapus.

## 5. Menghentikan / mengatur bot

- Hentikan proses: `Ctrl + C` di terminal.
- Nonaktifkan sementara tanpa mematikan proses: ubah `BOT_ACTIVE=false` di
  `.env`, lalu restart (`npm start` lagi).
- Reset sesi login (misal ganti nomor): hapus folder `auth_info_baileys/`,
  lalu jalankan ulang dan scan QR baru.

## Troubleshooting error Gemini API

- **404 "model not found"** → model di `GEMINI_MODEL` sudah deprecated/di-retire.
  Ganti ke model yang masih aktif (cek https://ai.google.dev/gemini-api/docs/models).
  Ganti API key tidak akan membantu untuk error ini.
- **429 "RESOURCE_EXHAUSTED", limit: 0** → ini **bukan** masalah di kode atau
  API key salah/typo. Google memangkas kuota gratis lewat API untuk banyak
  model — kalau limit-nya 0, artinya project Google Cloud yang terhubung ke
  API key kamu memang belum dapat jatah gratis sama sekali untuk model itu.
  Ganti-ganti key atau hardcode key tidak akan memperbaiki ini. Solusinya:
  1. Aktifkan billing (Tier 1) di https://console.cloud.google.com — tidak
     ada minimum spend, dan biaya Gemini 2.5 Flash sangat murah untuk
     pemakaian chatbot pribadi.
  2. Atau, sementara ganti `GEMINI_MODEL` ke `gemini-2.5-flash-lite`, yang
     biasanya masih punya kuota gratis lebih besar dibanding model lain.
  3. Bot sekarang otomatis mengirim pesan fallback ke WA (bukan diam saja)
     kalau Gemini API gagal, dan mencetak log yang menjelaskan akar
     masalahnya di terminal.

## Catatan penting

- **Baileys bukan API resmi WhatsApp.** Ini library open-source yang
  meniru WhatsApp Web, dan penggunaannya di luar Ketentuan Layanan resmi
  WhatsApp. Ini lazim dipakai untuk bot pribadi/hobi, tapi ada risiko kecil
  nomor kena limit/banned kalau polanya mencurigakan (kirim pesan terlalu
  cepat/banyak). Makanya delay mengetik di atas juga membantu.
- **Riwayat chat hanya disimpan sementara di RAM**, bukan di file — jadi
  ikut hilang tiap bot direstart. Kalau kamu mau bot tetap ingat percakapan
  lama setelah restart, itu perlu tambahan (simpan ke file/database) yang
  belum ada di versi ini.
- **Biaya API**: setiap balasan bot memanggil Gemini API yang berbayar per
  token (Gemini punya free tier terbatas, cek kuotanya di Google AI Studio
  supaya tidak kaget kalau kepakai terus).
- Versi ini baru menangani **pesan teks**. Pesan gambar/stiker/voice note
  akan diabaikan (bisa dikembangkan lagi kalau kamu mau).
