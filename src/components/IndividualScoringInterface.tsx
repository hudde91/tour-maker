// import { useState } from "react";
// import { useSwipeable } from "react-swipeable";
// import { Round, Tour } from "@/types/core";
// import { TotalScoreCard } from "./scoring/TotalScoreCard";
// import { ScoreEntryCard } from "./scoring/ScoreEntryCard";
// import { HoleNavigation } from "./scoring/HoleNavigation";

// interface IndividualScoringInterfaceProps {
//   tour: Tour;
//   round: Round;
//   onPlayerScoreChange: (
//     playerId: string,
//     holeIndex: number,
//     score: number
//   ) => void;
//   onPlayerTotalScoreChange: (
//     playerId: string,
//     totalScore: number,
//     handicapStrokes?: number,
//     stablefordPoints?: number
//   ) => void;
// }

// export const IndividualScoringInterface = ({
//   tour,
//   round,
//   onPlayerScoreChange,
//   onPlayerTotalScoreChange,
// }: IndividualScoringInterfaceProps) => {
//   const [currentHole, setCurrentHole] = useState(1);
//   const [scoringMode, setScoringMode] = useState<"individual" | "total">(
//     "individual"
//   );

//   // Swipe handlers for hole navigation
//   const handlers = useSwipeable({
//     onSwipedLeft: () => {
//       if (scoringMode === "individual" && currentHole < round.holes) {
//         setCurrentHole(currentHole + 1);
//       }
//     },
//     onSwipedRight: () => {
//       if (scoringMode === "individual" && currentHole > 1) {
//         setCurrentHole(currentHole - 1);
//       }
//     },
//     trackMouse: true, // Allow mouse swipe on desktop for testing
//     preventScrollOnSwipe: true,
//     delta: 50, // Minimum swipe distance in pixels
//   });

//   const currentHoleInfo = round.holeInfo[currentHole - 1];

//   const getPlayerScores = () => {
//     const scores: Record<string, number[]> = {};
//     Object.entries(round.scores).forEach(([playerId, playerScore]) => {
//       scores[playerId] = playerScore.scores;
//     });
//     return scores;
//   };

//   return (
//     <div className="space-y-6">
//       {scoringMode === "individual" && (
//         <HoleNavigation
//           holes={round.holeInfo}
//           currentHole={currentHole}
//           onHoleChange={setCurrentHole}
//           playerScores={getPlayerScores()}
//         />
//       )}

//       <div className="flex justify-between items-center">
//         <h2 className="section-header">
//           {scoringMode === "individual"
//             ? `Hole ${currentHole}`
//             : "Total Score Entry"}
//         </h2>

//         <div className="bg-white rounded-lg p-1 shadow-sm border border-slate-200">
//           <button
//             onClick={() => setScoringMode("individual")}
//             className={`px-3 py-1 rounded text-sm font-medium transition-all ${
//               scoringMode === "individual"
//                 ? "bg-emerald-600 text-white shadow-sm"
//                 : "text-slate-600 hover:text-slate-900"
//             }`}
//           >
//             Hole by Hole
//           </button>
//           <button
//             onClick={() => setScoringMode("total")}
//             className={`px-3 py-1 rounded text-sm font-medium transition-all ${
//               scoringMode === "total"
//                 ? "bg-emerald-600 text-white shadow-sm"
//                 : "text-slate-600 hover:text-slate-900"
//             }`}
//           >
//             Total Score
//           </button>
//         </div>
//       </div>

//       <div {...handlers} className="space-y-4 touch-pan-y relative">
//         {scoringMode === "individual" && (
//           <div className="text-center py-2 flex items-center justify-center gap-2 text-slate-400 text-sm animate-fade-in">
//             <svg
//               className="w-4 h-4"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M15 19l-7-7 7-7"
//               />
//             </svg>
//             <span>Swipe to change hole</span>
//             <svg
//               className="w-4 h-4"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M9 5l7 7-7 7"
//               />
//             </svg>
//           </div>
//         )}

//         {tour.players.map((player) => {
//           const playerScore = round.scores[player.id];
//           const currentScore = playerScore?.scores[currentHole - 1] || 0;
//           const totalScore = playerScore?.totalScore || 0;

//           return scoringMode === "total" ? (
//             <TotalScoreCard
//               key={player.id}
//               player={player}
//               round={round}
//               currentTotalScore={totalScore}
//               onTotalScoreChange={(score, handicapStrokes, stablefordPoints) =>
//                 onPlayerTotalScoreChange(
//                   player.id,
//                   score,
//                   handicapStrokes,
//                   stablefordPoints
//                 )
//               }
//             />
//           ) : (
//             <ScoreEntryCard
//               key={player.id}
//               player={player}
//               holeInfo={currentHoleInfo}
//               currentScore={currentScore}
//               playerScore={playerScore}
//               onScoreChange={(score) =>
//                 onPlayerScoreChange(player.id, currentHole - 1, score)
//               }
//               strokesGiven={round.settings.strokesGiven}
//             />
//           );
//         })}
//       </div>

//       {scoringMode === "individual" && (
//         <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 safe-area-bottom shadow-lg">
//           <div className="flex gap-3 max-w-md mx-auto">
//             <button
//               onClick={() => currentHole > 1 && setCurrentHole(currentHole - 1)}
//               disabled={currentHole === 1}
//               className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
//             >
//               <div className="flex items-center justify-center gap-2">
//                 <svg
//                   className="w-4 h-4"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M10 19l-7-7m0 0l7-7m-7 7h18"
//                   />
//                 </svg>
//                 <span className="font-semibold">Previous</span>
//               </div>
//             </button>

//             <div className="flex items-center justify-center px-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
//               <span className="text-emerald-800 font-bold">
//                 {currentHole} / {round.holes}
//               </span>
//             </div>

//             <button
//               onClick={() =>
//                 currentHole < round.holes && setCurrentHole(currentHole + 1)
//               }
//               disabled={currentHole === round.holes}
//               className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
//             >
//               <div className="flex items-center justify-center gap-2">
//                 <span className="font-semibold">Next</span>
//                 <svg
//                   className="w-4 h-4"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M14 5l7 7m0 0l-7 7m7-7H3"
//                   />
//                 </svg>
//               </div>
//             </button>
//           </div>

//           <div className="mt-3 max-w-md mx-auto">
//             <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
//               <div
//                 className="h-full bg-emerald-600 transition-all duration-300"
//                 style={{ width: `${(currentHole / round.holes) * 100}%` }}
//               />
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
