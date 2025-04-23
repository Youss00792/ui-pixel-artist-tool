
"use client";
import React, { useState, useEffect } from "react";
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
  const [activeTab, setActiveTab] = useState<string>("creation");

  // On tournament stage change, update the active tab if needed
  useEffect(() => {
    if (!tournament) {
      setActiveTab("creation");
    } else if (tournament.stage === "teams" && activeTab === "creation") {
      setActiveTab("teams");
    } else if (tournament.stage === "groups" && activeTab === "teams") {
      setActiveTab("groups");
    } else if (tournament.stage === "bracket" && activeTab === "groups") {
      setActiveTab("bracket");
    }
    // Don't force tab change if user manually switched to another tab
  }, [tournament?.stage]);

  // Check if a tab should be disabled
  const isTabDisabled = (tabName: string): boolean => {
    if (!tournament) return tabName !== "creation";
    
    switch (tabName) {
      case "creation": return tournament !== null;
      case "teams": return tournament.stage === "setup";
      case "groups": return tournament.stage === "setup" || tournament.stage === "teams";
      case "bracket": return tournament.stage === "setup" || tournament.stage === "teams" || tournament.stage === "groups";
      default: return false;
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
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 mb-6">
                  <TabsTrigger 
                    value="teams" 
                    disabled={isTabDisabled("teams")}
                  >
                    Team Setup
                  </TabsTrigger>
                  <TabsTrigger 
                    value="groups" 
                    disabled={isTabDisabled("groups")}
                  >
                    Group Stage
                  </TabsTrigger>
                  <TabsTrigger 
                    value="bracket" 
                    disabled={isTabDisabled("bracket")}
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
