/*
  ==========================================
  EDIT AVAILABILITY HERE
  ==========================================
  - Update the `slots` number any time capacity changes.
  - Update `status` using: "Open", "Limited", or "Full".
  - You can also edit labels and turnaround text if needed.
*/
const availabilityTiers = [
  {
    tier: "Rush",
    turnaround: "same/next day",
    status: "Limited",
    slots: 1
  },
  {
    tier: "Priority",
    turnaround: "2–3 days",
    status: "Open",
    slots: 3
  },
  {
    tier: "Standard",
    turnaround: "4–7 days",
    status: "Open",
    slots: 6
  }
];

// Maps status values to badge styles in CSS.
const statusClassMap = {
  Open: "badge-open",
  Limited: "badge-limited",
  Full: "badge-full"
};

function renderAvailabilityCards() {
  const container = document.getElementById("availabilityCards");
  if (!container) return;

  container.innerHTML = "";

  availabilityTiers.forEach((item) => {
    const card = document.createElement("article");
    card.className = "card";

    const badgeClass = statusClassMap[item.status] || "badge-limited";

    card.innerHTML = `
      <span class="badge ${badgeClass}">${item.status}</span>
      <h3>${item.tier}</h3>
      <p><strong>Turnaround:</strong> ${item.turnaround}</p>
      <p class="slot-count">${item.slots} slot${item.slots === 1 ? "" : "s"} available</p>
    `;

    container.appendChild(card);
  });
}

function setFooterYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

renderAvailabilityCards();
setFooterYear();
