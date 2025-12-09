
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ViewState } from '../types';
import { NeuModal } from '../components/NeuModal';

interface NavigationContextType {
  currentView: ViewState;
  navigate: (view: ViewState) => void;
  setDirty: (isDirty: boolean) => void;
  isDirty: boolean;
  confirmAction: (action: () => void) => void;
  registerSaveHandler: (handler: (() => Promise<void>) | null) => void;
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
  const [isDirty, setIsDirty] = useState(false);
  const [pendingView, setPendingView] = useState<ViewState | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [saveHandler, setSaveHandler] = useState<(() => Promise<void>) | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const registerSaveHandler = React.useCallback((handler: (() => Promise<void>) | null) => {
    setSaveHandler(() => handler);
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
    setIsDirty(false); // Force clean

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
    if (saveHandler) {
      setIsSaving(true);
      try {
        await saveHandler();
        handleDiscard(); // Reuse logic to proceed
      } catch (error) {
        console.error("Save failed during navigation", error);
        // We stay open so they can retry or discard
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleCancel = () => {
    setPendingView(null);
    setPendingAction(null);
    setIsModalOpen(false);
  };

  return (
    <NavigationContext.Provider value={{ currentView, navigate, setDirty: setIsDirty, isDirty, confirmAction, registerSaveHandler }}>
      {children}

      <NeuModal
        isOpen={isModalOpen}
        onClose={handleCancel}
        title="Unsaved Changes"
        // Dynamic Props based on whether a Save Handler is available
        actionLabel={saveHandler ? (isSaving ? "Saving..." : "Save & Exit") : "Discard & Leave"}
        onAction={saveHandler ? handleSaveAndExit : handleDiscard}
        variant={saveHandler ? "primary" : "danger"}
        // Secondary Action (Discard) only if Save is available
        secondaryActionLabel={saveHandler ? "Discard & Leave" : undefined}
        onSecondaryAction={saveHandler ? handleDiscard : undefined}
        secondaryVariant="danger"
      >
        <p>
          {saveHandler
            ? "You have unsaved changes. Do you want to save your progress before leaving?"
            : "You have unsaved changes in this section. If you leave now, your progress will be lost."}
        </p>
      </NeuModal>
    </NavigationContext.Provider>
  );
};
