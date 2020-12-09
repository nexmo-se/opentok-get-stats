import audioStats from "./audioStats";

function getStatsResult(publisher) {
  const audioStatsObj = new audioStats();
  const audioResults = audioStatsObj.run(publisher);
  console.log("audioResults", audioResults);
}

export default getStatsResult;
