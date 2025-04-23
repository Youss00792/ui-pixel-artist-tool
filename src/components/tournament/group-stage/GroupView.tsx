
import React from "react";
import GroupStandings, { TeamStanding } from "./GroupStandings";
import GroupMatches from "./GroupMatches";
import { Group, Team } from "@/types/tournament";

interface GroupViewProps {
  group: Group;
  advancingCount: number;
  createTiebreakerMatch: (groupId: string, position: number, teams: Team[]) => void;
  updateMatchWinner: (matchId: string, winner: Team) => void;
}

const GroupView: React.FC<GroupViewProps> = ({
  group,
  advancingCount,
  createTiebreakerMatch,
  updateMatchWinner
}) => {
  // Calculate standings
  const calculateStandings = (group: Group): TeamStanding[] => {
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
    return Object.values(standings).sort((a, b) => b.points - a.points);
  };

  const standings = calculateStandings(group);
  
  // Find positions with ties
  const findTiedPositions = (standings: TeamStanding[]): Record<number, TeamStanding[]> => {
    const tiedPositions: Record<number, TeamStanding[]> = {};
    
    // Group teams by points
    const teamsByPoints: Record<number, TeamStanding[]> = {};
    standings.forEach(standing => {
      if (!teamsByPoints[standing.points]) {
        teamsByPoints[standing.points] = [];
      }
      teamsByPoints[standing.points].push(standing);
    });
    
    // Find positions with multiple teams having the same points
    Object.entries(teamsByPoints).forEach(([points, teams]) => {
      if (teams.length > 1) {
        // Find the position of the first team in this group
        const position = standings.findIndex(s => s.team.id === teams[0].team.id) + 1;
        tiedPositions[position] = teams;
      }
    });
    
    return tiedPositions;
  };
  
  const tiedPositions = findTiedPositions(standings);
  
  // Check if there's a tie at the cutoff position
  const isTieAtCutoff = () => {
    if (advancingCount < standings.length) {
      const cutoffTeam = standings[advancingCount - 1];
      const nextTeam = standings[advancingCount];
      
      if (cutoffTeam && nextTeam && cutoffTeam.points === nextTeam.points) {
        return true;
      }
    }
    return false;
  };

  const handleCreateTiebreaker = (position: number, teams: Team[]) => {
    createTiebreakerMatch(group.id, position, teams);
  };

  return (
    <div className="space-y-6">
      <GroupStandings
        groupName={group.name}
        standings={standings}
        advancingCount={advancingCount}
        tieAtCutoff={isTieAtCutoff()}
        tiedPositions={tiedPositions}
        onCreateTiebreaker={handleCreateTiebreaker}
      />
      
      <GroupMatches
        groupName={group.name}
        matches={group.matches}
        tiebreakers={group.tiebreakers}
        onSetWinner={updateMatchWinner}
      />
    </div>
  );
};

export default GroupView;
