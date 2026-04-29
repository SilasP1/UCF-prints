const DAILY_CAPACITY_HOURS = 12;
const WARNING_THRESHOLD = 85;
const BASE_SETUP_FEE = 5;
const MACHINE_TIME_COST_PER_HOUR = 1.5;
const MINIMUM_ESTIMATED_ORDER = 12;
const SPECIAL_MATERIAL_HANDLING_FEE = 5;
const materialRates = {
  PLA: 0.10,
  PETG: 0.13,
  TPU: 0.16,
  ABS: 0.14,
  Other: 0.18
};

const sampleOrders = [
  { day: "Mon", file: "gearbox_mount_v3.stl", hours: 3.5, tier: "Standard", status: "Pending" },
  { day: "Tue", file: "wind_tunnel_fixture.stl", hours: 5, tier: "Priority", status: "Approved" },
  { day: "Wed", file: "robot_arm_bracket.stl", hours: 4.5, tier: "Rush", status: "Printing" },
  { day: "Thu", file: "drone_frame_plate.stl", hours: 2.5, tier: "Standard", status: "Ready" },
  { day: "Fri", file: "capstone_housing_revB.stl", hours: 10, tier: "Priority", status: "Approved" },
  { day: "Fri", file: "sensor_mount_array.stl", hours: 6, tier: "Rush", status: "Pending" },
  { day: "Sat", file: "lab_demo_handle.stl", hours: 8.5, tier: "Standard", status: "Approved" },
  { day: "Sun", file: "presentation_mockup.stl", hours: 11, tier: "Priority", status: "Printing" }
];

function formatHours(hours) {
  return `${Number(hours).toFixed(hours % 1 === 0 ? 0 : 1)}h`;
}

function formatCurrency(value) {
  return `$${value.toFixed(2)}`;
}

function setSliderProgress(slider) {
  const min = Number(slider.min || 0);
  const max = Number(slider.max || 100);
  const value = Number(slider.value);
  const progress = ((value - min) / (max - min)) * 100;
  slider.style.setProperty("--slider-progress", `${progress}%`);
}

function getBookedHoursByDay(orders) {
  return orders.reduce((totals, order) => {
    totals[order.day] = (totals[order.day] || 0) + order.hours;
    return totals;
  }, {});
}

function updateCapacitySummary() {
  const weeklyBookedTarget = document.querySelector("#weeklyBookedHours");
  const weeklyRemainingTarget = document.querySelector("#weeklyRemainingHours");
  const weeklyAlertDaysTarget = document.querySelector("#weeklyAlertDays");

  if (!weeklyBookedTarget || !weeklyRemainingTarget || !weeklyAlertDaysTarget) {
    return;
  }

  const bookedByDay = getBookedHoursByDay(sampleOrders);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeklyCapacity = DAILY_CAPACITY_HOURS * days.length;

  const weeklyBooked = days.reduce((total, day) => total + (bookedByDay[day] || 0), 0);
  const weeklyRemaining = Math.max(weeklyCapacity - weeklyBooked, 0);
  const weeklyAlertDays = days.filter((day) => ((bookedByDay[day] || 0) / DAILY_CAPACITY_HOURS) * 100 >= WARNING_THRESHOLD).length;

  weeklyBookedTarget.textContent = formatHours(weeklyBooked);
  weeklyRemainingTarget.textContent = formatHours(weeklyRemaining);
  weeklyAlertDaysTarget.textContent = `${weeklyAlertDays}`;
}

function updateQuotePage() {
  const detailsCard = document.querySelector("#quoteDetailsCard");
  if (!detailsCard) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const material = params.get("material");
  const color = params.get("color");
  const filament = params.get("filament");
  const time = params.get("time");
  const lead = params.get("lead");
  const estimate = params.get("estimate");
  const hasDetails = material || color || filament || time || lead || estimate;

  const statusBadge = document.querySelector("#quoteDetailsStatus");
  const messageTarget = document.querySelector("#quoteDetailsMessage");
  const emailButton = document.querySelector("#quoteEmailButton");

  document.querySelector("#quoteMaterial").textContent = material || "Not provided";
  document.querySelector("#quoteColor").textContent = color || "Not provided";
  document.querySelector("#quoteFilament").textContent = filament || "Not provided";
  document.querySelector("#quoteTime").textContent = time || "Not provided";
  document.querySelector("#quoteLead").textContent = lead || "Not provided";
  document.querySelector("#quoteEstimate").textContent = estimate || "Not provided";

  statusBadge.classList.remove("inventory-in-stock", "inventory-special");

  if (!hasDetails) {
    statusBadge.textContent = "Waiting for details";
    statusBadge.classList.add("inventory-special");
    messageTarget.textContent = "Use the pricing calculator first if you want to send estimate details along with your quote request.";
    return;
  }

  statusBadge.textContent = "Estimate attached";
  statusBadge.classList.add("inventory-in-stock");
  messageTarget.textContent = "These values came from the calculator. Final pricing still depends on file review, material availability, and print risk.";

  if (emailButton) {
    const emailBody = [
      "UCF Prints quote request",
      "",
      `Material: ${material || "Not provided"}`,
      `Color: ${color || "Not provided"}`,
      `Filament amount: ${filament || "Not provided"}`,
      `Print time: ${time || "Not provided"}`,
      `Lead time: ${lead || "Not provided"}`,
      `Estimated total: ${estimate || "Not provided"}`,
      "",
      "I understand this estimate may change after file review."
    ].join("\n");

    emailButton.href = `mailto:si354631@ucf.edu?subject=${encodeURIComponent("Request a Print Quote")}&body=${encodeURIComponent(emailBody)}`;
  }
}

function updateCapacityCards() {
  const cards = document.querySelectorAll(".capacity-card");

  if (!cards.length) {
    return;
  }

  const bookedHoursByDay = getBookedHoursByDay(sampleOrders);

  cards.forEach((card) => {
    const day = card.dataset.day;
    const bookedHours = bookedHoursByDay[day] || 0;
    const remainingHours = DAILY_CAPACITY_HOURS - bookedHours;
    const rawPercent = (bookedHours / DAILY_CAPACITY_HOURS) * 100;
    const displayPercent = Math.round(rawPercent);
    const fillPercent = Math.min(rawPercent, 100);

    const bookedTarget = card.querySelector("[data-booked]");
    const remainingTarget = card.querySelector("[data-remaining]");
    const percentTarget = card.querySelector("[data-percent]");
    const stateTarget = card.querySelector(".day-state");
    const messageTarget = card.querySelector("[data-message]");
    const progressFill = card.querySelector(".progress-fill");

    bookedTarget.textContent = formatHours(bookedHours);
    remainingTarget.textContent = remainingHours > 0 ? formatHours(remainingHours) : "0h";
    percentTarget.textContent = `${displayPercent}%`;
    progressFill.style.width = `${fillPercent}%`;

    card.classList.remove("near-capacity", "over-capacity");
    stateTarget.classList.remove("warning", "over");

    if (rawPercent > 100) {
      card.classList.add("over-capacity");
      stateTarget.classList.add("over");
      stateTarget.textContent = "Over capacity";
      messageTarget.textContent = "Over capacity - manual approval required";
      return;
    }

    if (rawPercent >= WARNING_THRESHOLD) {
      card.classList.add("near-capacity");
      stateTarget.classList.add("warning");
      stateTarget.textContent = "Near capacity";
      messageTarget.textContent = "High load - priority and rush review recommended.";
      return;
    }

    stateTarget.textContent = "Open capacity";
    messageTarget.textContent = "Capacity available for standard scheduling.";
  });
}

function updatePricingEstimate() {
  const filamentRange = document.querySelector("#filamentSlider");
  const timeRange = document.querySelector("#timeSlider");
  const leadTimeSelect = document.querySelector("#leadTimeSelect");
  const filamentTypeSelect = document.querySelector("#filamentTypeSelect");
  const filamentColorSelect = document.querySelector("#filamentColorSelect");

  if (!filamentRange || !timeRange || !leadTimeSelect || !filamentTypeSelect || !filamentColorSelect) {
    return;
  }

  const filamentValue = Number(filamentRange.value);
  const timeValue = Number(timeRange.value);
  const isImmediate = leadTimeSelect.value === "custom";
  const multiplierValue = isImmediate ? null : Number(leadTimeSelect.value);
  const leadTimeText = leadTimeSelect.options[leadTimeSelect.selectedIndex].text;
  const filamentType = filamentTypeSelect.value;
  const filamentColor = filamentColorSelect.value;
  const materialRate = materialRates[filamentType] ?? materialRates.Other;
  const inStock = filamentType === "PLA" && filamentColor === "Black";
  const isSpecialRequest = !inStock;
  const specialMaterialFee = isSpecialRequest ? SPECIAL_MATERIAL_HANDLING_FEE : 0;

  const filamentCost = filamentValue * materialRate;
  const timeCost = timeValue * MACHINE_TIME_COST_PER_HOUR;
  const subtotal = BASE_SETUP_FEE + filamentCost + timeCost + specialMaterialFee;
  const rawEstimate = isImmediate ? null : subtotal * multiplierValue;
  const estimateTotal = isImmediate ? null : Math.max(rawEstimate, MINIMUM_ESTIMATED_ORDER);

  setSliderProgress(filamentRange);
  setSliderProgress(timeRange);

  document.querySelector("#filamentValue").textContent = `${filamentValue}`;
  document.querySelector("#timeValue").textContent = `${timeValue}`;
  document.querySelector("#materialRate").textContent = `${formatCurrency(materialRate)}/g`;
  document.querySelector("#materialRatePreview").textContent = `${formatCurrency(materialRate)}/g`;
  document.querySelector("#setupCost").textContent = formatCurrency(BASE_SETUP_FEE);
  document.querySelector("#filamentCost").textContent = formatCurrency(filamentCost);
  document.querySelector("#machineCost").textContent = formatCurrency(timeCost);
  document.querySelector("#specialMaterialFee").textContent = formatCurrency(specialMaterialFee);
  document.querySelector("#leadMultiplier").textContent = isImmediate ? "Custom" : `${multiplierValue.toFixed(2)}x`;
  document.querySelector("#estimatedTotal").textContent = isImmediate ? "Custom quote" : formatCurrency(estimateTotal);

  const materialTypeNote = document.querySelector("#materialTypeNote");
  if (filamentType === "PLA") {
    materialTypeNote.textContent = "PLA is the most student-friendly option and is priced for standard quoting.";
  } else if (filamentType === "PETG") {
    materialTypeNote.textContent = "PETG is stronger than PLA but usually costs more and may need extra print tuning.";
  } else if (filamentType === "TPU") {
    materialTypeNote.textContent = "TPU is flexible and often requires slower speeds and more careful review.";
  } else if (filamentType === "ABS") {
    materialTypeNote.textContent = "ABS can need extra review because of warping, ventilation, and print-risk concerns.";
  } else {
    materialTypeNote.textContent = "Custom materials are placeholder-priced here and always require manual approval.";
  }

  const specialFeeRow = document.querySelector("#specialMaterialFeeRow");
  specialFeeRow.classList.toggle("is-hidden", !isSpecialRequest);

  const inventoryBadge = document.querySelector("#inventoryBadge");
  const inventoryMessage = document.querySelector("#inventoryMessage");
  const turnaroundNote = document.querySelector("#turnaroundNote");

  inventoryBadge.classList.remove("inventory-in-stock", "inventory-special");

  if (inStock) {
    inventoryBadge.textContent = "In stock";
    inventoryBadge.classList.add("inventory-in-stock");
    inventoryMessage.textContent = "Black PLA is currently available for standard quoting.";
    turnaroundNote.textContent = "Standard stocked materials support the fastest quoting and scheduling.";
  } else {
    inventoryBadge.textContent = "Special request";
    inventoryBadge.classList.add("inventory-special");
    inventoryMessage.textContent = "This material or color is not currently stocked. Final quote may change based on ordering time, material cost, and availability.";
    turnaroundNote.textContent = "Turnaround may be longer for materials or colors not currently stocked.";
  }

  const warningElement = document.querySelector("#pricingWarning");
  warningElement.classList.remove("warning", "danger");

  const isLongPrint = timeValue > 10;
  const isOverTwelveHours = timeValue > 12;
  const isRush = leadTimeText.startsWith("Rush");
  const isLargePart = filamentValue > 300;
  const isPETG = filamentType === "PETG";
  const isTPU = filamentType === "TPU";
  const isABS = filamentType === "ABS";
  const isOtherMaterial = filamentType === "Other";

  if (isImmediate) {
    warningElement.textContent = isOverTwelveHours ? "Long urgent prints require custom pricing." : "Immediate jobs require a custom quote.";
    warningElement.classList.add("danger");
  } else if (isRush && isOverTwelveHours) {
    warningElement.textContent = "Rush long prints require custom pricing.";
    warningElement.classList.add("danger");
  } else if (isOverTwelveHours) {
    warningElement.textContent = "Over 12 hours - special quote required.";
    warningElement.classList.add("danger");
  } else if (isOtherMaterial) {
    warningElement.textContent = "Custom materials require manual approval before quoting.";
    warningElement.classList.add("warning");
  } else if (isTPU) {
    warningElement.textContent = "TPU is flexible and may require slower print speeds or custom review.";
    warningElement.classList.add("warning");
  } else if (isABS) {
    warningElement.textContent = "ABS may require custom review due to warping, ventilation, and print-risk concerns.";
    warningElement.classList.add("warning");
  } else if (isPETG) {
    warningElement.textContent = "PETG may cost more due to material price and print tuning.";
    warningElement.classList.add("warning");
  } else if (isLargePart && isLongPrint) {
    warningElement.textContent = "Large, long print - custom quote likely.";
    warningElement.classList.add("warning");
  } else if (isSpecialRequest) {
    warningElement.textContent = "Special material/color request - quote may change based on ordering time, material cost, and availability.";
    warningElement.classList.add("warning");
  } else if (isRush) {
    warningElement.textContent = "Rush jobs require manual approval and may cost more depending on queue availability.";
    warningElement.classList.add("warning");
  } else if (isLargePart) {
    warningElement.textContent = "Large part - final pricing may vary after file review.";
    warningElement.classList.add("warning");
  } else if (isLongPrint) {
    warningElement.textContent = "Long print - higher failure risk and queue impact.";
    warningElement.classList.add("warning");
  } else {
    warningElement.textContent = "Standard scheduling estimate based on current assumptions.";
  }

  const quoteButton = document.querySelector("#calculatorQuoteButton");
  if (quoteButton) {
    const params = new URLSearchParams({
      material: filamentType,
      color: filamentColor,
      filament: `${filamentValue}g`,
      time: `${timeValue} hours`,
      lead: leadTimeText,
      estimate: isImmediate ? "Custom quote" : formatCurrency(estimateTotal)
    });

    quoteButton.href = `quote.html?${params.toString()}`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateCapacityCards();
  updateCapacitySummary();
  updatePricingEstimate();
  updateQuotePage();

  const estimateInputs = document.querySelectorAll("#filamentSlider, #timeSlider, #leadTimeSelect, #filamentTypeSelect, #filamentColorSelect");
  estimateInputs.forEach((input) => {
    input.addEventListener("input", updatePricingEstimate);
    input.addEventListener("change", updatePricingEstimate);
  });
});
