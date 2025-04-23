
import React from "react";
import { useTournamentStore } from "@/store/useTournamentStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Match } from "@/types/tournament";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Check, Trophy } from "lucide-react";

const KnockoutBracket: React.FC = () => {
  const { tournament, updateMatchWinner } = useTournamentStore();
  const { toast } = useToast();

  if (!tournament || tournament.stage !== "bracket" || tournament.knockoutMatches.length === 0) {
    return null;
  }

  const handleSetWinner = (match: Match, winnerId: string) => {
    const winner = winnerId === match.teamA.id ? match.teamA : match.teamB;
    updateMatchWinner(match.id, winner);
    
    toast({
      title: "Winner Selected",
      description: `${winner.name} advances to the next round.`,
    });
  };

  // Separate matches by round
  const quarterFinals = tournament.knockoutMatches.filter(m => m.round === "quarterfinal");
  const semiFinals = tournament.knockoutMatches.filter(m => m.round === "semifinal");
  const final = tournament.knockoutMatches.find(m => m.round === "final");

  const renderMatch = (match: Match, index: number) => {
    const isTBD = match.teamA.id === "tbd" || match.teamB.id === "tbd" || 
                 match.teamA.id.startsWith("tbd-") || match.teamB.id.startsWith("tbd-");
    const isByeMatch = match.teamA.name === "BYE" || match.teamB.name === "BYE";
    
    // Auto-select winner if one team is BYE
    if (isByeMatch && !match.winner) {
      const winner = match.teamA.name === "BYE" ? match.teamB : match.teamA;
      setTimeout(() => updateMatchWinner(match.id, winner), 100);
    }
    
    return (
      <div key={match.id} className="bracket-match bg-white rounded-md shadow p-4 mb-4">
        <div className="flex flex-col space-y-3">
          <div className={`team-row flex items-center justify-between p-2 rounded ${match.winner?.id === match.teamA.id ? 'bg-green-100' : ''}`}>
            <div className="team-name font-medium flex-grow">
              {match.teamA.name}
              {match.winner?.id === match.teamA.id && <Trophy className="h-4 w-4 ml-1 inline text-yellow-500" />}
            </div>
          </div>
          
          <div className={`team-row flex items-center justify-between p-2 rounded ${match.winner?.id === match.teamB.id ? 'bg-green-100' : ''}`}>
            <div className="team-name font-medium flex-grow">
              {match.teamB.name}
              {match.winner?.id === match.teamB.id && <Trophy className="h-4 w-4 ml-1 inline text-yellow-500" />}
            </div>
          </div>

          {!match.winner && !isTBD && !isByeMatch && (
            <div className="mt-2">
              <RadioGroup 
                className="flex flex-col space-y-2" 
                onValueChange={(value) => handleSetWinner(match, value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={match.teamA.id} id={`radio-${match.id}-a`} />
                  <Label htmlFor={`radio-${match.id}-a`}>Select {match.teamA.name} as winner</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={match.teamB.id} id={`radio-${match.id}-b`} />
                  <Label htmlFor={`radio-${match.id}-b`}>Select {match.teamB.name} as winner</Label>
                </div>
              </RadioGroup>
            </div>
          )}
          
          {match.winner && (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateMatchWinner(match.id, match.winner === match.teamA ? match.teamB : match.teamA)}
              >
                Change Winner
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Knockout Stage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bracket-container flex flex-col lg:flex-row gap-6">
            {quarterFinals.length > 0 && (
              <div className="bracket-round flex-1">
                <h3 className="text-lg font-semibold mb-4">Quarter Finals</h3>
                {quarterFinals.map((match, index) => renderMatch(match, index))}
              </div>
            )}

            {semiFinals.length > 0 && (
              <div className="bracket-round flex-1">
                <h3 className="text-lg font-semibold mb-4">Semi Finals</h3>
                {semiFinals.map((match, index) => renderMatch(match, index))}
              </div>
            )}

            {final && (
              <div className="bracket-round flex-1">
                <h3 className="text-lg font-semibold mb-4">Final</h3>
                {renderMatch(final, 0)}
                
                {final.winner && (
                  <div className="winner-banner mt-6 p-4 bg-green-100 border border-green-300 rounded-md text-center">
                    <h4 className="text-lg text-green-800 font-bold">Tournament Winner</h4>
                    <div className="text-xl font-bold mt-2">{final.winner.name}</div>
                    <div className="text-sm mt-1">
                      {final.winner.players[0].name} & {final.winner.players[1].name}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KnockoutBracket;
