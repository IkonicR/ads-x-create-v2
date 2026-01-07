/**
 * NavigationContext — App-wide navigation with dirty form checking
 * 
 * Now uses FormRegistry to check ALL dirty forms instead of a single global state.
 * Keeps backward compatibility with setDirty/registerSaveHandler for gradual migration.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ViewState } from '../types';
import { NeuModal } from '../components/NeuModal';
import { useFormRegistry, FormRegistry } from './FormContext';

interface NavigationContextType {
  currentView: ViewState;
  navigate: (view: ViewState) => void;
  // LEGACY: Keep for backward compatibility during migration
  setDirty: (isDirty: boolean, label?: string) => void;
  isDirty: boolean;
  confirmAction: (action: () => void) => void;
  registerSaveHandler: (handler: (() => Promise<void>) | null, label?: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) throw new Error('useNavigation must be used within a NavigationProvider');
  return context;
};

interface NavigationProviderProps {
  children: React.ReactNode;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
  currentView,
  onNavigate
}) => {
  // ADDITIVE dirty tracking: Map<formId, displayLabel>
  // Each form adds/removes itself without overwriting others
  const [dirtyFormLabels, setDirtyFormLabels] = useState<Map<string, string>>(new Map());

  // ADDITIVE save handlers: Map<formId, saveHandler>
  const [saveHandlers, setSaveHandlers] = useState<Map<string, () => Promise<void>>>(new Map());

  // NEW: Listen to FormRegistry
  const { hasDirtyForms, dirtyForms, saveAll, discardAll } = useFormRegistry();

  // Combined dirty state: legacy Map OR new FormRegistry
  const legacyIsDirty = dirtyFormLabels.size > 0;
  const isDirty = legacyIsDirty || hasDirtyForms;

  const [pendingView, setPendingView] = useState<ViewState | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Per-form save handler registration
  const registerSaveHandler = useCallback((handler: (() => Promise<void>) | null, label?: string) => {
    if (!label) return; // Require label for tracking
    const formId = label.toLowerCase().replace(/ /g, '-');
    setSaveHandlers(prev => {
      const next = new Map(prev);
      if (handler) {
        next.set(formId, handler);
      } else {
        next.delete(formId);
      }
      return next;
    });
  }, []);

  // Per-form dirty state tracking (MEMOIZED to prevent infinite loops)
  const setDirty = useCallback((dirty: boolean, label?: string) => {
    if (!label) return; // Require label for tracking
    const formId = label.toLowerCase().replace(/ /g, '-');
    setDirtyFormLabels(prev => {
      const next = new Map(prev);
      if (dirty) {
        next.set(formId, label);
      } else {
        next.delete(formId);
      }
      return next;
    });
  }, []);

  // Handle browser refresh / close tab
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const navigate = (targetView: ViewState) => {
    if (targetView === currentView) return;

    if (isDirty) {
      setPendingView(targetView);
      setPendingAction(null);
      setIsModalOpen(true);
    } else {
      onNavigate(targetView);
    }
  };

  const confirmAction = (action: () => void) => {
    if (isDirty) {
      setPendingAction(() => action);
      setPendingView(null);
      setIsModalOpen(true);
    } else {
      action();
    }
  };

  const handleDiscard = () => {
    // Clear ALL dirty state and handlers
    setDirtyFormLabels(new Map());
    setSaveHandlers(new Map());

    // Discard all form registry forms
    discardAll();

    if (pendingView) {
      onNavigate(pendingView);
      setPendingView(null);
    } else if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }

    setIsModalOpen(false);
  };

  const handleSaveAndExit = async () => {
    setIsSaving(true);

    // Capture handlers before clearing (so we can still call them)
    const handlersToCall = Array.from(saveHandlers.values());

    // Clear maps IMMEDIATELY to prevent race conditions with useEffects
    setDirtyFormLabels(new Map());
    setSaveHandlers(new Map());

    try {
      // Save all registered handlers
      for (const handler of handlersToCall) {
        await handler();
      }

      // Save all FormRegistry forms
      if (hasDirtyForms) {
        await saveAll();
      }

      handleDiscard(); // Proceed after saving
    } catch (error) {
      console.error("Save failed during navigation", error);
      // Stay open so they can retry or discard
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setPendingView(null);
    setPendingAction(null);
    setIsModalOpen(false);
  };

  // Build dirty forms list for modal
  const buildDirtyFormsList = () => {
    const forms: string[] = [];

    // Add all legacy dirty forms
    dirtyFormLabels.forEach((label) => {
      if (!forms.includes(label)) {
        forms.push(label);
      }
    });

    dirtyForms.forEach(f => {
      if (!forms.includes(f.name)) {
        forms.push(f.name);
      }
    });

    return forms;
  };

  const hasSaveHandler = saveHandlers.size > 0 || hasDirtyForms;
  const dirtyFormsList = buildDirtyFormsList();

  return (
    <NavigationContext.Provider value={{
      currentView,
      navigate,
      setDirty,
      isDirty,
      confirmAction,
      registerSaveHandler
    }}>
      {children}

      <NeuModal
        isOpen={isModalOpen}
        onClose={handleCancel}
        title="Unsaved Changes"
        actionLabel={hasSaveHandler ? (isSaving ? "Saving..." : "Save All & Exit") : "Discard & Leave"}
        onAction={hasSaveHandler ? handleSaveAndExit : handleDiscard}
        variant={hasSaveHandler ? "primary" : "danger"}
        secondaryActionLabel={hasSaveHandler ? "Discard & Leave" : undefined}
        onSecondaryAction={hasSaveHandler ? handleDiscard : undefined}
        secondaryVariant="danger"
      >
        <div className="space-y-3">
          <p>You have unsaved changes in:</p>
          <ul className="list-disc list-inside space-y-1 text-sm opacity-80">
            {dirtyFormsList.map((name, i) => (
              <li key={i}>{name}</li>
            ))}
          </ul>
          <p className="text-sm opacity-70">
            {hasSaveHandler
              ? "Do you want to save your progress before leaving?"
              : "If you leave now, your progress will be lost."
            }
          </p>
        </div>
      </NeuModal>
    </NavigationContext.Provider>
  );
};
