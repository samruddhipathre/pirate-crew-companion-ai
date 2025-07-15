import { useState, useEffect, useCallback } from 'react';
import { Character, ChatMessage, CompanionSettings } from '@/types/character';
import { characters, getCharacterById } from '@/data/characters';
import { CharacterSelector } from './CharacterSelector';
import { ChatInterface } from './ChatInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Users, MessageCircle, Volume2, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AICompanion() {
  const [activeCharacter, setActiveCharacter] = useState<string>('luffy');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [ambientSounds, setAmbientSounds] = useState(false);
  const [floatingMode, setFloatingMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const currentCharacter = getCharacterById(activeCharacter);

  // Initialize with a welcome message
  useEffect(() => {
    if (currentCharacter && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: `welcome-${Date.now()}`,
        content: getWelcomeMessage(currentCharacter),
        sender: 'character',
        characterId: currentCharacter.id,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [currentCharacter, messages.length]);

  const getWelcomeMessage = (character: Character): string => {
    const welcomeMessages = {
      luffy: "Hey! I'm Luffy! Let's go on an adventure together! What do you want to do?",
      zoro: "I'm Zoro, the swordsman. If you need someone cut down, I'm your guy. Otherwise, I'll be training.",
      sanji: "Ah, welcome! I'm Sanji, the cook. Can I prepare something delicious for you?",
      nami: "Hi there! I'm Nami, the navigator. Need directions or have any questions about the weather?",
      usopp: "I'm the great Captain Usopp! I have 8,000 followers, you know! Want to hear an amazing story?",
      chopper: "Hello! I'm Chopper, the doctor! If you're not feeling well, I can help you!"
    };
    return welcomeMessages[character.id as keyof typeof welcomeMessages] || "Hello! How can I help you today?";
  };

  const handleCharacterSelect = (characterId: string) => {
    setActiveCharacter(characterId);
    const character = getCharacterById(characterId);
    if (character) {
      // Add character switch message
      const switchMessage: ChatMessage = {
        id: `switch-${Date.now()}`,
        content: getWelcomeMessage(character),
        sender: 'character',
        characterId: character.id,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, switchMessage]);
    }
  };

  const generateCharacterResponse = async (userMessage: string, character: Character): Promise<string> => {
    // This is a simplified response generator
    // In a real implementation, you'd use OpenAI API or similar
    const responses = {
      luffy: [
        "That sounds awesome! Let's do it!",
        "I'm always ready for adventure!",
        "Meat! Do you have any meat?",
        "I'm gonna be the Pirate King!",
        "Let's go! This is gonna be fun!"
      ],
      zoro: [
        "Hmm, I see.",
        "If it's about swords, I'm interested.",
        "I need to train more.",
        "Nothing happened.",
        "That's not my problem."
      ],
      sanji: [
        "Ah, how interesting!",
        "Would you like me to cook something?",
        "All Blue... someday I'll find it.",
        "I can't refuse a request from a lady!",
        "Let me prepare something special for you."
      ],
      nami: [
        "That's useful information!",
        "Money! Er, I mean, that's nice.",
        "Leave the navigation to me!",
        "These idiots never listen...",
        "I'll make a note of that."
      ],
      usopp: [
        "That reminds me of the time I...",
        "I have 8,000 followers who would agree!",
        "I'm brave! Really!",
        "Let me tell you an amazing story!",
        "I have a disease that prevents me from doing that..."
      ],
      chopper: [
        "That's medically interesting!",
        "I'm not happy about that compliment, you bastard!",
        "Everyone gets sick sometimes.",
        "I'm a doctor, so I can help!",
        "Thank you for caring about health!"
      ]
    };

    const characterResponses = responses[character.id as keyof typeof responses] || responses.luffy;
    const randomResponse = characterResponses[Math.floor(Math.random() * characterResponses.length)];
    
    // Add some personality-based modifications
    if (userMessage.toLowerCase().includes('food') || userMessage.toLowerCase().includes('eat')) {
      if (character.id === 'luffy') return "MEAT! I love meat! Do you have any meat?";
      if (character.id === 'sanji') return "Ah, you appreciate good food! Let me cook something amazing for you!";
    }
    
    if (userMessage.toLowerCase().includes('sword') || userMessage.toLowerCase().includes('fight')) {
      if (character.id === 'zoro') return "A sword? Now you have my attention. I'm always ready for a good fight.";
    }

    return randomResponse;
  };

  const handleSendMessage = useCallback(async (content: string) => {
    if (!currentCharacter) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate thinking time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Generate character response
    const response = await generateCharacterResponse(content, currentCharacter);
    
    const characterMessage: ChatMessage = {
      id: `character-${Date.now()}`,
      content: response,
      sender: 'character',
      characterId: currentCharacter.id,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, characterMessage]);
    setIsTyping(false);
  }, [currentCharacter]);

  const handleVoiceToggle = (enabled: boolean) => {
    setIsVoiceEnabled(enabled);
    // TODO: Implement voice synthesis
  };

  const handleStartListening = () => {
    setIsListening(true);
    // TODO: Implement speech recognition
  };

  const handleStopListening = () => {
    setIsListening(false);
    // TODO: Stop speech recognition
  };

  if (!currentCharacter) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-ocean p-4">
      <div className="max-w-6xl mx-auto">
        <Tabs defaultValue="chat" className="w-full">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-primary-foreground">
                One Piece AI Companions
              </h1>
              <Badge variant="secondary" className="bg-accent text-accent-foreground">
                {currentCharacter.name} Active
              </Badge>
            </div>
            
            <TabsList className="bg-card">
              <TabsTrigger value="chat" className="flex items-center space-x-2">
                <MessageCircle size={16} />
                <span>Chat</span>
              </TabsTrigger>
              <TabsTrigger value="characters" className="flex items-center space-x-2">
                <Users size={16} />
                <span>Characters</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center space-x-2">
                <Settings size={16} />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="chat" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users size={20} />
                      <span>Quick Switch</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {characters.slice(0, 3).map((character) => (
                        <Button
                          key={character.id}
                          variant={activeCharacter === character.id ? "default" : "outline"}
                          className="w-full justify-start"
                          onClick={() => handleCharacterSelect(character.id)}
                        >
                          <img
                            src={character.avatar}
                            alt={character.name}
                            className="w-6 h-6 rounded-full mr-2"
                          />
                          {character.name}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="lg:col-span-3">
                <ChatInterface
                  character={currentCharacter}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  onVoiceToggle={handleVoiceToggle}
                  isVoiceEnabled={isVoiceEnabled}
                  isListening={isListening}
                  onStartListening={handleStartListening}
                  onStopListening={handleStopListening}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="characters" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Choose Your Companion</CardTitle>
              </CardHeader>
              <CardContent>
                <CharacterSelector
                  characters={characters}
                  activeCharacter={activeCharacter}
                  onCharacterSelect={handleCharacterSelect}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Voice Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Voice Synthesis</label>
                    <Switch
                      checked={isVoiceEnabled}
                      onCheckedChange={setIsVoiceEnabled}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Ambient Sounds</label>
                    <Switch
                      checked={ambientSounds}
                      onCheckedChange={setAmbientSounds}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Voice synthesis requires API key configuration.</p>
                    <p className="mt-2">Recommended: ElevenLabs for anime-style voices</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Display Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Floating Mode</label>
                    <Switch
                      checked={floatingMode}
                      onCheckedChange={setFloatingMode}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Floating mode shows character avatars as overlay widgets.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}