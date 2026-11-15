/** Fixed-start, open-tour refinement. Full directed costs preserve one-way paths. */
export function refineTourOrder(initial: number[], distances: number[][]): number[] {
  const cost = (route: number[]) => route.slice(1).reduce((sum, to, i) => sum + distances[route[i]][to], 0);
  let order = [...initial], best = cost(order);
  // Bounded work for large selections; every accepted move strictly improves cost.
  for (let pass = 0; pass < 30; pass++) {
    let candidate = order, candidateCost = best;
    for (let from = 1; from < order.length - 1; from++) {
      for (let to = from + 1; to < order.length; to++) {
        const reversed = [...order.slice(0, from), ...order.slice(from, to + 1).reverse(), ...order.slice(to + 1)];
        const distance = cost(reversed);
        if (distance < candidateCost - 0.001) { candidate = reversed; candidateCost = distance; }
      }
    }
    if (candidate === order) break;
    order = candidate; best = candidateCost;
  }
  return order;
}
