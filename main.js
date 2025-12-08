let currentSlide = 0;
let slides;
let totalSlides;

// Get navigation buttons
const prevSlideBtn = document.getElementById('prevSlideBtn');
const nextSlideBtn = document.getElementById('nextSlideBtn');

// Add click handlers
prevSlideBtn.addEventListener('click', () => {
  if (currentSlide > 0) {
    goToSlide(currentSlide - 1);
  }
});

nextSlideBtn.addEventListener('click', () => {
  if (currentSlide < slides.length - 1) {
    goToSlide(currentSlide + 1);
  }
});

// Update button states function
function updateNavigationButtons() {
  prevSlideBtn.disabled = currentSlide === 0;
  nextSlideBtn.disabled = currentSlide === slides.length - 1;
}

function updateSlide() {
  slides.forEach((slide, index) => {
    slide.classList.remove("active", "prev", "next");
    if (index === currentSlide) {
      slide.classList.add("active");
    } else if (index < currentSlide) {
      slide.classList.add("prev");
    } else {
      slide.classList.add("next");
    }
  });

  // Update indicators
  document.querySelectorAll(".indicator-dot").forEach((dot, index) => {
    dot.classList.toggle("active", index === currentSlide);
  });
}

let isTransitioning = false;

function nextSlide() {
  if (!isTransitioning) {
    isTransitioning = true;
    currentSlide = (currentSlide + 1) % totalSlides;
    updateSlide();
    setTimeout(() => {
      isTransitioning = false;
    }, 250);
  }
}

function previousSlide() {
  if (!isTransitioning) {
    // Prevent going back from the first slide
    if (currentSlide === 0) {
      return;
    }
    isTransitioning = true;
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateSlide();
    setTimeout(() => {
      isTransitioning = false;
    }, 250);
  }
}

function goToSlide(index) {
  if (index !== currentSlide && !isTransitioning) {
    isTransitioning = true;
    currentSlide = index;
    updateSlide();
    setTimeout(() => {
      isTransitioning = false;
    }, 250);
  }
  updateNavigationButtons();
}

// Keyboard navigation
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === " ") {
    e.preventDefault();
    nextSlide();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    previousSlide();
  }
});

// Scenario Chooser Functionality
let scenarioOptions;
let scenarioResult;
let selectedScenarioSpan;
let scenarioDetails;

const scenarioData = {
  low: {
    name: "Low Emissions (SSP1-2.6)",
    description:
      "With aggressive climate action, we can expect more moderate changes in precipitation patterns. Regional variations will be less extreme, and adaptation will be more manageable.",
    impact:
      "Precipitation changes: +2-5% nationally, with regional variations. More predictable patterns, less extreme events.",
  },
  high: {
    name: "High Emissions (SSP5-8.5)",
    description:
      "Under a business-as-usual scenario, precipitation patterns will shift dramatically. Extreme events will become more frequent, and regional disparities will intensify.",
    impact:
      "Precipitation changes: +5-15% nationally, with significant regional extremes. More frequent heavy rainfall events and atmospheric rivers.",
  },
};

function selectScenario(scenario) {
  // Remove selected class from all options
  scenarioOptions.forEach((opt) => opt.classList.remove("selected"));

  // Add selected class to chosen option
  const selectedOption = document.querySelector(
    `[data-scenario="${scenario}"]`
  );
  selectedOption.classList.add("selected");

  // Show result
  const data = scenarioData[scenario];
  selectedScenarioSpan.textContent = data.name;
  scenarioDetails.innerHTML = `
    <p><strong>${data.description}</strong></p>
    <p style="margin-top: 1rem;">${data.impact}</p>
  `;
  scenarioResult.style.display = "block";

  // Scroll result into view
  scenarioResult.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function resetScenario() {
  scenarioOptions.forEach((opt) => opt.classList.remove("selected"));
  scenarioResult.style.display = "none";
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Initialize slides
  slides = document.querySelectorAll(".slide");
  totalSlides = slides.length;

  // Create slide indicators
  const indicatorContainer = document.getElementById("slide-indicator");
  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement("div");
    dot.className = "indicator-dot";
    if (i === 0) dot.classList.add("active");
    dot.addEventListener("click", () => goToSlide(i));
    indicatorContainer.appendChild(dot);
  }

  updateSlide();

  // Set up reset button
  const resetButton = document.querySelector(".reset-button");
  if (resetButton) {
    resetButton.addEventListener("click", resetScenario);
  }

  // Initialize scenario chooser
  scenarioOptions = document.querySelectorAll(".scenario-option");
  scenarioResult = document.getElementById("scenario-result");
  selectedScenarioSpan = document.getElementById("selected-scenario");
  scenarioDetails = document.getElementById("scenario-details");

  scenarioOptions.forEach((option) => {
    option.addEventListener("click", () => {
      const scenario = option.getAttribute("data-scenario");
      selectScenario(scenario);
    });
  });

  // Click navigation on left/right sides of screen
  const slidesContainer = document.querySelector(".slides-container");
  if (slidesContainer) {
    slidesContainer.addEventListener("click", (e) => {
      // Don't navigate if clicking on interactive elements
      if (
        e.target.closest(".indicator-dot") ||
        e.target.closest(".slide-viz") ||
        e.target.closest("button") ||
        e.target.closest("a") ||
        e.target.closest(".game-container") ||
        e.target.closest("iframe") ||
        e.target.closest(".chart-container") ||
        e.target.closest(".regional-chart-container") ||
        e.target.closest("input") ||
        e.target.closest(".legend-item") ||
        e.target.closest("svg") ||
        e.target.closest("#chartSvg") ||
        e.target.closest(".chart-svg-wrapper") ||
        e.target.closest("label")
      ) {
        return;
      }

      // Don't navigate if clicking inside the game slide
      const gameSlide = document.querySelector(".game-slide-content");
      if (gameSlide && gameSlide.contains(e.target)) {
        return;
      }

      const clickX = e.clientX;
      const windowWidth = window.innerWidth;
      const leftHalf = clickX < windowWidth / 2;

      if (leftHalf) {
        // Prevent going back from the first slide
        if (currentSlide > 0) {
          previousSlide();
        }
      } else {
        nextSlide();
      }
    });
  }
});

// Key insight
// Toggle insights container - with event propagation prevention
const insightsToggle = document.querySelector('.insights-toggle');
const insightsContent = document.querySelector('.insights-content');
const insightsContainer = document.querySelector('.insights-container');

if (insightsToggle && insightsContent) {
  // Prevent the toggle button from triggering slide navigation
  insightsToggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    insightsToggle.classList.toggle('collapsed');
    insightsContent.classList.toggle('collapsed');
  });
}

// Prevent details/summary from triggering slide navigation
if (insightsContent) {
  const insightItems = insightsContent.querySelectorAll('.insight-item');
  insightItems.forEach(item => {
    const summary = item.querySelector('.insight-summary');
    if (summary) {
      summary.addEventListener('click', (e) => {
        e.stopPropagation();
        e.stopImmediatePropagation();
      });
    }
  });
}

// Stop all events from bubbling up from the insights container
if (insightsContainer) {
  insightsContainer.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  insightsContainer.addEventListener('touchstart', (e) => {
    e.stopPropagation();
  }, { passive: true });

  insightsContainer.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });
}

// typewriter
function typewriterEffect(element, speed = 50) {
  const text = element.getAttribute('data-text');
  const textElement = element.querySelector('.typewriter-text');
  let index = 0;

  function type() {
    if (index < text.length) {
      textElement.textContent += text.charAt(index);
      index++;
      setTimeout(type, speed);
    }
  }

  type();
}

// Apply to all typewriter elements
document.querySelectorAll('.typewriter').forEach(el => {
  typewriterEffect(el, 50);
});