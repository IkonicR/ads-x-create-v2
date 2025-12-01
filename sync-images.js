
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- CONFIGURATION ---
// 1. Set your Downloads folder path here. 
// I am guessing based on standard Mac paths.
const DOWNLOADS_DIR = path.join(process.env.HOME || '/Users/rijnhartman', 'Downloads');

// 2. Target Directory (The 'generations' folder in this project)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TARGET_DIR = path.join(__dirname, 'generations');

// --- LOGIC ---

if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR);
    console.log(`Created target directory: ${TARGET_DIR}`);
}

console.log(`
🔄 IMAGE SYNC ACTIVE
Watching: ${DOWNLOADS_DIR}
Target:   ${TARGET_DIR}
Looking for files starting with 'ad-asset-'...
`);

let processing = false;

setInterval(() => {
    if (processing) return;
    processing = true;

    try {
        const files = fs.readdirSync(DOWNLOADS_DIR);
        
        const adAssets = files.filter(file => file.startsWith('ad-asset-') && file.endsWith('.png'));

        for (const file of adAssets) {
            const sourcePath = path.join(DOWNLOADS_DIR, file);
            const targetPath = path.join(TARGET_DIR, file);

            // Move the file
            // We use copy + unlink to prevent issues across partitions
            fs.copyFileSync(sourcePath, targetPath);
            fs.unlinkSync(sourcePath);

            console.log(`✅ Moved: ${file}`);
        }
    } catch (error) {
        console.error("Sync Error:", error);
    } finally {
        processing = false;
    }
}, 2000); // Check every 2 seconds
