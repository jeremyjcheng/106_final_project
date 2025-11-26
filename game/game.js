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
  if (slideIndex > 0 && slideIndex <= categoryKeys.length) {
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
  resultSlide.append("h1").text("Your Carbon Impact");
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
    if (e.key === "ArrowRight") {
      nextSlide();
    } else if (e.key === "ArrowLeft") {
      // Prevent going back from title slide (index 0)
      if (currentSlide > 0) {
        prevSlide();
      }
    }
  });
}

// Create D3 precipitation chart
function createPrecipitationChart(containerId, totalEmissions) {
      const margin = { top: 40, right: 40, bottom: 60, left: 80 };
      const width = 400 - margin.left - margin.right;
      const height = 350 - margin.top - margin.bottom;

      const container = d3.select(`#${containerId}`);
      container.selectAll("*").remove();

      const svg = container
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("background", "#f8f9fa")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const currentPrecipitation = 3.0;
      let projected2100;
      
      if (totalEmissions < 1100) {
        projected2100 = 3.8;
      } else {
        projected2100 = 4.5;
      }

      const minRange = 2.0;
      const maxRange = 5.0;

      const yScale = d3.scaleLinear()
        .domain([minRange, maxRange])
        .range([height, 0]);

      const yAxis = d3.axisLeft(yScale)
        .tickValues([2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0])
        .tickSize(8)
        .tickFormat(d => d.toFixed(1));

      const axisGroup = svg.append("g")
        .call(yAxis);

      axisGroup.selectAll("text")
        .style("font-size", "12px")
        .style("font-weight", "600")
        .style("fill", "#2d3748");

      axisGroup.selectAll("line")
        .style("stroke", "#cbd5e0")
        .style("stroke-width", 1);

      axisGroup.select(".domain")
        .style("stroke", "#4a5568")
        .style("stroke-width", 2);

      svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "700")
        .style("fill", "#2d3748")
        .text("Precipitation (mm/day)");

      const currentY = yScale(currentPrecipitation);
      svg.append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", currentY)
        .attr("y2", currentY)
        .attr("stroke", "#f59e0b")
        .attr("stroke-width", 4)
        .attr("stroke-dasharray", "5,5")
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .delay(300)
        .style("opacity", 0.8);

      svg.append("text")
        .attr("x", width / 2)
        .attr("y", currentY - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "700")
        .style("fill", "#f59e0b")
        .style("opacity", 0)
        .text(`2025: ${currentPrecipitation.toFixed(1)}`)
        .transition()
        .duration(1000)
        .delay(300)
        .style("opacity", 1);

      const projectedY = yScale(projected2100);
      svg.append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", projectedY)
        .attr("y2", projectedY)
        .attr("stroke", "#14b8a6")
        .attr("stroke-width", 4)
        .attr("stroke-dasharray", "5,5")
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .delay(800)
        .style("opacity", 0.8);

      svg.append("text")
        .attr("x", width / 2)
        .attr("y", projectedY - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "700")
        .style("fill", "#14b8a6")
        .style("opacity", 0)
        .text(`2100: ${projected2100.toFixed(1)}`)
        .transition()
        .duration(1000)
        .delay(800)
        .style("opacity", 1);

      const legendContainer = container.append("div")
        .attr("class", "legend");

      legendContainer.append("div")
        .attr("class", "legend-item")
        .html(`
          <div class="legend-color" style="background: #f59e0b;"></div>
        `);

      legendContainer.append("div")
        .attr("class", "legend-item")
        .html(`
          <div class="legend-color" style="background: #14b8a6;"></div>
        `);
    }

function showTotalEmissions() {
  let total = 0;
  for (const cat in userChoices) {
    if (userChoices[cat]) total += emissionsData[cat][userChoices[cat]];
  }
  
  // Classify emissions - simplified to two categories
  let classification = "";
  let classColor = "";
  
  if (total < 1100) {
    classification = "Low Emissions 🌱";
    classColor = "#2e8b57";
  } else {
    classification = "High Emissions ⚠️";
    classColor = "#d9534f";
  }
  
  let extremeRainfallDays = getExtremeRainfallDays(total);
  let lowEmissionImpact = getLowEmissionImpact(total);
  
  d3.select("#final-emissions")
    .html(`
      <div class="results-header">
        <h2>Our Future</h2>
        <h3>Results Based On Your Answer:</h3>
        <div class="results-total">${total} kg CO₂</div>
        <div class="results-classification" style="color: ${classColor};">${classification}</div>
      </div>
      
      <div class="results-grid">
        <div class="results-box">
          <h4>Your Precipitation Projection</h4>
          <div id="precipitation-chart"></div>
        </div>
        
        <div class="results-box">
          <h4>🌧️ Extreme Rainfall Days</h4>
          <p><strong>Current scenario:</strong> ${extremeRainfallDays.current} days/year</p>
          <p><strong>Low emission scenario:</strong> ${extremeRainfallDays.lowEmission} days/year</p>
          <p style="margin-top: 15px; font-size: 0.9em; color: #888;">
            <em>Extreme rainfall days can cause flooding, landslides, and infrastructure damage.</em>
          </p>
        </div>
      </div>
      
      <div class="results-info-box">
        <h4>💡 Understanding the Impact</h4>
        <p>${lowEmissionImpact}</p>
      </div>
      
      <div class="results-info-box">
        <h4>🌍 How Carbon Emissions Affect Precipitation</h4>
        <p>
          Carbon dioxide traps heat in Earth's atmosphere. Warmer air holds approximately 7% more moisture 
          per degree Celsius of warming. This extra moisture leads to more intense precipitation events 
          and increases the frequency of extreme rainfall days, resulting in flooding, erosion, and 
          infrastructure damage.
        </p>
      </div>
    `);
  
  // Create the D3 chart after the HTML is inserted
  createPrecipitationChart("precipitation-chart", total);
}

function getExtremeRainfallDays(total) {
  let current, lowEmission;
  
  if (total < 1100) {
    // Low emissions
    current = 15;
    lowEmission = 10;
  } else {
    // High emissions
    current = 25;
    lowEmission = 10;
  }
  
  return { current, lowEmission };
}

function getLowEmissionImpact(total) {
  if (total < 1100) {
    return "Great job! Your low carbon footprint helps keep global temperatures stable. This means precipitation patterns remain more predictable, with fewer extreme weather events. Warmer air holds more moisture, so by keeping emissions low, we prevent the atmosphere from supercharging with excess water vapor that leads to intense rainfall and flooding.";
  } else {
    return "Your high emissions significantly contribute to global warming. As carbon dioxide traps heat in the atmosphere, global temperatures rise, causing the air to hold more moisture (about 7% more per degree Celsius). This leads to more intense precipitation events and an increase in extreme rainfall days, resulting in increased flooding, erosion, and infrastructure damage. Reducing your carbon footprint can help slow this trend.";
  }
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