const PRINTER_BUILD_VOLUME = { x: 220, y: 220, z: 250 };
const OPERATOR = { name: "Peer Printing", email: "silaspowersw2@gmail.com" };
const pricingDefaults = {
  materialRates: { PLA: 0.10, PETG: 0.13, TPU: 0.16, ABS: 0.14 },
  timeRate: 1.5,
  marginMultiplier: 1.3,
  handlingFee: 5,
  minimumPrice: 12,
  deadlineMultipliers: { economy: 0.9, standard: 1, priority: 1.35, rush: 1.75 }
};

const form = document.querySelector("#quoteForm");
const copyQuoteButton = document.querySelector("#copyQuoteButton");
const emailQuoteButton = document.querySelector("#emailQuoteButton");
const gmailQuoteButton = document.querySelector("#gmailQuoteButton");
const quoteMessageElement = document.querySelector("#quoteMessage");
const developerPanel = document.querySelector("#developerPanel");
const debugOutputElement = document.querySelector("#debugOutput");
const debugEnabled = new URLSearchParams(window.location.search).has("debug");
let currentRequest = null;

if (developerPanel && debugEnabled) developerPanel.hidden = false;

function getValue(id) { return document.querySelector(`#${id}`).value; }

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

function calculateEstimate({ material, estimatedWeightGrams, estimatedPrintHours, deadlineType }) {
  const grams = Math.max(Number(estimatedWeightGrams) || 0, 0);
  const printHours = Math.max(Number(estimatedPrintHours) || 0, 0);
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
    estimatedPriceRange: {
      lowEstimate: roundUpToHalfDollar(estimatedPrice * 0.9),
      highEstimate: roundUpToHalfDollar(estimatedPrice * 1.2)
    },
    materialRate, materialCost, timeCost, deadlineMultiplier,
    handlingFee: pricingDefaults.handlingFee
  };
}

function roundUpToHalfDollar(value) { return Math.ceil(Number(value) * 2) / 2; }
function formatCurrency(value) { return `$${Number(value).toFixed(2)}`; }
function formatRange(range) { return `${formatCurrency(range.lowEstimate)}–${formatCurrency(range.highEstimate)}`; }

function estimateTurnaround(deadlineType) {
  return ({
    economy: "Economy turnaround: usually 7–10 days after review.",
    standard: "Standard turnaround: usually 3–5 days after review.",
    priority: "Priority turnaround: usually 1–2 days after review.",
    rush: "Rush turnaround: as soon as capacity allows after review."
  })[deadlineType] || "Standard turnaround: usually 3–5 days after review.";
}

function createRequest(input, estimate) {
  return {
    requestId: `REQ-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    ...input,
    estimatedPrice: estimate.estimatedPrice,
    estimatedPriceRange: estimate.estimatedPriceRange,
    operator: OPERATOR,
    createdAt: new Date().toISOString(),
    status: "quote_requested"
  };
}

function buildQuoteSummary(request) {
  return [
    "Peer Printing quote request", "",
    `Request ID: ${request.requestId}`,
    `Estimated range: ${formatRange(request.estimatedPriceRange)}`,
    `Calculated midpoint: ${formatCurrency(request.estimatedPrice)}`,
    `Material and color: ${request.material}, ${request.color}`,
    "Slicer printer profile: Creality K1C",
    `K1C filament estimate: ${request.estimatedWeightGrams}g`,
    `K1C print-time estimate: ${request.estimatedPrintHours} hours`,
    `Deadline: ${request.deadlineType}`,
    `Fulfillment: ${request.fulfillmentPreference}`, "",
    "STL/3MF below:"
  ].join("\n");
}

function renderEstimate(estimate, input) {
  document.querySelector("#estimatedPriceRange").textContent = formatRange(estimate.estimatedPriceRange);
  document.querySelector("#estimatedPrice").textContent = formatCurrency(estimate.estimatedPrice);
  document.querySelector("#estimatedTurnaround").textContent = estimateTurnaround(input.deadlineType);
  document.querySelector("#materialBreakdown").textContent = `${formatCurrency(estimate.materialCost)} @ ${formatCurrency(estimate.materialRate)}/g`;
  document.querySelector("#timeBreakdown").textContent = `${formatCurrency(estimate.timeCost)} @ $1.50/hr`;
  document.querySelector("#deadlineBreakdown").textContent = `${estimate.deadlineMultiplier.toFixed(2)}×`;
  document.querySelector("#handlingBreakdown").textContent = `+${formatCurrency(estimate.handlingFee)}`;
}

function updateQuote() {
  const input = getFormInput();
  const estimate = calculateEstimate(input);
  currentRequest = createRequest(input, estimate);
  renderEstimate(estimate, input);
  const summary = buildQuoteSummary(currentRequest);
  const subject = "Peer Printing quote request";
  emailQuoteButton.href = buildMailtoUrl(OPERATOR.email, subject, summary);
  gmailQuoteButton.href = buildGmailUrl(OPERATOR.email, subject, summary);
  if (debugEnabled) debugOutputElement.textContent = JSON.stringify({ input, estimate, request: currentRequest }, null, 2);
  window.currentPeerPrintingRequest = currentRequest;
  try { sessionStorage.setItem("peerPrintingCurrentRequest", JSON.stringify(currentRequest)); } catch (error) { console.warn("Unable to save quote request", error); }
}

function buildMailtoUrl(recipient, subject, body) {
  return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function buildGmailUrl(recipient, subject, body) {
  const params = new URLSearchParams({ view: "cm", fs: "1", to: recipient, su: subject, body });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

function configureFileReviewLinks() {
  const subject = "Peer Printing file review";
  const body = [
    "Hi,", "", "I'd like a 3D printing quote.", "",
    "Deadline:",
    "Material/color preference:",
    "Approximate size:", "",
    "STL/3MF below:"
  ].join("\n");
  document.querySelector("#fileReviewEmailButton").href = buildMailtoUrl(OPERATOR.email, subject, body);
  document.querySelector("#fileReviewGmailButton").href = buildGmailUrl(OPERATOR.email, subject, body);
}

async function copyQuoteSummary() {
  if (!currentRequest) return;
  const summary = buildQuoteSummary(currentRequest);
  try {
    await navigator.clipboard.writeText(summary);
    quoteMessageElement.textContent = "Quote summary copied. Attach your model when you send it.";
  } catch (error) {
    quoteMessageElement.textContent = summary;
  }
}

function setMode(mode) {
  const showFile = mode === "file";
  document.querySelector("#estimateMode").hidden = showFile;
  document.querySelector("#file-only").hidden = !showFile;
  document.querySelectorAll("[data-mode]").forEach(button => {
    const active = button.dataset.mode === mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  if (showFile) document.querySelector("#file-only").scrollIntoView({ behavior: "smooth", block: "start" });
}

document.querySelectorAll("[data-mode]").forEach(button => button.addEventListener("click", () => setMode(button.dataset.mode)));
form.addEventListener("input", updateQuote);
form.addEventListener("change", updateQuote);
copyQuoteButton.addEventListener("click", copyQuoteSummary);
updateQuote();
configureFileReviewLinks();

if (window.location.hash === "#file-only") setMode("file");
