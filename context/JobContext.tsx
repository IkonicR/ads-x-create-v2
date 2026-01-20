/**
 * JobContext — Unified Background Job Management
 * Handles all pending image generation jobs across Generator and Chat.
 * 
 * Features:
 * - Central state for all pending jobs
 * - Automatic polling with cleanup
 * - localStorage sync for refresh persistence
 * - Load pending from server on mount
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { pollJobStatus, getPendingJobs } from '../services/geminiService';

// ============================================================================
// TYPES
// ============================================================================

export interface BackgroundJob {
    id: string;                    // Job ID from generation_jobs table
    type: 'generator' | 'chat';    // Source of the job
    businessId: string;            // Which business
    status: 'pending' | 'polling' | 'complete' | 'failed';

    // For chat: which message to attach result to
    messageId?: string;

    // Generation metadata
    aspectRatio?: string;
    styleName?: string;
    styleId?: string;
    subjectId?: string;
    modelTier?: 'flash' | 'pro' | 'ultra';
    prompt?: string;

    // Progress and result
    progress?: number;
    result?: string;               // Image URL when complete
    animationPhase?: 'warmup' | 'cruise' | 'deceleration' | 'revealed';

    createdAt: number;
}

interface JobContextType {
    jobs: BackgroundJob[];
    addJob: (job: Omit<BackgroundJob, 'status'>) => void;
    removeJob: (id: string) => void;
    updateJob: (id: string, updates: Partial<BackgroundJob>) => void;
    getJobsByType: (type: 'generator' | 'chat') => BackgroundJob[];
    getJobsForBusiness: (businessId: string) => BackgroundJob[];
    clearJobsForBusiness: (businessId: string) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const JobContext = createContext<JobContextType | undefined>(undefined);

export const useJobs = () => {
    const context = useContext(JobContext);
    if (!context) throw new Error('useJobs must be used within JobProvider');
    return context;
};

// ============================================================================
// PROVIDER
// ============================================================================

const STORAGE_KEY = 'background_jobs';
const POLL_INTERVAL = 2000;  // 2 seconds
const MAX_POLL_TIME = 5 * 60 * 1000;  // 5 minutes

// Cross-tab synchronization
const JOB_SYNC_CHANNEL = 'job_sync';
let jobSyncChannel: BroadcastChannel | null = null;

function getJobSyncChannel(): BroadcastChannel {
    if (!jobSyncChannel) {
        jobSyncChannel = new BroadcastChannel(JOB_SYNC_CHANNEL);
    }
    return jobSyncChannel;
}

export const JobProvider: React.FC<{
    children: React.ReactNode;
    businessId: string | null;
}> = ({ children, businessId }) => {
    const [jobs, setJobs] = useState<BackgroundJob[]>([]);
    const pollingRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
    const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
    const mountedRef = useRef(true);

    // -------------------------------------------------------------------------
    // PERSISTENCE: Load from localStorage on mount
    // -------------------------------------------------------------------------
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as BackgroundJob[];
                // Filter out jobs older than 5 minutes
                const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
                const validJobs = parsed.filter(j =>
                    j.createdAt > fiveMinutesAgo &&
                    (j.status === 'pending' || j.status === 'polling')
                );
                if (validJobs.length > 0) {
                    setJobs(validJobs);
                }
            }
        } catch {
            // Ignore localStorage errors
        }
    }, []);

    // -------------------------------------------------------------------------
    // PERSISTENCE: Save to localStorage on change
    // -------------------------------------------------------------------------
    useEffect(() => {
        const pendingJobs = jobs.filter(j => j.status === 'pending' || j.status === 'polling');
        if (pendingJobs.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingJobs));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [jobs]);

    // -------------------------------------------------------------------------
    // CLEANUP on unmount
    // -------------------------------------------------------------------------
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            pollingRefs.current.forEach(interval => clearInterval(interval));
            timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
            pollingRefs.current.clear();
            timeoutRefs.current.clear();
        };
    }, []);

    // -------------------------------------------------------------------------
    // CROSS-TAB SYNC: Broadcast job updates to other tabs
    // -------------------------------------------------------------------------
    useEffect(() => {
        const pendingJobs = jobs.filter(j => j.status === 'pending' || j.status === 'polling');
        if (pendingJobs.length > 0) {
            try {
                getJobSyncChannel().postMessage({ type: 'jobs_updated', jobs: pendingJobs });
            } catch {
                // BroadcastChannel not supported
            }
        }
    }, [jobs]);

    // -------------------------------------------------------------------------
    // CROSS-TAB SYNC: Listen for job updates from other tabs
    // -------------------------------------------------------------------------
    useEffect(() => {
        const channel = getJobSyncChannel();
        const handler = (event: MessageEvent) => {
            if (event.data.type === 'jobs_updated') {
                const incomingJobs = event.data.jobs as BackgroundJob[];
                setJobs(prev => {
                    // Merge without duplicates, prefer existing jobs
                    const existingIds = new Set(prev.map(j => j.id));
                    const newJobs = incomingJobs.filter(j => !existingIds.has(j.id));
                    if (newJobs.length === 0) return prev;
                    return [...prev, ...newJobs];
                });
                // Start polling for newly discovered jobs
                incomingJobs.forEach(job => {
                    if (!pollingRefs.current.has(job.id)) {
                        startPolling(job.id);
                    }
                });
            }
        };
        channel.addEventListener('message', handler);
        return () => channel.removeEventListener('message', handler);
    }, []);

    // -------------------------------------------------------------------------
    // LOAD FROM SERVER: Get pending jobs from generation_jobs table
    // -------------------------------------------------------------------------
    useEffect(() => {
        if (!businessId) return;

        const loadFromServer = async () => {
            try {
                const serverJobs = await getPendingJobs(businessId);
                if (serverJobs.length === 0) return;

                console.log('[JobContext] Found', serverJobs.length, 'pending jobs from server');

                // Convert server jobs to BackgroundJob format
                const convertedJobs: BackgroundJob[] = serverJobs.map(job => ({
                    id: job.id,
                    type: 'generator' as const,  // Server jobs are from Generator unless tagged
                    businessId,
                    status: 'polling' as const,
                    aspectRatio: job.aspect_ratio,
                    styleId: job.style_id,
                    subjectId: job.subject_id,
                    modelTier: job.model_tier,
                    prompt: job.prompt,
                    animationPhase: 'cruise' as const,  // Resume in cruise
                    createdAt: new Date(job.created_at).getTime()
                }));

                setJobs(prev => {
                    // Merge without duplicates
                    const existingIds = new Set(prev.map(j => j.id));
                    const newJobs = convertedJobs.filter(j => !existingIds.has(j.id));
                    return [...prev, ...newJobs];
                });

                // Start polling for each
                convertedJobs.forEach(job => {
                    startPolling(job.id);
                });
            } catch (error) {
                console.error('[JobContext] Failed to load pending jobs:', error);
            }
        };

        loadFromServer();
    }, [businessId]);

    // -------------------------------------------------------------------------
    // POLLING: Start polling for a job
    // -------------------------------------------------------------------------
    const startPolling = useCallback((jobId: string) => {
        // Don't start if already polling
        if (pollingRefs.current.has(jobId)) return;

        console.log('[JobContext] Starting poll for job:', jobId);

        const interval = setInterval(async () => {
            if (!mountedRef.current) {
                clearInterval(interval);
                return;
            }

            try {
                const status = await pollJobStatus(jobId);

                if (status.status === 'completed' && status.asset) {
                    console.log('[JobContext] ✅ Job completed:', jobId);
                    clearInterval(interval);
                    pollingRefs.current.delete(jobId);

                    if (timeoutRefs.current.has(jobId)) {
                        clearTimeout(timeoutRefs.current.get(jobId)!);
                        timeoutRefs.current.delete(jobId);
                    }

                    setJobs(prev => prev.map(j =>
                        j.id === jobId
                            ? { ...j, status: 'complete' as const, result: status.asset.content }
                            : j
                    ));
                } else if (status.status === 'failed') {
                    console.error('[JobContext] ❌ Job failed:', jobId, status.errorMessage);
                    clearInterval(interval);
                    pollingRefs.current.delete(jobId);

                    setJobs(prev => prev.filter(j => j.id !== jobId));
                }
            } catch (error) {
                console.error('[JobContext] Poll error:', jobId, error);
            }
        }, POLL_INTERVAL);

        pollingRefs.current.set(jobId, interval);

        // Safety timeout
        const timeout = setTimeout(() => {
            console.log('[JobContext] Job timed out:', jobId);
            clearInterval(interval);
            pollingRefs.current.delete(jobId);
            setJobs(prev => prev.filter(j => j.id !== jobId));
        }, MAX_POLL_TIME);

        timeoutRefs.current.set(jobId, timeout);
    }, []);

    // -------------------------------------------------------------------------
    // PUBLIC API
    // -------------------------------------------------------------------------

    const addJob = useCallback((job: Omit<BackgroundJob, 'status'>) => {
        const newJob: BackgroundJob = { ...job, status: 'polling' };
        setJobs(prev => [newJob, ...prev]);
        startPolling(job.id);
    }, [startPolling]);

    const removeJob = useCallback((id: string) => {
        // Stop polling
        if (pollingRefs.current.has(id)) {
            clearInterval(pollingRefs.current.get(id)!);
            pollingRefs.current.delete(id);
        }
        if (timeoutRefs.current.has(id)) {
            clearTimeout(timeoutRefs.current.get(id)!);
            timeoutRefs.current.delete(id);
        }
        setJobs(prev => prev.filter(j => j.id !== id));
    }, []);

    const updateJob = useCallback((id: string, updates: Partial<BackgroundJob>) => {
        setJobs(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j));
    }, []);

    const getJobsByType = useCallback((type: 'generator' | 'chat') => {
        return jobs.filter(j => j.type === type);
    }, [jobs]);

    const getJobsForBusiness = useCallback((businessId: string) => {
        return jobs.filter(j => j.businessId === businessId);
    }, [jobs]);

    const clearJobsForBusiness = useCallback((businessId: string) => {
        jobs.filter(j => j.businessId === businessId).forEach(j => {
            if (pollingRefs.current.has(j.id)) {
                clearInterval(pollingRefs.current.get(j.id)!);
                pollingRefs.current.delete(j.id);
            }
        });
        setJobs(prev => prev.filter(j => j.businessId !== businessId));
    }, [jobs]);

    return (
        <JobContext.Provider value={{
            jobs,
            addJob,
            removeJob,
            updateJob,
            getJobsByType,
            getJobsForBusiness,
            clearJobsForBusiness
        }}>
            {children}
        </JobContext.Provider>
    );
};
