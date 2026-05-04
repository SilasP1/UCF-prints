import { suppliers } from "./suppliers.js";
import { matchSuppliersToRequest } from "./matching.js";

const supplierResultsElement = document.querySelector("#supplierResults");
const resultsSummaryElement = document.querySelector("#resultsSummary");
const copyQuoteButton = document.querySelector("#copyQuoteButton");
const copyMessageElement = document.querySelector("#copyMessage");
const developerPanel = document.querySelector("#developerPanel");
const debugOutputElement = document.querySelector("#debugOutput");
const debugEnabled = new URLSearchParams(window.location.search).has("debug");
const storedRequest = sessionStorage.getItem("ucfPrintsCurrentRequest");
const request = storedRequest ? JSON.parse(storedRequest) : null;
let matchResult = null;
let selectedSupplier = null;

if (developerPanel && debugEnabled) {
  developerPanel.hidden = false;
}

if (!request) {
  renderMissingRequest();
} else {
  matchResult = matchSuppliersToRequest(request, suppliers);
  selectedSupplier = matchResult.bestSupplier;
  renderSummary(request, matchResult);
  renderSupplierResults(request, matchResult);
  renderDebug(request, matchResult);
}

function renderMissingRequest() {
  supplierResultsElement.innerHTML = `
    <div class="manual-review">
      Start with the guided quote first so supplier matches can use your print specs.
      <a class="button button-primary" href="quote.html">Start quote</a>
    </div>
  `;
  copyQuoteButton.disabled = true;
}

function renderSummary(activeRequest, activeMatchResult) {
  const range = formatRange(activeRequest.estimatedPriceRange);
  const matchCount = [
    activeMatchResult.bestSupplier,
    ...activeMatchResult.alternateSuppliers
  ].filter(Boolean).length;

  resultsSummaryElement.textContent = `${range} rough quote. ${matchCount} supplier ${matchCount === 1 ? "match" : "matches"} found. Final price is confirmed after reviewing the file or reference.`;
}

function renderSupplierResults(activeRequest, activeMatchResult) {
  if (!activeMatchResult.bestSupplier) {
    supplierResultsElement.innerHTML = `
      <div class="manual-review">
        No supplier matched every requirement yet. This request may need manual review, a different material, adjusted dimensions, or founder assignment.
      </div>
    `;
    return;
  }

  const visibleSuppliers = [
    activeMatchResult.bestSupplier,
    ...activeMatchResult.alternateSuppliers
  ].slice(0, 3);

  supplierResultsElement.innerHTML = visibleSuppliers
    .map((supplier, index) => renderSupplierProfile(activeRequest, activeMatchResult, supplier, index === 0))
    .join("");

  supplierResultsElement.querySelectorAll(".supplier-profile").forEach((card) => {
    card.addEventListener("click", () => selectSupplier(card.dataset.supplierId));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectSupplier(card.dataset.supplierId);
      }
    });
  });
}

function renderSupplierProfile(activeRequest, activeMatchResult, supplier, isBest) {
  const reasons = getStrongestReasons(activeMatchResult.matchReasons[supplier.id] ?? []).slice(0, 3);
  const quoteRange = getSupplierQuoteRange(activeRequest, supplier, isBest);

  return `
    <article class="supplier-profile ${isBest ? "selected" : ""}" data-supplier-id="${supplier.id}" tabindex="0">
      <div class="supplier-profile-head">
        <div>
          <span class="note-label">${isBest ? "Recommended for this job" : "Backup option"}</span>
          <h2>${supplier.name}</h2>
        </div>
        <span class="selected-tag">${isBest ? "Selected supplier" : "Click to select"}</span>
      </div>
      <div class="supplier-quote">${formatRange(quoteRange)}</div>
      <p>${supplier.locationLabel}</p>
      <ul class="supplier-meta">
        <li>${getAvailabilityLabel(supplier)}</li>
        <li>${getQueueSummary(supplier)}</li>
        <li>${getCapabilitySummary(supplier)}</li>
      </ul>
      <details class="supplier-more">
        <summary>See more</summary>
        <div>
          <h3>Why this match</h3>
          <ul class="reason-list">
            ${reasons.map((reason) => `<li>${reason}</li>`).join("")}
          </ul>
          <p>${supplier.notes}</p>
        </div>
      </details>
    </article>
  `;
}

function selectSupplier(supplierId) {
  const nextSupplier = suppliers.find((supplier) => supplier.id === supplierId);

  if (!nextSupplier || !request) {
    return;
  }

  selectedSupplier = nextSupplier;
  request.selectedSupplierId = nextSupplier.id;
  sessionStorage.setItem("ucfPrintsCurrentRequest", JSON.stringify(request));

  supplierResultsElement.querySelectorAll(".supplier-profile").forEach((card) => {
    const selected = card.dataset.supplierId === supplierId;
    card.classList.toggle("selected", selected);
    const tag = card.querySelector(".selected-tag");
    tag.textContent = selected ? "Selected supplier" : "Click to select";
  });
}

function getSupplierQuoteRange(activeRequest, supplier, isBest) {
  const queueBuffer = supplier.queueLoad > 1 ? 1.05 : 1;
  const backupBuffer = isBest ? 1 : 1.03;

  return {
    lowEstimate: Math.round(activeRequest.estimatedPriceRange.lowEstimate * queueBuffer * backupBuffer),
    highEstimate: Math.round(activeRequest.estimatedPriceRange.highEstimate * queueBuffer * backupBuffer)
  };
}

function getStrongestReasons(reasons) {
  const priority = [
    "Founder supplier",
    "Low current queue",
    "Accepts rush jobs",
    "Fits requested build volume",
    "Good UCF location fit",
    "Flexible on color"
  ];

  return [...reasons].sort((a, b) => {
    const aIndex = priority.indexOf(a);
    const bIndex = priority.indexOf(b);
    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
  });
}

function getAvailabilityLabel(supplier) {
  if (supplier.trustTier === "founder") {
    return "Founder-operated";
  }

  if (supplier.trustTier === "approved" || supplier.trustTier === "tested") {
    return "Approved supplier";
  }

  if (supplier.trustTier === "trial" || supplier.trustTier === "probation") {
    return "Backup supplier";
  }

  return supplier.availableNow ? "Available now" : "Availability pending";
}

function getQueueSummary(supplier) {
  if (supplier.queueLoad === 0) {
    return "No current queue";
  }

  if (supplier.queueLoad === 1) {
    return "1 job in queue";
  }

  return `${supplier.queueLoad} jobs in queue`;
}

function getCapabilitySummary(supplier) {
  return `${supplier.materials.join(", ")} on ${supplier.printerTypes.join(", ")}`;
}

async function copyQuoteSummary() {
  if (!request) {
    return;
  }

  const summary = buildQuoteSummary(request, selectedSupplier);

  try {
    await navigator.clipboard.writeText(summary);
    copyMessageElement.textContent = "Quote summary copied. Send this with your file or reference.";
  } catch (error) {
    copyMessageElement.textContent = summary;
  }
}

function buildQuoteSummary(activeRequest, supplier) {
  return [
    "UCF Prints final quote request",
    "",
    `Request ID: ${activeRequest.requestId}`,
    `Estimated price range: ${formatRange(activeRequest.estimatedPriceRange)}`,
    `Material and color: ${activeRequest.material}, ${activeRequest.color}`,
    `Estimated weight: ${activeRequest.estimatedWeightGrams}g`,
    `Estimated print time: ${activeRequest.estimatedPrintHours} hours`,
    `Dimensions: ${activeRequest.estimatedDimensions.x} x ${activeRequest.estimatedDimensions.y} x ${activeRequest.estimatedDimensions.z} mm`,
    `Deadline type: ${activeRequest.deadlineType}`,
    `Fulfillment preference: ${activeRequest.fulfillmentPreference}`,
    `Recommended supplier: ${supplier?.name ?? "Manual review"}`,
    "",
    "Final price is confirmed after reviewing the file or reference."
  ].join("\n");
}

function renderDebug(activeRequest, activeMatchResult) {
  if (!debugEnabled) {
    return;
  }

  debugOutputElement.textContent = JSON.stringify({
    request: activeRequest,
    rejectedSuppliers: activeMatchResult.rejectedSuppliers
  }, null, 2);
}

function formatRange(range) {
  return `${formatCurrency(range.lowEstimate)}-${formatCurrency(range.highEstimate)}`;
}

function formatCurrency(value) {
  return `$${Number(value).toFixed(0)}`;
}

copyQuoteButton.addEventListener("click", copyQuoteSummary);
