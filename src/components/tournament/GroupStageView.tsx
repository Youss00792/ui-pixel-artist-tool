
import React, { useState } from "react";
import { useTournamentStore } from "@/store/useTournamentStore";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Team } from "@/types/tournament";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Check, Trophy, AlertTriangle } from "lucide-react";

interface TeamStanding {
  team: Team;
  played: number;
  wins: number;
  points: number;
}

const GroupStageView: React.FC = () => {
  const { tournament, updateMatchWinner, generateKnockoutStage, createTiebreakerMatch } = useTournamentStore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<string>(tournament?.groups[0]?.id || "");

  if (!tournament || tournament.stage !== "groups") return null;

  // Calculate standings for each group
  const groupStandings = new Map<string, TeamStanding[]>();
  const teamsAdvancing = new Map<string, number>(); // Map to track how many teams advance per group
  
  // Determine how many teams should advance from each group to make quarterfinals possible
  const totalTeams = tournament.teams.length;
  const numberOfGroups = tournament.groups.length;
  
  // Always aim for 8 teams in quarterfinals if possible
  let teamsToAdvancePerGroup = Math.ceil(8 / numberOfGroups);
  
  // If we can't make 8 teams for quarterfinals, aim for 4 teams for semifinals
  if (teamsToAdvancePerGroup > Math.floor(totalTeams / numberOfGroups)) {
    teamsToAdvancePerGroup = Math.ceil(4 / numberOfGroups);
  }
  
  // Make sure at least one team advances from each group
  teamsToAdvancePerGroup = Math.max(1, teamsToAdvancePerGroup);
  
  tournament.groups.forEach(group => {
    const standings: Record<string, TeamStanding> = {};
    
    // Initialize standings for each team
    group.teams.forEach(team => {
      standings[team.id] = {
        team,
        played: 0,
        wins: 0,
        points: 0
      };
    });
    
    // Calculate match statistics
    group.matches.forEach(match => {
      if (match.winner) {
        const teamAStats = standings[match.teamA.id];
        const teamBStats = standings[match.teamB.id];
        
        // Update played games
        teamAStats.played += 1;
        teamBStats.played += 1;
        
        // Update results
        if (match.winner.id === match.teamA.id) {
          teamAStats.wins += 1;
          teamAStats.points += 1;
        } else {
          teamBStats.wins += 1;
          teamBStats.points += 1;
        }
      }
    });
    
    // Include tiebreaker matches in standings if they exist
    if (group.tiebreakers) {
      group.tiebreakers.forEach(match => {
        if (match.winner) {
          const winnerStats = standings[match.winner.id];
          if (winnerStats) {
            winnerStats.points += 1;  // Give an extra point for winning a tiebreaker
          }
        }
      });
    }
    
    // Convert to array and sort by points
    const sortedStandings = Object.values(standings).sort((a, b) => b.points - a.points);
    
    groupStandings.set(group.id, sortedStandings);
    teamsAdvancing.set(group.id, teamsToAdvancePerGroup);
  });

  const handleSetWinner = (matchId: string, winner: Team) => {
    updateMatchWinner(matchId, winner);
    
    toast({
      title: "Winner Selected",
      description: `${winner.name} has been marked as the winner.`,
    });
  };
  
  const handleCreateTiebreaker = (groupId: string, teamA: Team, teamB: Team) => {
    createTiebreakerMatch(groupId, teamA, teamB);
    
    toast({
      title: "Tiebreaker Created",
      description: `A tiebreaker match between ${teamA.name} and ${teamB.name} has been created.`,
    });
  };

  const handleFinishGroupStage = () => {
    // Check if all matches have been played
    const allMatchesPlayed = tournament.matches.every(match => match.winner !== null);
    
    if (!allMatchesPlayed) {
      toast({
        title: "Cannot Proceed",
        description: "All matches must be completed before advancing to the knockout stage.",
        variant: "destructive",
      });
      return;
    }
    
    // Check for ties at the cutoff positions
    let tiebreakersNeeded = false;
    
    tournament.groups.forEach(group => {
      const standings = groupStandings.get(group.id);
      const advancingCount = teamsAdvancing.get(group.id) || 1;
      
      if (standings && advancingCount < standings.length) {
        // Check if there's a tie at the cutoff point
        const cutoffTeam = standings[advancingCount - 1];
        const nextTeam = standings[advancingCount];
        
        if (cutoffTeam.points === nextTeam.points) {
          tiebreakersNeeded = true;
        }
      }
    });
    
    if (tiebreakersNeeded) {
      toast({
        title: "Tiebreakers Needed",
        description: "There are ties at cutoff positions. Please create tiebreaker matches to determine which teams advance.",
        variant: "destructive", // Changed from "warning" to "destructive"
      });
      return;
    }
    
    generateKnockoutStage();
    toast({
      title: "Advancing to Knockout Stage",
      description: "The knockout bracket has been generated based on group results.",
    });
  };

  // Check if all regular matches are completed
  const allMatchesCompleted = tournament.matches.every(match => match.winner !== null);
  
  // Find any groups that have tiebreakers
  const groupsWithTiebreakers = tournament.groups.filter(group => 
    group.tiebreakers && group.tiebreakers.length > 0
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

        {tournament.groups.map(group => {
          const standings = groupStandings.get(group.id) || [];
          const advancingCount = teamsAdvancing.get(group.id) || 0;
          const hasTiebreakers = group.tiebreakers && group.tiebreakers.length > 0;
          
          // Check for ties at the cutoff position
          let tieAtCutoff = false;
          if (advancingCount < standings.length) {
            const cutoffTeam = standings[advancingCount - 1];
            const nextTeam = standings[advancingCount];
            if (cutoffTeam && nextTeam && cutoffTeam.points === nextTeam.points) {
              tieAtCutoff = true;
            }
          }
          
          return (
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
                        <TableHead className="text-center">Wins</TableHead>
                        <TableHead className="text-center">Points</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {standings.map((standing, index) => {
                        const isAdvancing = index < advancingCount;
                        const isTied = index === advancingCount - 1 && tieAtCutoff;
                        
                        let statusBg = isAdvancing ? "bg-green-50" : "bg-red-50";
                        let textColor = isAdvancing ? "text-green-700" : "text-red-700";
                        
                        if (isTied) {
                          statusBg = "bg-yellow-50";
                          textColor = "text-yellow-700";
                        }
                        
                        return (
                          <TableRow key={standing.team.id} className={statusBg}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell className="font-medium">{standing.team.name}</TableCell>
                            <TableCell className="text-center">{standing.played}</TableCell>
                            <TableCell className="text-center">{standing.wins}</TableCell>
                            <TableCell className="text-center font-bold">{standing.points}</TableCell>
                            <TableCell className={`text-center ${textColor} font-semibold`}>
                              {isTied ? (
                                <div className="flex items-center justify-center">
                                  <AlertTriangle className="h-4 w-4 mr-1" />
                                  Tie
                                </div>
                              ) : (
                                isAdvancing ? "Advancing" : "Eliminated"
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  
                  {tieAtCutoff && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-yellow-800">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">Tiebreaker needed!</p>
                          <p className="text-sm">There is a tie at position {advancingCount}. Create a tiebreaker match to determine which team advances.</p>
                          <div className="mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const cutoffTeam = standings[advancingCount - 1].team;
                                const nextTeam = standings[advancingCount].team;
                                handleCreateTiebreaker(group.id, cutoffTeam, nextTeam);
                              }}
                            >
                              Create Tiebreaker Match
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
                        <TableHead>Teams</TableHead>
                        <TableHead className="text-center">Winner</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.matches.map((match) => (
                        <TableRow key={match.id}>
                          <TableCell className="font-medium">
                            {match.teamA.name} vs {match.teamB.name}
                          </TableCell>
                          <TableCell className="text-center">
                            {match.winner ? (
                              <div className="flex items-center justify-center">
                                <span className="font-semibold">{match.winner.name}</span>
                                <Trophy className="h-4 w-4 ml-1 text-yellow-500" />
                              </div>
                            ) : (
                              <span className="text-gray-400">Not played</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!match.winner ? (
                              <RadioGroup 
                                className="flex space-x-4" 
                                onValueChange={(value) => {
                                  const winningTeam = value === match.teamA.id ? match.teamA : match.teamB;
                                  handleSetWinner(match.id, winningTeam);
                                }}
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value={match.teamA.id} id={`radio-${match.id}-a`} />
                                  <Label htmlFor={`radio-${match.id}-a`}>{match.teamA.name}</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value={match.teamB.id} id={`radio-${match.id}-b`} />
                                  <Label htmlFor={`radio-${match.id}-b`}>{match.teamB.name}</Label>
                                </div>
                              </RadioGroup>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSetWinner(match.id, match.winner === match.teamA ? match.teamB : match.teamA)}
                              >
                                Change Winner
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {/* Display tiebreaker matches if they exist */}
                      {group.tiebreakers && group.tiebreakers.map((match) => (
                        <TableRow key={match.id} className="bg-yellow-50">
                          <TableCell className="font-medium">
                            <span className="text-xs font-bold text-yellow-700 uppercase mr-2">Tiebreaker:</span>
                            {match.teamA.name} vs {match.teamB.name}
                          </TableCell>
                          <TableCell className="text-center">
                            {match.winner ? (
                              <div className="flex items-center justify-center">
                                <span className="font-semibold">{match.winner.name}</span>
                                <Trophy className="h-4 w-4 ml-1 text-yellow-500" />
                              </div>
                            ) : (
                              <span className="text-gray-400">Not played</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!match.winner ? (
                              <RadioGroup 
                                className="flex space-x-4" 
                                onValueChange={(value) => {
                                  const winningTeam = value === match.teamA.id ? match.teamA : match.teamB;
                                  handleSetWinner(match.id, winningTeam);
                                }}
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value={match.teamA.id} id={`radio-${match.id}-a`} />
                                  <Label htmlFor={`radio-${match.id}-a`}>{match.teamA.name}</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value={match.teamB.id} id={`radio-${match.id}-b`} />
                                  <Label htmlFor={`radio-${match.id}-b`}>{match.teamB.name}</Label>
                                </div>
                              </RadioGroup>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSetWinner(match.id, match.winner === match.teamA ? match.teamB : match.teamA)}
                              >
                                Change Winner
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
          );
        })}
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
