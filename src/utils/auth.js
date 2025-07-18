const fs = require('fs');
const path = require('path');

const usersFile = path.resolve(__dirname, '../../config/registeredUsers.json');
const SECRET = process.env.REGISTER_SECRET || 'milujos123'; // cambia esta contraseña o colócala en tu `.env`

function loadRegisteredUsers() {
  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([]));
  }
  return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
}

function saveRegisteredUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

function isAuthorized(userId) {
  const users = loadRegisteredUsers();
  return users.includes(userId);
}

function registerUser(userId, secret) {
  if (secret !== SECRET) return false;

  const users = loadRegisteredUsers();
  if (!users.includes(userId)) {
    users.push(userId);
    saveRegisteredUsers(users);
  }
  return true;
}

module.exports = {
  isAuthorized,
  registerUser,
};
