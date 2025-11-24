
import React, { createContext, useContext, useState } from 'react';
import { ViewState } from '../types';
import { NeuModal } from '../components/NeuModal';

interface NavigationContextType {
  currentView: ViewState;
  navigate: (view: ViewState) => void;
  setDirty: (isDirty: boolean) => void;
  isDirty: boolean;
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = (targetView: ViewState) => {
    if (targetView === currentView) return;

    if (isDirty) {
      setPendingView(targetView);
      setIsModalOpen(true);
    } else {
      onNavigate(targetView);
    }
  };

  const handleConfirm = () => {
    if (pendingView) {
      setIsDirty(false); // Force clean
      onNavigate(pendingView);
      setPendingView(null);
    }
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setPendingView(null);
    setIsModalOpen(false);
  };

  return (
    <NavigationContext.Provider value={{ currentView, navigate, setDirty: setIsDirty, isDirty }}>
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
