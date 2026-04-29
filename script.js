const DAILY_CAPACITY_HOURS = 12;
const WARNING_THRESHOLD = 85;
const BASE_SETUP_FEE = 5;
const FILAMENT_COST_PER_GRAM = 0.12;
const MACHINE_TIME_COST_PER_HOUR = 2;

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

function getBookedHoursByDay(orders) {
  return orders.reduce((totals, order) => {
    totals[order.day] = (totals[order.day] || 0) + order.hours;
    return totals;
  }, {});
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
  const filamentRange = document.querySelector("#filament-range");
  const timeRange = document.querySelector("#time-range");
  const leadTimeSelect = document.querySelector("#lead-time");

  if (!filamentRange || !timeRange || !leadTimeSelect) {
    return;
  }

  const filamentValue = Number(filamentRange.value);
  const timeValue = Number(timeRange.value);
  const multiplierValue = Number(leadTimeSelect.value);
  const leadTimeText = leadTimeSelect.options[leadTimeSelect.selectedIndex].text;

  const filamentCost = filamentValue * FILAMENT_COST_PER_GRAM;
  const timeCost = timeValue * MACHINE_TIME_COST_PER_HOUR;
  const subtotal = BASE_SETUP_FEE + filamentCost + timeCost;
  const estimateTotal = subtotal * multiplierValue;

  document.querySelector("#filament-value").textContent = `${filamentValue}`;
  document.querySelector("#time-value").textContent = `${timeValue}`;
  document.querySelector("#lead-time-label").textContent = leadTimeText.split(":")[0];
  document.querySelector("#setup-fee").textContent = formatCurrency(BASE_SETUP_FEE);
  document.querySelector("#filament-cost").textContent = formatCurrency(filamentCost);
  document.querySelector("#time-cost").textContent = formatCurrency(timeCost);
  document.querySelector("#lead-multiplier").textContent = `${multiplierValue.toFixed(2)}x`;
  document.querySelector("#estimate-price").textContent = formatCurrency(estimateTotal);

  const warningElement = document.querySelector("#estimate-warning");
  warningElement.classList.remove("warning", "danger");

  const isLongPrint = timeValue > 12;
  const isRush = leadTimeText.startsWith("Rush");

  if (isRush && isLongPrint) {
    warningElement.textContent = "Rush long prints require custom pricing.";
    warningElement.classList.add("danger");
  } else if (isRush) {
    warningElement.textContent = "Rush jobs require manual approval and may cost more depending on queue availability.";
    warningElement.classList.add("warning");
  } else if (isLongPrint) {
    warningElement.textContent = "Long print - special quote required.";
    warningElement.classList.add("warning");
  } else {
    warningElement.textContent = "Standard scheduling estimate based on current assumptions.";
  }

  const cta = document.querySelector("#estimate-cta");
  const bodyLines = [
    "Estimated print details:",
    `Filament: ${filamentValue}g`,
    `Print time: ${timeValue} hours`,
    `Lead time: ${leadTimeText}`,
    `Estimated price: ${formatCurrency(estimateTotal)}`
  ];

  cta.href = `mailto:ucfprints@example.com?subject=${encodeURIComponent("Request Quote With These Details")}&body=${encodeURIComponent(bodyLines.join("\n"))}`;
}

document.addEventListener("DOMContentLoaded", () => {
  updateCapacityCards();
  updatePricingEstimate();

  const estimateInputs = document.querySelectorAll("#filament-range, #time-range, #lead-time");
  estimateInputs.forEach((input) => {
    input.addEventListener("input", updatePricingEstimate);
    input.addEventListener("change", updatePricingEstimate);
  });
});

