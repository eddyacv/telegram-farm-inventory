function handleMessage(bot, msg) {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text.toLowerCase() === '/start') {
    bot.sendMessage(chatId, '¡Hola! Elige una opción:', {
      reply_markup: {
        keyboard: [['Entrada', 'Salida']],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    });
  } else {
    bot.sendMessage(chatId, `Recibido: ${text}`);
  }
}

module.exports = { handleMessage };
