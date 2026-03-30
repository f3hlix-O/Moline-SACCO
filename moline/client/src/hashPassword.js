const bcrypt = require('bcryptjs');

const password = 'Test@staff2'; // known password
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error hashing password:', err);
    } else {
        console.log('Hashed password:', hash);
        // Use this hash to update your database record for testing
    }
});

