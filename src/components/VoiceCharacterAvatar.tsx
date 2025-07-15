import { useState, useEffect, useRef } from 'react';
import { Character } from '@/types/character';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Volume2, VolumeX, Mic, MicOff, MoreHorizontal } from 'lucide-react';

interface VoiceCharacterAvatarProps {
  character: Character;
  isActive: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  position?: { x: number; y: number };
  size?: 'small' | 'medium' | 'large';
  onVoiceToggle?: () => void;
  onMicToggle?: () => void;
  onPositionChange?: (position: { x: number; y: number }) => void;
  className?: string;
}

export function VoiceCharacterAvatar({
  character,
  isActive,
  isSpeaking,
  isListening,
  position = { x: 20, y: 20 },
  size = 'medium',
  onVoiceToggle,
  onMicToggle,
  onPositionChange,
  className
}: VoiceCharacterAvatarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  const imageSizes = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16',
    large: 'w-20 h-20'
  };

  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Keep avatar within viewport bounds
        const maxX = window.innerWidth - (size === 'small' ? 64 : size === 'medium' ? 96 : 128);
        const maxY = window.innerHeight - (size === 'small' ? 64 : size === 'medium' ? 96 : 128);
        
        const clampedX = Math.max(0, Math.min(newX, maxX));
        const clampedY = Math.max(0, Math.min(newY, maxY));
        
        onPositionChange?.({ x: clampedX, y: clampedY });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset, onPositionChange, size]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (avatarRef.current) {
      const rect = avatarRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  };

  return (
    <div
      ref={avatarRef}
      className={cn(
        "fixed z-50 cursor-move select-none animate-character-appear",
        sizeClasses[size],
        className
      )}
      style={{
        left: position.x,
        top: position.y
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <Card className={cn(
        "relative transition-all duration-300 hover:shadow-avatar",
        isActive && "border-primary shadow-glow",
        isSpeaking && "animate-glow-pulse",
        isListening && "animate-bounce-gentle"
      )}>
        <CardContent className="p-2">
          {/* Character Avatar */}
          <div className="relative">
            <img
              src={character.avatar}
              alt={character.name}
              className={cn(
                "rounded-full object-cover mx-auto transition-all duration-300",
                imageSizes[size],
                isSpeaking && "animate-pulse",
                isListening && "ring-2 ring-primary ring-offset-2",
                isActive && "ring-1 ring-accent ring-offset-1"
              )}
              draggable={false}
            />
            
            {/* Status Indicators */}
            {isActive && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
            )}
            
            {isSpeaking && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <Volume2 size={8} className="text-white" />
              </div>
            )}
            
            {isListening && (
              <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <Mic size={8} className="text-white" />
              </div>
            )}
          </div>

          {/* Character Name */}
          <div className="mt-2 text-center">
            <Badge 
              variant="secondary" 
              className={cn(
                "text-xs px-2 py-1",
                `bg-${character.color}/10 text-${character.color}`
              )}
            >
              {character.name}
            </Badge>
          </div>

          {/* Controls (show on hover) */}
          {showControls && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-card border rounded-lg p-1 shadow-lg animate-fade-in">
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onVoiceToggle?.();
                  }}
                  className="w-6 h-6 p-0"
                >
                  <Volume2 size={12} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMicToggle?.();
                  }}
                  className="w-6 h-6 p-0"
                >
                  <Mic size={12} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-6 h-6 p-0"
                >
                  <MoreHorizontal size={12} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Speaking Animation Overlay */}
      {isSpeaking && (
        <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-20" />
      )}

      {/* Listening Animation Overlay */}
      {isListening && (
        <div className="absolute inset-0 rounded-full border-2 border-red-500 animate-pulse opacity-30" />
      )}
    </div>
  );
}
