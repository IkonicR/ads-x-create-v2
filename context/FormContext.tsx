/**
 * FormContext — App-wide form dirty state management
 * 
 * Each form registers itself, tracks its own dirty state, and provides a save handler.
 * NavigationContext queries the registry to block navigation when forms are dirty.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

// ============================================================================
// FORM REGISTRY — Global tracking of all active forms
// ============================================================================

interface RegisteredForm {
    id: string;
    name: string;
    isDirty: boolean;
    save: () => Promise<void>;
}

class FormRegistryClass {
    private forms: Map<string, RegisteredForm> = new Map();
    private listeners: Set<() => void> = new Set();

    register(form: RegisteredForm) {
        this.forms.set(form.id, form);
        this.notifyListeners();
    }

    unregister(id: string) {
        this.forms.delete(id);
        this.notifyListeners();
    }

    update(id: string, updates: Partial<RegisteredForm>) {
        const existing = this.forms.get(id);
        if (existing) {
            this.forms.set(id, { ...existing, ...updates });
            this.notifyListeners();
        }
    }

    hasDirtyForms(): boolean {
        return Array.from(this.forms.values()).some(f => f.isDirty);
    }

    getDirtyForms(): RegisteredForm[] {
        return Array.from(this.forms.values()).filter(f => f.isDirty);
    }

    async saveAll(): Promise<boolean> {
        const dirtyForms = this.getDirtyForms();
        try {
            for (const form of dirtyForms) {
                await form.save();
            }
            return true;
        } catch (error) {
            console.error('[FormRegistry] Save all failed:', error);
            return false;
        }
    }

    discardAll() {
        // Forms will handle their own discard via reset
        // This just clears dirty flags
        for (const form of this.forms.values()) {
            this.update(form.id, { isDirty: false });
        }
    }

    subscribe(listener: () => void) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners() {
        this.listeners.forEach(l => l());
    }
}

// Singleton instance
export const FormRegistry = new FormRegistryClass();

// ============================================================================
// FORM CONTEXT — Per-form context for components
// ============================================================================

interface FormContextValue {
    formId: string;
    formName: string;
    isDirty: boolean;
    setDirty: (dirty: boolean) => void;
    registerSave: (save: () => Promise<void>) => void;
    save: () => Promise<void>;
    reset: () => void;
}

const FormContext = createContext<FormContextValue | null>(null);

// ============================================================================
// FORM PROVIDER — Wrap any form with this
// ============================================================================

interface FormProviderProps {
    children: React.ReactNode;
    name: string;  // Human-readable name for the form (shown in modal)
    onSave?: () => Promise<void>;
    onReset?: () => void;
}

export const FormProvider: React.FC<FormProviderProps> = ({
    children,
    name,
    onSave,
    onReset
}) => {
    const formId = useRef(`form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`).current;
    const [isDirty, setIsDirty] = useState(false);
    const saveHandlerRef = useRef<(() => Promise<void>) | null>(onSave || null);

    // Update save handler ref when prop changes
    useEffect(() => {
        saveHandlerRef.current = onSave || null;
    }, [onSave]);

    // Register with global registry on mount
    useEffect(() => {
        FormRegistry.register({
            id: formId,
            name,
            isDirty: false,
            save: async () => {
                if (saveHandlerRef.current) {
                    await saveHandlerRef.current();
                }
            }
        });

        return () => {
            FormRegistry.unregister(formId);
        };
    }, [formId, name]);

    // Sync dirty state with registry
    useEffect(() => {
        FormRegistry.update(formId, { isDirty });
    }, [formId, isDirty]);

    const setDirty = useCallback((dirty: boolean) => {
        setIsDirty(dirty);
    }, []);

    const registerSave = useCallback((save: () => Promise<void>) => {
        saveHandlerRef.current = save;
        FormRegistry.update(formId, {
            save: async () => {
                await save();
                setIsDirty(false);
            }
        });
    }, [formId]);

    const save = useCallback(async () => {
        if (saveHandlerRef.current) {
            await saveHandlerRef.current();
            setIsDirty(false);
        }
    }, []);

    const reset = useCallback(() => {
        setIsDirty(false);
        if (onReset) {
            onReset();
        }
    }, [onReset]);

    const value: FormContextValue = {
        formId,
        formName: name,
        isDirty,
        setDirty,
        registerSave,
        save,
        reset
    };

    return (
        <FormContext.Provider value={value}>
            {children}
        </FormContext.Provider>
    );
};

// ============================================================================
// USE FORM HOOK — Access form context in components
// ============================================================================

export const useForm = () => {
    const context = useContext(FormContext);
    if (!context) {
        // Return a no-op version if not wrapped in FormProvider
        // This allows gradual migration
        return {
            formId: 'none',
            formName: 'Unknown',
            isDirty: false,
            setDirty: () => { },
            registerSave: () => { },
            save: async () => { },
            reset: () => { }
        };
    }
    return context;
};

// ============================================================================
// USE FORM REGISTRY HOOK — Listen to registry changes (for NavigationContext)
// ============================================================================

export const useFormRegistry = () => {
    const [, forceUpdate] = useState({});

    useEffect(() => {
        return FormRegistry.subscribe(() => forceUpdate({}));
    }, []);

    return {
        hasDirtyForms: FormRegistry.hasDirtyForms(),
        dirtyForms: FormRegistry.getDirtyForms(),
        saveAll: () => FormRegistry.saveAll(),
        discardAll: () => FormRegistry.discardAll()
    };
};
