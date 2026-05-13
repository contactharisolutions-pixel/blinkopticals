const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function testLocalUpload() {
    try {
        console.log('Reading file...');
        const fileContent = fs.readFileSync('public/img/logo-new.png');
        
        const form = new FormData();
        form.append('file', fileContent, 'test-logo.png');
        form.append('business_id', 'biz_blink_001');
        form.append('module_name', 'gallery');

        console.log('Uploading to local server...');
        const response = await axios.post('http://localhost:5174/api/media/upload', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Upload failed:', error.response ? error.response.data : error.message);
    }
}

testLocalUpload();
