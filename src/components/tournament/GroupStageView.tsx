
import React, { useState } from "react";
import { useTournamentStore } from "@/store/useTournamentStore";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Team } from "@/types/tournament";
import GroupView from "./group-stage/GroupView";

const GroupStageView: React.FC = () => {
  const { tournament, updateMatchWinner, generateKnockoutStage, createTiebreakerMatch } = useTournamentStore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<string>(tournament?.groups[0]?.id || "");

  if (!tournament) return null;

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

  const handleSetWinner = (matchId: string, winner: Team) => {
    updateMatchWinner(matchId, winner);
    
    toast({
      title: "Winner Selected",
      description: `${winner.name} has been marked as the winner.`,
    });
  };
  
  const handleCreateTiebreakerForTeams = (groupId: string, position: number, teams: Team[]) => {
    // If there are more than 2 teams, create matches in a mini-tournament format
    if (teams.length > 2) {
      // Create matches in a round-robin format for the tied teams
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          createTiebreakerMatch(groupId, teams[i], teams[j], position);
        }
      }
      
      toast({
        title: "Tiebreaker Matches Created",
        description: `${teams.length} teams are tied for position ${position}. ${teams.length * (teams.length - 1) / 2} tiebreaker matches have been created.`,
      });
    } else if (teams.length === 2) {
      // Simple case: just two teams tied
      createTiebreakerMatch(groupId, teams[0], teams[1], position);
      
      toast({
        title: "Tiebreaker Created",
        description: `A tiebreaker match between ${teams[0].name} and ${teams[1].name} has been created.`,
      });
    }
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
      // Recalculate standings for each group
      const standings: Record<string, { team: Team, points: number }> = {};
      
      group.teams.forEach(team => {
        standings[team.id] = { team, points: 0 };
      });
      
      // Calculate points based on match results
      group.matches.forEach(match => {
        if (match.winner) {
          const winnerStats = standings[match.winner.id];
          if (winnerStats) {
            winnerStats.points += 1;
          }
        }
      });
      
      // Include tiebreaker matches if they exist
      if (group.tiebreakers) {
        group.tiebreakers.forEach(match => {
          if (match.winner) {
            const winnerStats = standings[match.winner.id];
            if (winnerStats) {
              winnerStats.points += 1;
            }
          } else if (!match.winner) {
            // If there's an unplayed tiebreaker match
            tiebreakersNeeded = true;
          }
        });
      }
      
      const sortedTeams = Object.values(standings).sort((a, b) => b.points - a.points);
      const advancingCount = teamsToAdvancePerGroup;
      
      if (advancingCount < sortedTeams.length) {
        // Check if there's a tie at the cutoff point
        const cutoffTeam = sortedTeams[advancingCount - 1];
        const nextTeam = sortedTeams[advancingCount];
        
        if (cutoffTeam.points === nextTeam.points) {
          tiebreakersNeeded = true;
        }
      }
    });
    
    if (tiebreakersNeeded) {
      toast({
        title: "Tiebreakers Needed",
        description: "There are ties at cutoff positions or unplayed tiebreaker matches. Please create and complete all tiebreaker matches to determine which teams advance.",
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

  // Check if all regular matches are completed
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
          <TabsContent key={group.id} value={group.id}>
            <GroupView
              group={group}
              advancingCount={teamsToAdvancePerGroup}
              createTiebreakerMatch={handleCreateTiebreakerForTeams}
              updateMatchWinner={handleSetWinner}
            />
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
