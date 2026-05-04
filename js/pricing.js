export const pricingDefaults = {
  materialRate: 0.1,
  timeRate: 1.5,
  minimumPrice: 10,
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

  const rawPrice = (
    grams * pricingDefaults.materialRate +
    printHours * pricingDefaults.timeRate
  ) * complexityMultiplier * deadlineMultiplier;

  const estimatedPrice = Math.round(Math.max(rawPrice, pricingDefaults.minimumPrice));
  const lowEstimate = Math.round(estimatedPrice * 0.9);
  const highEstimate = Math.round(estimatedPrice * 1.15);

  return {
    estimatedPrice,
    estimatedPriceRange: {
      lowEstimate,
      highEstimate
    },
    rawPrice
  };
}

export function estimateTurnaround(deadlineType) {
  const turnaroundByDeadline = {
    economy: "Economy turnaround: usually 7-10 days after review.",
    standard: "Standard turnaround: usually 3-5 days after review.",
    priority: "Priority turnaround: usually 1-2 days after review.",
    rush: "Rush turnaround: same-day or next-day only if the file and queue allow it."
  };

  return turnaroundByDeadline[deadlineType] ?? turnaroundByDeadline.standard;
}
