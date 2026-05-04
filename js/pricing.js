export const pricingDefaults = {
  materialRate: 0.1,
  timeRate: 1.5,
  marginMultiplier: 1.3,
  handlingFee: 5,
  minimumPrice: 12,
  complexityMultipliers: {
    simple: 1,
    moderate: 1.15,
    complex: 1.35
  },
  deadlineMultipliers: {
    economy: 0.9,
    standard: 1,
    priority: 1.35,
    rush: 1.75
  }
};

export function calculateEstimate({
  estimatedWeightGrams,
  estimatedPrintHours,
  roughComplexity,
  deadlineType
}) {
  const grams = Number(estimatedWeightGrams) || 0;
  const printHours = Number(estimatedPrintHours) || 0;
  const complexityMultiplier = pricingDefaults.complexityMultipliers[roughComplexity] ?? 1;
  const deadlineMultiplier = pricingDefaults.deadlineMultipliers[deadlineType] ?? 1;

  const baseCost = (
    grams * pricingDefaults.materialRate +
    printHours * pricingDefaults.timeRate
  );
  const adjustedCost = baseCost * complexityMultiplier * deadlineMultiplier;
  // marginMultiplier covers failed prints, machine wear, and quote uncertainty.
  // handlingFee covers setup, messaging, and coordination.
  const finalPrice = adjustedCost * pricingDefaults.marginMultiplier + pricingDefaults.handlingFee;

  const estimatedPrice = Math.round(Math.max(finalPrice, pricingDefaults.minimumPrice));
  const lowEstimate = Math.round(estimatedPrice * 0.9);
  const highEstimate = Math.round(estimatedPrice * 1.15);

  return {
    estimatedPrice,
    estimatedPriceRange: {
      lowEstimate,
      highEstimate
    },
    baseCost,
    adjustedCost
  };
}

export function estimateTurnaround(deadlineType) {
  const turnaroundByDeadline = {
    economy: "Economy turnaround: usually 3-5 days after review.",
    standard: "Standard turnaround: usually 24-48 hours after review, depending on size and queue.",
    priority: "Priority turnaround: usually 1-2 days after review.",
    rush: "Rush turnaround: as soon as possible after review."
  };

  return turnaroundByDeadline[deadlineType] ?? turnaroundByDeadline.standard;
}
