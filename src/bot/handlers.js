const productList = ['Pollo', 'Roja', 'Gallo', 'Doble'];
const userSessions = {};
const { appendProductRows } = require('../services/sheetsService');
const { isAuthorized, registerUser } = require('../utils/auth');

async function handleMessage(bot, msg) {
  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const userId = msg.from.id;

  // 👤 Comando para mostrar ID
  if (text === '/id') {
    const nombre = `${msg.from.first_name} ${msg.from.last_name || ''}`.trim();
    bot.sendMessage(chatId, `🆔 Tu ID de Telegram es: *${userId}*\n👤 Nombre: *${nombre}*`, {
      parse_mode: 'Markdown'
    });
    return;
  }

  // 🔐 Registro de usuarios con clave secreta
  if (text.startsWith('/registrar ')) {
    const [, clave] = text.split(' ');
    if (registerUser(userId, clave)) {
      bot.sendMessage(chatId, '✅ ¡Registro exitoso! Ya puedes usar el bot.');
    } else {
      bot.sendMessage(chatId, '❌ Clave incorrecta. No tienes permiso para registrarte.');
    }
    return;
  }

  // 🚫 Verificación de autorización
  if (!isAuthorized(userId)) {
    bot.sendMessage(chatId, '🚫 No estás autorizado para usar este bot.\n\nSi tienes una clave, regístrate con:\n/registrar TU_CLAVE');
    return;
  }

  // Inicializar sesión si no existe
  if (!userSessions[chatId]) {
    userSessions[chatId] = {
      step: 'init',
      tipo: null,
      productos: {},
    };
  }

  const session = userSessions[chatId];

  // 🔁 Reinicio del bot
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

  // Confirmación de reinicio
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

  // Selección de tipo
  if (text === 'Entrada' || text === 'Salida') {
    session.tipo = text;
    session.step = 'selecting';
    productList.forEach(prod => (session.productos[prod] = 0));
    showCurrentList(bot, chatId, session);
    return;
  }

  // Finalizar y guardar
  if (text === 'Terminar') {
    const productosValidos = Object.entries(session.productos).filter(([_, val]) => val > 0);

    if (productosValidos.length === 0) {
      bot.sendMessage(chatId, '⚠️ Para registrar la operación, necesitas haber asignado al menos una cantidad mayor a 0.');
      return;
    }

    const resumen = productosValidos.map(([k, v]) => `${k}: ${v}`).join('\n');
    const fecha = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' });

    await appendProductRows({
      tipo: session.tipo,
      productos: session.productos,
      userId,
    });

    bot.sendMessage(chatId, `✅ *Registro guardado correctamente:*\n\n📅 Fecha: ${fecha}\n📦 Tipo: ${session.tipo}\n\n${resumen}`, {
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

  // Entrada de datos: "Producto Cantidad"
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

  // Mensaje por defecto
  bot.sendMessage(chatId, '😕 No entendí eso.\n\nPor favor selecciona una opción válida del menú o ingresa un producto correctamente.');
}

// ✅ Mostrar lista actual
function showCurrentList(bot, chatId, session) {
  const lista = Object.entries(session.productos)
    .map(([producto, cantidad]) => `- ${producto}: ${cantidad}`)
    .join('\n');

  bot.sendMessage(chatId, `📝 *${session.tipo} actual:*\n\n${lista}\n\n✏️ Puedes escribir por ejemplo: Pollo 10\n✅ Cuando termines, pulsa: *Terminar*`, {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [['⬅️ Atrás', 'Terminar']],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  });
}

module.exports = { handleMessage };
