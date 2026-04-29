/*
  ==========================================
  EDIT AVAILABILITY HERE
  ==========================================
*/
const availabilityTiers = [
  {
    tier: "Rush",
    turnaround: "Same / next day",
    status: "Limited",
    slots: 1,
    description: "Best for urgent deadlines and last-minute class deliverables."
  },
  {
    tier: "Priority",
    turnaround: "2–3 days",
    status: "Open",
    slots: 3,
    description: "Fast lane for projects that need reliable turnaround this week."
  },
  {
    tier: "Standard",
    turnaround: "4–7 days",
    status: "Open",
    slots: 6,
    description: "Most cost-efficient option for planned prints and iteration cycles."
  }
];

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
    card.className = "card availability-card";

    const badgeClass = statusClassMap[item.status] || "badge-limited";

    card.innerHTML = `
      <span class="badge ${badgeClass}">${item.status}</span>
      <h3>${item.tier}</h3>
      <p><strong>Turnaround:</strong> ${item.turnaround}</p>
      <p class="availability-desc">${item.description}</p>
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
