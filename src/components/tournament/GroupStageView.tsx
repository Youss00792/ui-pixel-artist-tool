
import React, { useState } from "react";
import { useTournamentStore } from "@/store/useTournamentStore";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Team } from "@/types/tournament";

interface TeamStanding {
  team: Team;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

const GroupStageView: React.FC = () => {
  const { tournament, updateMatchResult, generateKnockoutStage } = useTournamentStore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<string>("group-1");
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [scoreA, setScoreA] = useState<string>("");
  const [scoreB, setScoreB] = useState<string>("");

  if (!tournament || tournament.stage !== "groups") return null;

  // Calculate standings for each group
  const groupStandings = new Map<string, TeamStanding[]>();
  
  tournament.groups.forEach(group => {
    const standings: Record<string, TeamStanding> = {};
    
    // Initialize standings for each team
    group.teams.forEach(team => {
      standings[team.id] = {
        team,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0
      };
    });
    
    // Calculate match statistics
    group.matches.forEach(match => {
      if (match.scoreA !== null && match.scoreB !== null) {
        const teamAStats = standings[match.teamA.id];
        const teamBStats = standings[match.teamB.id];
        
        // Update played games
        teamAStats.played += 1;
        teamBStats.played += 1;
        
        // Update goals
        teamAStats.goalsFor += match.scoreA;
        teamAStats.goalsAgainst += match.scoreB;
        teamAStats.goalDifference = teamAStats.goalsFor - teamAStats.goalsAgainst;
        
        teamBStats.goalsFor += match.scoreB;
        teamBStats.goalsAgainst += match.scoreA;
        teamBStats.goalDifference = teamBStats.goalsFor - teamBStats.goalsAgainst;
        
        // Update results
        if (match.scoreA > match.scoreB) {
          teamAStats.wins += 1;
          teamBStats.losses += 1;
          teamAStats.points += 3;
        } else if (match.scoreB > match.scoreA) {
          teamBStats.wins += 1;
          teamAStats.losses += 1;
          teamBStats.points += 3;
        } else {
          teamAStats.draws += 1;
          teamBStats.draws += 1;
          teamAStats.points += 1;
          teamBStats.points += 1;
        }
      }
    });
    
    // Convert to array and sort
    const sortedStandings = Object.values(standings).sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
    
    groupStandings.set(group.id, sortedStandings);
  });

  const handleStartEditingMatch = (matchId: string) => {
    const match = tournament.matches.find(m => m.id === matchId);
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
    
    updateMatchResult(matchId, scoreANum, scoreBNum);
    setEditingMatch(null);
    
    toast({
      title: "Match Result Updated",
      description: "The standings have been updated.",
    });
  };

  const handleFinishGroupStage = () => {
    // Check if all matches have been played
    const allMatchesPlayed = tournament.matches.every(
      match => match.scoreA !== null && match.scoreB !== null
    );
    
    if (!allMatchesPlayed) {
      toast({
        title: "Cannot Proceed",
        description: "All matches must be completed before advancing to the knockout stage.",
        variant: "destructive",
      });
      return;
    }
    
    generateKnockoutStage();
    toast({
      title: "Advancing to Knockout Stage",
      description: "The knockout bracket has been generated based on group results.",
    });
  };

  // Check if all matches are completed
  const allMatchesCompleted = tournament.matches.every(
    match => match.scoreA !== null && match.scoreB !== null
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          {tournament.groups.map(group => (
            <TabsTrigger key={group.id} value={group.id}>
              {group.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {tournament.groups.map(group => (
          <TabsContent key={group.id} value={group.id} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Standings - {group.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Position</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-center">Played</TableHead>
                      <TableHead className="text-center">W</TableHead>
                      <TableHead className="text-center">D</TableHead>
                      <TableHead className="text-center">L</TableHead>
                      <TableHead className="text-center">GF</TableHead>
                      <TableHead className="text-center">GA</TableHead>
                      <TableHead className="text-center">GD</TableHead>
                      <TableHead className="text-center">Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupStandings.get(group.id)?.map((standing, index) => (
                      <TableRow key={standing.team.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{standing.team.name}</TableCell>
                        <TableCell className="text-center">{standing.played}</TableCell>
                        <TableCell className="text-center">{standing.wins}</TableCell>
                        <TableCell className="text-center">{standing.draws}</TableCell>
                        <TableCell className="text-center">{standing.losses}</TableCell>
                        <TableCell className="text-center">{standing.goalsFor}</TableCell>
                        <TableCell className="text-center">{standing.goalsAgainst}</TableCell>
                        <TableCell className="text-center">{standing.goalDifference}</TableCell>
                        <TableCell className="text-center font-bold">{standing.points}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Matches - {group.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Home Team</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead>Away Team</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.matches.map((match) => (
                      <TableRow key={match.id}>
                        <TableCell>{match.teamA.name}</TableCell>
                        <TableCell className="text-center">
                          {editingMatch === match.id ? (
                            <div className="flex items-center justify-center space-x-2">
                              <Input
                                type="number"
                                value={scoreA}
                                onChange={(e) => setScoreA(e.target.value)}
                                className="w-16 text-center"
                                min="0"
                              />
                              <span>:</span>
                              <Input
                                type="number"
                                value={scoreB}
                                onChange={(e) => setScoreB(e.target.value)}
                                className="w-16 text-center"
                                min="0"
                              />
                            </div>
                          ) : (
                            <span className="text-lg font-medium">
                              {match.scoreA !== null && match.scoreB !== null
                                ? `${match.scoreA} : ${match.scoreB}`
                                : "- : -"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{match.teamB.name}</TableCell>
                        <TableCell className="text-right">
                          {editingMatch === match.id ? (
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
                            >
                              {match.scoreA !== null && match.scoreB !== null
                                ? "Edit Score"
                                : "Add Score"}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-end">
        <Button
          onClick={handleFinishGroupStage}
          disabled={!allMatchesCompleted}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {allMatchesCompleted
            ? "Proceed to Knockout Stage"
            : "Complete All Matches First"}
        </Button>
      </div>
    </div>
  );
};

export default GroupStageView;
