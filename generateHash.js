const bcrypt = require('bcrypt');

async function generateHash() {
  const hash = await bcrypt.hash("temporaryPassword", 10);
  console.log(hash);
}

generateHash();
