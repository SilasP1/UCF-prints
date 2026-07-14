const processSteps = [
  { number: "01", title: "Send your request", body: "Use the calculator with K1C slicer numbers, or send the STL or 3MF directly.", bullets: ["Use the Creality K1C profile for calculator estimates", "Include the material, color, and deadline", "Attach the model before sending the email"], note: "You do not pay at this stage.", state: "request", stateLabel: "Request received", stateTitle: "Details gathered", stateBody: "Next: file review and final pricing." },
  { number: "02", title: "Review and confirm", body: "The model is checked for size, supports, orientation, print time, and material use.", bullets: ["K1C build volume: 220 × 220 × 250 mm", "You will be contacted if the file needs changes", "The final price and completion estimate are sent for approval"], note: "Nothing is printed until you approve the final quote.", state: "review", stateLabel: "File review", stateTitle: "Price and timing confirmed", stateBody: "Next: your approval and payment." },
  { number: "03", title: "Approve, pay, and print", body: "After you approve the quote and pay, the order enters the printer queue.", bullets: ["Standard jobs usually take 3–5 days", "Rush timing depends on current capacity", "You will be contacted if a print issue changes the schedule"], note: "The quoted timing begins after the file is approved and payment is received.", state: "printing", stateLabel: "In production", stateTitle: "Your part is being printed", stateBody: "Next: completion check and pickup message." },
  { number: "04", title: "Pick up the finished part", body: "You receive a message when the print is complete and schedule pickup near the Student Union.", bullets: ["The pickup time is confirmed in advance", "Inspect the part when you receive it", "Special meeting requests depend on availability"], note: "Peer Printing is independent and is not affiliated with or endorsed by UCF.", state: "pickup", stateLabel: "Ready for pickup", stateTitle: "Order complete", stateBody: "Meet near the Student Union and collect the part." }
];

const stepButtons = Array.from(document.querySelectorAll("[data-step-index]"));
const stepNumber = document.querySelector("#timelineStepNumber");
const stepTitle = document.querySelector("#timelineStepTitle");
const stepBody = document.querySelector("#timelineStepBody");
const stepBullets = document.querySelector("#timelineStepBullets");
const stepNote = document.querySelector("#timelineStepNote");
const statePanel = document.querySelector("#timelineState");
const stateNumber = document.querySelector("#timelineStateNumber");
const stateLabel = document.querySelector("#timelineStateLabel");
const stateTitle = document.querySelector("#timelineStateTitle");
const stateBody = document.querySelector("#timelineStateBody");
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
  statePanel.dataset.state = step.state;
  stateNumber.textContent = step.number;
  stateLabel.textContent = step.stateLabel;
  stateTitle.textContent = step.stateTitle;
  stateBody.textContent = step.stateBody;
  prevButton.disabled = selectedStep === 0;
  nextButton.disabled = selectedStep === processSteps.length - 1;
}

stepButtons.forEach(button => {
  button.addEventListener("click", () => renderStep(Number(button.dataset.stepIndex)));
  button.addEventListener("keydown", event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (Number(button.dataset.stepIndex) + direction + processSteps.length) % processSteps.length;
    renderStep(nextIndex);
    stepButtons[nextIndex].focus();
  });
});
prevButton.addEventListener("click", () => renderStep(selectedStep - 1));
nextButton.addEventListener("click", () => renderStep(selectedStep + 1));
renderStep(0);
