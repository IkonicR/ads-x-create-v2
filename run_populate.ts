import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
console.log("Loaded Env Keys:", Object.keys(process.env).filter(k => k.includes('SUPABASE')));

(async () => {
    try {
        const { populateDatabase } = await import('./populate_db');
        await populateDatabase();
        console.log("Database population finished successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Database population failed:", error);
        process.exit(1);
    }
})();
