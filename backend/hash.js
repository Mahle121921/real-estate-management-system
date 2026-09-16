const bcrypt = require("bcryptjs");

bcrypt.hash("Mahlet123", 10).then(hash => {
    console.log(hash);
});