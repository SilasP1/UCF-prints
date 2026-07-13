const processSteps = [
  { number: "01", title: "Submit the Print", body: "Use the calculator with a Creality K1C slicer estimate, or email your STL, 3MF, or STEP file.", bullets: ["Include the deadline", "Choose a material and color", "Mention fit or strength requirements", "Attach the model before sending"] },
  { number: "02", title: "File Review", body: "The model is checked for size, supports, print time, and material use.", bullets: ["K1C build volume: 220 × 220 × 250 mm", "Support-heavy models may cost more", "You will be contacted if the model needs changes", "Rush orders depend on printer availability"] },
  { number: "03", title: "Final Quote", body: "You receive the final price, completion estimate, and pickup details.", bullets: ["Calculator prices are estimates", "The final price is sent before payment", "Printing does not begin without approval"] },
  { number: "04", title: "Payment and Printing", body: "After you approve and pay, the order is added to the print queue.", bullets: ["Payment is required before printing", "Priority depends on printer availability", "You will be contacted if the schedule changes"] },
  { number: "05", title: "Pickup", body: "Pickup is scheduled near the Student Union after the print is complete.", bullets: ["The pickup day is confirmed in advance", "Inspect the part when you receive it", "Special meeting requests may add a fee"], note: "Peer Printing is an independent student-run service and is not affiliated with or endorsed by UCF." }
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
