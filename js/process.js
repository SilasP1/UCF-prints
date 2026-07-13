const processSteps = [
  { number: "01", title: "Submit Your Print Request", body: "Start with the calculator if you know the material, filament weight, and print time. If not, send your STL, 3MF, or STEP file with the deadline and intended use.", bullets: ["Use slicer estimates when available", "Otherwise send the model for manual review", "Include your deadline and material preference", "Mention functional or fit-critical requirements"] },
  { number: "02", title: "We Review the File", body: "We check size, print time, material use, supports, orientation, geometry, failure risk, and whether your deadline is realistic.", bullets: ["Build volume is 220 × 220 × 250 mm", "Support-heavy models may cost more", "Large or risky models may require changes", "Rush timing depends on current capacity"] },
  { number: "03", title: "You Receive a Final Quote", body: "After reviewing the actual file, we confirm the final price, estimated completion time, and pickup plan before anything is printed.", bullets: ["Calculator results remain estimates", "You know the final price before printing", "Model concerns are raised before production", "No job starts without approval"] },
  { number: "04", title: "You Approve and Pay", body: "Once you approve the quote and payment is confirmed, your job enters the print queue.", bullets: ["Payment occurs after quote approval", "Payment is required before printing", "Priority depends on available capacity", "Updates are provided if timing changes"] },
  { number: "05", title: "Pick Up the Finished Part", body: "Completed orders are collected during the campus pickup window confirmed with your quote.", bullets: ["Pickup is scheduled near the Student Union", "Your pickup day is confirmed in advance", "Inspect the part when you receive it", "Special meeting requests may add a fee"], note: "Peer Printing is an independent student-run service and is not affiliated with or endorsed by UCF." }
];

const stepButtons = Array.from(document.querySelectorAll("[data-step-index]"));
const stepNumber = document.querySelector("#timelineStepNumber");
const stepTitle = document.querySelector("#timelineStepTitle");
const stepBody = document.querySelector("#timelineStepBody");
const stepBullets = document.querySelector("#timelineStepBullets");
const stepNote = document.querySelector("#timelineStepNote");
const prevButton = document.querySelector("#timelinePrev");
const nextButton = document.querySelector("#timelineNext");
let selectedStep = 0;

function renderStep(index) {
  selectedStep = Math.max(0, Math.min(index, processSteps.length - 1));
  const step = processSteps[selectedStep];
  stepButtons.forEach((button, i) => { const active = i === selectedStep; button.classList.toggle("is-active", active); button.setAttribute("aria-selected", String(active)); });
  stepNumber.textContent = step.number;
  stepTitle.textContent = step.title;
  stepBody.textContent = step.body;
  stepBullets.innerHTML = step.bullets.map(item => `<li>${item}</li>`).join("");
  stepNote.hidden = !step.note;
  stepNote.textContent = step.note || "";
  prevButton.disabled = selectedStep === 0;
  nextButton.disabled = selectedStep === processSteps.length - 1;
}

stepButtons.forEach(button => button.addEventListener("click", () => renderStep(Number(button.dataset.stepIndex))));
prevButton.addEventListener("click", () => renderStep(selectedStep - 1));
nextButton.addEventListener("click", () => renderStep(selectedStep + 1));
renderStep(0);
