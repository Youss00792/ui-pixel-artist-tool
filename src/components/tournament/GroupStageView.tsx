
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
import { Check, Trophy } from "lucide-react";

interface TeamStanding {
  team: Team;
  played: number;
  wins: number;
  points: number;
}

const GroupStageView: React.FC = () => {
  const { tournament, updateMatchWinner, generateKnockoutStage } = useTournamentStore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<string>("group-1");

  if (!tournament || tournament.stage !== "groups") return null;

  // Calculate standings for each group
  const groupStandings = new Map<string, TeamStanding[]>();
  const teamsAdvancing = new Map<string, number>(); // Map to track how many teams advance per group
  
  // Determine how many teams should advance from each group
  const totalTeams = tournament.teams.length;
  const numberOfGroups = tournament.groups.length;
  
  let teamsToAdvancePerGroup = 2; // Default: 2 teams per group
  
  if (totalTeams <= 4) {
    teamsToAdvancePerGroup = 1; // If total teams <= 4, only top team advances
  } else if (numberOfGroups * 2 > 8) {
    // If we would have more than 8 teams advancing, take just the top teams
    teamsToAdvancePerGroup = Math.floor(8 / numberOfGroups) || 1;
  }
  
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
    
    generateKnockoutStage();
    toast({
      title: "Advancing to Knockout Stage",
      description: "The knockout bracket has been generated based on group results.",
    });
  };

  // Check if all matches are completed
  const allMatchesCompleted = tournament.matches.every(match => match.winner !== null);

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
                      <TableHead className="text-center">Wins</TableHead>
                      <TableHead className="text-center">Points</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupStandings.get(group.id)?.map((standing, index) => {
                      const isAdvancing = index < (teamsAdvancing.get(group.id) || 0);
                      const statusBg = isAdvancing ? "bg-green-50" : "bg-red-50";
                      const textColor = isAdvancing ? "text-green-700" : "text-red-700";
                      
                      return (
                        <TableRow key={standing.team.id} className={statusBg}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{standing.team.name}</TableCell>
                          <TableCell className="text-center">{standing.played}</TableCell>
                          <TableCell className="text-center">{standing.wins}</TableCell>
                          <TableCell className="text-center font-bold">{standing.points}</TableCell>
                          <TableCell className={`text-center ${textColor} font-semibold`}>
                            {isAdvancing ? "Advancing" : "Eliminated"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
