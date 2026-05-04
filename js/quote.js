import { calculateEstimate, estimateTurnaround } from "./pricing.js";
import { suppliers } from "./suppliers.js";
import { matchSuppliersToRequest } from "./matching.js";
import { createRequest } from "./requests.js";

const form = document.querySelector("#quoteForm");
const estimatedPriceElement = document.querySelector("#estimatedPrice");
const estimatedPriceRangeElement = document.querySelector("#estimatedPriceRange");
const estimatedTurnaroundElement = document.querySelector("#estimatedTurnaround");
const supplierCardsElement = document.querySelector("#supplierCards");
const requestSummaryElement = document.querySelector("#requestSummary");
const debugOutputElement = document.querySelector("#debugOutput");

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
  renderSupplierResult(matchResult);
  renderRequestSummary(request);
  renderDebug(matchResult, request);

  // Early UCF Prints is operator-controlled. Matching suggests the best fit,
  // but the founder can manually override assignment before a real job starts.
  window.currentUcfPrintsRequest = request;
}

function renderEstimate(estimate, deadlineType) {
  estimatedPriceElement.textContent = formatCurrency(estimate.estimatedPrice);
  estimatedPriceRangeElement.textContent = `${formatCurrency(estimate.estimatedPriceRange.lowEstimate)}-${formatCurrency(estimate.estimatedPriceRange.highEstimate)} estimated range`;
  estimatedTurnaroundElement.textContent = estimateTurnaround(deadlineType);
}

function renderSupplierResult(matchResult) {
  if (!matchResult.bestSupplier) {
    supplierCardsElement.innerHTML = `
      <div class="manual-review">
        No supplier matched every requirement yet. This request may need manual review, a different material, adjusted dimensions, or founder assignment.
      </div>
    `;
    return;
  }

  const cards = [matchResult.bestSupplier, ...matchResult.alternateSuppliers]
    .slice(0, 3)
    .map((supplier, index) => renderSupplierCard(supplier, matchResult.matchReasons[supplier.id] ?? [], index === 0))
    .join("");

  supplierCardsElement.innerHTML = cards;
}

function renderSupplierCard(supplier, reasons, isBest) {
  const title = isBest ? "Recommended supplier" : "Alternate best fit";
  const rating = supplier.rating ? `${supplier.rating.toFixed(1)} rating` : "New supplier";

  return `
    <article class="supplier-card ${isBest ? "best" : ""}">
      <div>
        <span class="note-label">${title}</span>
        <h3>${supplier.name}</h3>
      </div>
      <ul class="supplier-meta">
        <li>${supplier.locationLabel}</li>
        <li>${supplier.trustTier}</li>
        <li>${rating}</li>
        <li>${supplier.queueLoad} in queue</li>
      </ul>
      <ul class="reason-list">
        ${reasons.map((reason) => `<li>${reason}</li>`).join("")}
      </ul>
    </article>
  `;
}

function renderRequestSummary(request) {
  const items = {
    "Request ID": request.requestId,
    Status: request.status,
    Material: `${request.material}, ${request.color}`,
    Specs: `${request.estimatedWeightGrams}g, ${request.estimatedPrintHours}h`,
    Dimensions: `${request.estimatedDimensions.x} x ${request.estimatedDimensions.y} x ${request.estimatedDimensions.z} mm`,
    Deadline: request.deadlineType,
    Fulfillment: request.fulfillmentPreference,
    "Selected supplier": request.selectedSupplierId ?? "Manual review"
  };

  requestSummaryElement.innerHTML = Object.entries(items)
    .map(([label, value]) => `<dt>${label}</dt><dd>${value}</dd>`)
    .join("");
}

function renderDebug(matchResult, request) {
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

form.addEventListener("input", updateQuote);
form.addEventListener("change", updateQuote);
updateQuote();
