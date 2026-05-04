import { JOB_STATUSES } from "./statuses.js";

export function createRequest(input, estimate, matchResult) {
  const recommendedSupplierIds = [
    matchResult.bestSupplier,
    ...matchResult.alternateSuppliers
  ]
    .filter(Boolean)
    .map((supplier) => supplier.id);

  return {
    requestId: createRequestId(),
    material: input.material,
    color: input.color,
    estimatedWeightGrams: input.estimatedWeightGrams,
    estimatedPrintHours: input.estimatedPrintHours,
    estimatedDimensions: input.estimatedDimensions,
    deadlineType: input.deadlineType,
    fulfillmentPreference: input.fulfillmentPreference,
    roughComplexity: input.roughComplexity,
    fileAttached: input.fileAttached,
    estimatedPrice: estimate.estimatedPrice,
    estimatedPriceRange: estimate.estimatedPriceRange,
    recommendedSupplierIds,
    selectedSupplierId: matchResult.bestSupplier?.id ?? null,
    createdAt: new Date().toISOString(),
    status: JOB_STATUSES.quoteRequested
  };
}

function createRequestId() {
  const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `REQ-${randomPart}`;
}
