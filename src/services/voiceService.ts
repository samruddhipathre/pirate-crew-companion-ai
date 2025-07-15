// Speech Recognition API types
declare global {
  interface Window {
    SpeechRecognition: new() => SpeechRecognition;
    webkitSpeechRecognition: new() => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionError) => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionError extends Event {
  readonly error: string;
  readonly message: string;
}

export class VoiceRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isInitialized = false;
  private callbacks: {
    onResult?: (transcript: string, confidence: number) => void;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: string) => void;
  } = {};

  constructor() {
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition() {
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      console.error('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 3;

    this.recognition.onstart = () => {
      this.callbacks.onStart?.();
    };

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;

        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          this.callbacks.onResult?.(transcript.trim(), confidence);
        } else {
          interimTranscript += transcript;
        }
      }
    };

    this.recognition.onend = () => {
      this.callbacks.onEnd?.();
    };

    this.recognition.onerror = (event) => {
      this.callbacks.onError?.(event.error);
    };

    this.isInitialized = true;
  }

  public setCallbacks(callbacks: {
    onResult?: (transcript: string, confidence: number) => void;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: string) => void;
  }) {
    this.callbacks = callbacks;
  }

  public startListening(): boolean {
    if (!this.recognition || !this.isInitialized) {
      console.error('Speech recognition not initialized');
      return false;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  public isSupported(): boolean {
    return this.isInitialized && this.recognition !== null;
  }
}

export class TextToSpeechService {
  private synthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.loadVoices();
  }

  private loadVoices() {
    const loadVoicesImpl = () => {
      this.voices = this.synthesis.getVoices();
    };

    loadVoicesImpl();
    
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = loadVoicesImpl;
    }
  }

  public speak(text: string, options: {
    voiceId?: string;
    pitch?: number;
    rate?: number;
    volume?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: string) => void;
  } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stopSpeaking();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice if specified
      if (options.voiceId) {
        const voice = this.voices.find(v => v.name === options.voiceId);
        if (voice) {
          utterance.voice = voice;
        }
      }

      utterance.pitch = options.pitch ?? 1;
      utterance.rate = options.rate ?? 1;
      utterance.volume = options.volume ?? 1;

      utterance.onstart = () => {
        options.onStart?.();
      };

      utterance.onend = () => {
        options.onEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        options.onError?.(event.error);
        reject(new Error(event.error));
      };

      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);
    });
  }

  public stopSpeaking(): void {
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }
    this.currentUtterance = null;
  }

  public isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  public getAnimeVoices(): SpeechSynthesisVoice[] {
    // Filter voices that might work well for anime characters
    return this.voices.filter(voice => 
      voice.lang.includes('en') || 
      voice.lang.includes('ja') ||
      voice.name.toLowerCase().includes('female') ||
      voice.name.toLowerCase().includes('male')
    );
  }
}

// Voice command parser
export class VoiceCommandParser {
  private characterKeywords: Record<string, string[]> = {
    'luffy': ['luffy', 'monkey', 'captain', 'straw hat'],
    'zoro': ['zoro', 'roronoa', 'swordsman', 'green hair'],
    'sanji': ['sanji', 'cook', 'chef', 'blonde'],
    'nami': ['nami', 'navigator', 'orange hair'],
    'usopp': ['usopp', 'sniper', 'long nose'],
    'chopper': ['chopper', 'doctor', 'reindeer'],
    'law': ['law', 'trafalgar', 'surgeon']
  };

  private commandKeywords: Record<string, string[]> = {
    'switch': ['switch to', 'change to', 'bring in', 'call', 'summon'],
    'tell_joke': ['tell a joke', 'make me laugh', 'joke', 'funny'],
    'introduce': ['introduce yourself', 'who are you', 'tell me about'],
    'weather': ['weather', 'temperature', 'forecast'],
    'time': ['time', 'what time', 'clock'],
    'help': ['help', 'what can you do', 'commands']
  };

  public parseCommand(transcript: string): {
    characterId?: string;
    command: string;
    confidence: number;
  } {
    const normalizedTranscript = transcript.toLowerCase();
    
    // Check for character mentions
    let characterId: string | undefined;
    let maxCharacterScore = 0;
    
    for (const [id, keywords] of Object.entries(this.characterKeywords)) {
      const score = keywords.reduce((acc, keyword) => {
        return acc + (normalizedTranscript.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (score > maxCharacterScore) {
        maxCharacterScore = score;
        characterId = id;
      }
    }

    // Check for command keywords
    let command = 'general';
    let maxCommandScore = 0;
    
    for (const [cmd, keywords] of Object.entries(this.commandKeywords)) {
      const score = keywords.reduce((acc, keyword) => {
        return acc + (normalizedTranscript.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (score > maxCommandScore) {
        maxCommandScore = score;
        command = cmd;
      }
    }

    const confidence = (maxCharacterScore + maxCommandScore) / 10;
    
    return {
      characterId,
      command,
      confidence: Math.min(confidence, 1)
    };
  }
}

// Global voice service instances
export const voiceRecognition = new VoiceRecognitionService();
export const textToSpeech = new TextToSpeechService();
export const commandParser = new VoiceCommandParser();