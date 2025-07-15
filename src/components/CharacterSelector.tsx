import { Character } from '@/types/character';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CharacterSelectorProps {
  characters: Character[];
  activeCharacter: string;
  onCharacterSelect: (characterId: string) => void;
  className?: string;
}

export function CharacterSelector({
  characters,
  activeCharacter,
  onCharacterSelect,
  className
}: CharacterSelectorProps) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4", className)}>
      {characters.map((character) => (
        <Card
          key={character.id}
          className={cn(
            "cursor-pointer transition-all duration-300 hover:shadow-character",
            "border-2 hover:scale-105 animate-fade-in",
            activeCharacter === character.id
              ? "border-primary bg-gradient-character shadow-glow"
              : "border-border hover:border-accent"
          )}
          onClick={() => onCharacterSelect(character.id)}
        >
          <CardContent className="p-4 text-center">
            <div className="relative mb-3">
              <img
                src={character.avatar}
                alt={character.name}
                className={cn(
                  "w-16 h-16 rounded-full mx-auto object-cover",
                  "transition-all duration-300 hover:scale-110",
                  activeCharacter === character.id && "animate-glow-pulse"
                )}
              />
              {activeCharacter === character.id && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-bounce-gentle" />
              )}
            </div>
            
            <h3 className="font-bold text-sm mb-1 text-foreground">
              {character.name}
            </h3>
            
            <Badge 
              variant="secondary" 
              className={cn(
                "text-xs mb-2",
                `bg-${character.color}/10 text-${character.color} border-${character.color}/30`
              )}
            >
              {character.title}
            </Badge>
            
            <div className="text-xs text-muted-foreground space-y-1">
              {character.personality.traits.slice(0, 2).map((trait, index) => (
                <div key={index} className="truncate">
                  {trait}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}