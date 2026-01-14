import { createClient } from '@supabase/supabase-js';
import { VercelRequest, VercelResponse } from '@vercel/node';
import formidable from 'formidable';
import fs from 'fs';

// Disable default body parsing for file uploads
export const config = {
    api: {
        bodyParser: false,
    },
};

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Parse multipart form data
        const form = formidable({
            maxFileSize: MAX_FILE_SIZE,
            keepExtensions: true,
        });

        const [fields, files] = await form.parse(req);

        const taskId = fields.taskId?.[0];
        const businessId = fields.businessId?.[0];
        const file = files.file?.[0];

        if (!taskId || !businessId || !file) {
            return res.status(400).json({ error: 'taskId, businessId, and file are required' });
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.mimetype || '')) {
            return res.status(400).json({ error: 'File type not allowed' });
        }

        // Read file buffer
        const fileBuffer = fs.readFileSync(file.filepath);

        // Generate unique filename
        const timestamp = Date.now();
        const extension = file.originalFilename?.split('.').pop() || 'bin';
        const filename = `${timestamp}_${file.originalFilename?.replace(/[^a-zA-Z0-9.-]/g, '_') || 'upload'}`;
        const storagePath = `tasks/${businessId}/${taskId}/${filename}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('attachments')
            .upload(storagePath, fileBuffer, {
                contentType: file.mimetype || 'application/octet-stream',
                upsert: false,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return res.status(500).json({ error: 'Failed to upload file', details: uploadError.message });
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('attachments')
            .getPublicUrl(storagePath);

        // Clean up temp file
        fs.unlinkSync(file.filepath);

        // Return attachment metadata
        const attachment = {
            id: `att_${timestamp}_${Math.random().toString(36).slice(2, 6)}`,
            type: 'file' as const,
            name: file.originalFilename || filename,
            url: urlData.publicUrl,
            mimeType: file.mimetype || 'application/octet-stream',
            size: file.size,
            createdAt: new Date().toISOString(),
        };

        return res.status(200).json({ success: true, attachment });
    } catch (error) {
        console.error('Upload handler error:', error);
        return res.status(500).json({ error: 'Upload failed', details: String(error) });
    }
}
