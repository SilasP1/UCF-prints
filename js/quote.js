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
const outlookQuoteButton = document.querySelector("#outlookQuoteButton");
const gmailQuoteButton = document.querySelector("#gmailQuoteButton");
const requestQuoteButton = document.querySelector("#requestQuoteButton");
const quoteEmailOptions = document.querySelector("#quoteEmailOptions");
const quoteMessageElement = document.querySelector("#quoteMessage");
const fileReviewCopyButton = document.querySelector("#fileReviewCopyButton");
const fileReviewMessageElement = document.querySelector("#fileReviewMessage");
const developerPanel = document.querySelector("#developerPanel");
const debugOutputElement = document.querySelector("#debugOutput");
const debugEnabled = new URLSearchParams(window.location.search).has("debug");
const REQUEST_ID = `REQ-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
const QUOTE_SUBJECT = "Peer Printing quote request";
const FILE_REVIEW_SUBJECT = "Peer Printing file review";
let currentRequest = null;
let quoteBody = "";
let fileReviewBody = "";

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
    requestId: REQUEST_ID,
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
  const rangeElement = document.querySelector("#estimatedPriceRange");
  rangeElement.textContent = formatRange(estimate.estimatedPriceRange);
  rangeElement.classList.remove("estimate-empty");
  document.querySelector("#estimateStatus").textContent = "Ballpark estimate before file review.";
  document.querySelector("#estimatedTurnaround").textContent = estimateTurnaround(input.deadlineType);
  document.querySelector("#materialBreakdown").textContent = `${formatCurrency(estimate.materialCost)} @ ${formatCurrency(estimate.materialRate)}/g`;
  document.querySelector("#timeBreakdown").textContent = `${formatCurrency(estimate.timeCost)} @ $1.50/hr`;
  document.querySelector("#deadlineBreakdown").textContent = `${estimate.deadlineMultiplier.toFixed(2)}×`;
  document.querySelector("#handlingBreakdown").textContent = `+${formatCurrency(estimate.handlingFee)}`;
  document.querySelector("#estimateDetails").hidden = false;
}

function updateQuote() {
  const input = getFormInput();
  const hasValidEstimate = input.estimatedWeightGrams > 0 && input.estimatedPrintHours >= 0.5;

  if (!hasValidEstimate) {
    currentRequest = null;
    renderEmptyEstimate();
    setQuoteRequestReady(false);
    return;
  }

  const estimate = calculateEstimate(input);
  currentRequest = createRequest(input, estimate);
  renderEstimate(estimate, input);
  configureQuoteLinks(buildQuoteSummary(currentRequest));
  setQuoteRequestReady(true);
  if (debugEnabled) debugOutputElement.textContent = JSON.stringify({ input, estimate, request: currentRequest }, null, 2);
  window.currentPeerPrintingRequest = currentRequest;
  try { sessionStorage.setItem("peerPrintingCurrentRequest", JSON.stringify(currentRequest)); } catch (error) { console.warn("Unable to save quote request", error); }
}

function renderEmptyEstimate() {
  const rangeElement = document.querySelector("#estimatedPriceRange");
  rangeElement.textContent = "Enter details";
  rangeElement.classList.add("estimate-empty");
  document.querySelector("#estimateStatus").textContent = "Add the filament weight and print time to calculate an estimate.";
  document.querySelector("#estimatedTurnaround").textContent = "";
  document.querySelector("#estimateDetails").hidden = true;
}

function buildEmailParams(values) {
  return new URLSearchParams(values).toString().replace(/\+/g, "%20");
}

function buildOutlookUrl(recipient, subject, body) {
  return `https://outlook.live.com/mail/0/deeplink/compose?${buildEmailParams({ to: recipient, subject, body })}`;
}

function buildGmailUrl(recipient, subject, body) {
  return `https://mail.google.com/mail/?${buildEmailParams({ view: "cm", fs: "1", to: recipient, su: subject, body })}`;
}

function buildCopyInfo(subject, body) {
  return [`To: ${OPERATOR.email}`, `Subject: ${subject}`, "", body].join("\n");
}

function configureQuoteLinks(body) {
  quoteBody = body;
  outlookQuoteButton.href = buildOutlookUrl(OPERATOR.email, QUOTE_SUBJECT, body);
  gmailQuoteButton.href = buildGmailUrl(OPERATOR.email, QUOTE_SUBJECT, body);
}

function setQuoteRequestReady(ready) {
  requestQuoteButton.disabled = !ready;
  requestQuoteButton.textContent = ready ? "Request this print" : "Enter weight and time to continue";
  if (!ready) {
    quoteEmailOptions.hidden = true;
    requestQuoteButton.setAttribute("aria-expanded", "false");
  }
}

function showQuoteEmailOptions() {
  if (!currentRequest) return;
  quoteEmailOptions.hidden = false;
  requestQuoteButton.setAttribute("aria-expanded", "true");
  quoteEmailOptions.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function configureFileReviewLinks() {
  const body = [
    "Hi,", "", "I'd like a 3D printing quote.", "",
    "Deadline:",
    "Material/color preference:",
    "Approximate size:", "",
    "STL/3MF below:"
  ].join("\n");
  fileReviewBody = body;
  document.querySelector("#fileReviewOutlookButton").href = buildOutlookUrl(OPERATOR.email, FILE_REVIEW_SUBJECT, body);
  document.querySelector("#fileReviewGmailButton").href = buildGmailUrl(OPERATOR.email, FILE_REVIEW_SUBJECT, body);
}

async function copyQuoteSummary() {
  await copyText(buildCopyInfo(QUOTE_SUBJECT, quoteBody), quoteMessageElement, "Email info copied.");
}

async function copyFileReviewSummary() {
  await copyText(buildCopyInfo(FILE_REVIEW_SUBJECT, fileReviewBody), fileReviewMessageElement, "Email info copied.");
}

async function copyText(text, statusElement, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    statusElement.textContent = successMessage;
  } catch (error) {
    statusElement.textContent = text;
  }
}

function setMode(mode, shouldScroll = true) {
  const showFile = mode === "file";
  const showEstimate = mode === "estimate";
  document.querySelector("#quoteChoices").hidden = showFile || showEstimate;
  document.querySelector("#estimateMode").hidden = !showEstimate;
  document.querySelector("#file-only").hidden = !showFile;

  if (showEstimate) {
    document.querySelector("#estimatedWeightGrams").focus({ preventScroll: true });
    if (shouldScroll) document.querySelector("#estimateMode").scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (showFile) {
    if (shouldScroll) document.querySelector("#file-only").scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    if (shouldScroll) document.querySelector("#quoteChoices").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

document.querySelectorAll("[data-mode]").forEach(button => button.addEventListener("click", () => setMode(button.dataset.mode)));
document.querySelectorAll("[data-change-mode]").forEach(button => button.addEventListener("click", () => setMode("choice")));
form.addEventListener("input", updateQuote);
form.addEventListener("change", updateQuote);
copyQuoteButton.addEventListener("click", copyQuoteSummary);
fileReviewCopyButton.addEventListener("click", copyFileReviewSummary);
requestQuoteButton.addEventListener("click", showQuoteEmailOptions);
updateQuote();
configureFileReviewLinks();

if (window.location.hash === "#file-only") setMode("file");
else if (window.location.hash === "#estimate") setMode("estimate");
else setMode("choice", false);
