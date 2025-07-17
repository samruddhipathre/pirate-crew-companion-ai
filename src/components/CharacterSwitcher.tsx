import { useState, useEffect } from 'react';
import { Character } from '@/types/character';
import { characters } from '@/data/characters';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CharacterSwitcherProps {
  activeCharacter: string;
  onCharacterChange: (characterId: string) => void;
  className?: string;
}

export function CharacterSwitcher({ 
  activeCharacter, 
  onCharacterChange, 
  className 
}: CharacterSwitcherProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Find current character index
  useEffect(() => {
    const index = characters.findIndex(char => char.id === activeCharacter);
    if (index !== -1) {
      setCurrentIndex(index);
    }
  }, [activeCharacter]);

  const nextCharacter = () => {
    const nextIndex = (currentIndex + 1) % characters.length;
    const nextChar = characters[nextIndex];
    setCurrentIndex(nextIndex);
    onCharacterChange(nextChar.id);
  };

  const prevCharacter = () => {
    const prevIndex = (currentIndex - 1 + characters.length) % characters.length;
    const prevChar = characters[prevIndex];
    setCurrentIndex(prevIndex);
    onCharacterChange(prevChar.id);
  };

  const selectCharacter = (characterId: string) => {
    console.log('Character selected:', characterId);
    onCharacterChange(characterId);
    setIsExpanded(false);
  };

  const currentCharacter = characters[currentIndex];

  return (
    <div className={cn("fixed top-4 left-4 z-50", className)}>
      {/* Compact Switcher */}
      {!isExpanded && (
        <Card className="shadow-character bg-card/95 backdrop-blur-sm">
          <CardContent className="p-2">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={prevCharacter}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft size={16} />
              </Button>
              
              <div className="flex items-center space-x-2 min-w-0">
                <img
                  src={currentCharacter.avatar}
                  alt={currentCharacter.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {currentCharacter.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {currentCharacter.title}
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={nextCharacter}
                className="h-8 w-8 p-0"
              >
                <ChevronRight size={16} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(true)}
                className="h-8 w-8 p-0"
              >
                <Users size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expanded Character Grid */}
      {isExpanded && (
        <Card className="shadow-character bg-card/95 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Select Character</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-6 w-6 p-0"
              >
                <X size={14} />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {characters.map((character) => (
                <Button
                  key={character.id}
                  variant={activeCharacter === character.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => selectCharacter(character.id)}
                  className="flex items-center space-x-2 h-12 justify-start"
                >
                  <img
                    src={character.avatar}
                    alt={character.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-xs font-medium truncate">
                      {character.name.split(' ')[0]}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {character.title}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}