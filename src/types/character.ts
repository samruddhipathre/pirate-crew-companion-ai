export interface Character {
  id: string;
  name: string;
  title: string;
  avatar: string;
  color: string;
  personality: {
    traits: string[];
    speechStyle: string;
    catchphrases: string[];
    voiceDescription: string;
  };
  systemPrompt: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'character';
  characterId?: string;
  timestamp: Date;
  isTyping?: boolean;
}

export interface VoiceConfig {
  enabled: boolean;
  voiceId?: string;
  speed: number;
  pitch: number;
}

export interface CompanionSettings {
  activeCharacter: string;
  voiceConfig: VoiceConfig;
  ambientSounds: boolean;
  floatingMode: boolean;
  autoRespond: boolean;
}