export interface Attachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  data: string; // Base64 data or data URL
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  groundingSources?: GroundingSource[];
  isStreaming?: boolean;
  error?: string;
  modelUsed?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  model: string;
  isPinned?: boolean;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  requiresPaid?: boolean;
  recommended?: boolean;
}

export interface UserMemory {
  userName?: string;
  occupation?: string;
  preferredTone?: 'concise' | 'balanced' | 'detailed' | 'academic';
  customPreferences?: string;
  preferredLanguage?: string;
}

export interface AppSettings {
  model: string;
  temperature: number;
  systemInstruction: string;
  enableSearchGrounding: boolean;
  theme: 'black-ghost' | 'cyber-purple' | 'midnight-charcoal';
  speechVoice: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  streamResponses: boolean;
  userMemory: UserMemory;
}
