
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Trophy } from "lucide-react";
import { Match, Team } from "@/types/tournament";

interface GroupMatchesProps {
  groupName: string;
  matches: Match[];
  tiebreakers?: Match[];
  onSetWinner: (matchId: string, winner: Team) => void;
}

const GroupMatches: React.FC<GroupMatchesProps> = ({
  groupName,
  matches,
  tiebreakers,
  onSetWinner
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Matches - {groupName}</CardTitle>
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
            {matches.map((match) => (
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
                        onSetWinner(match.id, winningTeam);
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
                      onClick={() => onSetWinner(match.id, match.winner === match.teamA ? match.teamB : match.teamA)}
                    >
                      Change Winner
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            
            {/* Display tiebreaker matches if they exist */}
            {tiebreakers && tiebreakers.map((match) => (
              <TableRow key={match.id} className="bg-yellow-50">
                <TableCell className="font-medium">
                  <span className="text-xs font-bold text-yellow-700 uppercase mr-2">
                    Tiebreaker {match.tieBreakerPosition && `(Position ${match.tieBreakerPosition})`}:
                  </span>
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
                        onSetWinner(match.id, winningTeam);
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
                      onClick={() => onSetWinner(match.id, match.winner === match.teamA ? match.teamB : match.teamA)}
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
  );
};

export default GroupMatches;
