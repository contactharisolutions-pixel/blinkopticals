const axios = require('axios');

async function testLogin() {
    try {
        console.log('Testing Staff Login...');
        const response = await axios.post('http://localhost:5000/api/auth/staff/login', {
            email: 'admin@blinkopticals.com',
            password: 'Blink@Admin2026'
        });
        console.log('Login Success:', response.data.success);
        console.log('User Role:', response.data.user.role);
    } catch (err) {
        console.error('Login Failed:', err.response?.data || err.message);
    }
}

// Start the server briefly to test?
// Or just run the logic directly.

const bcrypt = require('bcryptjs');
const db = require('../db');

async function testLogic() {
    try {
        const email = 'admin@blinkopticals.com';
        const password = 'Blink@Admin2026';
        
        console.log('Querying DB for user...');
        const { rows } = await db.query('SELECT * FROM app_user WHERE email = $1 AND active_status = true', [email]);
        const user = rows[0];
        
        if (!user) {
            console.error('User not found in DB');
            return;
        }
        
        console.log('User found:', user.email);
        const match = await bcrypt.compare(password, user.password_hash);
        console.log('Password Match:', match);
        
        if (match) {
            console.log('LOGIN WOULD SUCCEED');
        } else {
            console.log('LOGIN WOULD FAIL: Invalid credentials');
        }
    } catch (err) {
        console.error('Logic Test Error:', err.message);
    }
}

testLogic();
