
export interface Message {
  role: 'user' | 'agent';
  text: string;
}

export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

export interface VoiceState {
  status: ConnectionStatus;
  isListening: boolean;
  history: Message[];
  error?: string;
}
