const db = require('./db');
async function fix() {
    try {
        console.log('Updating message_template constraint...');
        await db.query("ALTER TABLE message_template DROP CONSTRAINT IF EXISTS message_template_channel_check;");
        await db.query("ALTER TABLE message_template ADD CONSTRAINT message_template_channel_check CHECK (channel IN ('whatsapp', 'sms', 'email', 'push', 'WhatsApp', 'SMS', 'Email'));");
        
        console.log('Updating message_templates constraint...');
        await db.query("ALTER TABLE message_templates DROP CONSTRAINT IF EXISTS message_templates_channel_check;");
        await db.query("ALTER TABLE message_templates ADD CONSTRAINT message_templates_channel_check CHECK (channel IN ('whatsapp', 'sms', 'email', 'push', 'WhatsApp', 'SMS', 'Email'));");
        
        console.log('Success!');
    } catch (e) {
        console.error(e);
    }
    process.exit();
}
fix();
