const bcrypt = require("bcryptjs");

const password = "Customer@123";

const hash = bcrypt.hashSync(password, 10);

console.log("Password:", password);
console.log("Hash:", hash);
console.log("Length:", hash.length);