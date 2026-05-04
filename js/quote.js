import { calculateEstimate, estimateTurnaround } from "./pricing.js";
import { suppliers } from "./suppliers.js";
import { matchSuppliersToRequest } from "./matching.js";
import { createRequest } from "./requests.js";

const form = document.querySelector("#quoteForm");
const estimatedPriceElement = document.querySelector("#estimatedPrice");
const estimatedPriceRangeElement = document.querySelector("#estimatedPriceRange");
const estimatedTurnaroundElement = document.querySelector("#estimatedTurnaround");
const searchSuppliersButton = document.querySelector("#searchSuppliersButton");
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
    estimatedDimensions: {
      x: Number(getValue("dimensionX")),
      y: Number(getValue("dimensionY")),
      z: Number(getValue("dimensionZ"))
    },
    deadlineType: getValue("deadlineType"),
    fulfillmentPreference: getValue("fulfillmentPreference"),
    roughComplexity: getValue("roughComplexity"),
    fileAttached: document.querySelector("#fileAttached").checked
  };
}

function getValue(id) {
  return document.querySelector(`#${id}`).value;
}

function updateQuote() {
  const input = getFormInput();
  const estimate = calculateEstimate(input);
  const matchingInput = {
    ...input,
    estimatedPrice: estimate.estimatedPrice,
    estimatedPriceRange: estimate.estimatedPriceRange
  };
  const matchResult = matchSuppliersToRequest(matchingInput, suppliers);
  const request = createRequest(input, estimate, matchResult);

  renderEstimate(estimate, input.deadlineType);
  renderDebug(matchResult, request);
  currentRequest = request;

  // Early UCF Prints is operator-controlled. Matching suggests the best fit,
  // but the founder can manually override assignment before a real job starts.
  window.currentUcfPrintsRequest = request;
}

function renderEstimate(estimate, deadlineType) {
  estimatedPriceElement.textContent = formatCurrency(estimate.estimatedPrice);
  estimatedPriceRangeElement.textContent = `${formatCurrency(estimate.estimatedPriceRange.lowEstimate)}-${formatCurrency(estimate.estimatedPriceRange.highEstimate)} estimated range`;
  estimatedTurnaroundElement.textContent = estimateTurnaround(deadlineType);
}

function renderDebug(matchResult, request) {
  if (!debugEnabled) {
    return;
  }

  debugOutputElement.textContent = JSON.stringify({
    request,
    rejectedSuppliers: matchResult.rejectedSuppliers
  }, null, 2);

  console.info("UCF Prints quote request", request);
  console.info("UCF Prints supplier matching", matchResult);
}

function formatCurrency(value) {
  return `$${Number(value).toFixed(0)}`;
}

function searchSuppliers() {
  if (!currentRequest) {
    return;
  }

  sessionStorage.setItem("ucfPrintsCurrentRequest", JSON.stringify(currentRequest));
  quoteMessageElement.textContent = "Searching for best-fit suppliers...";
  window.location.href = "suppliers.html";
}

form.addEventListener("input", updateQuote);
form.addEventListener("change", updateQuote);
searchSuppliersButton.addEventListener("click", searchSuppliers);
updateQuote();
