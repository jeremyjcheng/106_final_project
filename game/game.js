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

  const yScale = d3
    .scaleLinear()
    .domain([minRange, maxRange])
    .range([height, 0]);

  const yAxis = d3
    .axisLeft(yScale)
    .tickValues([2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0])
    .tickSize(8)
    .tickFormat((d) => d.toFixed(1));

  const axisGroup = svg.append("g").call(yAxis);

  axisGroup
    .selectAll("text")
    .style("font-size", "12px")
    .style("font-weight", "600")
    .style("fill", "#2d3748");

  axisGroup
    .selectAll("line")
    .style("stroke", "#cbd5e0")
    .style("stroke-width", 1);

  axisGroup
    .select(".domain")
    .style("stroke", "#4a5568")
    .style("stroke-width", 2);

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "700")
    .style("fill", "#2d3748")
    .text("Precipitation (mm/day)");

  const currentY = yScale(currentPrecipitation);
  svg
    .append("line")
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

  svg
    .append("text")
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
  svg
    .append("line")
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

  svg
    .append("text")
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

  const legendContainer = container.append("div").attr("class", "legend");

  legendContainer.append("div").attr("class", "legend-item").html(`
          <div class="legend-color" style="background: #f59e0b;"></div>
        `);

  legendContainer.append("div").attr("class", "legend-item").html(`
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

  d3.select("#final-emissions").html(`
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
function showCO2Equivalencies(total) {
  // --- Equivalency math ---
  const equivalencies = [
    {
      label: "Miles of driving",
      value: Math.round(total / 0.404),
      icon: "../assets/car.png",
    },
    {
      label: "Hours of lighting",
      value: Math.round((total / 0.417) * 10),
      icon: "../assets/light.png",
    },
    {
      label: "Beef burgers",
      value: Math.round(total / 5),
      icon: "../assets/burger.png",
    },
    {
      label: "Trees to absorb it",
      value: Math.ceil(total / 22),
      icon: "../assets/tree.png",
    },
  ];

  // Clear previous content
  const container = d3.select("#co2-equivalency");
  container.selectAll("*").remove();

  container.append("h3").text("Your CO₂ in Real-World Terms");

  // Create SVG for icon grid
  const svgWidth = 400,
    svgHeight = 250;
  const iconSize = 40,
    padding = 20;
  const svg = container
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  equivalencies.forEach((eq, i) => {
    const x = (i % 2) * (svgWidth / 2) + padding;
    const y = Math.floor(i / 2) * (svgHeight / 2) + padding;

    const group = svg.append("g").attr("transform", `translate(${x},${y})`);

    // Icon image
    group
      .append("image")
      .attr("href", eq.icon)
      .attr("width", iconSize)
      .attr("height", iconSize);

    // Animated number
    const numberText = group
      .append("text")
      .attr("x", iconSize + 10)
      .attr("y", iconSize / 2)
      .attr("dy", "0.35em")
      .style("font-size", "16px")
      .style("font-weight", "700")
      .text("0");

    animateNumberD3(numberText, eq.value);

    // Label
    group
      .append("text")
      .attr("x", 0)
      .attr("y", iconSize + 15)
      .style("font-size", "12px")
      .text(eq.label);
  });
}

// Animate D3 text counting
function animateNumberD3(selection, targetValue) {
  selection
    .transition()
    .duration(1200)
    .tween("text", function () {
      const i = d3.interpolateNumber(0, targetValue);
      return function (t) {
        this.textContent = Math.round(i(t));
      };
    });
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

  d3.select("#final-emissions").html(`
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
      
      <div class="results-box">
        <div id="co2-equivalency"></div>
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

  // Create CO2 equivalencies visualization
  showCO2Equivalencies(total);
}

function showCO2Equivalencies(total) {
  // --- Equivalency math ---
  const equivalencies = [
    {
      label: "Miles of driving",
      value: Math.round(total / 0.404),
      type: "driving",
    },
    {
      label: "Hours of lighting",
      value: Math.round((total / 0.417) * 10),
      type: "lighting",
    },
    { label: "Beef burgers", value: Math.round(total / 5), type: "burgers" },
    {
      label: "Trees to absorb it",
      value: Math.ceil(total / 22),
      type: "trees",
    },
  ];

  // Clear previous content
  const container = d3.select("#co2-equivalency");
  container.selectAll("*").remove();

  container
    .append("h3")
    .style("text-align", "center")
    .style("margin-bottom", "30px")
    .style("font-size", "24px")
    .text("Your CO₂ in Real-World Terms");

  // Create individual viz containers
  equivalencies.forEach((eq, index) => {
    const vizBox = container
      .append("div")
      .style("margin-bottom", "40px")
      .style("padding", "20px")
      .style("background", "#f8f9fa")
      .style("border-radius", "12px");

    vizBox
      .append("h4")
      .style("text-align", "center")
      .style("margin-bottom", "15px")
      .style("color", "#2d3748")
      .text(`${eq.value.toLocaleString()} ${eq.label}`);

    // Add city input for driving visualization ONLY
    if (eq.type === "driving") {
      const inputContainer = vizBox
        .append("div")
        .attr("id", "city-input-container")
        .style("text-align", "center")
        .style("margin-bottom", "20px");

      inputContainer
        .append("label")
        .style("font-size", "14px")
        .style("color", "#475569")
        .style("margin-right", "10px")
        .text("Your city:");

      const input = inputContainer
        .append("input")
        .attr("type", "text")
        .attr("id", "city-input")
        .attr("placeholder", "e.g., San Diego, CA")
        .style("padding", "8px 12px")
        .style("border", "2px solid #cbd5e0")
        .style("border-radius", "6px")
        .style("font-size", "14px")
        .style("width", "200px")
        .style("margin-right", "10px");

      const button = inputContainer
        .append("button")
        .attr("id", "city-submit")
        .style("padding", "8px 16px")
        .style("background", "#3b82f6")
        .style("color", "white")
        .style("border", "none")
        .style("border-radius", "6px")
        .style("font-size", "14px")
        .style("cursor", "pointer")
        .style("font-weight", "600")
        .text("Show Route");

      const messageDiv = inputContainer
        .append("div")
        .attr("id", "city-message")
        .style("margin-top", "10px")
        .style("font-size", "13px")
        .style("min-height", "20px");

      // Button hover effect
      button
        .on("mouseenter", function () {
          d3.select(this).style("background", "#2563eb");
        })
        .on("mouseleave", function () {
          d3.select(this).style("background", "#3b82f6");
        });

      // Handle city submission
      button.on("click", () => {
        const cityName = input.property("value").trim();
        if (cityName) {
          d3.select("#city-message")
            .text("Loading new map...")
            .style("color", "#3b82f6");
          // Clear the viz area before creating new map
          d3.select(`#viz-${eq.type}`).selectAll("*").remove();
          createDrivingViz(`viz-${eq.type}`, eq.value, cityName);
        } else {
          d3.select("#city-message")
            .text("Please enter a city name")
            .style("color", "#dc2626");
        }
      });

      // Allow Enter key to submit
      input.on("keypress", function (event) {
        if (event.key === "Enter") {
          button.node().click();
        }
      });

      // Show initial helpful message
      d3.select("#city-message")
      .text("💡 Default: San Diego, CA. Enter your city to update the route!")
      .style("color", "#059669")
      .style("font-weight", "600");
    }

    // Create the viz container div
    const vizId = `viz-${eq.type}`;
    vizBox.append("div").attr("id", vizId);


// Create visualizations
  setTimeout(() => {
  if (eq.type === "driving") {
    // Show default map with San Diego as starting point
    createDrivingViz(vizId, eq.value, "San Diego, CA");
  } else if (eq.type === "lighting") {
    createLightingViz(vizId, eq.value);
  } else if (eq.type === "burgers") {
    createFoodComparison(`#${vizId}`, eq.value);
  } else if (eq.type === "trees") {
    createTreesViz(vizId, eq.value);
  }
}, index * 200);
  });
}

// 1. DRIVING VISUALIZATION - Mapbox with animated route from user's city
function createDrivingViz(containerId, miles, startCity) {
  const container = d3.select(`#${containerId}`);

  // Clear any existing map
  container.selectAll("*").remove();

  // Show loading message
  const loadingMsg = container
    .append("div")
    .style("text-align", "center")
    .style("padding", "20px")
    .style("color", "#3b82f6")
    .text("🗺️ Loading map...");

  // Mapbox access token - IMPORTANT: Replace with your own token for production use
  const MAPBOX_TOKEN =
    "pk.eyJ1IjoiY21oYW5kYWxpIiwiYSI6ImNtaHZhN3M2NTA4dWsybXBxb3N1bzhjem0ifQ.3nLeaXx3soucrW7XQ_ctKA";

  // Geocode the start city using Mapbox Geocoding API
  const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    startCity
  )}.json?access_token=${MAPBOX_TOKEN}&limit=1`;

  fetch(geocodeUrl)
    .then((response) => response.json())
    .then((data) => {
      if (!data.features || data.features.length === 0) {
        loadingMsg.remove();
        d3.select("#city-message")
          .text(
            `❌ Could not find "${startCity}". Please try a different city.`
          )
          .style("color", "#dc2626");
        container
          .append("div")
          .style("text-align", "center")
          .style("padding", "20px")
          .style("color", "#dc2626")
          .html(
            `City not found. Try adding state/country (e.g., "Paris, France" or "Portland, OR")`
          );
        return;
      }

      const startCoords = data.features[0].center;
      const startCityName = data.features[0].place_name;

      // Find appropriate destination based on miles
      const destination = findDestination(startCoords, miles);

      if (!destination) {
        loadingMsg.remove();
        container
          .append("div")
          .style("text-align", "center")
          .style("padding", "20px")
          .style("color", "#dc2626")
          .text("Unable to calculate route. Please try again.");
        return;
      }

      // Remove loading message
      loadingMsg.remove();

      // Update message with success
      d3.select("#city-message")
        .text(
          `✅ Map loaded! Showing route from ${startCityName.split(",")[0]}`
        )
        .style("color", "#059669");

      // Create map container
      const mapDiv = container
        .append("div")
        .attr("id", `map-${containerId}`)
        .style("width", "100%")
        .style("height", "450px")
        .style("border-radius", "8px")
        .style("overflow", "hidden")
        .style("box-shadow", "0 4px 6px rgba(0,0,0,0.1)");

      // Initialize Mapbox
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: `map-${containerId}`,
        style: "mapbox://styles/mapbox/streets-v12",
        center: startCoords,
        zoom: 3,
        interactive: true,
      });

      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      map.addControl(new mapboxgl.FullscreenControl(), "top-right");

      map.on("load", () => {
        // Calculate actual distance using Haversine formula
        const actualDistance = calculateDistance(
          startCoords,
          destination.coords
        );

        // Fit bounds to show both locations with nice padding
        const bounds = new mapboxgl.LngLatBounds()
          .extend(startCoords)
          .extend(destination.coords);

        map.fitBounds(bounds, {
          padding: { top: 80, bottom: 80, left: 80, right: 80 },
          duration: 2000,
        });

        // Add start marker with custom styling
        const startMarkerEl = document.createElement("div");
        startMarkerEl.className = "custom-marker";
        startMarkerEl.innerHTML = "🏠";
        startMarkerEl.style.fontSize = "36px";
        startMarkerEl.style.cursor = "pointer";

        new mapboxgl.Marker({ element: startMarkerEl })
          .setLngLat(startCoords)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(`
                <div style="padding: 8px;">
                  <strong style="color: #2563eb;">Start</strong><br>
                  ${startCityName}
                </div>
              `)
          )
          .addTo(map);

        // Add end marker with custom styling
        const endMarkerEl = document.createElement("div");
        endMarkerEl.className = "custom-marker";
        endMarkerEl.innerHTML = "🏁";
        endMarkerEl.style.fontSize = "36px";
        endMarkerEl.style.cursor = "pointer";

        new mapboxgl.Marker({ element: endMarkerEl })
          .setLngLat(destination.coords)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(`
                <div style="padding: 8px;">
                  <strong style="color: #dc2626;">Destination</strong><br>
                  ${destination.name}
                </div>
              `)
          )
          .addTo(map);

        // Add animated route line using great circle path
        const routeCoords = generateGreatCirclePath(
          startCoords,
          destination.coords,
          100
        );

        map.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: routeCoords,
            },
          },
        });

        // Add the route line - solid red line
        map.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#dc2626",
            "line-width": 4,
            "line-opacity": 0.9,
          },
        });

        // Info text below map - simpler, more visible
        container
          .append("p")
          .style("text-align", "center")
          .style("margin-top", "15px")
          .style("color", "#1f2937")
          .style("font-size", "15px")
          .style("line-height", "1.6")
          .html(`🚗 That's like driving from <strong>${
          startCityName.split(",")[0]
        }</strong> to <strong>${destination.name}</strong>!<br>
                 📏 Route distance: <strong>~${actualDistance.toLocaleString()} miles</strong> | 
                 💨 CO₂ equivalent: <strong>${miles.toLocaleString()} miles</strong>`);

        // Animate car along route
        const steps = 150;
        let carStep = 0;

        const carMarkerEl = document.createElement("div");
        carMarkerEl.innerHTML = "🚗";
        carMarkerEl.style.fontSize = "32px";
        carMarkerEl.style.filter = "drop-shadow(2px 2px 4px rgba(0,0,0,0.3))";

        const car = new mapboxgl.Marker({ element: carMarkerEl })
          .setLngLat(startCoords)
          .addTo(map);

        function animateCar() {
          if (carStep <= steps) {
            const progress = carStep / steps;
            const coordIndex = Math.floor(progress * (routeCoords.length - 1));
            if (routeCoords[coordIndex]) {
              car.setLngLat(routeCoords[coordIndex]);
            }
            carStep++;
            setTimeout(animateCar, 40);
          } else {
            // Loop animation
            carStep = 0;
            setTimeout(animateCar, 2000);
          }
        }

        setTimeout(animateCar, 1500);
      });
    })
    .catch((error) => {
      loadingMsg.remove();
      d3.select("#city-message")
        .text("❌ Error loading map. Please try again.")
        .style("color", "#dc2626");
      container
        .append("div")
        .style("text-align", "center")
        .style("padding", "20px")
        .style("color", "#dc2626")
        .html(
          `Error: ${
            error.message || "Could not load map"
          }. Please check your internet connection.`
        );
      console.error("Map error:", error);
    });
}

// Helper function to calculate distance using Haversine formula
function calculateDistance(coords1, coords2) {
  const R = 3959; // Earth's radius in miles
  const lat1 = (coords1[1] * Math.PI) / 180;
  const lat2 = (coords2[1] * Math.PI) / 180;
  const deltaLat = ((coords2[1] - coords1[1]) * Math.PI) / 180;
  const deltaLon = ((coords2[0] - coords1[0]) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Helper function to find appropriate destination based on miles
function findDestination(startCoords, targetMiles) {
  const destinations = [
    { name: "Los Angeles, CA", coords: [-118.243, 34.052], region: "US" },
    { name: "Phoenix, AZ", coords: [-112.074, 33.448], region: "US" },
    { name: "Denver, CO", coords: [-104.99, 39.739], region: "US" },
    { name: "Chicago, IL", coords: [-87.629, 41.878], region: "US" },
    { name: "New York, NY", coords: [-74.006, 40.713], region: "US" },
    { name: "Miami, FL", coords: [-80.191, 25.761], region: "US" },
    { name: "Seattle, WA", coords: [-122.332, 47.606], region: "US" },
    {
      name: "Mexico City, Mexico",
      coords: [-99.133, 19.432],
      region: "Americas",
    },
    { name: "Toronto, Canada", coords: [-79.383, 43.653], region: "Americas" },
    { name: "London, UK", coords: [-0.127, 51.507], region: "Europe" },
    { name: "Paris, France", coords: [2.352, 48.856], region: "Europe" },
    { name: "Rome, Italy", coords: [12.496, 41.902], region: "Europe" },
    { name: "Tokyo, Japan", coords: [139.692, 35.689], region: "Asia" },
    {
      name: "Sydney, Australia",
      coords: [151.209, -33.868],
      region: "Oceania",
    },
    { name: "Dubai, UAE", coords: [55.296, 25.276], region: "Middle East" },
    {
      name: "São Paulo, Brazil",
      coords: [-46.633, -23.55],
      region: "Americas",
    },
  ];

  // Find destinations closest to target miles
  let bestMatch = null;
  let smallestDiff = Infinity;

  destinations.forEach((dest) => {
    const distance = calculateDistance(startCoords, dest.coords);
    const diff = Math.abs(distance - targetMiles);

    if (diff < smallestDiff) {
      smallestDiff = diff;
      bestMatch = { ...dest, actualDistance: distance };
    }
  });

  return bestMatch;
}

// Generate smooth great circle path between two points
function generateGreatCirclePath(start, end, numPoints) {
  const path = [];
  const lat1 = (start[1] * Math.PI) / 180;
  const lon1 = (start[0] * Math.PI) / 180;
  const lat2 = (end[1] * Math.PI) / 180;
  const lon2 = (end[0] * Math.PI) / 180;

  for (let i = 0; i <= numPoints; i++) {
    const fraction = i / numPoints;

    const a =
      Math.sin(
        (1 - fraction) *
          Math.acos(
            Math.sin(lat1) * Math.sin(lat2) +
              Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)
          )
      ) /
      Math.sin(
        Math.acos(
          Math.sin(lat1) * Math.sin(lat2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)
        )
      );
    const b =
      Math.sin(
        fraction *
          Math.acos(
            Math.sin(lat1) * Math.sin(lat2) +
              Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)
          )
      ) /
      Math.sin(
        Math.acos(
          Math.sin(lat1) * Math.sin(lat2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)
        )
      );

    const x =
      a * Math.cos(lat1) * Math.cos(lon1) + b * Math.cos(lat2) * Math.cos(lon2);
    const y =
      a * Math.cos(lat1) * Math.sin(lon1) + b * Math.cos(lat2) * Math.sin(lon2);
    const z = a * Math.sin(lat1) + b * Math.sin(lat2);

    const lat = (Math.atan2(z, Math.sqrt(x * x + y * y)) * 180) / Math.PI;
    const lon = (Math.atan2(y, x) * 180) / Math.PI;

    path.push([lon, lat]);
  }

  return path;
}

// food comparison
function createFoodComparison(containerId, burgers) {
  // DATA
  const foods = [
    { name: "Beef Burgers", emoji: "🍔", value: burgers, color: "#ef4444" },
    {
      name: "Chicken Meals",
      emoji: "🍗",
      value: Math.round(burgers * 2.5),
      color: "#f97316",
    },
    {
      name: "Vegetarian Meals",
      emoji: "🥗",
      value: Math.round(burgers * 5),
      color: "#22c55e",
    },
  ];

  // SVG SETUP
  const width = 700;
  const height = 300;

  const svg = d3
    .select(containerId)
    .html("") // clear previous render
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const maxValue = d3.max(foods, (d) => d.value);
  const barHeight = 50;
  const barSpacing = 80;

  const xScale = d3
    .scaleLinear()
    .domain([0, maxValue])
    .range([0, width - 200]);

  // DRAW EACH ROW
  foods.forEach((food, i) => {
    const g = svg
      .append("g")
      .attr("transform", `translate(150,${i * barSpacing + 30})`);

    // EMOJI
    g.append("text")
      .attr("x", -100)
      .attr("y", barHeight / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "32px")
      .text(food.emoji);

    // LABEL
    g.append("text")
      .attr("x", -100)
      .attr("y", barHeight / 2 + 30)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#666")
      .text(food.name);

    // ANIMATED BAR
    g.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 0)
      .attr("height", barHeight)
      .attr("fill", food.color)
      .attr("rx", 5)
      .transition()
      .duration(1500)
      .delay(i * 200)
      .attr("width", xScale(food.value));

    // VALUE TEXT (fade in)
    g.append("text")
      .attr("x", 10)
      .attr("y", barHeight / 2 + 5)
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("fill", "white")
      .style("opacity", 0)
      .text(food.value)
      .transition()
      .duration(500)
      .delay(i * 200 + 1500)
      .style("opacity", 1);
  });
}
// 2. LIGHTING VISUALIZATION - Electricity bill card
function createLightingViz(containerId, hours) {
  const container = d3.select(`#${containerId}`);
  container.selectAll("*").remove();

  // Calculate electricity cost (average $0.13 per kWh, 60W bulb)
  const kWh = (hours * 60) / 1000;
  const cost = (kWh * 0.18).toFixed(2);
  
  // Determine impact level
  let impactLevel = "LOW";
  let impactColor = "#22c55e";
  if (hours > 100) {
    impactLevel = "HIGH";
    impactColor = "#ef4444";
  } else if (hours > 50) {
    impactLevel = "MEDIUM";
    impactColor = "#f59e0b";
  }

  // Create electricity bill card
  const card = container
    .append("div")
    .style("background", "linear-gradient(135deg, #667eea 0%, #764ba2 100%)")
    .style("border-radius", "16px")
    .style("padding", "30px")
    .style("color", "white")
    .style("box-shadow", "0 10px 25px rgba(0,0,0,0.2)")
    .style("max-width", "450px")
    .style("margin", "0 auto");

  // Header with lightbulb icon
  card
    .append("div")
    .style("text-align", "center")
    .style("font-size", "64px")
    .style("margin-bottom", "20px")
    .text("💡");

  // Title
  card
    .append("h3")
    .style("text-align", "center")
    .style("margin", "0 0 25px 0")
    .style("font-size", "24px")
    .style("font-weight", "700")
    .text("Electricity Usage");

  // Hours display with animation
  const hoursDisplay = card
    .append("div")
    .style("text-align", "center")
    .style("font-size", "48px")
    .style("font-weight", "bold")
    .style("margin-bottom", "10px")
    .text("0");

  // Animate the hours counter
  hoursDisplay
    .transition()
    .duration(2000)
    .tween("text", function () {
      const i = d3.interpolateNumber(0, hours);
      return function (t) {
        this.textContent = Math.round(i(t)).toLocaleString();
      };
    });

  card
    .append("div")
    .style("text-align", "center")
    .style("font-size", "18px")
    .style("opacity", "0.9")
    .style("margin-bottom", "25px")
    .text("Hours of Lighting");

  // Divider
  card
    .append("hr")
    .style("border", "none")
    .style("border-top", "1px solid rgba(255,255,255,0.3)")
    .style("margin", "25px 0");

  // Cost section
  card
    .append("div")
    .style("display", "flex")
    .style("justify-content", "space-between")
    .style("align-items", "center")
    .style("margin-bottom", "15px")
    .html(`
      <span style="font-size: 16px; opacity: 0.9;">Equivalent Cost:</span>
      <span style="font-size: 32px; font-weight: bold;">$${cost}</span>
    `);

  // kWh info
  card
    .append("div")
    .style("text-align", "right")
    .style("font-size", "14px")
    .style("opacity", "0.8")
    .style("margin-bottom", "20px")
    .text(`(${kWh.toFixed(1)} kWh @ $0.13/kWh)`);

  // Impact level badge
  card
    .append("div")
    .style("text-align", "center")
    .style("margin-top", "20px")
    .append("span")
    .style("display", "inline-block")
    .style("background", impactColor)
    .style("padding", "10px 24px")
    .style("border-radius", "25px")
    .style("font-weight", "bold")
    .style("font-size", "16px")
    .style("letter-spacing", "1px")
    .text(`${impactLevel} IMPACT`);

  // Additional info
  card
    .append("p")
    .style("text-align", "center")
    .style("margin-top", "20px")
    .style("font-size", "13px")
    .style("opacity", "0.8")
    .style("line-height", "1.5")
    .style("color", "white")
    .text(`💡 Tip: LED bulbs use 75% less energy than traditional bulbs!`);
}


// 3. TREES VISUALIZATION - Animated growing forest for 2100 emissions
function createTreesViz(containerId, currentYearEmissions) {
  const container = d3.select(`#${containerId}`);
  container.selectAll("*").remove();

  // Calculate 2100 emissions (75 years of emissions)
  const emissions2100 = currentYearEmissions * 75;
  const treesNeeded = Math.ceil(emissions2100 / 22); // Each tree absorbs 22kg CO2/year

  const width = 700;
  const height = 500;

  // Main container with forest background
  const vizContainer = container
    .append("div")
    .style("position", "relative")
    .style("width", `${width}px`)
    .style("margin", "0 auto");

  // Info header
  vizContainer
    .append("div")
    .style("text-align", "center")
    .style("padding", "20px")
    .style("background", "linear-gradient(135deg, #10b981 0%, #059669 100%)")
    .style("border-radius", "12px 12px 0 0")
    .style("color", "white")
    .html(`
      <h3 style="margin: 0 0 10px 0; font-size: 24px;">🌍 Trees Needed by 2100</h3>
      <p style="margin: 5px 0; font-size: 16px; opacity: 0.95;">
        Your annual emissions: <strong>${currentYearEmissions} kg CO₂</strong>
      </p>
      <p style="margin: 5px 0; font-size: 16px; opacity: 0.95;">
        Total by 2100 (75 years): <strong>${emissions2100.toLocaleString()} kg CO₂</strong>
      </p>
      <div style="margin-top: 15px; padding: 12px; background: rgba(255,255,255,0.2); border-radius: 8px; display: inline-block;">
        <div style="font-size: 48px; font-weight: bold;" id="tree-counter">0</div>
        <div style="font-size: 14px; opacity: 0.9;">Trees Required</div>
      </div>
    `);

  // SVG for animated forest
  const svg = vizContainer
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "linear-gradient(to bottom, #87CEEB 0%, #b8dbd9 50%, #8B7355 100%)")
    .style("display", "block")
    .style("border-radius", "0 0 12px 12px");

  const groundY = height - 100;

  // Add sun
  svg
    .append("circle")
    .attr("cx", width - 80)
    .attr("cy", 60)
    .attr("r", 40)
    .attr("fill", "#FFD700")
    .style("opacity", 0)
    .transition()
    .duration(1500)
    .style("opacity", 0.8);

  // Add clouds
  for (let i = 0; i < 3; i++) {
    const cloudGroup = svg.append("g");
    const cloudX = 100 + i * 200;
    const cloudY = 50 + Math.random() * 50;

    [0, 20, 40].forEach((offset, j) => {
      cloudGroup
        .append("ellipse")
        .attr("cx", cloudX + offset)
        .attr("cy", cloudY)
        .attr("rx", 25)
        .attr("ry", 15)
        .attr("fill", "white")
        .style("opacity", 0)
        .transition()
        .duration(1000)
        .delay(500 + i * 200)
        .style("opacity", 0.7);
    });
  }

  // Ground with grass texture
  svg
    .append("rect")
    .attr("x", 0)
    .attr("y", groundY)
    .attr("width", width)
    .attr("height", height - groundY)
    .attr("fill", "#6B8E23");

  // Add grass blades
  for (let i = 0; i < 50; i++) {
    svg
      .append("line")
      .attr("x1", Math.random() * width)
      .attr("y1", groundY)
      .attr("x2", Math.random() * width)
      .attr("y2", groundY - 10)
      .attr("stroke", "#556B2F")
      .attr("stroke-width", 2)
      .style("opacity", 0.5);
  }

  // Animate tree counter
  d3.select("#tree-counter")
    .transition()
    .duration(3000)
    .tween("text", function () {
      const i = d3.interpolateNumber(0, treesNeeded);
      return function (t) {
        this.textContent = Math.round(i(t)).toLocaleString();
      };
    });

  // Create color palette for tree dots
  const treeColors = [
    "#228B22", // Forest Green
    "#2E8B57", // Sea Green
    "#3CB371", // Medium Sea Green
    "#32CD32", // Lime Green
    "#00FF00", // Lime
    "#7CFC00", // Lawn Green
    "#7FFF00", // Chartreuse
    "#ADFF2F", // Green Yellow
    "#9ACD32", // Yellow Green
    "#00FA9A", // Medium Spring Green
  ];

  // Calculate ALL tree positions as colorful dots
  const dotsPerRow = 40;
  const dotSize = 8;
  const dotSpacing = (width - 40) / dotsPerRow;
  const verticalSpacing = 12;
  
  const treePositions = [];
  for (let i = 0; i < treesNeeded; i++) {
    const row = Math.floor(i / dotsPerRow);
    const col = i % dotsPerRow;
    
    treePositions.push({
      x: 20 + col * dotSpacing + Math.random() * 3, // Add slight randomness
      y: groundY - 30 - row * verticalSpacing,
      delay: i * 8, // Faster animation
      size: dotSize + Math.random() * 3,
      color: treeColors[Math.floor(Math.random() * treeColors.length)],
    });
  }

  // Animate ALL trees as colorful dots growing from the ground
  treePositions.forEach((pos, i) => {
    const dot = svg
      .append("circle")
      .attr("cx", pos.x)
      .attr("cy", groundY) // Start from ground
      .attr("r", 0)
      .attr("fill", pos.color)
      .attr("stroke", "rgba(255,255,255,0.4)")
      .attr("stroke-width", 1);

    // Animate dot growing and rising
    setTimeout(() => {
      dot
        .transition()
        .duration(600)
        .ease(d3.easeBackOut)
        .attr("r", pos.size)
        .attr("cy", pos.y)
        .style("filter", "drop-shadow(0px 2px 3px rgba(0,0,0,0.3))");

      // Add subtle pulse animation
      function pulse() {
        dot
          .transition()
          .duration(2000 + Math.random() * 1000)
          .ease(d3.easeSinInOut)
          .attr("r", pos.size * 1.15)
          .transition()
          .duration(2000 + Math.random() * 1000)
          .ease(d3.easeSinInOut)
          .attr("r", pos.size)
          .on("end", pulse);
      }
      
      // Start pulsing after initial animation
      if (Math.random() > 0.7) { // Only some dots pulse to avoid too much movement
        setTimeout(pulse, 1000);
      }
    }, pos.delay);
  });

  // Progress indicator
  const progressText = svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 180)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("fill", "#2d5016")
    .style("font-weight", "bold")
    .style("opacity", 0)
    .text("🌱 Forest Growing...");

  progressText
    .transition()
    .delay(500)
    .duration(1000)
    .style("opacity", 1)
    .transition()
    .delay(treesNeeded * 8)
    .duration(1000)
    .style("opacity", 0);

  // Completion message
  setTimeout(() => {
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 180)
      .attr("text-anchor", "middle")
      .style("font-size", "20px")
      .style("fill", "#059669")
      .style("font-weight", "bold")
      .style("opacity", 0)
      .text(`✓ ${treesNeeded.toLocaleString()} Trees Complete!`)
      .transition()
      .duration(1000)
      .style("opacity", 1);
  }, treesNeeded * 8 + 1500);

  // Calculate real-world comparison
  function getTreeComparison(numTrees) {
    if (numTrees < 50) {
      return `That's about <strong>half a neighborhood block</strong> of trees! 🏘️`;
    } else if (numTrees < 150) {
      return `That's roughly <strong>1 football field</strong> covered in trees! ⚽`;
    } else if (numTrees < 300) {
      return `That's about <strong>2-3 football fields</strong> of forest! 🏟️`;
    } else if (numTrees < 500) {
      return `That's equivalent to <strong>a small city park</strong>! 🏞️`;
    } else if (numTrees < 1000) {
      return `That's like <strong>5+ football fields</strong> or a large urban park! 🌳`;
    } else if (numTrees < 2500) {
      return `That's <strong>10+ acres</strong> of forest - bigger than 7 football fields! 🌲`;
    } else if (numTrees < 5000) {
      return `That's <strong>a small forest</strong> of 20+ acres! 🏔️`;
    } else if (numTrees < 10000) {
      return `That's <strong>a medium-sized forest</strong> of 40+ acres - like Central Park! 🌲`;
    } else {
      return `That's <strong>an entire forest reserve</strong> of ${Math.round(numTrees / 250)} acres! 🏔️`;
    }
  }

  // Bottom info panel
  vizContainer
    .append("div")
    .style("margin-top", "20px")
    .style("padding", "20px")
    .style("background", "#f3f4f6")
    .style("border-radius", "8px")
    .style("text-align", "center")
    .html(`
      <p style="margin: 0 0 15px 0; font-size: 16px; color: #059669; line-height: 1.6; font-weight: 600;">
        📏 ${getTreeComparison(treesNeeded)}
      </p>
      <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6;">
        🌲 Each mature tree absorbs approximately <strong>22 kg of CO₂ per year</strong>.<br>
        🌍 It would take <strong>${treesNeeded.toLocaleString()} trees</strong> growing for one year to offset your emissions by 2100.<br>
        💚 Or plant <strong>${Math.ceil(treesNeeded / 75).toLocaleString()} trees now</strong> and let them grow for 75 years!
      </p>
    `);
}