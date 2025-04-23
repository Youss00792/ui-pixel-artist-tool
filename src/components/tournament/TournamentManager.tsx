
"use client";
import React from "react";
import { useTournamentStore } from "@/store/useTournamentStore";
import TournamentHeader from "./TournamentHeader";
import TournamentCreationForm from "./TournamentCreationForm";
import TeamSetupForm from "./TeamSetupForm";
import GroupStageView from "./GroupStageView";
import KnockoutBracket from "./KnockoutBracket";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const TournamentManager: React.FC = () => {
  const { tournament, resetTournament } = useTournamentStore();

  // Default tab to show based on tournament stage
  const getDefaultTab = () => {
    if (!tournament) return "creation";
    
    switch (tournament.stage) {
      case "teams": return "teams";
      case "groups": return "groups";
      case "bracket": return "bracket";
      default: return "creation";
    }
  };

  return (
    <div className="bg-white">
      <div className="w-full max-md:max-w-full">
        <div className="bg-gray-50 flex w-full flex-col items-center pt-[34px] pb-12 px-4 md:px-8 lg:px-20 min-h-screen">
          <div className="w-full max-w-[864px] flex flex-col items-stretch">
            <div className="flex justify-between items-center mb-6">
              <TournamentHeader />
              {tournament && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={resetTournament}
                  className="flex items-center gap-1"
                >
                  <X className="h-4 w-4" /> Reset Tournament
                </Button>
              )}
            </div>

            {!tournament ? (
              <TournamentCreationForm />
            ) : (
              <Tabs defaultValue={getDefaultTab()} className="w-full">
                <TabsList className="grid grid-cols-3 mb-6">
                  <TabsTrigger 
                    value="teams" 
                    disabled={tournament.stage !== "teams" && tournament.stage !== "groups" && tournament.stage !== "bracket"}
                  >
                    Team Setup
                  </TabsTrigger>
                  <TabsTrigger 
                    value="groups" 
                    disabled={tournament.stage !== "groups" && tournament.stage !== "bracket"}
                  >
                    Group Stage
                  </TabsTrigger>
                  <TabsTrigger 
                    value="bracket" 
                    disabled={tournament.stage !== "bracket"}
                  >
                    Knockout Stage
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="teams">
                  <TeamSetupForm />
                </TabsContent>

                <TabsContent value="groups">
                  <GroupStageView />
                </TabsContent>

                <TabsContent value="bracket">
                  <KnockoutBracket />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentManager;
