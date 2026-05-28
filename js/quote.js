const PRINTER_BUILD_VOLUME = { x: 220, y: 220, z: 250 };
const JOB_STATUSES = {
  quoteRequested: "quote_requested"
};
const pricingDefaults = {
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
const form = document.querySelector("#quoteForm");
const estimatedPriceElement = document.querySelector("#estimatedPrice");
const estimatedTurnaroundElement = document.querySelector("#estimatedTurnaround");
const materialBreakdownElement = document.querySelector("#materialBreakdown");
const timeBreakdownElement = document.querySelector("#timeBreakdown");
const deadlineBreakdownElement = document.querySelector("#deadlineBreakdown");
const handlingBreakdownElement = document.querySelector("#handlingBreakdown");
const copyQuoteButton = document.querySelector("#copyQuoteButton");
const quoteMessageElement = document.querySelector("#quoteMessage");
const developerPanel = document.querySelector("#developerPanel");
const debugOutputElement = document.querySelector("#debugOutput");
const debugEnabled = new URLSearchParams(window.location.search).has("debug");
let currentRequest = null;

if (developerPanel && debugEnabled) {
  developerPanel.hidden = false;
}

function getFormInput() {
  return {
    material: getValue("material"),
    color: getValue("color"),
    estimatedWeightGrams: Number(getValue("estimatedWeightGrams")),
    estimatedPrintHours: Number(getValue("estimatedPrintHours")),
    estimatedDimensions: PRINTER_BUILD_VOLUME,
    deadlineType: getValue("deadlineType"),
    fulfillmentPreference: getValue("fulfillmentPreference")
  };
}

function getValue(id) {
  return document.querySelector(`#${id}`).value;
}

function calculateEstimate({
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

function estimateTurnaround(deadlineType) {
  const turnaroundByDeadline = {
    economy: "Economy turnaround: usually 7-10 days after review.",
    standard: "Standard turnaround: usually 3-5 days after review.",
    priority: "Priority turnaround: usually 1-2 days after review.",
    rush: "Rush turnaround: as soon as possible after review."
  };

  return turnaroundByDeadline[deadlineType] ?? turnaroundByDeadline.standard;
}

function createRequest(input, estimate) {
  return {
    requestId: createRequestId(),
    material: input.material,
    color: input.color,
    estimatedWeightGrams: input.estimatedWeightGrams,
    estimatedPrintHours: input.estimatedPrintHours,
    estimatedDimensions: input.estimatedDimensions,
    deadlineType: input.deadlineType,
    fulfillmentPreference: input.fulfillmentPreference,
    estimatedPrice: estimate.estimatedPrice,
    operator: {
      name: "UCF Prints",
      email: "si354631@ucf.edu"
    },
    createdAt: new Date().toISOString(),
    status: JOB_STATUSES.quoteRequested
  };
}

function createRequestId() {
  const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `REQ-${randomPart}`;
}

function updateQuote() {
  const input = getFormInput();
  const estimate = calculateEstimate(input);
  const request = createRequest(input, estimate);

  renderEstimate(estimate, input.deadlineType);
  renderBreakdown(estimate);
  renderDebug(request);
  currentRequest = request;

  // UCF Prints is currently founder-operated.
  window.currentUcfPrintsRequest = request;
}

function renderEstimate(estimate, deadlineType) {
  estimatedPriceElement.textContent = formatCurrency(estimate.estimatedPrice);
  estimatedTurnaroundElement.textContent = estimateTurnaround(deadlineType);
}

function renderBreakdown(estimate) {
  materialBreakdownElement.textContent = `${formatCurrency(estimate.materialCost)} @ ${formatRate(estimate.materialRate)}/g`;
  timeBreakdownElement.textContent = `${formatCurrency(estimate.timeCost)} @ $1.50/hr`;
  deadlineBreakdownElement.textContent = `${estimate.deadlineMultiplier.toFixed(2)}x`;
  handlingBreakdownElement.textContent = `+${formatCurrency(estimate.handlingFee)}`;
}

function renderDebug(request) {
  if (!debugEnabled) {
    return;
  }

  debugOutputElement.textContent = JSON.stringify({
    request
  }, null, 2);

  console.info("UCF Prints quote request", request);
}

function formatCurrency(value) {
  return `$${Number(value).toFixed(2)}`;
}

function formatRate(value) {
  return `$${Number(value).toFixed(2)}`;
}

async function copyQuoteSummary() {
  if (!currentRequest) {
    return;
  }

  const summary = buildQuoteSummary(currentRequest);

  try {
    await navigator.clipboard.writeText(summary);
    quoteMessageElement.textContent = "Quote summary copied. Send this with your file or reference.";
  } catch (error) {
    quoteMessageElement.textContent = summary;
  }
}

function buildQuoteSummary(request) {
  return [
    "UCF Prints final quote request",
    "",
    `Request ID: ${request.requestId}`,
    `Estimated price: ${formatCurrency(request.estimatedPrice)}`,
    "Final confirmed prices round up to the nearest half dollar.",
    `Material and color: ${request.material}, ${request.color}`,
    `Printer filament estimate: ${request.estimatedWeightGrams}g`,
    `Printer time estimate: ${request.estimatedPrintHours} hours`,
    `Printer size limit: 220 x 220 x 250 mm max build volume`,
    `Deadline type: ${request.deadlineType}`,
    `Fulfillment preference: ${request.fulfillmentPreference}`,
    "Operator: UCF Prints",
    "Contact: si354631@ucf.edu",
    "",
    "Final price is confirmed after reviewing the file or reference."
  ].join("\n");
}

form.addEventListener("input", updateQuote);
form.addEventListener("change", updateQuote);
copyQuoteButton.addEventListener("click", copyQuoteSummary);
updateQuote();
