import { Character } from '@/types/character';

interface ElevenLabsVoiceSettings {
  voiceId: string;
  stability: number;
  similarityBoost: number;
  style: number;
  useSpeakerBoost: boolean;
}

// Character-specific voice configurations for anime-style Japanese-accented English
export const characterVoiceConfigs: Record<string, ElevenLabsVoiceSettings> = {
  luffy: {
    voiceId: 'TX3LPaxmHKxFdv7VOQHJ', // Liam - energetic young male
    stability: 0.5,
    similarityBoost: 0.7,
    style: 0.8,
    useSpeakerBoost: true
  },
  zoro: {
    voiceId: 'onwK4e9ZLuTAKqWW03F9', // Daniel - deep, serious male
    stability: 0.8,
    similarityBoost: 0.8,
    style: 0.3,
    useSpeakerBoost: true
  },
  sanji: {
    voiceId: 'CwhRBWXzGAHq8TQ4Fs17', // Roger - smooth, sophisticated
    stability: 0.6,
    similarityBoost: 0.7,
    style: 0.6,
    useSpeakerBoost: true
  },
  nami: {
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah - intelligent female
    stability: 0.7,
    similarityBoost: 0.8,
    style: 0.5,
    useSpeakerBoost: true
  },
  usopp: {
    voiceId: 'N2lVS1w4EtoT3dr4eOWO', // Callum - nervous but enthusiastic
    stability: 0.4,
    similarityBoost: 0.6,
    style: 0.7,
    useSpeakerBoost: true
  },
  chopper: {
    voiceId: 'pFZP5JQG7iQjIQuC4Bku', // Lily - high-pitched, innocent
    stability: 0.5,
    similarityBoost: 0.7,
    style: 0.8,
    useSpeakerBoost: true
  },
  law: {
    voiceId: 'bIHbv24MWmeRgasZH58o', // Will - calm, calculated
    stability: 0.9,
    similarityBoost: 0.9,
    style: 0.2,
    useSpeakerBoost: true
  }
};

// Japanese accent modifications for each character
export const japaneseAccentModifications: Record<string, (text: string) => string> = {
  luffy: (text) => text
    .replace(/\bl\b/g, 'ru')
    .replace(/\br\b/g, 'ru')
    .replace(/th/g, 'ze')
    .replace(/v/g, 'bu')
    + ' ne!',
  
  zoro: (text) => text
    .replace(/\bl\b/g, 'ru')
    .replace(/\br\b/g, 'ru')
    .replace(/th/g, 'ze')
    + ' yo.',
  
  sanji: (text) => text
    .replace(/\bl\b/g, 'ru')
    .replace(/\br\b/g, 'ru')
    .replace(/th/g, 'ze')
    + ' mademoiselle.',
  
  nami: (text) => text
    .replace(/\bl\b/g, 'ru')
    .replace(/\br\b/g, 'ru')
    .replace(/th/g, 'ze')
    + ' na.',
  
  usopp: (text) => text
    .replace(/\bl\b/g, 'ru')
    .replace(/\br\b/g, 'ru')
    .replace(/th/g, 'ze')
    + ' yo!',
  
  chopper: (text) => text
    .replace(/\bl\b/g, 'ru')
    .replace(/\br\b/g, 'ru')
    .replace(/th/g, 'ze')
    + ' desu!',
  
  law: (text) => text
    .replace(/\bl\b/g, 'ru')
    .replace(/\br\b/g, 'ru')
    .replace(/th/g, 'ze')
    + ' desu.'
};

export class ElevenLabsService {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  async speak(text: string, character: Character): Promise<void> {
    if (!this.apiKey) {
      console.warn('ElevenLabs API key not set, falling back to browser TTS');
      await this.fallbackTTS(text, character);
      return;
    }

    try {
      const voiceConfig = characterVoiceConfigs[character.id];
      const accentModifier = japaneseAccentModifications[character.id];
      const modifiedText = accentModifier ? accentModifier(text) : text;

      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceConfig.voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey
        },
        body: JSON.stringify({
          text: modifiedText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: voiceConfig.stability,
            similarity_boost: voiceConfig.similarityBoost,
            style: voiceConfig.style,
            use_speaker_boost: voiceConfig.useSpeakerBoost
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioData = await response.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(audioData);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();

    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      await this.fallbackTTS(text, character);
    }
  }

  private async fallbackTTS(text: string, character: Character): Promise<void> {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Character-specific voice settings for fallback
      const voiceSettings = {
        luffy: { pitch: 1.3, rate: 1.2 },
        zoro: { pitch: 0.7, rate: 0.8 },
        sanji: { pitch: 1.0, rate: 1.0 },
        nami: { pitch: 1.4, rate: 1.1 },
        usopp: { pitch: 1.2, rate: 1.3 },
        chopper: { pitch: 1.6, rate: 1.0 },
        law: { pitch: 0.8, rate: 0.9 }
      };

      const settings = voiceSettings[character.id as keyof typeof voiceSettings];
      utterance.pitch = settings.pitch;
      utterance.rate = settings.rate;
      utterance.volume = 1;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      speechSynthesis.speak(utterance);
    });
  }
}

export const elevenLabsService = new ElevenLabsService();