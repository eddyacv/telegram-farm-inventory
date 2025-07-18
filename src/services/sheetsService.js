// src/services/sheetsService.js
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '../../config/credentials.json'), // tu JSON aquí
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

async function appendProductRows({ tipo, productos, userId }) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const fecha = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });

  const values = Object.entries(productos)
    .filter(([_, cantidad]) => cantidad > 0)
    .map(([producto, cantidad]) => [
      fecha,
      tipo,
      String(userId),
      producto,
      cantidad,
    ]);

  if (values.length === 0) return;

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Hoja 1!A:E',
    valueInputOption: 'USER_ENTERED',
    resource: { values },
  });
}

module.exports = { appendProductRows };
