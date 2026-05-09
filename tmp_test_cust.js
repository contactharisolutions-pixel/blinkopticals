const axios = require('axios');
async function test() {
    try {
        const r = await axios.post('http://localhost:5174/api/customers', {
            name: 'Sonu Raval',
            mobile: '8160675646',
            email: 'er.sonuraval@gmail.com',
            city: 'Surat',
            gender: 'Male',
            date_of_birth: '',
            notes: ''
        }, {
            headers: {
                'Authorization': 'Bearer ' + 'TOKEN_HERE'
            }
        });
        console.log(r.data);
    } catch (e) {
        console.log(e.response ? e.response.data : e.message);
    }
}
// I don't have the token. I can skip auth if I modify the route or use a test route.
// Or I can just fix the code which is obviously buggy for empty dates.
