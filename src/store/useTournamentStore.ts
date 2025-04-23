
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
  updateMatchResult: (matchId: string, scoreA: number, scoreB: number) => void;
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
          ],
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
              ],
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
                scoreA: null,
                scoreB: null,
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

      updateMatchResult: (matchId, scoreA, scoreB) => {
        const { tournament } = get();
        if (!tournament) return;

        // Update match in matches array
        let updatedMatches = tournament.matches.map((match) => {
          if (match.id === matchId) {
            const winner = scoreA > scoreB ? match.teamA : scoreB > scoreA ? match.teamB : null;
            return {
              ...match,
              scoreA,
              scoreB,
              winner,
            };
          }
          return match;
        });

        // Update match in knockout matches if it exists there
        let updatedKnockoutMatches = tournament.knockoutMatches.map((match) => {
          if (match.id === matchId) {
            const winner = scoreA > scoreB ? match.teamA : scoreB > scoreA ? match.teamB : null;
            return {
              ...match,
              scoreA,
              scoreB,
              winner,
            };
          }
          return match;
        });

        // Update groups if it's a group match
        const updatedGroups = tournament.groups.map((group) => {
          const updatedGroupMatches = group.matches.map((match) => {
            if (match.id === matchId) {
              const winner = scoreA > scoreB ? match.teamA : scoreB > scoreA ? match.teamB : null;
              return {
                ...match,
                scoreA,
                scoreB,
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
            // Find the next match this winner should go to
            // This would require a more complex implementation depending on bracket structure
            // TODO: Implement bracket progression logic
          }
        }
      },

      generateKnockoutStage: () => {
        const { tournament } = get();
        if (!tournament) return;

        // Get top teams from each group
        const teamsAdvancing = tournament.groups.flatMap(group => {
          // Calculate points for each team
          const teamStats = new Map();
          
          group.teams.forEach(team => {
            teamStats.set(team.id, {
              team,
              points: 0,
              goalDifference: 0,
              goalsScored: 0,
            });
          });
          
          // Calculate points based on match results
          group.matches.forEach(match => {
            if (match.scoreA !== null && match.scoreB !== null) {
              const teamAStats = teamStats.get(match.teamA.id);
              const teamBStats = teamStats.get(match.teamB.id);
              
              if (match.scoreA > match.scoreB) {
                teamAStats.points += 3;
              } else if (match.scoreB > match.scoreA) {
                teamBStats.points += 3;
              } else {
                teamAStats.points += 1;
                teamBStats.points += 1;
              }
              
              teamAStats.goalDifference += (match.scoreA - match.scoreB);
              teamAStats.goalsScored += match.scoreA;
              
              teamBStats.goalDifference += (match.scoreB - match.scoreA);
              teamBStats.goalsScored += match.scoreB;
            }
          });
          
          // Sort teams by points, then goal difference, then goals scored
          const sortedTeams = Array.from(teamStats.values()).sort((a, b) => {
            if (a.points !== b.points) return b.points - a.points;
            if (a.goalDifference !== b.goalDifference) return b.goalDifference - a.goalDifference;
            return b.goalsScored - a.goalsScored;
          });
          
          // Return top 2 teams from each group (or just the top team if there's only 1)
          return sortedTeams.slice(0, Math.min(2, sortedTeams.length)).map(stats => stats.team);
        });
        
        // Generate knockout stage matches based on the number of advancing teams
        const knockoutMatches: Match[] = [];
        const numTeams = teamsAdvancing.length;
        
        if (numTeams >= 2) {
          // If 2 teams, just a final
          if (numTeams === 2) {
            knockoutMatches.push({
              id: uuidv4(),
              teamA: teamsAdvancing[0],
              teamB: teamsAdvancing[1],
              scoreA: null,
              scoreB: null,
              winner: null,
              round: "final"
            });
          }
          // If 4 teams, 2 semis and a final
          else if (numTeams === 4) {
            // Semifinals
            knockoutMatches.push({
              id: uuidv4(),
              teamA: teamsAdvancing[0],
              teamB: teamsAdvancing[3],
              scoreA: null,
              scoreB: null,
              winner: null,
              round: "semifinal"
            });
            
            knockoutMatches.push({
              id: uuidv4(),
              teamA: teamsAdvancing[1],
              teamB: teamsAdvancing[2],
              scoreA: null,
              scoreB: null,
              winner: null,
              round: "semifinal"
            });
            
            // Final (with placeholder teams)
            knockoutMatches.push({
              id: uuidv4(),
              teamA: { id: "tbd", name: "TBD", players: [{ id: "tbd", name: "TBD" }, { id: "tbd", name: "TBD" }] },
              teamB: { id: "tbd", name: "TBD", players: [{ id: "tbd", name: "TBD" }, { id: "tbd", name: "TBD" }] },
              scoreA: null,
              scoreB: null,
              winner: null,
              round: "final"
            });
          }
          // If 8 teams, quarterfinals, semis, and a final
          else if (numTeams === 8) {
            // Quarterfinals
            for (let i = 0; i < 4; i++) {
              knockoutMatches.push({
                id: uuidv4(),
                teamA: teamsAdvancing[i],
                teamB: teamsAdvancing[7-i], // 0 vs 7, 1 vs 6, 2 vs 5, 3 vs 4
                scoreA: null,
                scoreB: null,
                winner: null,
                round: "quarterfinal"
              });
            }
            
            // Semifinals (with placeholder teams)
            for (let i = 0; i < 2; i++) {
              knockoutMatches.push({
                id: uuidv4(),
                teamA: { id: "tbd", name: "TBD", players: [{ id: "tbd", name: "TBD" }, { id: "tbd", name: "TBD" }] },
                teamB: { id: "tbd", name: "TBD", players: [{ id: "tbd", name: "TBD" }, { id: "tbd", name: "TBD" }] },
                scoreA: null,
                scoreB: null,
                winner: null,
                round: "semifinal"
              });
            }
            
            // Final (with placeholder teams)
            knockoutMatches.push({
              id: uuidv4(),
              teamA: { id: "tbd", name: "TBD", players: [{ id: "tbd", name: "TBD" }, { id: "tbd", name: "TBD" }] },
              teamB: { id: "tbd", name: "TBD", players: [{ id: "tbd", name: "TBD" }, { id: "tbd", name: "TBD" }] },
              scoreA: null,
              scoreB: null,
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
