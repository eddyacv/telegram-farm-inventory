// src/bot/handlers.js
const productList = ['Pollo', 'Roja', 'Gallo', 'Doble'];
const userSessions = {};

function handleMessage(bot, msg) {
  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const userId = msg.from.id;

  if (!userSessions[chatId]) {
    userSessions[chatId] = {
      step: 'init',
      tipo: null,
      productos: {},
    };
  }

  const session = userSessions[chatId];

  if (text.toLowerCase() === '/start' || text === '⬅️ Atrás') {
    if (session.step !== 'init' && Object.values(session.productos).some(v => v > 0)) {
      bot.sendMessage(chatId, '🔄 ¿Estás seguro de que deseas volver al inicio?\n\nSe perderán los datos que has ingresado.', {
        reply_markup: {
          keyboard: [['Sí', 'No']],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      });
      session.step = 'confirm_reset';
    } else {
      session.step = 'init';
      session.tipo = null;
      session.productos = {};
      bot.sendMessage(chatId, '👋 ¡Hola! Bienvenido al registro de MILUJOS.\n\nPor favor, selecciona una opción para comenzar:', {
        reply_markup: {
          keyboard: [['Entrada', 'Salida']],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      });
    }
    return;
  }

  if (session.step === 'confirm_reset') {
    if (text === 'Sí') {
      session.step = 'init';
      session.tipo = null;
      session.productos = {};
      bot.sendMessage(chatId, '✅ ¡Sesión reiniciada!\n\nSelecciona una nueva opción para comenzar:', {
        reply_markup: {
          keyboard: [['Entrada', 'Salida']],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      });
    } else {
      session.step = 'selecting';
      showCurrentList(bot, chatId, session);
    }
    return;
  }

  if (text === 'Entrada' || text === 'Salida') {
    session.tipo = text;
    session.step = 'selecting';
    productList.forEach(prod => (session.productos[prod] = 0));
    showCurrentList(bot, chatId, session);
    return;
  }

  if (text === 'Terminar') {
    const productosValidos = Object.entries(session.productos).filter(([_, val]) => val > 0);
    if (productosValidos.length === 0) {
      bot.sendMessage(chatId, '⚠️ Para registrar la operación, necesitas haber asignado al menos una cantidad mayor a 0.');
      return;
    }

    const resumen = productosValidos.map(([k, v]) => `${k}: ${v}`).join('\n');
    const fecha = new Date().toLocaleString();

    bot.sendMessage(chatId, `🗓️ *Registro guardado correctamente:*\n\n📅 Fecha: ${fecha}\n📦 Tipo: ${session.tipo}\n\n${resumen}`, {
      parse_mode: 'Markdown'
    });

    session.step = 'init';
    session.tipo = null;
    session.productos = {};

    bot.sendMessage(chatId, '¿Deseas realizar otra operación?\n\nSelecciona una opción para continuar:', {
      reply_markup: {
        keyboard: [['Entrada', 'Salida']],
        resize_keyboard: true,
        one_time_keyboard: true
      }
    });
    return;
  }

  // Entrada del tipo "Producto Cantidad"
  const parts = text.split(' ');
  if (parts.length === 2) {
    const [producto, cantidadStr] = parts;
    const cantidad = parseInt(cantidadStr);

    if (productList.includes(producto) && !isNaN(cantidad) && cantidad >= 0) {
      session.productos[producto] = cantidad;
      showCurrentList(bot, chatId, session);
    } else {
      bot.sendMessage(chatId, '❌ Formato inválido.\n\nPor favor usa el formato: Producto Cantidad\nEjemplo: *Pollo 50*', {
        parse_mode: 'Markdown'
      });
    }
    return;
  }

  bot.sendMessage(chatId, '😕 No entendí eso.\n\nPor favor selecciona una opción válida del menú o ingresa un producto correctamente.');
}

function showCurrentList(bot, chatId, session) {
  const resumen = productList.map(p => `${p}: ${session.productos[p]}`).join('\n');
  bot.sendMessage(chatId, `📋 *Estado actual de ${session.tipo}:*\n\n${resumen}`, {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [['Terminar'], ['⬅️ Atrás']],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
}

module.exports = { handleMessage };
