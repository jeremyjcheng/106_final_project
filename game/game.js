const emissionsData = {
  vacation: {
    "International flight": 1000,
    "Domestic flight": 300,
    "Multiple flights per year": 2000,
    "Road trip (gas car)": 150,
    "Road trip (electric vehicle)": 50,
    "Train or bus vacation": 30,
  },
  commute: {
    "Walk/Bike": 0,
    "Public transit": 20,
    "Drive small car": 150,
    "Drive SUV": 300,
    "Drive EV": 50,
  },
  distance: {
    "Short (0–5 miles)": 10,
    "Medium (5–20 miles)": 50,
    "Long (20–50+ miles)": 200,
  },
  shopping: {
    "Buy frequently from global stores": 100,
    "Buy less and buy local": 30,
    "Buy second-hand": 10,
  },
  diet: {
    "High-meat diet": 500,
    "Moderate-meat diet": 250,
    Vegetarian: 100,
    Vegan: 50,
  },
  housing: { Apartment: 100, "Small house": 200, "Large house": 400 },
};

const imagesData = {
  "International flight": "../assets/flight.png",
  "Domestic flight": "../assets/domestic.png",
  "Multiple flights per year": "../assets/multiple.png",

  "Road trip (gas car)": "../assets/gasroad.png",
  "Road trip (electric vehicle)": "../assets/evroad.png",
  "Train or bus vacation": "../assets/train.png",

  "Walk/Bike": "../assets/bike.png",
  "Public transit": "../assets/public.png",
  "Drive small car": "../assets/small.png",
  "Drive SUV": "../assets/suv.png",
  "Drive EV": "../assets/ev.png",

  "Short (0–5 miles)": "../assets/short.png",
  "Medium (5–20 miles)": "../assets/medium.png",
  "Long (20–50+ miles)": "../assets/long.png",

  "Buy frequently from global stores": "../assets/online.png",
  "Buy less and buy local": "../assets/local.png",
  "Buy second-hand": "../assets/second.png",

  "High-meat diet": "../assets/meat.png",
  "Moderate-meat diet": "../assets/modmeat.png",
  Vegetarian: "../assets/vege.png",
  Vegan: "../assets/vegan.png",

  Apartment: "../assets/multi.png",
  "Small house": "../assets/house.png",
  "Large house": "../assets/largehouse.png",
};

let userChoices = {
  vacation: null,
  commute: null,
  distance: null,
  shopping: null,
  diet: null,
  housing: null,
};

const categories = {
  vacation: "What type of vacation will you take?",
  commute: "How do you commute to work or school?",
  distance: "How far is your commute to work or school?",
  shopping: "What will your shopping habits be?",
  diet: "What will your diet be?",
  housing: "Where will you live?",
};

let currentSlide = 0;
let slides = [];

function updateSlide() {
  slides.forEach((s, i) => {
    s.classList.remove("active");
    if (i === currentSlide) s.classList.add("active");
  });

  // Restore selected state when updating slide (only if slides are created)
  if (slides.length > 0) {
    restoreSelectedState();
  }
}

function nextSlide() {
  if (currentSlide < slides.length - 1) currentSlide++;
  // If last slide, calculate total emissions
  if (currentSlide === slides.length - 1) {
    showTotalEmissions();
  }
  updateSlide();
}

function prevSlide() {
  if (currentSlide > 0) {
    currentSlide--;
    updateSlide();
    // Restore selected state for the previous slide's category
    restoreSelectedState();
  }
}

function restoreSelectedState() {
  // Get the current slide's category
  const slideIndex = currentSlide;
  const categoryKeys = Object.keys(categories);

  // Only restore if we're on a question slide (not title or results)
  // Note: slides array includes title slide at index 0, so question slides start at 1
  // But we need to account for the fact that createSlides() creates slides after the title
  // So the first question slide in the slides array is at index 1 (after title slide)
  if (slideIndex > 0 && slideIndex <= categoryKeys.length) {
    // Adjust index: slideIndex 1 = first category, slideIndex 2 = second category, etc.
    const categoryIndex = slideIndex - 1;
    if (categoryIndex >= 0 && categoryIndex < categoryKeys.length) {
      const category = categoryKeys[categoryIndex];
      const selectedChoice = userChoices[category];

      if (selectedChoice) {
        // Find and select the button for this choice
        const slide = slides[slideIndex];
        if (slide) {
          const buttons = slide.querySelectorAll(".choice-button");
          buttons.forEach((btn) => {
            if (btn.getAttribute("data-choice") === selectedChoice) {
              btn.classList.add("selected");
            } else {
              btn.classList.remove("selected");
            }
          });
        }
      } else {
        // Clear all selections if no choice was made
        const slide = slides[slideIndex];
        if (slide) {
          const buttons = slide.querySelectorAll(".choice-button");
          buttons.forEach((btn) => {
            btn.classList.remove("selected");
          });
        }
      }
    }
  }
}

// Initialize start game
d3.select("#start-game").on("click", () => {
  createSlides();
  nextSlide();
});

// Generate slides for each category
function createSlides() {
  const container = d3.select(".slides-container");
  let slideIndex = 0;

  for (const category in categories) {
    const slide = container.append("div").attr("class", "slide");
    slide.append("h2").text(categories[category]);

    const btnDiv = slide.append("div").attr("class", "buttons");
    const options = emissionsData[category];

    Object.keys(options).forEach((choice) => {
      const btn = btnDiv
        .append("div")
        .attr("class", "choice-button")
        .attr("data-category", category)
        .attr("data-choice", choice);

      btn
        .append("img")
        .attr("src", imagesData[choice] || "images/placeholder.jpg")
        .attr("alt", choice);
      btn.append("span").text(choice);

      btn.on("click", function () {
        d3.select(this.parentNode)
          .selectAll(".choice-button")
          .classed("selected", false);
        d3.select(this).classed("selected", true);
        userChoices[category] = choice;
        nextSlide();
      });
    });

    // Add back button to each question slide (not the first one)
    if (slideIndex > 0) {
      const backBtn = slide
        .append("button")
        .attr("class", "back-button")
        .text("← Back");

      backBtn.on("click", () => {
        prevSlide();
      });
    }

    slideIndex++;
  }

  // Add final slide for total emissions
  const resultSlide = container.append("div").attr("class", "slide");
  resultSlide.append("h2").text("Your Total Emissions");
  resultSlide
    .append("div")
    .attr("class", "emissions-output")
    .attr("id", "final-emissions");

  // Add button container for results slide
  const buttonContainer = resultSlide
    .append("div")
    .attr("class", "result-buttons");

  // Add Back button to results slide
  const backBtn = buttonContainer
    .append("button")
    .attr("class", "back-button")
    .text("← Back");

  backBtn.on("click", () => {
    prevSlide();
  });

  // Add Start Over button
  const startOverBtn = buttonContainer
    .append("button")
    .attr("class", "start-over-button")
    .attr("id", "start-over-btn")
    .text("Start Over");

  startOverBtn.on("click", () => {
    resetGame();
  });

  slides = document.querySelectorAll(".slide");

  // keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") nextSlide();
    else if (e.key === "ArrowLeft") prevSlide();
  });
}

function showTotalEmissions() {
  let total = 0;
  for (const cat in userChoices) {
    if (userChoices[cat]) total += emissionsData[cat][userChoices[cat]];
  }
  d3.select("#final-emissions").text(`Total Emissions: ${total} kg CO₂`);
}

function resetGame() {
  // Reset user choices
  userChoices = {
    vacation: null,
    commute: null,
    distance: null,
    shopping: null,
    diet: null,
    housing: null,
  };

  // Reset slide index
  currentSlide = 0;

  // Remove all dynamically created slides (keep only the title slide)
  const container = d3.select(".slides-container");
  container.selectAll(".slide:not(.title-slide)").remove();

  // Clear slides array
  slides = [];

  // Show title slide and hide all other slides
  d3.selectAll(".slide").classed("active", false);
  d3.select(".title-slide").classed("active", true);
}
