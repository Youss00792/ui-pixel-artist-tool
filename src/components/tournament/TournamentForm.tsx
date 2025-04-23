import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Define the form schema with Zod
const tournamentFormSchema = z.object({
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
type TournamentFormValues = z.infer<typeof tournamentFormSchema>;

const TournamentForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: {
      tournamentName: "",
      numberOfTeams: 4,
      numberOfGroups: 1,
    },
  });

  const onSubmit = async (data: TournamentFormValues) => {
    setIsSubmitting(true);
    try {
      // In a real application, you would send this data to your backend
      console.log("Form submitted:", data);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Navigate to the next step (team entry)
      // This would typically use a router or state management
      alert("Form submitted successfully! Proceeding to Team Entry.");
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-white shadow-[0px_2px_4px_-2px_rgba(0,0,0,0.1)] flex flex-col items-stretch font-medium mt-[34px] py-7 rounded-lg max-md:max-w-full">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
        <div className="flex w-full flex-col text-xs px-6 max-md:max-w-full max-md:px-5">
          <h2 className="text-gray-800 text-xl font-semibold leading-loose">
            Create New Tournament
          </h2>

          {/* Tournament Name Field */}
          <div className="mt-[38px]">
            <label
              htmlFor="tournamentName"
              className="text-gray-700 leading-loose"
            >
              Tournament Name
            </label>
            <input
              id="tournamentName"
              type="text"
              placeholder="Enter tournament name"
              className={`self-stretch bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)] border-gray-300 border min-h-[46px] text-base w-full mt-3.5 pl-[41px] pr-[11px] py-[11px] rounded-md border-solid max-md:pl-5 ${
                errors.tournamentName ? "border-red-500" : ""
              }`}
              {...register("tournamentName")}
            />
            {errors.tournamentName && (
              <p className="text-red-500 text-xs mt-1">
                {errors.tournamentName.message}
              </p>
            )}
          </div>

          {/* Number of Teams and Groups Fields */}
          <div className="flex w-full max-w-full items-stretch gap-5 text-gray-700 leading-loose flex-wrap justify-between mt-[29px]">
            <div className="flex-1">
              <label htmlFor="numberOfTeams">Number of Teams</label>
              <input
                id="numberOfTeams"
                type="number"
                className={`self-stretch bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)] border-gray-300 border min-h-[46px] text-base w-full mt-3 pl-[41px] pr-[11px] py-[11px] rounded-md border-solid max-md:pl-5 ${
                  errors.numberOfTeams ? "border-red-500" : ""
                }`}
                {...register("numberOfTeams")}
              />
              {errors.numberOfTeams && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.numberOfTeams.message}
                </p>
              )}
            </div>

            <div className="flex-1">
              <label htmlFor="numberOfGroups">Number of Groups</label>
              <input
                id="numberOfGroups"
                type="number"
                className={`self-stretch bg-white shadow-[0px_1px_2px_rgba(0,0,0,0.05)] border-gray-300 border min-h-[46px] text-base w-full mt-3 pl-[41px] pr-[11px] py-[11px] rounded-md border-solid max-md:pl-5 ${
                  errors.numberOfGroups ? "border-red-500" : ""
                }`}
                {...register("numberOfGroups")}
              />
              {errors.numberOfGroups && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.numberOfGroups.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end px-6 max-md:px-5">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 shadow-[0px_1px_2px_rgba(0,0,0,0.05)] text-sm text-white text-center leading-loose mt-6 px-[35px] py-3.5 rounded-md max-md:px-5 hover:bg-blue-700 transition-colors disabled:opacity-70"
          >
            {isSubmitting ? "Processing..." : "Continue to Team Entry"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default TournamentForm;
