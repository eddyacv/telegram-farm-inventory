// src/bot/index.js
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { handleMessage } = require('./handlers');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

console.log('🤖 Bot iniciado...');

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '¡Hola! Elige una opción para comenzar:', {
    reply_markup: {
      keyboard: [['Entrada', 'Salida']],
      resize_keyboard: true,
      one_time_keyboard: false,
    },
  });
});

bot.on('message', (msg) => {
  handleMessage(bot, msg);
});
