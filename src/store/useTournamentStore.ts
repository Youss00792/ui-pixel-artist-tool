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
  progressKnockoutStage: () => void;
  resetTournament: () => void;
  createTiebreakerMatch: (groupId: string, teamA: Team, teamB: Team, position?: number) => void;
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

        const shuffledTeams = [...tournament.teams].sort(() => Math.random() - 0.5);
        
        const groups: Group[] = [];
        const teamsPerGroup = Math.ceil(tournament.teams.length / tournament.numberOfGroups);
        
        for (let i = 0; i < tournament.numberOfGroups; i++) {
          const startIndex = i * teamsPerGroup;
          const groupTeams = shuffledTeams.slice(startIndex, startIndex + teamsPerGroup);
          
          const teamsWithGroupId = groupTeams.map(team => ({
            ...team,
            groupId: `group-${i + 1}`
          }));
          
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
            name: `Group ${String.fromCharCode(65 + i)}`,
            teams: teamsWithGroupId,
            matches: groupMatches
          });
        }
        
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

        let updatedMatches = tournament.matches.map((match) => {
          if (match.id === matchId) {
            return {
              ...match,
              winner,
            };
          }
          return match;
        });

        let updatedKnockoutMatches = tournament.knockoutMatches.map((match) => {
          if (match.id === matchId) {
            return {
              ...match,
              winner,
            };
          }
          return match;
        });

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
          
          const updatedTiebreakers = group.tiebreakers ? 
            group.tiebreakers.map((match) => {
              if (match.id === matchId) {
                return {
                  ...match,
                  winner,
                };
              }
              return match;
            }) : 
            undefined;

          return {
            ...group,
            matches: updatedGroupMatches,
            tiebreakers: updatedTiebreakers,
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
      },
      
      createTiebreakerMatch: (groupId, teamA, teamB, position) => {
        const { tournament } = get();
        if (!tournament) return;
        
        const newTiebreakerMatch: Match = {
          id: uuidv4(),
          teamA: teamA,
          teamB: teamB,
          winner: null,
          round: "tiebreaker",
          groupId: groupId,
          isTiebreaker: true,
          tieBreakerPosition: position
        };
        
        const updatedGroups = tournament.groups.map(group => {
          if (group.id === groupId) {
            return {
              ...group,
              tiebreakers: [...(group.tiebreakers || []), newTiebreakerMatch]
            };
          }
          return group;
        });
        
        const updatedMatches = [...tournament.matches, newTiebreakerMatch];
        
        set({
          tournament: {
            ...tournament,
            groups: updatedGroups,
            matches: updatedMatches,
            updatedAt: new Date().toISOString(),
          },
        });
      },
      
      progressKnockoutStage: () => {
        const { tournament } = get();
        if (!tournament || tournament.stage !== "bracket") return;
        
        const quarterFinalMatches = tournament.knockoutMatches.filter(m => m.round === "quarterfinal");
        const semiFinalMatches = tournament.knockoutMatches.filter(m => m.round === "semifinal");
        
        if (quarterFinalMatches.length > 0 && quarterFinalMatches.every(m => m.winner)) {
          const winners = quarterFinalMatches.map(m => m.winner!);
          
          let updatedKnockoutMatches = tournament.knockoutMatches.map(match => {
            if (match.round === "semifinal") {
              if (match === semiFinalMatches[0]) {
                return {
                  ...match,
                  teamA: winners[0],
                  teamB: winners[1]
                };
              } else if (match === semiFinalMatches[1]) {
                return {
                  ...match,
                  teamA: winners[2],
                  teamB: winners[3]
                };
              }
            }
            return match;
          });
          
          set({
            tournament: {
              ...tournament,
              knockoutMatches: updatedKnockoutMatches,
              updatedAt: new Date().toISOString(),
            },
          });
        }
        
        if (semiFinalMatches.length > 0 && semiFinalMatches.every(m => m.winner)) {
          const winners = semiFinalMatches.map(m => m.winner!);
          
          let updatedKnockoutMatches = tournament.knockoutMatches.map(match => {
            if (match.round === "final") {
              return {
                ...match,
                teamA: winners[0],
                teamB: winners[1]
              };
            }
            return match;
          });
          
          set({
            tournament: {
              ...tournament,
              knockoutMatches: updatedKnockoutMatches,
              updatedAt: new Date().toISOString(),
            },
          });
        }
      },
      
      generateKnockoutStage: () => {
        const { tournament } = get();
        if (!tournament) return;

        const teamsAdvancing = tournament.groups.flatMap(group => {
          const teamPoints = new Map<string, { team: Team, points: number }>();
          
          group.teams.forEach(team => {
            teamPoints.set(team.id, {
              team,
              points: 0
            });
          });
          
          group.matches.forEach(match => {
            if (match.winner) {
              const winnerStats = teamPoints.get(match.winner.id);
              if (winnerStats) {
                winnerStats.points += 1;
              }
            }
          });
          
          if (group.tiebreakers) {
            group.tiebreakers.forEach(match => {
              if (match.winner) {
                const winnerStats = teamPoints.get(match.winner.id);
                if (winnerStats) {
                  winnerStats.points += 1;
                }
              }
            });
          }
          
          const sortedTeams = Array.from(teamPoints.values()).sort((a, b) => b.points - a.points);
          
          let teamsToAdvancePerGroup = Math.ceil(8 / tournament.groups.length);
          teamsToAdvancePerGroup = Math.min(teamsToAdvancePerGroup, group.teams.length);
          
          return sortedTeams.slice(0, teamsToAdvancePerGroup).map(stats => stats.team);
        });
        
        const knockoutMatches: Match[] = [];
        const numTeams = teamsAdvancing.length;
        
        const randomizedTeams = [...teamsAdvancing].sort(() => Math.random() - 0.5);
        
        if (numTeams >= 2) {
          if (numTeams >= 5) {
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
            
            for (let i = 0; i < 4; i++) {
              knockoutMatches.push({
                id: uuidv4(),
                teamA: teamsToUse[i],
                teamB: teamsToUse[7-i],
                winner: null,
                round: "quarterfinal"
              });
            }
            
            for (let i = 0; i < 2; i++) {
              knockoutMatches.push({
                id: uuidv4(),
                teamA: { id: "tbd", name: "TBD", players: [{ id: "tbd", name: "TBD" }, { id: "tbd", name: "TBD" }] as [Player, Player] },
                teamB: { id: "tbd", name: "TBD", players: [{ id: "tbd", name: "TBD" }, { id: "tbd", name: "TBD" }] as [Player, Player] },
                winner: null,
                round: "semifinal"
              });
            }
            
            knockoutMatches.push({
              id: uuidv4(),
              teamA: { id: "tbd", name: "TBD", players: [{ id: "tbd", name: "TBD" }, { id: "tbd", name: "TBD" }] as [Player, Player] },
              teamB: { id: "tbd", name: "TBD", players: [{ id: "tbd", name: "TBD" }, { id: "tbd", name: "TBD" }] as [Player, Player] },
              winner: null,
              round: "final"
            });
          } else if (numTeams >= 3 && numTeams <= 4) {
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
            
            knockoutMatches.push({
              id: uuidv4(),
              teamA: { id: "tbd", name: "TBD", players: [{ id: "tbd", name: "TBD" }, { id: "tbd", name: "TBD" }] as [Player, Player] },
              teamB: { id: "tbd", name: "TBD", players: [{ id: "tbd", name: "TBD" }, { id: "tbd", name: "TBD" }] as [Player, Player] },
              winner: null,
              round: "final"
            });
          } else if (numTeams === 2) {
            knockoutMatches.push({
              id: uuidv4(),
              teamA: randomizedTeams[0],
              teamB: randomizedTeams[1],
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
