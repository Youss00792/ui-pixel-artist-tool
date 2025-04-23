
import React, { useState } from "react";
import { useTournamentStore } from "@/store/useTournamentStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Match } from "@/types/tournament";

const KnockoutBracket: React.FC = () => {
  const { tournament, updateMatchResult } = useTournamentStore();
  const { toast } = useToast();
  
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [scoreA, setScoreA] = useState<string>("");
  const [scoreB, setScoreB] = useState<string>("");

  if (!tournament || tournament.stage !== "bracket" || tournament.knockoutMatches.length === 0) {
    return null;
  }

  const handleStartEditingMatch = (matchId: string) => {
    const match = tournament.knockoutMatches.find(m => m.id === matchId);
    if (match) {
      setEditingMatch(matchId);
      setScoreA(match.scoreA !== null ? String(match.scoreA) : "");
      setScoreB(match.scoreB !== null ? String(match.scoreB) : "");
    }
  };

  const handleSaveMatchResult = (matchId: string) => {
    const scoreANum = parseInt(scoreA);
    const scoreBNum = parseInt(scoreB);
    
    if (isNaN(scoreANum) || isNaN(scoreBNum) || scoreANum < 0 || scoreBNum < 0) {
      toast({
        title: "Invalid Scores",
        description: "Please enter valid non-negative scores.",
        variant: "destructive",
      });
      return;
    }
    
    if (scoreANum === scoreBNum) {
      toast({
        title: "Cannot Have a Draw",
        description: "Knockout matches cannot end in a draw.",
        variant: "destructive",
      });
      return;
    }
    
    updateMatchResult(matchId, scoreANum, scoreBNum);
    setEditingMatch(null);
    
    toast({
      title: "Match Result Updated",
      description: "The bracket has been updated.",
    });
    
    // Handle progression logic
    updateBracketProgression(matchId, scoreANum > scoreBNum);
  };

  // Separate matches by round
  const quarterFinals = tournament.knockoutMatches.filter(m => m.round === "quarterfinal");
  const semiFinals = tournament.knockoutMatches.filter(m => m.round === "semifinal");
  const final = tournament.knockoutMatches.find(m => m.round === "final");

  const updateBracketProgression = (matchId: string, isTeamAWinner: boolean) => {
    const match = tournament.knockoutMatches.find(m => m.id === matchId);
    if (!match || !match.winner) return;
    
    // Find the appropriate next match to update
    if (match.round === "quarterfinal") {
      const quarterFinalIndex = quarterFinals.findIndex(qf => qf.id === matchId);
      if (quarterFinalIndex >= 0) {
        // Determine which semifinal this team should go to
        const semiFinalIndex = Math.floor(quarterFinalIndex / 2);
        if (semiFinals.length > semiFinalIndex) {
          const semiFinal = semiFinals[semiFinalIndex];
          
          // Update the semifinal match with the winner
          const isFirstTeam = quarterFinalIndex % 2 === 0;
          if (isFirstTeam) {
            updateMatchResult(semiFinal.id, 0, 0); // Just to update the teams, reset the score
          } else {
            updateMatchResult(semiFinal.id, 0, 0); // Just to update the teams, reset the score
          }
        }
      }
    } else if (match.round === "semifinal") {
      // Update the final with the winners from semifinals
      if (final) {
        const isFirstSemiFinal = semiFinals[0]?.id === matchId;
        if (isFirstSemiFinal) {
          updateMatchResult(final.id, 0, 0); // Just to update the teams, reset the score
        } else {
          updateMatchResult(final.id, 0, 0); // Just to update the teams, reset the score
        }
      }
    }
  };

  const renderMatch = (match: Match) => {
    const isBeingEdited = editingMatch === match.id;
    const isCompleted = match.scoreA !== null && match.scoreB !== null;
    const isTBD = match.teamA.id === "tbd" || match.teamB.id === "tbd";
    
    return (
      <div className="bracket-match bg-white rounded-md shadow p-4 mb-4">
        <div className="team-row flex items-center justify-between mb-2">
          <div className="team-name font-medium flex-grow">
            {match.teamA.name}
          </div>
          <div className="score w-12 text-center">
            {isBeingEdited ? (
              <Input
                type="number"
                value={scoreA}
                onChange={(e) => setScoreA(e.target.value)}
                className="w-12 text-center"
                min="0"
              />
            ) : (
              <span>{match.scoreA !== null ? match.scoreA : "-"}</span>
            )}
          </div>
        </div>
        <div className="team-row flex items-center justify-between">
          <div className="team-name font-medium flex-grow">
            {match.teamB.name}
          </div>
          <div className="score w-12 text-center">
            {isBeingEdited ? (
              <Input
                type="number"
                value={scoreB}
                onChange={(e) => setScoreB(e.target.value)}
                className="w-12 text-center"
                min="0"
              />
            ) : (
              <span>{match.scoreB !== null ? match.scoreB : "-"}</span>
            )}
          </div>
        </div>
        <div className="mt-2 text-right">
          {isBeingEdited ? (
            <Button
              size="sm"
              onClick={() => handleSaveMatchResult(match.id)}
            >
              Save
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStartEditingMatch(match.id)}
              disabled={isTBD}
            >
              {isCompleted ? "Edit Score" : "Add Score"}
            </Button>
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
                {quarterFinals.map(match => renderMatch(match))}
              </div>
            )}

            {semiFinals.length > 0 && (
              <div className="bracket-round flex-1">
                <h3 className="text-lg font-semibold mb-4">Semi Finals</h3>
                {semiFinals.map(match => renderMatch(match))}
              </div>
            )}

            {final && (
              <div className="bracket-round flex-1">
                <h3 className="text-lg font-semibold mb-4">Final</h3>
                {renderMatch(final)}
                
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
