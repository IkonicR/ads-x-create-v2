
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ViewState } from '../types';
import { NeuModal } from '../components/NeuModal';

interface NavigationContextType {
  currentView: ViewState;
  navigate: (view: ViewState) => void;
  setDirty: (isDirty: boolean) => void;
  isDirty: boolean;
  confirmAction: (action: () => void) => void;
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
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleConfirm = () => {
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

  const handleCancel = () => {
    setPendingView(null);
    setPendingAction(null);
    setIsModalOpen(false);
  };

  return (
    <NavigationContext.Provider value={{ currentView, navigate, setDirty: setIsDirty, isDirty, confirmAction }}>
      {children}

      <NeuModal
        isOpen={isModalOpen}
        onClose={handleCancel}
        title="Unsaved Changes"
        actionLabel="Discard & Leave"
        onAction={handleConfirm}
        variant="danger"
      >
        <p>
          You have unsaved changes in this section.
          If you leave now, your progress will be lost.
        </p>
      </NeuModal>
    </NavigationContext.Provider>
  );
};
