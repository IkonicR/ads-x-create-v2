export const downloadImage = async (url: string, filenameBase: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const header = new Uint8Array(arrayBuffer).subarray(0, 12);

    // Magic Byte Detection
    let extension = '.png'; // Default
    let mimeType = 'image/png';

    // JPEG: FF D8 FF
    if (header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
      extension = '.jpg';
      mimeType = 'image/jpeg';
    }
    // PNG: 89 50 4E 47
    else if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
      extension = '.png';
      mimeType = 'image/png';
    }
    // WebP: RIFF....WEBP (RIFF at 0, WEBP at 8)
    else if (header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 &&
      header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50) {
      extension = '.webp';
      mimeType = 'image/webp';
    }
    // GIF: GIF8
    else if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x38) {
      extension = '.gif';
      mimeType = 'image/gif';
    }

    // Clean filename and append correct extension
    const cleanFilename = filenameBase.replace(/\.(png|jpg|jpeg|webp|gif|svg)$/i, '');
    const finalFilename = `${cleanFilename}${extension}`;

    // Re-create blob with correct type if needed (helps some browsers)
    const finalBlob = new Blob([arrayBuffer], { type: mimeType });
    const blobUrl = window.URL.createObjectURL(finalBlob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download failed:', error);
    // Fallback: Open original URL in new tab so user can at least see it/save manually
    window.open(url, '_blank');
  }
};

export const getAssetFilename = (asset: any, businessName: string = 'AdsCreate') => {
  // 1. Sanitize Business Name (Alpha-numeric only)
  const safeBusiness = businessName.replace(/[^a-zA-Z0-9]/g, '');

  // 2. Slugify Prompt using Regex to keep it clean (Max 30 chars)
  // Remove special chars, replace spaces with hyphens
  const promptSlug = (asset.prompt || 'asset')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 30);

  // 3. Format Date: YYYY-MM-DD_HH-mm
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // 2023-10-27
  const timeStr = date.toTimeString().split(' ')[0].substring(0, 5).replace(':', '-'); // 14-30

  // 4. Combine: Business_Prompt-Slug_Date_Time
  // Note: No extension here, downloadImage adds it automatically via magic bytes
  return `${safeBusiness}_${promptSlug}_${dateStr}_${timeStr}`;
};
