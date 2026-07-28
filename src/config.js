import 'dotenv/config';

export const config = {
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',

  allowedNumber: process.env.ALLOWED_WA_NUMBER,
  botActive: process.env.BOT_ACTIVE !== 'false',
};

// validasi dasar dari awal, biar kalau ada yang lupa diisi errornya jelas
// (daripada baru ketahuan pas tengah malam waktu bot dibutuhkan)
if (!config.allowedNumber) {
  throw new Error('ALLOWED_WA_NUMBER belum diisi di file .env');
}
if (!config.geminiApiKey) {
  throw new Error('GEMINI_API_KEY belum diisi di file .env');
}
