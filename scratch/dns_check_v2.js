
const dns = require('dns');

const hostname = 'db.mtoslybnnywmsmpwjphv.supabase.co';

console.log(`Looking up ${hostname} (Family: 4)...`);
dns.lookup(hostname, { family: 4 }, (err, address, family) => {
    if (err) {
        console.error('IPv4 Lookup FAILED:', err.message);
    } else {
        console.log('IPv4 Address:', address);
    }
});

console.log(`Looking up ${hostname} (Family: 6)...`);
dns.lookup(hostname, { family: 6 }, (err, address, family) => {
    if (err) {
        console.error('IPv6 Lookup FAILED:', err.message);
    } else {
        console.log('IPv6 Address:', address);
    }
});
