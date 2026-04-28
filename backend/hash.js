const bcrypt = require("bcryptjs");

async function run() {
  const password = "123456"; // manager password
  const hash = await bcrypt.hash(password, 10);

  console.log("PLAINTEXT:", password);
  console.log("HASH:", hash);
}

run();