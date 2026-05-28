const processSteps = [
  {
    number: "01",
    title: "Submit Your Print Request",
    body: "Start by sending your file or project details through the quote form. Include your material preference, color, deadline, and any notes that matter. The more context you give upfront, the easier it is to quote the job accurately.",
    bullets: [
      "Upload or send your STL/3MF file if available",
      "Tell us the material, color, and deadline",
      "Mention if the part has a functional purpose or tight fit requirement",
      "Use the calculator first if you want a rough estimate"
    ]
  },
  {
    number: "02",
    title: "We Review the File",
    body: "Before giving a final price, we check the model for print time, material use, supports, size, difficulty, orientation, and deadline feasibility. The calculator is useful for a quick estimate, but the final quote depends on the actual file.",
    bullets: [
      "Support-heavy models may cost more",
      "Large parts may require a custom quote",
      "Files with high failure risk may need changes before approval",
      "Rush timing depends on printer capacity"
    ]
  },
  {
    number: "03",
    title: "You Get a Quote",
    body: "After review, we contact you with a confirmed price, estimated completion time, payment details, and pickup option. If the file has print risks or needs changes, we'll tell you before starting.",
    bullets: [
      "Final quote is sent after file review",
      "Calculator price is only an estimate",
      "You will know the price before printing begins",
      "No print starts until you approve the quote"
    ]
  },
  {
    number: "04",
    title: "You Confirm and Pay",
    body: "Once you approve the final quote, payment is handled through Zelle or PayPal. After payment is confirmed, your job is added to the print queue. This keeps the queue fair and prevents abandoned jobs.",
    bullets: [
      "Payment happens after quote approval",
      "Payment is required before printing begins",
      "Zelle and PayPal are currently supported",
      "Priority and rush jobs may be available depending on capacity"
    ]
  },
  {
    number: "05",
    title: "Pick Up on Your Assigned Day",
    body: "Finished prints are picked up at 12 noon on your assigned pickup day, directly in front of the Student Union. This keeps pickup simple, predictable, and efficient.",
    bullets: [
      "Default pickup: 12 noon",
      "Default location: directly in front of the Student Union",
      "Pickup day is confirmed when your order is approved",
      "Special pickup requests may be available, but may cost extra"
    ],
    note: "Special accommodations are not guaranteed, but we'll try to work with you when possible. Extra fees may apply."
  }
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

  stepButtons.forEach((button, buttonIndex) => {
    const active = buttonIndex === selectedStep;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });

  stepNumber.textContent = step.number;
  stepTitle.textContent = step.title;
  stepBody.textContent = step.body;
  stepBullets.innerHTML = step.bullets.map((item) => `<li>${item}</li>`).join("");

  if (step.note) {
    stepNote.textContent = step.note;
    stepNote.hidden = false;
  } else {
    stepNote.textContent = "";
    stepNote.hidden = true;
  }

  prevButton.disabled = selectedStep === 0;
  nextButton.disabled = selectedStep === processSteps.length - 1;
}

stepButtons.forEach((button) => {
  button.addEventListener("click", () => {
    renderStep(Number(button.dataset.stepIndex));
  });
});

prevButton.addEventListener("click", () => renderStep(selectedStep - 1));
nextButton.addEventListener("click", () => renderStep(selectedStep + 1));

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    renderStep(selectedStep - 1);
  }

  if (event.key === "ArrowRight") {
    renderStep(selectedStep + 1);
  }
});

renderStep(0);
