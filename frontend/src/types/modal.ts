export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export interface VoiceRecognitionState {
  transcript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
}

export interface LocationState {
  location: {
    latitude: number;
    longitude: number;
    error?: string;
  } | null;
  error: string | null;
}

export interface ModalContentProps {
  onClose: () => void;
  onSubmit: (input: string) => void;
} 