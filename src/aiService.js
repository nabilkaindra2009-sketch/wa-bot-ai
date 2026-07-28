import { GoogleGenAI } from '@google/genai';
import { config } from './config.js';
import { SYSTEM_PROMPT } from './systemPrompt.js';

const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

let chatSession = null; // dibuat sekali, dipakai berulang biar konteks nyambung

function getChatSession() {
  if (!chatSession) {
    chatSession = geminiClient.chats.create({
      model: 'gemini-3.5-flash',
      config: { systemInstruction: SYSTEM_PROMPT, temperature: 0.9 },
    });
  }
  return chatSession;
}

// dikirim ke WA kalau Gemini API lagi error, biar chat gak "digantung" diem aja
const FALLBACK_REPLY =
  'duh cyan, ak lagi error nih di sisi server 😭 bentar lagi beliau benerin, sabar ya bby...';

export async function getAIResponse(userMessage) {
  const chat = getChatSession();
  try {
    return await callWithRetry(chat, userMessage);
  } catch (err) {
    logGeminiError(err);
    return FALLBACK_REPLY; // jangan sampai bot diam total ke pacar cuma karena API error
  }
}

// retry pakai backoff HANYA untuk error transient (500/503/504 = masalah sesaat di server Google).
// 404 (model salah/deprecated) dan 429 (kuota 0) TIDAK diulang, karena walau dicoba
// 100x pun hasilnya bakal sama — itu masalah konfigurasi/akun, bukan soal waktu.
async function callWithRetry(chat, userMessage, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await chat.sendMessage({ message: userMessage });
      return response.text.trim();
    } catch (err) {
      const status = err?.status || err?.code;
      const isTransient = [500, 503, 504].includes(status);
      if (!isTransient || attempt === maxRetries) throw err;

      const wait = 1000 * 2 ** attempt;
      console.log(`percobaan ${attempt + 1} gagal (${status}), coba lagi dalam ${wait}ms...`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

// log yang jelas nunjukin AKAR masalahnya, bukan cuma "error: [object Object]"
function logGeminiError(err) {
  const status = err?.status || err?.code;

  if (status === 404) {
    console.error(
      `❌ model "${config.geminiModel}" tidak ditemukan (404). kemungkinan besar model ini ` +
        `sudah deprecated/di-retire. cek daftar model yang masih aktif di ` +
        `https://ai.google.dev/gemini-api/docs/models lalu update GEMINI_MODEL di .env.`
    );
  } else if (status === 429) {
    console.error(
      `❌ kuota Gemini API 0/habis (429). INI BUKAN masalah di kodingan atau API key salah. ` +
        `penyebab paling umum: project Google Cloud yang terhubung ke API key belum diaktifkan ` +
        `billing-nya, jadi model ini memang tidak dapat jatah gratis sama sekali.\n` +
        `   → aktifkan billing (Tier 1, tanpa minimum spend) di console.cloud.google.com, atau ` +
        `sementara ganti GEMINI_MODEL ke "gemini-2.5-flash-lite" yang kuota gratisnya lebih besar.`
    );
  } else {
    console.error('❌ gagal memanggil Gemini API:', err?.message || err);
  }
}
