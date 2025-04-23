import React from "react";

const TournamentHeader: React.FC = () => {
  return (
    <header className="self-center flex w-[307px] max-w-full items-stretch gap-2 text-[26px] text-gray-800 font-bold leading-none">
      <img
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/6075afd753ab8c8841907be9d251c6a9e9ac8ab5?placeholderIfAbsent=true"
        alt="Tournament Manager Logo"
        className="aspect-[1] object-contain w-8 shrink-0"
      />
      <h1 className="grow shrink w-[261px] basis-auto">Tournament Manager</h1>
    </header>
  );
};

export default TournamentHeader;
