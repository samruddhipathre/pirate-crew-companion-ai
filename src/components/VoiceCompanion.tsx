import { useState, useEffect, useCallback, useRef } from 'react';
import { Character } from '@/types/character';
import { characters, getCharacterById } from '@/data/characters';
import { VoiceCharacterAvatar } from './VoiceCharacterAvatar';
import { CharacterSwitcher } from './CharacterSwitcher';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { elevenLabsService } from '@/services/elevenlabsService';
import { 
  voiceRecognition, 
  textToSpeech, 
  commandParser,
  VoiceRecognitionService,
  TextToSpeechService,
  VoiceCommandParser
} from '@/services/voiceService';
import { cn } from '@/lib/utils';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Settings, 
  Play, 
  Pause,
  RotateCcw,
  Users,
  MessageSquare
} from 'lucide-react';

interface VoiceLog {
  id: string;
  timestamp: Date;
  type: 'command' | 'response' | 'system';
  content: string;
  characterId?: string;
  confidence?: number;
}

export function VoiceCompanion() {
  const [activeCharacter, setActiveCharacter] = useState<string>('luffy');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceLogs, setVoiceLogs] = useState<VoiceLog[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [voiceSettings, setVoiceSettings] = useState({
    pitch: 1,
    rate: 1,
    volume: 1
  });
  const [characterPositions, setCharacterPositions] = useState<Record<string, { x: number; y: number }>>({
    luffy: { x: 20, y: 20 },
    zoro: { x: 20, y: 120 },
    sanji: { x: 20, y: 220 },
    nami: { x: 20, y: 320 },
    usopp: { x: 20, y: 420 },
    chopper: { x: 20, y: 520 },
    law: { x: 20, y: 620 }
  });

  const currentCharacter = getCharacterById(activeCharacter);
  const recognitionRef = useRef<VoiceRecognitionService>(voiceRecognition);
  const ttsRef = useRef<TextToSpeechService>(textToSpeech);
  const parserRef = useRef<VoiceCommandParser>(commandParser);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = ttsRef.current.getVoices();
      setAvailableVoices(voices);
      
      // Try to set a default voice
      if (voices.length > 0 && !selectedVoice) {
        const englishVoice = voices.find(v => v.lang.includes('en'));
        if (englishVoice) {
          setSelectedVoice(englishVoice.name);
        }
      }
    };

    loadVoices();
    
    // Load voices again after they're loaded
    setTimeout(loadVoices, 1000);
  }, [selectedVoice]);

  // Add voice log
  const addVoiceLog = useCallback((log: Omit<VoiceLog, 'id' | 'timestamp'>) => {
    const newLog: VoiceLog = {
      ...log,
      id: `log-${Date.now()}`,
      timestamp: new Date()
    };
    setVoiceLogs(prev => [...prev, newLog].slice(-50)); // Keep last 50 logs
  }, []);

  // Generate character response
  const generateResponse = useCallback((command: string, character: Character, commandType: string): string => {
    const responses = {
      tell_joke: {
        luffy: "Why don't pirates ever get lost? Because they always follow their dreams! Shishishi!",
        zoro: "I don't tell jokes. I cut things.",
        sanji: "What's a chef's favorite type of music? Anything with a good beat to cook to!",
        nami: "Why do pirates love math? Because they're always looking for X marks the spot!",
        usopp: "I once told a joke so funny that my 8,000 followers laughed for three days straight!",
        chopper: "Why don't doctors trust stairs? Because they're always up to something!",
        law: "Medical humor is not my specialty, but I suppose laughter is the best medicine."
      },
      introduce: {
        luffy: "I'm Monkey D. Luffy! I'm gonna be the Pirate King! I love meat and adventures!",
        zoro: "I'm Roronoa Zoro, swordsman of the Straw Hat Pirates. I'll be the world's greatest swordsman.",
        sanji: "I'm Sanji, the cook. I'll find the All Blue someday and cook the most amazing dishes!",
        nami: "I'm Nami, the navigator. I can read the weather and guide us anywhere!",
        usopp: "I'm the great Captain Usopp! I have 8,000 followers and I'm the bravest warrior of the sea!",
        chopper: "I'm Tony Tony Chopper! I'm a doctor who can help anyone who's sick!",
        law: "I'm Trafalgar Law, captain of the Heart Pirates and a surgeon of death."
      },
      time: {
        luffy: `It's ${new Date().toLocaleTimeString()}! Time flies when you're having adventures!`,
        zoro: `${new Date().toLocaleTimeString()}. Time to train more.`,
        sanji: `It's ${new Date().toLocaleTimeString()}. Perfect time for a meal!`,
        nami: `The time is ${new Date().toLocaleTimeString()}. I keep track of everything!`,
        usopp: `${new Date().toLocaleTimeString()}! I once created a clock that could tell time backwards!`,
        chopper: `It's ${new Date().toLocaleTimeString()}. Regular sleep is important for health!`,
        law: `${new Date().toLocaleTimeString()}. Precision in timing is crucial for any operation.`
      },
      help: {
        luffy: "You can ask me to tell jokes, switch characters, or just chat! I'm always ready for fun!",
        zoro: "I can help with training advice or just talk. Don't expect me to help with directions though.",
        sanji: "I can talk about cooking, tell jokes, or help with anything a gentleman should do!",
        nami: "I can help with navigation, weather, or managing things efficiently!",
        usopp: "I can tell amazing stories, help with inventions, or share tales of my adventures!",
        chopper: "I can give medical advice, help with health questions, or just chat about anything!",
        law: "I can provide strategic advice, medical information, or discuss complex topics."
      },
      general: {
        luffy: "That's interesting! Want to go on an adventure together?",
        zoro: "I see. Is there something you need help with?",
        sanji: "How can I assist you today?",
        nami: "That's useful information. Anything else?",
        usopp: "That reminds me of an incredible story!",
        chopper: "Thank you for sharing! Is there anything I can help you with?",
        law: "Understood. What would you like to discuss?"
      }
    };

    const characterResponses = responses[commandType as keyof typeof responses];
    if (characterResponses) {
      return characterResponses[character.id as keyof typeof characterResponses];
    }

    return responses.general[character.id as keyof typeof responses.general];
  }, []);

  // Handle voice commands
  const handleVoiceCommand = useCallback(async (transcript: string, confidence: number) => {
    addVoiceLog({
      type: 'command',
      content: transcript,
      confidence
    });

    const parsed = parserRef.current.parseCommand(transcript);
    
    // Switch character if requested
    if (parsed.characterId && parsed.characterId !== activeCharacter) {
      setActiveCharacter(parsed.characterId);
      addVoiceLog({
        type: 'system',
        content: `Switched to ${getCharacterById(parsed.characterId)?.name}`,
        characterId: parsed.characterId
      });
    }

    // Generate response
    const targetCharacter = getCharacterById(parsed.characterId || activeCharacter);
    if (targetCharacter) {
      const response = generateResponse(transcript, targetCharacter, parsed.command);
      
      addVoiceLog({
        type: 'response',
        content: response,
        characterId: targetCharacter.id
      });

      // Speak the response
      if (isVoiceEnabled) {
        await speakResponse(response, targetCharacter);
      }
    }
  }, [activeCharacter, isVoiceEnabled, addVoiceLog, generateResponse]);

  // Speak response with Japanese accent
  const speakResponse = useCallback(async (text: string, character: Character) => {
    setIsSpeaking(true);
    
    try {
      // Try ElevenLabs first for better Japanese accent
      await elevenLabsService.speak(text, character);
    } catch (error) {
      console.error('Speech synthesis error:', error);
    } finally {
      setIsSpeaking(false);
    }
  }, []);

  // Setup voice recognition
  useEffect(() => {
    recognitionRef.current.setCallbacks({
      onResult: handleVoiceCommand,
      onStart: () => setIsListening(true),
      onEnd: () => setIsListening(false),
      onError: (error) => {
        console.error('Voice recognition error:', error);
        setIsListening(false);
        addVoiceLog({
          type: 'system',
          content: `Voice recognition error: ${error}`
        });
      }
    });
  }, [handleVoiceCommand, addVoiceLog]);

  // Toggle voice listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current.stopListening();
      setIsListening(false);
    } else {
      if (recognitionRef.current.startListening()) {
        setIsListening(true);
      }
    }
  }, [isListening]);

  // Toggle voice synthesis
  const toggleVoice = useCallback(() => {
    if (isSpeaking) {
      ttsRef.current.stopSpeaking();
      setIsSpeaking(false);
    }
    setIsVoiceEnabled(!isVoiceEnabled);
  }, [isVoiceEnabled, isSpeaking]);

  // Test voice
  const testVoice = useCallback(() => {
    if (currentCharacter) {
      const testMessage = generateResponse('test', currentCharacter, 'introduce');
      speakResponse(testMessage, currentCharacter);
    }
  }, [currentCharacter, generateResponse, speakResponse]);

  if (!currentCharacter) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-ocean">
      {/* Character Switcher */}
      <CharacterSwitcher
        activeCharacter={activeCharacter}
        onCharacterChange={setActiveCharacter}
      />

      {/* Active Character Avatar */}
      <VoiceCharacterAvatar
        character={currentCharacter}
        isActive={true}
        isSpeaking={isSpeaking}
        isListening={isListening}
        position={characterPositions[activeCharacter]}
        size="large"
        onVoiceToggle={toggleVoice}
        onMicToggle={toggleListening}
        onPositionChange={(pos) => setCharacterPositions(prev => ({
          ...prev,
          [activeCharacter]: pos
        }))}
      />

      {/* Control Panel */}
      <div className="fixed bottom-4 right-4 w-80 max-h-96 z-40">
        <Card className="shadow-character">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Users size={20} />
                <span>Voice Controls</span>
              </span>
              <Badge variant="secondary">
                {currentCharacter.name}
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Main Controls */}
            <div className="flex items-center justify-between">
              <Button
                variant={isListening ? "default" : "outline"}
                onClick={toggleListening}
                className={cn(
                  "flex-1 mr-2",
                  isListening && "animate-pulse"
                )}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                {isListening ? "Stop Listening" : "Start Listening"}
              </Button>
              
              <Button
                variant="outline"
                onClick={toggleVoice}
                className="flex items-center space-x-2"
              >
                {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </Button>
            </div>

            {/* ElevenLabs API Key */}
            <div className="space-y-2">
              <label className="text-sm font-medium">ElevenLabs API Key</label>
              <input
                type="password"
                placeholder="Enter API key for better Japanese voices"
                className="w-full px-3 py-2 text-sm border rounded-md"
                onChange={(e) => elevenLabsService.setApiKey(e.target.value)}
              />
            </div>

            {/* Voice Settings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Voice Settings</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testVoice}
                  disabled={isSpeaking}
                >
                  <Play size={12} />
                  Test
                </Button>
              </div>
              
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-muted-foreground">Voice</label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVoices.map((voice) => (
                        <SelectItem key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-xs text-muted-foreground">Pitch</label>
                  <Slider
                    value={[voiceSettings.pitch]}
                    onValueChange={([value]) => setVoiceSettings(prev => ({ ...prev, pitch: value }))}
                    min={0.5}
                    max={2}
                    step={0.1}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-muted-foreground">Speed</label>
                  <Slider
                    value={[voiceSettings.rate]}
                    onValueChange={([value]) => setVoiceSettings(prev => ({ ...prev, rate: value }))}
                    min={0.5}
                    max={2}
                    step={0.1}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Current Status */}
            <div className="text-center text-sm text-muted-foreground">
              {isListening && <span className="text-green-500">🎤 Listening...</span>}
              {isSpeaking && <span className="text-blue-500">🔊 Speaking...</span>}
              {!isListening && !isSpeaking && <span>💬 Say "Hey {currentCharacter.name}" to start</span>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Voice Log */}
      <div className="fixed bottom-4 left-4 w-80 max-h-96 z-40">
        <Card className="shadow-character">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare size={20} />
              <span>Voice Log</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVoiceLogs([])}
              >
                <RotateCcw size={14} />
              </Button>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {voiceLogs.slice(-10).map((log) => (
                <div
                  key={log.id}
                  className={cn(
                    "text-xs p-2 rounded",
                    log.type === 'command' && "bg-blue-50 border-l-2 border-blue-500",
                    log.type === 'response' && "bg-green-50 border-l-2 border-green-500",
                    log.type === 'system' && "bg-yellow-50 border-l-2 border-yellow-500"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">
                      {log.type === 'command' ? 'You' : 
                       log.type === 'response' ? getCharacterById(log.characterId || '')?.name : 
                       'System'}
                    </span>
                    <span className="text-muted-foreground">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p>{log.content}</p>
                  {log.confidence && (
                    <div className="mt-1 text-muted-foreground">
                      Confidence: {(log.confidence * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              ))}
              
              {voiceLogs.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No voice interactions yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
