const trustTierScore = {
  founder: 4,
  approved: 3,
  trial: 2,
  applicant: 1
};

export function matchSuppliersToRequest(request, suppliers) {
  const rejectedSuppliers = [];
  const eligibleSuppliers = [];

  suppliers.forEach((supplier) => {
    const reasons = getRejectionReasons(request, supplier);

    if (reasons.length) {
      rejectedSuppliers.push({
        supplierId: supplier.id,
        supplierName: supplier.name,
        reasons
      });
      return;
    }

    eligibleSuppliers.push(supplier);
  });

  const rankedSuppliers = eligibleSuppliers.sort((a, b) => compareSuppliers(request, a, b));

  const [bestSupplier, ...alternates] = rankedSuppliers;
  const visibleSuppliers = rankedSuppliers.slice(0, 3);

  return {
    bestSupplier: bestSupplier ?? null,
    alternateSuppliers: alternates.slice(0, 2),
    rejectedSuppliers,
    matchReasons: Object.fromEntries(
      visibleSuppliers.map((supplier) => [supplier.id, getMatchReasons(request, supplier)])
    )
  };
}

function getRejectionReasons(request, supplier) {
  const reasons = [];
  const material = request.material.toUpperCase();
  const color = request.color.toLowerCase();

  if (!supplier.active) {
    reasons.push("Supplier is inactive");
  }

  if (!supplier.availableNow) {
    reasons.push("Supplier is not currently available");
  }

  if (!supplier.printerTypes.includes("FDM")) {
    reasons.push("FDM printing is not supported");
  }

  if (!supplier.materials.map((item) => item.toUpperCase()).includes(material)) {
    reasons.push(`Does not support ${request.material}`);
  }

  if (color !== "custom" && !supplier.colors.map((item) => item.toLowerCase()).includes(color)) {
    reasons.push(`Does not support ${request.color}`);
  }

  if (!fitsBuildVolume(request.estimatedDimensions, supplier.maxBuildVolume)) {
    reasons.push("Requested dimensions exceed build volume");
  }

  if (request.deadlineType === "rush" && !supplier.acceptsRush) {
    reasons.push("Does not accept rush jobs");
  }

  return reasons;
}

function compareSuppliers(request, a, b) {
  return (
    compareBoolean(b.availableNow, a.availableNow) ||
    a.queueLoad - b.queueLoad ||
    (trustTierScore[b.trustTier] ?? 0) - (trustTierScore[a.trustTier] ?? 0) ||
    b.completedJobs - a.completedJobs ||
    (b.rating ?? 0) - (a.rating ?? 0) ||
    compareBoolean(b.campus === "UCF", a.campus === "UCF") ||
    compareBoolean(b.acceptsRush && request.deadlineType === "rush", a.acceptsRush && request.deadlineType === "rush")
  );
}

function compareBoolean(a, b) {
  return Number(a) - Number(b);
}

function getMatchReasons(request, supplier) {
  const reasons = [
    `Supports ${request.material}`,
    "Supports FDM printing",
    "Fits requested build volume"
  ];

  if (request.color === "custom") {
    reasons.push("Flexible on color");
  } else {
    reasons.push(`Supports ${request.color}`);
  }

  if (request.deadlineType === "rush" && supplier.acceptsRush) {
    reasons.push("Accepts rush jobs");
  }

  if (supplier.queueLoad <= 1) {
    reasons.push("Low current queue");
  }

  if (supplier.trustTier === "founder") {
    reasons.push("Founder supplier");
  } else {
    reasons.push(`${titleCase(supplier.trustTier)} trust tier`);
  }

  if (supplier.campus === "UCF") {
    reasons.push("Good UCF location fit");
  }

  return reasons;
}

function fitsBuildVolume(dimensions, maxBuildVolume) {
  const dimensionValues = [dimensions.x, dimensions.y, dimensions.z].map(Number);

  if (dimensionValues.some((value) => !value || value <= 0)) {
    return true;
  }

  return (
    dimensionValues[0] <= maxBuildVolume.x &&
    dimensionValues[1] <= maxBuildVolume.y &&
    dimensionValues[2] <= maxBuildVolume.z
  );
}

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
