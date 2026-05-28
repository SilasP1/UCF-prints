export const pricingDefaults = {
  materialRates: {
    PLA: 0.1,
    PETG: 0.13,
    TPU: 0.16,
    ABS: 0.14
  },
  timeRate: 1.5,
  marginMultiplier: 1.3,
  handlingFee: 5,
  minimumPrice: 12,
  deadlineMultipliers: {
    economy: 0.9,
    standard: 1,
    priority: 1.35,
    rush: 1.75
  }
};

export function calculateEstimate({
  material,
  estimatedWeightGrams,
  estimatedPrintHours,
  deadlineType
}) {
  const grams = Number(estimatedWeightGrams) || 0;
  const printHours = Number(estimatedPrintHours) || 0;
  const materialRate = pricingDefaults.materialRates[material] ?? pricingDefaults.materialRates.PLA;
  const deadlineMultiplier = pricingDefaults.deadlineMultipliers[deadlineType] ?? 1;
  const materialCost = grams * materialRate;
  const timeCost = printHours * pricingDefaults.timeRate;

  const baseCost = materialCost + timeCost;
  const adjustedCost = baseCost * deadlineMultiplier;
  // marginMultiplier covers failed prints, machine wear, and quote uncertainty.
  // handlingFee covers setup, messaging, and coordination.
  const finalPrice = adjustedCost * pricingDefaults.marginMultiplier + pricingDefaults.handlingFee;

  const estimatedPrice = Math.max(finalPrice, pricingDefaults.minimumPrice);

  return {
    estimatedPrice,
    materialRate,
    materialCost,
    timeCost,
    baseCost,
    deadlineMultiplier,
    adjustedCost,
    marginMultiplier: pricingDefaults.marginMultiplier,
    handlingFee: pricingDefaults.handlingFee
  };
}

export function estimateTurnaround(deadlineType) {
  const turnaroundByDeadline = {
    economy: "Economy turnaround: usually 7-10 days after review.",
    standard: "Standard turnaround: usually 3-5 days after review.",
    priority: "Priority turnaround: usually 1-2 days after review.",
    rush: "Rush turnaround: as soon as possible after review."
  };

  return turnaroundByDeadline[deadlineType] ?? turnaroundByDeadline.standard;
}
