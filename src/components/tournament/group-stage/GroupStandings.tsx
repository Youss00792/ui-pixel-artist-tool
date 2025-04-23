
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trophy } from "lucide-react";
import { Team } from "@/types/tournament";

export interface TeamStanding {
  team: Team;
  played: number;
  wins: number;
  points: number;
}

interface GroupStandingsProps {
  groupName: string;
  standings: TeamStanding[];
  advancingCount: number;
  tieAtCutoff: boolean;
  tiedPositions: Record<number, TeamStanding[]>;
  onCreateTiebreaker: (position: number, teams: Team[]) => void;
}

const GroupStandings: React.FC<GroupStandingsProps> = ({
  groupName,
  standings,
  advancingCount,
  tieAtCutoff,
  tiedPositions,
  onCreateTiebreaker
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Standings - {groupName}</CardTitle>
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
              const position = index + 1;
              const isAdvancing = position <= advancingCount;
              const isTied = Object.entries(tiedPositions).some(([pos, teams]) => 
                parseInt(pos) === position && teams.length > 1
              );
              
              let statusBg = isAdvancing ? "bg-green-50" : "bg-red-50";
              let textColor = isAdvancing ? "text-green-700" : "text-red-700";
              
              if (isTied) {
                statusBg = "bg-yellow-50";
                textColor = "text-yellow-700";
              }
              
              return (
                <TableRow key={standing.team.id} className={statusBg}>
                  <TableCell>{position}</TableCell>
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
        
        {Object.entries(tiedPositions).map(([position, tiedTeams]) => {
          if (tiedTeams.length <= 1) return null;
          
          return (
            <div key={`tie-${position}`} className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-yellow-800">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Tiebreaker needed at position {position}!</p>
                  <p className="text-sm">
                    There is a tie between {tiedTeams.map(t => t.team.name).join(", ")}.
                    Create a tiebreaker match to determine which team advances.
                  </p>
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCreateTiebreaker(
                        parseInt(position),
                        tiedTeams.map(t => t.team)
                      )}
                    >
                      Create Tiebreaker Match
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default GroupStandings;
