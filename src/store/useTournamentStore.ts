
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { Tournament, Team, Group, Match, Player } from "@/types/tournament";

interface TournamentState {
  tournament: Tournament | null;
  createTournament: (name: string, numberOfTeams: number, numberOfGroups: number) => void;
  addTeam: (name: string, players: [string, string]) => void;
  updateTeam: (id: string, name: string, players: [string, string]) => void;
  generateGroups: () => void;
  updateMatchWinner: (matchId: string, winner: Team) => void;
  generateKnockoutStage: () => void;
  resetTournament: () => void;
}

export const useTournamentStore = create<TournamentState>()(
  persist(
    (set, get) => ({
      tournament: null,

      createTournament: (name, numberOfTeams, numberOfGroups) => {
        set({
          tournament: {
            id: uuidv4(),
            name,
            numberOfTeams,
            numberOfGroups,
            teams: [],
            groups: [],
            matches: [],
            knockoutMatches: [],
            stage: "teams",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
      },

      addTeam: (name, playerNames) => {
        const { tournament } = get();
        if (!tournament) return;

        const newTeam: Team = {
          id: uuidv4(),
          name,
          players: [
            { id: uuidv4(), name: playerNames[0] },
            { id: uuidv4(), name: playerNames[1] },
          ] as [Player, Player],
        };

        set({
          tournament: {
            ...tournament,
            teams: [...tournament.teams, newTeam],
            updatedAt: new Date().toISOString(),
          },
        });
      },

      updateTeam: (id, name, playerNames) => {
        const { tournament } = get();
        if (!tournament) return;

        const updatedTeams = tournament.teams.map((team) => {
          if (team.id === id) {
            return {
              ...team,
              name,
              players: [
                { id: team.players[0].id, name: playerNames[0] },
                { id: team.players[1].id, name: playerNames[1] },
              ] as [Player, Player],
            };
          }
          return team;
        });

        set({
          tournament: {
            ...tournament,
            teams: updatedTeams,
            updatedAt: new Date().toISOString(),
          },
        });
      },

      generateGroups: () => {
        const { tournament } = get();
        if (!tournament) return;

        // Shuffle teams randomly
        const shuffledTeams = [...tournament.teams].sort(() => Math.random() - 0.5);
        
        // Create groups
        const groups: Group[] = [];
        const teamsPerGroup = Math.ceil(tournament.teams.length / tournament.numberOfGroups);
        
        for (let i = 0; i < tournament.numberOfGroups; i++) {
          const startIndex = i * teamsPerGroup;
          const groupTeams = shuffledTeams.slice(startIndex, startIndex + teamsPerGroup);
          
          // Assign groupId to teams
          const teamsWithGroupId = groupTeams.map(team => ({
            ...team,
            groupId: `group-${i + 1}`
          }));
          
          // Generate matches within the group (round-robin)
          const groupMatches: Match[] = [];
          
          for (let j = 0; j < teamsWithGroupId.length; j++) {
            for (let k = j + 1; k < teamsWithGroupId.length; k++) {
              groupMatches.push({
                id: uuidv4(),
                teamA: teamsWithGroupId[j],
                teamB: teamsWithGroupId[k],
                winner: null,
                round: "group",
                groupId: `group-${i + 1}`
              });
            }
          }
          
          groups.push({
            id: `group-${i + 1}`,
            name: `Group ${String.fromCharCode(65 + i)}`, // Group A, Group B, etc.
            teams: teamsWithGroupId,
            matches: groupMatches
          });
        }
        
        // Flatten all matches
        const allMatches = groups.flatMap(group => group.matches);
        
        set({
          tournament: {
            ...tournament,
            groups,
            matches: allMatches,
            stage: "groups",
            updatedAt: new Date().toISOString(),
          },
        });
      },

      updateMatchWinner: (matchId, winner) => {
        const { tournament } = get();
        if (!tournament) return;

        // Update match in matches array
        let updatedMatches = tournament.matches.map((match) => {
          if (match.id === matchId) {
            return {
              ...match,
              winner,
            };
          }
          return match;
        });

        // Update match in knockout matches if it exists there
        let updatedKnockoutMatches = tournament.knockoutMatches.map((match) => {
          if (match.id === matchId) {
            return {
              ...match,
              winner,
            };
          }
          return match;
        });

        // Update groups if it's a group match
        const updatedGroups = tournament.groups.map((group) => {
          const updatedGroupMatches = group.matches.map((match) => {
            if (match.id === matchId) {
              return {
                ...match,
                winner,
              };
            }
            return match;
          });

          return {
            ...group,
            matches: updatedGroupMatches,
          };
        });

        set({
          tournament: {
            ...tournament,
            matches: updatedMatches,
            knockoutMatches: updatedKnockoutMatches,
            groups: updatedGroups,
            updatedAt: new Date().toISOString(),
          },
        });

        // Progress knockout stage matches if needed
        if (tournament.stage === "bracket") {
          const knockoutMatch = tournament.knockoutMatches.find(m => m.id === matchId);
          if (knockoutMatch && knockoutMatch.winner) {
            // Find the appropriate next match to update
            const updatedKnockoutMatches = progressKnockoutBracket(tournament.knockoutMatches, matchId, winner);
            
            set({
              tournament: {
                ...tournament,
                knockoutMatches: updatedKnockoutMatches,
                updatedAt: new Date().toISOString(),
              },
            });
          }
        }
      },
      
      generateKnockoutStage: () => {
        const { tournament } = get();
        if (!tournament) return;

        // Get top teams from each group
        const teamsAdvancing = tournament.groups.flatMap(group => {
          // Calculate points for each team
          const teamPoints = new Map<string, { team: Team, points: number }>();
          
          group.teams.forEach(team => {
            teamPoints.set(team.id, {
              team,
              points: 0
            });
          });
          
          // Calculate points based on match results
          group.matches.forEach(match => {
            if (match.winner) {
              const winnerStats = teamPoints.get(match.winner.id);
              if (winnerStats) {
                winnerStats.points += 1;
              }
            }
          });
          
          // Sort teams by points
          const sortedTeams = Array.from(teamPoints.values()).sort((a, b) => b.points - a.points);
          
          // Determine how many teams should advance from each group based on total teams
          // We want to generate a bracket that starts with quarterfinals (8 teams),
          // semifinals (4 teams), or final (2 teams)
          const totalTeams = tournament.teams.length;
          const numberOfGroups = tournament.groups.length;
          
          let teamsToAdvancePerGroup = 2; // Default: 2 teams per group
          
          if (totalTeams <= 4) {
            teamsToAdvancePerGroup = 1; // If total teams <= 4, only top team advances
          } else if (numberOfGroups * 2 > 8) {
            // If we would have more than 8 teams advancing, take just the top teams
            teamsToAdvancePerGroup = Math.floor(8 / numberOfGroups) || 1;
          }
          
          // Return top N teams from each group
          return sortedTeams.slice(0, teamsToAdvancePerGroup).map(stats => stats.team);
        });
        
        // Generate knockout stage matches based on the number of advancing teams
        const knockoutMatches: Match[] = [];
        const numTeams = teamsAdvancing.length;
        
        // Randomize team order for more interesting matchups
        const randomizedTeams = [...teamsAdvancing].sort(() => Math.random() - 0.5);
        
        if (numTeams >= 2) {
          // If 2 teams, just a final
          if (numTeams === 2) {
            knockoutMatches.push({
              id: uuidv4(),
              teamA: randomizedTeams[0],
              teamB: randomizedTeams[1],
              winner: null,
              round: "final"
            });
          }
          // If 3-4 teams, 2 semis and a final
          else if (numTeams <= 4) {
            // Fill with placeholder teams if needed
            const teamsToUse = [...randomizedTeams];
            while (teamsToUse.length < 4) {
              teamsToUse.push({
                id: `tbd-${uuidv4()}`,
                name: "BYE",
                players: [
                  { id: "tbd", name: "TBD" },
                  { id: "tbd", name: "TBD" }
                ] as [Player, Player]
              });
            }
            
            // Semifinals
            knockoutMatches.push({
              id: uuidv4(),
              teamA: teamsToUse[0],
              teamB: teamsToUse[3],
              winner: null,
              round: "semifinal"
            });
            
            knockoutMatches.push({
              id: uuidv4(),
              teamA: teamsToUse[1],
              teamB: teamsToUse[2],
              winner: null,
              round: "semifinal"
            });
            
            // Final (with placeholder teams)
            knockoutMatches.push({
              id: uuidv4(),
              teamA: { id: "tbd", name: "TBD", players: [{ id: "tbd", name: "TBD" }, { id: "tbd", name: "TBD" }] as [Player, Player] },
              teamB: { id: "tbd", name: "TBD", players: [{ id: "tbd", name: "TBD" }, { id: "tbd", name: "TBD" }] as [Player, Player] },
              winner: null,
              round: "final"
            });
          }
          // If 5-8 teams, quarterfinals, semis, and a final
          else if (numTeams <= 8) {
            // Fill with placeholder teams if needed
            const teamsToUse = [...randomizedTeams];
            while (teamsToUse.length < 8) {
              teamsToUse.push({
                id: `tbd-${uuidv4()}`,
                name: "BYE",
                players: [
                  { id: "tbd", name: "TBD" },
                  { id: "tbd", name: "TBD" }
                ] as [Player, Player]
              });
            }
            
            // Quarterfinals
            for (let i = 0; i < 4; i++) {
              knockoutMatches.push({
                id: uuidv4(),
                teamA: teamsToUse[i],
                teamB: teamsToUse[7-i], // 0 vs 7, 1 vs 6, 2 vs 5, 3 vs 4
                winner: null,
                round: "quarterfinal"
              });
            }
            
            // Semifinals (with placeholder teams)
            for (let i = 0; i < 2; i++) {
              knockoutMatches.push({
                id: uuidv4(),
                teamA: { id: "tbd", name: "TBD", players: [{ id: "tbd", name: "TBD" }, { id: "tbd", name: "TBD" }] as [Player, Player] },
                teamB: { id: "tbd", name: "TBD", players: [{ id: "tbd", name: "TBD" }, { id: "tbd", name: "TBD" }] as [Player, Player] },
                winner: null,
                round: "semifinal"
              });
            }
            
            // Final (with placeholder teams)
            knockoutMatches.push({
              id: uuidv4(),
              teamA: { id: "tbd", name: "TBD", players: [{ id: "tbd", name: "TBD" }, { id: "tbd", name: "TBD" }] as [Player, Player] },
              teamB: { id: "tbd", name: "TBD", players: [{ id: "tbd", name: "TBD" }, { id: "tbd", name: "TBD" }] as [Player, Player] },
              winner: null,
              round: "final"
            });
          }
        }
        
        set({
          tournament: {
            ...tournament,
            knockoutMatches,
            stage: "bracket",
            updatedAt: new Date().toISOString(),
          },
        });
      },

      resetTournament: () => {
        set({ tournament: null });
      },
    }),
    {
      name: "tournament-storage",
    }
  )
);

// Helper function to progress teams through the knockout bracket
function progressKnockoutBracket(knockoutMatches: Match[], currentMatchId: string, winner: Team): Match[] {
  // Find the current match and its round
  const currentMatch = knockoutMatches.find(match => match.id === currentMatchId);
  if (!currentMatch) return knockoutMatches;

  const currentRound = currentMatch.round;
  
  // Determine the next round
  let nextRound: string | null = null;
  if (currentRound === "quarterfinal") nextRound = "semifinal";
  if (currentRound === "semifinal") nextRound = "final";
  
  // If we're already in the final, there's no next match to update
  if (!nextRound) return knockoutMatches;
  
  // Get all matches of the current round to determine position
  const roundMatches = knockoutMatches.filter(match => match.round === currentRound);
  const position = roundMatches.findIndex(match => match.id === currentMatchId);
  
  // Get the corresponding next round match
  const nextRoundMatches = knockoutMatches.filter(match => match.round === nextRound);
  const nextMatchIndex = Math.floor(position / 2);
  
  if (nextRoundMatches.length <= nextMatchIndex) return knockoutMatches;
  
  // Determine if this winner should go to teamA or teamB of the next match
  const isTeamA = position % 2 === 0;
  
  // Update the next match
  return knockoutMatches.map(match => {
    if (match.round === nextRound && nextRoundMatches[nextMatchIndex].id === match.id) {
      if (isTeamA) {
        return { ...match, teamA: winner };
      } else {
        return { ...match, teamB: winner };
      }
    }
    return match;
  });
}
