export interface VoiceCommand {
  trigger: string[];
  characterId?: string;
  action: string;
  response?: string;
}

export interface SpeechState {
  isListening: boolean;
  isRecognizing: boolean;
  isSpeaking: boolean;
  currentTranscript: string;
  confidence: number;
}

export interface VoiceSettings {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  autoStart: boolean;
  voiceId: string;
  pitch: number;
  rate: number;
  volume: number;
}

export interface CharacterVoiceConfig {
  characterId: string;
  voiceId: string;
  pitch: number;
  rate: number;
  volume: number;
  enabled: boolean;
}