import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { StylePreset } from '../types';

export const useStyles = (businessId?: string) => {
    const [styles, setStyles] = useState<StylePreset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStyles = async () => {
            try {
                // Fetch active styles
                // We fetch styles that are either global (no business_id if that's a pattern) or linked to this business
                // For now, let's assume we want all active styles available in the system
                const { data, error } = await supabase
                    .from('styles')
                    .select('*')
                    .eq('isActive', true)
                    .order('sortOrder', { ascending: true });

                if (error) throw error;

                // Simple client-side filtering if needed in future
                setStyles(data as StylePreset[]);
            } catch (err: any) {
                console.error('[useStyles] Error fetching styles:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStyles();
    }, [businessId]);

    return { styles, loading, error };
};
