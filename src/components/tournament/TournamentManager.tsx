"use client";
import React from "react";
import TournamentHeader from "./TournamentHeader";
import TournamentForm from "./TournamentForm";

const TournamentManager: React.FC = () => {
  return (
    <div className="bg-white">
      <div className="w-full max-md:max-w-full">
        <div className="bg-gray-50 flex w-full flex-col items-center pt-[34px] pb-[417px] px-20 max-md:max-w-full max-md:pb-[100px] max-md:px-5">
          <div className="flex mb-[-83px] w-full max-w-[864px] flex-col items-stretch max-md:max-w-full max-md:mb-2.5">
            <TournamentHeader />
            <TournamentForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentManager;
