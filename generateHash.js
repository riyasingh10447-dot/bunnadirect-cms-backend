const bcrypt = require('bcrypt');

async function generateHash() {
  const hash = await bcrypt.hash(" Isz@14567", 10);
  console.log(hash);
}

generateHash();
