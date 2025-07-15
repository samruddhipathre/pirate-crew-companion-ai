import { useState, useRef, useEffect } from 'react';
import { ChatMessage, Character } from '@/types/character';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface ChatInterfaceProps {
  character: Character;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onVoiceToggle: (enabled: boolean) => void;
  isVoiceEnabled: boolean;
  isListening: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  className?: string;
}

export function ChatInterface({
  character,
  messages,
  onSendMessage,
  onVoiceToggle,
  isVoiceEnabled,
  isListening,
  onStartListening,
  onStopListening,
  className
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Card className={cn("flex flex-col h-full max-h-[600px] animate-slide-in-up", className)}>
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <img
            src={character.avatar}
            alt={character.name}
            className="w-10 h-10 rounded-full object-cover animate-float"
          />
          <div>
            <h3 className="font-bold text-lg">{character.name}</h3>
            <Badge variant="secondary" className={`bg-${character.color}/10 text-${character.color}`}>
              {character.title}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onVoiceToggle(!isVoiceEnabled)}
            className={cn(
              "transition-colors",
              isVoiceEnabled ? "text-primary" : "text-muted-foreground"
            )}
          >
            {isVoiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={isListening ? onStopListening : onStartListening}
            className={cn(
              "transition-colors",
              isListening ? "text-primary animate-pulse" : "text-muted-foreground"
            )}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </Button>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full max-h-[400px] p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.sender === 'user' ? "justify-end" : "justify-start"
                )}
              >
                <div className={cn("flex items-end space-x-2 max-w-[70%]")}>
                  {message.sender === 'character' && (
                    <img
                      src={character.avatar}
                      alt={character.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  )}
                  
                  <div
                    className={cn(
                      "px-4 py-2 rounded-lg shadow-sm animate-fade-in",
                      message.sender === 'user'
                        ? "bg-primary text-primary-foreground"
                        : `bg-${character.color}/10 text-foreground border border-${character.color}/30`
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-end space-x-2 max-w-[70%]">
                  <img
                    src={character.avatar}
                    alt={character.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <div className={`px-4 py-2 rounded-lg bg-${character.color}/10 border border-${character.color}/30`}>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.1s]"></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>
      </CardContent>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Chat with ${character.name}...`}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim()}
            size="sm"
            className="transition-all hover:scale-105"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
}