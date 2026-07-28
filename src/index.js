import express from 'express';
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot WhatsApp Aktif! 🚀'));
app.listen(PORT, () => console.log(`Web server jalan di port ${PORT}`));
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import P from 'pino';
import qrcode from 'qrcode-terminal';
import { config } from './config.js';
import { getAIResponse } from './aiService.js';

const ALLOWED_JID = `${config.allowedNumber}@s.whatsapp.net`;

// delay acak 2-5 detik biar keliatan kayak orang lagi ngetik, bukan bot spam instan
function randomDelayMs(min = 2000, max = 5000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function startBot() {
  // useMultiFileAuthState nyimpen sesi login WA di folder auth_info_baileys,
  // jadi sekali scan QR, lain kali gak perlu scan ulang selama file itu gak dihapus
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' }), // biar terminal gak kebanjiran log teknis Baileys
    printQRInTerminal: false, // kita cetak QR manual pakai qrcode-terminal di bawah
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode =
        lastDisconnect?.error instanceof Boom
          ? lastDisconnect.error.output?.statusCode
          : undefined;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('koneksi terputus, reconnect:', shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('✅ bot whatsapp berhasil terhubung!');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return; // abaikan event selain pesan baru masuk

    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return; // abaikan pesan kosong & pesan dari diri sendiri

    const sender = msg.key.remoteJid;
console.log('👉 CHAT MASUK DARI:', sender);
console.log('👉 SATPAM NYARI NOMOR:', ALLOWED_JID);
    // FILTER UTAMA (paling krusial): cuma proses pesan dari 1 nomor yang diizinkan.
    // pesan dari nomor lain atau grup WA otomatis diabaikan di sini.
    // JANGAN di-comment-out baris ini di luar sesi testing.
    if (sender !== '192517832208551@lid') return;

    if (!config.botActive) return; // toggle manual lewat BOT_ACTIVE di .env

    const text =
      msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    if (!text) return; // versi awal ini cuma menangani pesan teks (belum gambar/stiker/voice note)

    try {
      // simulasi mengetik: kirim status "composing" lalu delay acak sebelum balas
      await sock.sendPresenceUpdate('composing', sender);
      await new Promise((r) => setTimeout(r, randomDelayMs()));

      const reply = await getAIResponse(text);

      await sock.sendPresenceUpdate('paused', sender);
      await sock.sendMessage(sender, { text: reply });
    } catch (err) {
      console.error('gagal membalas pesan:', err);
    }
  });
}

startBot();
