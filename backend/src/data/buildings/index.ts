import { computerScienceBuilding } from "./computerScienceBuilding";
import { emersonElectricHall } from "./emersonElectricHall";
import { havenerCenter } from "./havenerCenter";
import { BuildingKnowledge } from "./types";

export const buildingKnowledgeBase: BuildingKnowledge[] = [
  computerScienceBuilding,
  emersonElectricHall,
  havenerCenter
];

export function getBuildingKnowledgeById(
  buildingId: string
): BuildingKnowledge | undefined {
  return buildingKnowledgeBase.find(building => building.id === buildingId);
}