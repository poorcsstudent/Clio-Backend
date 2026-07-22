import { getKnowledgeStats } from "../services/knowledge";

const stats = getKnowledgeStats();
console.log(JSON.stringify(stats, null, 2));

if (stats.campuses === 0 || stats.documents === 0 || stats.stops === 0) {
  process.exitCode = 1;
}
