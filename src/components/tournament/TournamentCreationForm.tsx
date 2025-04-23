
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTournamentStore } from "@/store/useTournamentStore";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Define the form schema with Zod
const tournamentCreationSchema = z.object({
  tournamentName: z.string().min(1, "Tournament name is required"),
  numberOfTeams: z.coerce
    .number()
    .int()
    .min(2, "At least 2 teams required")
    .max(64, "Maximum 64 teams allowed"),
  numberOfGroups: z.coerce
    .number()
    .int()
    .min(1, "At least 1 group required")
    .max(16, "Maximum 16 groups allowed"),
});

// Infer the type from the schema
type TournamentCreationValues = z.infer<typeof tournamentCreationSchema>;

const TournamentCreationForm: React.FC = () => {
  const { createTournament } = useTournamentStore();
  const { toast } = useToast();

  const form = useForm<TournamentCreationValues>({
    resolver: zodResolver(tournamentCreationSchema),
    defaultValues: {
      tournamentName: "",
      numberOfTeams: 4,
      numberOfGroups: 1,
    },
  });

  const onSubmit = (data: TournamentCreationValues) => {
    createTournament(data.tournamentName, data.numberOfTeams, data.numberOfGroups);
    toast({
      title: "Tournament Created",
      description: `Created "${data.tournamentName}" with ${data.numberOfTeams} teams and ${data.numberOfGroups} groups.`,
    });
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Create New Tournament</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="tournamentName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tournament Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter tournament name" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="numberOfTeams"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Teams</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={2}
                      max={64}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="numberOfGroups"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Groups</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={1}
                      max={16}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              Continue to Team Setup
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default TournamentCreationForm;
