
const bcrypt = require('bcryptjs');

const hash = '$2b$12$SeUvDp9Lborpu/Ts.XuMee80PnA6w8hxK0iZiLZ1yw5RJRycUreEC';
const password = 'Blink@Admin2026';

bcrypt.compare(password, hash).then(res => {
    console.log('Password Match:', res);
});
