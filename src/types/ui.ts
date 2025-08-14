export interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Navigation and layout types
export interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  isActive?: boolean;
}

// Modal and sheet states
export interface ModalState {
  isOpen: boolean;
  onClose: () => void;
}

// Color scheme for teams
export interface TeamColorOption {
  color: string;
  name: string;
}

// Status types for UI display
export type StatusType = "active" | "completed" | "in-progress" | "created";

export interface StatusInfo {
  text: string;
  style: string;
  emoji?: string;
}
