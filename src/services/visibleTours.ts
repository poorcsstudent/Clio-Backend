/** Keep a saved active tour reachable even without a catalog or after its removal. */
export function visibleTours<T extends { id: string }>(catalog: readonly T[] | undefined, active: T | undefined): T[] {
  const tours = [...(catalog ?? [])];
  if (active && !tours.some(tour => tour.id === active.id)) tours.unshift(active);
  return tours;
}
