'use strict';
/**
 * Media Processor — Supabase Cloud Storage + Sharp Optimization
 * Uploads all media to Supabase Storage bucket 'media'
 * Pattern: <businessId>/<module>/<filename>
 */
const sharp    = require('sharp');
const crypto   = require('crypto');
const supabase = require('../supabase_client');
const path     = require('path');

function randomHex() {
    return crypto.randomBytes(8).toString('hex');
}

/** Returns the public URL from Supabase Storage */
function getPublicUrl(storagePath) {
    const { data } = supabase.storage.from('media').getPublicUrl(storagePath);
    return data.publicUrl;
}

async function processImage(file, businessId, moduleName) {
    const hash     = randomHex();
    const rawName  = path.basename(file.originalname, path.extname(file.originalname))
                        .replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const finalName = `${rawName}-${hash}`;

    const storageRoot = `${businessId}/${moduleName}`;
    const origPath  = `${storageRoot}/original/${finalName}.webp`;
    const thumbPath = `${storageRoot}/thumbnails/${finalName}_thumb.webp`;

    // 1. Process original → WebP 80%
    const origBuf = await sharp(file.buffer).webp({ quality: 80 }).toBuffer();
    const { error: oErr } = await supabase.storage.from('media').upload(origPath, origBuf, {
        contentType: 'image/webp',
        upsert: true
    });
    if (oErr) throw new Error('Original upload failed: ' + oErr.message);

    // 2. Process thumbnail 150x150 cover → WebP 70%
    const thumbBuf = await sharp(file.buffer)
        .resize(150, 150, { fit: 'cover', position: 'centre' })
        .webp({ quality: 70 })
        .toBuffer();
    const { error: tErr } = await supabase.storage.from('media').upload(thumbPath, thumbBuf, {
        contentType: 'image/webp',
        upsert: true
    });
    if (tErr) throw new Error('Thumbnail upload failed: ' + tErr.message);

    const meta = await sharp(file.buffer).metadata();

    return {
        url:       getPublicUrl(origPath),
        thumbnail: getPublicUrl(thumbPath),
        width:     meta.width  || null,
        height:    meta.height || null,
        size:      origBuf.length,
        tags:      ['image', moduleName]
    };
}

async function processVideo(file, businessId, moduleName) {
    const hash      = randomHex();
    const rawName   = path.basename(file.originalname, path.extname(file.originalname))
                         .replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const finalName = `${rawName}-${hash}`;
    const ext       = path.extname(file.originalname) || '.mp4';

    const storagePath = `${businessId}/${moduleName}/videos/${finalName}${ext}`;

    // Upload video directly from buffer
    const { error: vErr } = await supabase.storage.from('media').upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
    });
    if (vErr) throw new Error('Video upload failed: ' + vErr.message);

    // Fallback thumbnail for videos (generating screenshots on serverless is unreliable without binaries)
    const thumbUrl = '/admin/img/video-thumb.png'; 

    return {
        url:       getPublicUrl(storagePath),
        thumbnail: thumbUrl,
        width:     null,
        height:    null,
        size:      file.buffer.length,
        tags:      ['video', moduleName]
    };
}

async function processDocument(file, businessId, moduleName) {
    const hash    = randomHex();
    const ext     = path.extname(file.originalname) || '.bin';
    const storagePath = `${businessId}/${moduleName}/docs/${hash}${ext}`;

    const { error: dErr } = await supabase.storage.from('media').upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
    });
    if (dErr) throw new Error('Document upload failed: ' + dErr.message);

    return {
        url:       getPublicUrl(storagePath),
        thumbnail: null,
        width:     null,
        height:    null,
        size:      file.buffer.length,
        tags:      ['document', moduleName]
    };
}

module.exports = {
    processMedia: async (file, businessId, moduleName) => {
        if (file.mimetype.startsWith('image')) return processImage(file, businessId, moduleName);
        if (file.mimetype.startsWith('video')) return processVideo(file, businessId, moduleName);
        return processDocument(file, businessId, moduleName);
    }
};
