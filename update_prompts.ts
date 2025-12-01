import dotenv from 'dotenv';
const result = dotenv.config({ path: '.env.local' });
if (result.error) {
    console.error("Error loading .env.local", result.error);
}
console.log("Loaded Env Vars:", {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? 'FOUND' : 'MISSING',
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? 'FOUND' : 'MISSING'
});

const updatePrompts = async () => {
    // Dynamic import to ensure env vars are loaded first
    const { supabase } = await import('./services/supabase');
    const { DEFAULT_IMAGE_PROMPT } = await import('./services/prompts');

    console.log("Updating System Prompts...");

    const { error } = await supabase.from('system_prompts').upsert({
        id: '1',
        image_gen_rules: DEFAULT_IMAGE_PROMPT
    });

    if (error) {
        const { data: existing } = await supabase.from('system_prompts').select('id').limit(1).single();
        if (existing) {
            await supabase.from('system_prompts').update({
                image_gen_rules: DEFAULT_IMAGE_PROMPT
            }).eq('id', existing.id);
            console.log("Updated existing prompt row.");
        } else {
            console.error("Could not update prompts:", error);
        }
    } else {
        console.log("Successfully updated prompts.");
    }
};

updatePrompts();
