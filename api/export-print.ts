import type { VercelRequest, VercelResponse } from '@vercel/node';
import sharp from 'sharp';
import { PDFDocument, rgb } from 'pdf-lib';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

interface ExportRequest {
    imageUrl: string;
    format: 'png' | 'jpeg' | 'webp' | 'pdf';
    pdfType?: 'digital' | 'print-ready';
    colorSpace?: 'rgb' | 'cmyk';
    dpi?: number;
    bleedMm?: number;
    cropMarks?: boolean;
    paperSize?: string;
    fitMode?: 'fit' | 'fill' | 'stretch';
    shareToken?: string; // Optional: for public share downloads
    customWidthPx?: number; // Custom pixel width
    customHeightPx?: number; // Custom pixel height
    cropOffsetX?: number; // 0=left, 0.5=center, 1=right
    cropOffsetY?: number; // 0=top, 0.5=center, 1=bottom
}

// Rate limit: 10 downloads per hour per token
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Paper sizes in mm
const PAPER_SIZES: Record<string, { widthMm: number; heightMm: number }> = {
    'custom': { widthMm: 0, heightMm: 0 },
    'a4-portrait': { widthMm: 210, heightMm: 297 },
    'a4-landscape': { widthMm: 297, heightMm: 210 },
    'a5-portrait': { widthMm: 148, heightMm: 210 },
    'letter-portrait': { widthMm: 216, heightMm: 279 },
    'instagram-square': { widthMm: 108, heightMm: 108 },
    'instagram-story': { widthMm: 108, heightMm: 192 },
    'facebook-post': { widthMm: 120, heightMm: 63 },
};

// ============================================================================
// HELPERS
// ============================================================================

// Convert mm to pixels at given DPI
const mmToPx = (mm: number, dpi: number) => Math.round((mm / 25.4) * dpi);

// Convert pixels to PDF points (1 point = 1/72 inch)
const pxToPoints = (px: number, dpi: number) => (px / dpi) * 72;

// Draw crop marks on PDF page
function drawCropMarks(
    page: any,
    width: number,
    height: number,
    bleedPts: number,
    markLength: number = 20,
    markOffset: number = 5
) {
    const color = rgb(0, 0, 0);
    const lineWidth = 0.5;

    const contentX = bleedPts;
    const contentY = bleedPts;
    const contentW = width - 2 * bleedPts;
    const contentH = height - 2 * bleedPts;

    // Top-left
    page.drawLine({ start: { x: contentX - markOffset - markLength, y: contentY }, end: { x: contentX - markOffset, y: contentY }, thickness: lineWidth, color });
    page.drawLine({ start: { x: contentX, y: contentY - markOffset - markLength }, end: { x: contentX, y: contentY - markOffset }, thickness: lineWidth, color });

    // Top-right
    page.drawLine({ start: { x: contentX + contentW + markOffset, y: contentY }, end: { x: contentX + contentW + markOffset + markLength, y: contentY }, thickness: lineWidth, color });
    page.drawLine({ start: { x: contentX + contentW, y: contentY - markOffset - markLength }, end: { x: contentX + contentW, y: contentY - markOffset }, thickness: lineWidth, color });

    // Bottom-left
    page.drawLine({ start: { x: contentX - markOffset - markLength, y: contentY + contentH }, end: { x: contentX - markOffset, y: contentY + contentH }, thickness: lineWidth, color });
    page.drawLine({ start: { x: contentX, y: contentY + contentH + markOffset }, end: { x: contentX, y: contentY + contentH + markOffset + markLength }, thickness: lineWidth, color });

    // Bottom-right
    page.drawLine({ start: { x: contentX + contentW + markOffset, y: contentY + contentH }, end: { x: contentX + contentW + markOffset + markLength, y: contentY + contentH }, thickness: lineWidth, color });
    page.drawLine({ start: { x: contentX + contentW, y: contentY + contentH + markOffset }, end: { x: contentX + contentW, y: contentY + contentH + markOffset + markLength }, thickness: lineWidth, color });
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            imageUrl,
            format = 'png',
            pdfType = 'digital',
            colorSpace = 'rgb',
            dpi = 300,
            bleedMm = 0,
            cropMarks = false,
            paperSize = 'custom',
            fitMode = 'fit',
            shareToken,
            customWidthPx,
            customHeightPx,
            cropOffsetX = 0.5, // 0=left, 0.5=center, 1=right
            cropOffsetY = 0.5, // 0=top, 0.5=center, 1=bottom
        } = req.body as ExportRequest;

        if (!imageUrl) {
            return res.status(400).json({ error: 'imageUrl is required' });
        }

        // ============================================================================
        // SHARE TOKEN VALIDATION (for public printer downloads)
        // ============================================================================
        if (shareToken) {
            const supabaseUrl = process.env.VITE_SUPABASE_URL!;
            const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;
            const supabase = createClient(supabaseUrl, supabaseSecretKey);

            // Get share record
            const { data: share, error: shareError } = await supabase
                .from('shared_assets')
                .select('*')
                .eq('token', shareToken)
                .single();

            if (shareError || !share) {
                return res.status(404).json({ error: 'Share link not found' });
            }

            if (!share.is_active) {
                return res.status(410).json({ error: 'This link has been revoked' });
            }

            if (share.expires_at && new Date(share.expires_at) < new Date()) {
                return res.status(410).json({ error: 'This link has expired' });
            }

            // Rate limiting: check downloads in the last hour
            const hourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
            if (share.last_download_at && new Date(share.last_download_at) > hourAgo) {
                // Count recent downloads (simplified: use download_count with time check)
                // For true rate limiting, we'd need a separate downloads table
                // Here we use a simple approach: if downloaded in last hour and count > limit
                if (share.download_count >= RATE_LIMIT_MAX) {
                    return res.status(429).json({
                        error: 'Rate limit exceeded. Try again in an hour.',
                        retryAfter: 3600
                    });
                }
            }

            // Increment download count and update last_download_at
            await supabase
                .from('shared_assets')
                .update({
                    download_count: share.download_count + 1,
                    last_download_at: new Date().toISOString()
                })
                .eq('id', share.id);
        }

        // Fetch the source image
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            return res.status(400).json({ error: 'Failed to fetch image' });
        }
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

        // Get image metadata
        const metadata = await sharp(imageBuffer).metadata();
        const originalWidth = metadata.width || 1024;
        const originalHeight = metadata.height || 1024;

        // Calculate target dimensions
        let targetWidth = originalWidth;
        let targetHeight = originalHeight;
        const paper = PAPER_SIZES[paperSize];
        const useCustomPx = customWidthPx && customHeightPx && customWidthPx > 0 && customHeightPx > 0;

        if (useCustomPx) {
            // Priority 1: Custom pixel dimensions (from ad size presets or manual input)
            targetWidth = customWidthPx;
            targetHeight = customHeightPx;
        } else if (paper && paper.widthMm > 0 && paper.heightMm > 0) {
            // Priority 2: Paper sizes (mm, converted to px)
            targetWidth = mmToPx(paper.widthMm, dpi);
            targetHeight = mmToPx(paper.heightMm, dpi);
        }

        // Calculate bleed in pixels
        const bleedPx = mmToPx(bleedMm, dpi);

        // Start Sharp pipeline
        let pipeline = sharp(imageBuffer);

        // Apply fit mode if target dimensions differ from original
        const needsResize = useCustomPx || (paperSize !== 'custom' && paper && paper.widthMm > 0);
        if (needsResize) {
            if (fitMode === 'fill') {
                // Cover: Resize to cover the target, then extract at custom position
                // First, get the original image dimensions
                const metadata = await sharp(imageBuffer).metadata();
                const origW = metadata.width || targetWidth;
                const origH = metadata.height || targetHeight;
                const origAspect = origW / origH;
                const targetAspect = targetWidth / targetHeight;

                // Calculate the resize dimensions to cover the target
                let resizeW: number, resizeH: number;
                if (origAspect > targetAspect) {
                    // Image is wider - resize to match height, excess width
                    resizeH = targetHeight;
                    resizeW = Math.round(targetHeight * origAspect);
                } else {
                    // Image is taller - resize to match width, excess height
                    resizeW = targetWidth;
                    resizeH = Math.round(targetWidth / origAspect);
                }

                // Resize to cover
                pipeline = pipeline.resize(resizeW, resizeH, { fit: 'fill' });

                // Calculate extract position based on offset
                const excessW = resizeW - targetWidth;
                const excessH = resizeH - targetHeight;
                const extractLeft = Math.round(excessW * cropOffsetX);
                const extractTop = Math.round(excessH * cropOffsetY);

                // Extract the target area
                pipeline = pipeline.extract({
                    left: extractLeft,
                    top: extractTop,
                    width: targetWidth,
                    height: targetHeight,
                });
            } else if (fitMode === 'stretch') {
                // Stretch: Force resize to exact dimensions
                pipeline = pipeline.resize(targetWidth, targetHeight, {
                    fit: 'fill',
                });
            } else {
                // Fit (default): Contain within target, add background
                pipeline = pipeline.resize(targetWidth, targetHeight, {
                    fit: 'contain',
                    background: { r: 255, g: 255, b: 255, alpha: 1 },
                });
            }
        }

        // Add bleed (extend canvas)
        if (bleedMm > 0) {
            pipeline = pipeline.extend({
                top: bleedPx,
                bottom: bleedPx,
                left: bleedPx,
                right: bleedPx,
                background: { r: 255, g: 255, b: 255, alpha: 1 },
            });
        }

        // Convert color space for print-ready
        if (pdfType === 'print-ready' && colorSpace === 'cmyk') {
            pipeline = pipeline.toColourspace('cmyk');
        }

        // Process based on format
        if (format === 'png') {
            const outputBuffer = await pipeline.png().toBuffer();
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Content-Disposition', 'attachment; filename="export.png"');
            return res.send(outputBuffer);
        }

        if (format === 'jpeg') {
            const outputBuffer = await pipeline.jpeg({ quality: 95 }).toBuffer();
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('Content-Disposition', 'attachment; filename="export.jpg"');
            return res.send(outputBuffer);
        }

        if (format === 'webp') {
            const outputBuffer = await pipeline.webp({ quality: 90 }).toBuffer();
            res.setHeader('Content-Type', 'image/webp');
            res.setHeader('Content-Disposition', 'attachment; filename="export.webp"');
            return res.send(outputBuffer);
        }

        if (format === 'pdf') {
            // For PDF, process to JPEG first
            let pdfPipeline = sharp(imageBuffer);

            // Apply fit mode
            if (paperSize !== 'custom' && paper && paper.widthMm > 0) {
                if (fitMode === 'fill') {
                    pdfPipeline = pdfPipeline.resize(targetWidth, targetHeight, { fit: 'cover', position: 'center' });
                } else if (fitMode === 'stretch') {
                    pdfPipeline = pdfPipeline.resize(targetWidth, targetHeight, { fit: 'fill' });
                } else {
                    pdfPipeline = pdfPipeline.resize(targetWidth, targetHeight, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } });
                }
            }

            // Add bleed
            if (bleedMm > 0) {
                pdfPipeline = pdfPipeline.extend({
                    top: bleedPx,
                    bottom: bleedPx,
                    left: bleedPx,
                    right: bleedPx,
                    background: { r: 255, g: 255, b: 255, alpha: 1 },
                });
            }

            const jpegBuffer = await pdfPipeline.jpeg({ quality: 100 }).toBuffer();
            const jpegMeta = await sharp(jpegBuffer).metadata();

            const finalWidth = jpegMeta.width || targetWidth + 2 * bleedPx;
            const finalHeight = jpegMeta.height || targetHeight + 2 * bleedPx;

            // Convert to PDF points
            const widthPts = pxToPoints(finalWidth, dpi);
            const heightPts = pxToPoints(finalHeight, dpi);
            const bleedPts = pxToPoints(bleedPx, dpi);

            // Create PDF
            const pdfDoc = await PDFDocument.create();

            const markSpace = cropMarks ? 40 : 0;
            const pageWidth = widthPts + (cropMarks ? markSpace * 2 : 0);
            const pageHeight = heightPts + (cropMarks ? markSpace * 2 : 0);

            const page = pdfDoc.addPage([pageWidth, pageHeight]);

            // Embed and draw image
            const jpgImage = await pdfDoc.embedJpg(jpegBuffer);
            page.drawImage(jpgImage, {
                x: cropMarks ? markSpace : 0,
                y: cropMarks ? markSpace : 0,
                width: widthPts,
                height: heightPts,
            });

            // Draw crop marks
            if (cropMarks && bleedMm > 0) {
                drawCropMarks(page, pageWidth, pageHeight, bleedPts + markSpace);
            }

            // Set metadata
            pdfDoc.setTitle('Ads x Create Export');
            pdfDoc.setCreator('Ads x Create');
            if (pdfType === 'print-ready') {
                const paperName = paper?.widthMm ? paperSize : 'custom';
                pdfDoc.setSubject(`Print-Ready | ${colorSpace.toUpperCase()} | ${dpi} DPI | ${bleedMm}mm Bleed | ${paperName}`);
            }

            const pdfBytes = await pdfDoc.save();

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="export-${pdfType}.pdf"`);
            return res.send(Buffer.from(pdfBytes));
        }

        return res.status(400).json({ error: 'Invalid format' });
    } catch (error: any) {
        console.error('[export-print] Error:', error);
        return res.status(500).json({ error: error.message || 'Export failed' });
    }
}
