
import React, { useState } from "react";
import { useTournamentStore } from "@/store/useTournamentStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash, Save, X, Plus } from "lucide-react";

const TeamSetupForm: React.FC = () => {
  const { tournament, addTeam, updateTeam, generateGroups } = useTournamentStore();
  const { toast } = useToast();
  
  const [teamName, setTeamName] = useState("");
  const [player1Name, setPlayer1Name] = useState("");
  const [player2Name, setPlayer2Name] = useState("");
  
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [editPlayer1Name, setEditPlayer1Name] = useState("");
  const [editPlayer2Name, setEditPlayer2Name] = useState("");

  const handleAddTeam = () => {
    if (teamName && player1Name && player2Name) {
      addTeam(teamName, [player1Name, player2Name]);
      // Reset form
      setTeamName("");
      setPlayer1Name("");
      setPlayer2Name("");
      toast({
        title: "Team Added",
        description: `${teamName} has been added to the tournament.`,
      });
    }
  };

  const startEditingTeam = (teamId: string) => {
    const team = tournament?.teams.find(t => t.id === teamId);
    if (team) {
      setEditingTeam(teamId);
      setEditTeamName(team.name);
      setEditPlayer1Name(team.players[0].name);
      setEditPlayer2Name(team.players[1].name);
    }
  };

  const cancelEditing = () => {
    setEditingTeam(null);
  };

  const saveTeamEdit = (teamId: string) => {
    if (editTeamName && editPlayer1Name && editPlayer2Name) {
      updateTeam(teamId, editTeamName, [editPlayer1Name, editPlayer2Name]);
      setEditingTeam(null);
      toast({
        title: "Team Updated",
        description: `${editTeamName} has been updated.`,
      });
    }
  };

  const handleStartTournament = () => {
    if (tournament && tournament.teams.length >= 2) {
      generateGroups();
      toast({
        title: "Tournament Starting",
        description: "Group stage has been generated.",
      });
    } else {
      toast({
        title: "Cannot Start Tournament",
        description: "You need at least 2 teams to start the tournament.",
        variant: "destructive",
      });
    }
  };

  if (!tournament) return null;

  const teamsNeeded = tournament.numberOfTeams - (tournament.teams?.length || 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Team Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="teamName" className="text-sm font-medium">
                  Team Name
                </label>
                <Input
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter team name"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="player1" className="text-sm font-medium">
                  Player 1 Name
                </label>
                <Input
                  id="player1"
                  value={player1Name}
                  onChange={(e) => setPlayer1Name(e.target.value)}
                  placeholder="Enter player 1 name"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="player2" className="text-sm font-medium">
                  Player 2 Name
                </label>
                <Input
                  id="player2"
                  value={player2Name}
                  onChange={(e) => setPlayer2Name(e.target.value)}
                  placeholder="Enter player 2 name"
                />
              </div>
            </div>
            <Button 
              onClick={handleAddTeam} 
              disabled={!teamName || !player1Name || !player2Name}
              className="w-full md:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Team
            </Button>
          </div>
        </CardContent>
      </Card>

      {tournament.teams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Teams ({tournament.teams.length}/{tournament.numberOfTeams})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Player 1</TableHead>
                  <TableHead>Player 2</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournament.teams.map((team) => (
                  <TableRow key={team.id}>
                    {editingTeam === team.id ? (
                      <>
                        <TableCell>
                          <Input
                            value={editTeamName}
                            onChange={(e) => setEditTeamName(e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editPlayer1Name}
                            onChange={(e) => setEditPlayer1Name(e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editPlayer2Name}
                            onChange={(e) => setEditPlayer2Name(e.target.value)}
                          />
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => saveTeamEdit(team.id)}
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditing}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{team.name}</TableCell>
                        <TableCell>{team.players[0].name}</TableCell>
                        <TableCell>{team.players[1].name}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditingTeam(team.id)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              {teamsNeeded > 0 ? (
                <span>Add {teamsNeeded} more team{teamsNeeded !== 1 ? "s" : ""}</span>
              ) : (
                <span>All teams added</span>
              )}
            </div>
            <Button
              onClick={handleStartTournament}
              disabled={tournament.teams.length < 2}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Start Tournament
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default TeamSetupForm;
