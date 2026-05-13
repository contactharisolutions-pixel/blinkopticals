const supabase = require('../supabase_client');
const fs = require('fs');

async function testUpload() {
    const testFile = Buffer.from('test upload content');
    const path = 'test/test-file.txt';

    console.log('Attempting upload to bucket "media"...');
    const { data, error } = await supabase.storage.from('media').upload(path, testFile, {
        contentType: 'text/plain',
        upsert: true
    });

    if (error) {
        console.error('Upload failed:', error);
    } else {
        console.log('Upload success:', data);
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
        console.log('Public URL:', urlData.publicUrl);
    }
}

testUpload();
