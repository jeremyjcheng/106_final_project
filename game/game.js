const emissionsData = {
  vacation: {
    // Source: ICAO Carbon Calculator, DEFRA 2023
    "International flight": 900,   // typical long-haul roundtrip ≈ 0.9 t
    "Domestic flight": 239,        // US EPA domestic average
    "Multiple flights per year": 598, // 2–3 short flights combined
    // Source: IEA mobility & EEA train/bus LCAs
    "Road trip (gas car)": 172,
    "Road trip (electric vehicle)": 44,
    "Train or bus vacation": 20    // EEA: 14–20 kg for ~1000 km
  },

  commute: {
    // calculated dynamically — placeholder zeros
    "Walk/Bike": 0,
    "Public transit": 0,
    "Drive small car": 0,
    "Drive SUV": 0,
    "Drive EV": 0,
  },

  distance: {
    "Short (0–5 miles)": 0,
    "Medium (5–20 miles)": 0,
    "Long (20–50+ miles)": 0,
  },

  shopping: {
    // Sources: IGES 1.5°C Lifestyles Report (2021)
    "Buy frequently from global stores": 1000,   // high-consumption lifestyle
    "Buy less and buy local": 350,              // reduced logistics footprint
    "Buy second-hand": 60                       // IGES low-consumption: 50–100 kg
  },

  diet: {
    // Source: Poore & Nemecek (Science, 2018)
    "High-meat diet": 4435,     // 4.4 t for high beef/animal product consumption
    "Moderate-meat diet": 2385, // mixed diet ~2.3 t
    Vegetarian: 700,            // 0.6–0.9 t based on LCA
    Vegan: 350                  // low-end vegan: 0.3–0.4 t
  },

  housing: {
    // Sources: ADEME (France), UK Climate Change Committee, IEA Buildings LCA
    Apartment: 850,        // Efficient apartment: 0.6–0.9 t
    "Small house": 1800,   // small detached: 1.5–2.0 t
    "Large house": 3500    // large detached: 3.0–4.0 t depending on heating fuel
  },
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

function calculateCommuteEmissions(commuteChoice, distanceChoice) {
  // Emission intensities (kg CO₂ per mile)
  const intensity_kg_per_mile = {
    "Walk/Bike": 0,            // no fuel, 0 emissions
    "Public transit": 0.150,   // 150 g/mile → 0.150 kg/mile
    "Drive small car": 0.404,  // 404 g/mile → 0.404 kg/mile
    "Drive SUV": 0.650,        // 650 g/mile → 0.650 kg/mile
    "Drive EV": 0.100          // 100 g/mile → 0.100 kg/mile (US grid average)
  };

  // Annual miles for each distance tier (miles per year)
  const annualMiles = {
    "Short (0–5 miles)": 1000,   // ~4 miles/day × 250 days
    "Medium (5–20 miles)": 4000, // ~16 miles/day × 250 days
    "Long (20–50+ miles)": 10000 // ~40 miles/day × 250 days
  };

  // Get intensity and annual miles
  const intensity = intensity_kg_per_mile[commuteChoice] || 0;
  const miles = annualMiles[distanceChoice] || 0;

  // Calculate: kg CO₂ per mile × miles per year = kg CO₂ per year
  return intensity * miles;
}

function createTitleSlide() {
  const container = d3.select(".slides-container");

  const titleSlide = container
    .append("div")
    .attr("class", "slide title-slide active") // first slide starts active
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("justify-content", "center")
    .style("align-items", "center")
    .style("height", "100vh")
    .style("background", "linear-gradient(135deg, #293aa8 0%, #5c3db2 50%, #7A3E9D 100%)")
    .style("color", "white")
    .style("text-align", "center");

  // Title
  titleSlide
    .append("h1")
    .html("Climate Choices Game 🌍 ")
    .style("font-size", "4rem")
    .style("font-weight", "800")
    .style("color", "white")
    .style("text-shadow", "2px 2px 8px rgba(0,0,0,0.7)")
    .style("margin-bottom", "1rem");

  // Subtitle
  titleSlide
    .append("p")
    .text("Make choices to see your carbon impact!")
    .style("font-size", "2rem")
    .style("margin-bottom", "2rem")
    .style("text-shadow", "1px 1px 6px rgba(0,0,0,0.6)");

  // Start button
  const startBtn = titleSlide
    .append("button")
    .attr("id", "start-game")
    .text("Start Game")
    .style("padding", "1rem 2.5rem")
    .style("font-size", "1.3rem")
    .style("border-radius", "12px")
    .style("border", "none")
    .style("background", "#ff6ec4")
    .style("color", "white")
    .style("cursor", "pointer")
    .style("box-shadow", "0 4px 10px rgba(0,0,0,0.3)")
    .on("mouseover", function () {
      d3.select(this).style("background", "#7873f5");
    })
    .on("mouseout", function () {
      d3.select(this).style("background", "#ff6ec4");
    })
    .on("click", () => {
      nextSlide(); // go to first question slide
    });

  return titleSlide;
}


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
// Initialize the game
function initGame() {
  // Clear container
  d3.select(".slides-container").selectAll("*").remove();
  
  // Create title slide
  createTitleSlide();
  
  // Create all question slides
  createSlides();
  
  // Update slides array to include ALL slides (title + questions + results)
  slides = document.querySelectorAll(".slide");
  
  // Ensure title slide is active
  updateSlide();
}

// Start the game
initGame();

// Add keyboard navigation (only needs to be attached once)
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    nextSlide();
  } else if (e.key === "ArrowLeft") {
    // Prevent going back from title slide (index 0)
    if (currentSlide > 0) {
      prevSlide();
    }
  }
})


// Generate slides for each category
function createSlides() {
  const container = d3.select(".slides-container");
  const totalQuestions = Object.keys(categories).length;
  let slideIndex = 0;

  for (const category in categories) {
    const currentQuestionNum = slideIndex + 1;
    const slide = container.append("div").attr("class", "slide");
    
    // Add progress indicator
    const progress = slide.append("div")
      .style("text-align", "center")
      .style("margin-bottom", "30px");
    
    progress.append("div")
      .style("font-size", "26px")
      .style("color", "white")
      .style("margin-bottom", "15px")
      .style("font-weight", "700")
      .style("text-shadow", "2px 2px 4px rgba(0,0,0,0.2)")
      .text(`Question ${currentQuestionNum} of ${totalQuestions}`);
    
    // Progress bar
    const progressBar = progress.append("div")
      .style("width", "500px")
      .style("height", "16px")
      .style("background", "rgba(255, 255, 255, 0.3)")
      .style("border-radius", "20px")
      .style("margin", "0 auto")
      .style("overflow", "hidden")
      .style("box-shadow", "0 2px 8px rgba(0,0,0,0.15)");
    
    progressBar.append("div")
      .style("width", `${(currentQuestionNum / totalQuestions) * 100}%`)
      .style("height", "100%")
      .style("background", "linear-gradient(90deg, #10b981, #34d399)")
      .style("border-radius", "20px")
      .style("transition", "width 0.5s ease")
      .style("box-shadow", "0 0 10px rgba(16, 185, 129, 0.5)");
    
    // Category icon mapping
    const categoryIcons = {
      vacation: "✈️",
      commute: "🚗",
      distance: "📍",
      shopping: "🛍️",
      diet: "🍽️",
      housing: "🏠"
    };
    
    // Enhanced heading with icon
    slide.append("div")
      .style("text-align", "center")
      .style("margin", "30px 0 40px 0")
      .html(`
        <div style="font-size: 80px; margin-bottom: 25px; filter: drop-shadow(3px 3px 6px rgba(0,0,0,0.2));">${categoryIcons[category]}</div>
        <h2 style="font-size: 46px; color: white; font-weight: 800; margin: 0; text-shadow: 2px 2px 8px rgba(0,0,0,0.3);">${categories[category]}</h2>
      `);

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

    // Add back button to each question slide (except first)
    if (slideIndex > 0) {
      const backBtn = slide
        .append("button")
        .attr("class", "back-button")
        .text("← Back")    .style("background", "white")
        .style("color", "#1f2937");

      backBtn.on("click", () => {
        prevSlide();
      });
    }

    slideIndex++;
  }
  // END OF FOR LOOP - All question slides created above

  // Add final slide for total emissions
  const resultSlide = container.append("div").attr("class", "slide");
  resultSlide
    .append("h1")
    .text("Your Carbon Impact")
    .style("font-size", "48px")
    .style("font-weight", "700")
    .style("margin-bottom", "20px")
    .style("color", "white");
  
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
    .text("← Back")
    .style("background", "white")
    .style("color", "#1f2937");

  backBtn.on("click", () => {
    prevSlide();
  });

  // Add Start Over button
  const startOverBtn = buttonContainer
    .append("button")
    .attr("class", "start-over-button")
    .attr("id", "start-over-btn")
    .text("Start Over")
    .style("background", "white")
    .style("color", "#1f2937");

  startOverBtn.on("click", () => {
    resetGame();
  });

  // Collect all slides AFTER they're all created
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

  if (totalEmissions < 2300) {
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
    .style("font-family", "Georgia, serif")
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
    .style("font-family", "Georgia, serif")
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
    .style("font-family", "Georgia, serif")
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
    .style("font-family", "Georgia, serif")
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
  
  // Calculate emissions for each category
  for (const cat in userChoices) {
    if (userChoices[cat]) {
      // Special handling for commute + distance
      if (cat === 'commute' || cat === 'distance') {
        continue; // Skip these, we'll handle them together below
      }
      total += emissionsData[cat][userChoices[cat]];
    }
  }
  
  // Handle commute + distance together
  if (userChoices.commute && userChoices.distance) {
    const commuteEmissions = calculateCommuteEmissions(
      userChoices.commute, 
      userChoices.distance
    );
    total += commuteEmissions;
  }

  // Calculate 2100 total (75 years of emissions)
  const total2100 = total * 75;

  // Classify emissions - simplified to two categories
  let classification = "";
  let classColor = "";

  if (total <= 2300) {
    classification = "🌱 Low Emissions Pathway";
    classColor = "#2e8b57";
  } else {
    classification = "⚠️ High Emissions Pathway";
    classColor = "#d9534f";
  }

  let extremeRainfallDays = getExtremeRainfallDays(total);
  let lowEmissionImpact = getLowEmissionImpact(total);

  // Use requestAnimationFrame to prevent blocking the UI
  requestAnimationFrame(() => {
    d3.select("#final-emissions").html(`
        
        <!-- SECTION 1: ANNUAL EMISSIONS & COMPARISON -->
        <div style="background: #f0f9ff; border: 3px solid #3b82f6; border-radius: 20px; padding: 40px; margin-bottom: 60px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; border-radius: 30px; font-size: 1.3em; font-weight: bold; margin-bottom: 15px;">
               YOUR ANNUAL EMISSIONS
            </div>
            <p style="color: #1e40af; font-size: 1.1em; margin: 15px 0 0 0;">
              Let's see how your yearly emissions compare to others <strong>per year</strong> 
            </p>
          </div>
          
          <div style="background: white; border-radius: 16px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto;">
            <div style="text-align: center;">
              <div style="font-size: 0.9em; color: #6b7280; margin-bottom: 10px;">Annual Emissions</div>
              <div style="font-size: 4em; font-weight: bold; color: #3b82f6;">${total.toLocaleString()}</div>
              <div style="font-size: 1.2em; color: #6b7280;">kg CO₂/year</div>
              <div style="display: inline-block; background: ${classColor === '#2e8b57' ? 'rgba(46,139,87,0.1)' : 'rgba(217,83,79,0.1)'}; padding: 12px 30px; border-radius: 30px; font-size: 1.1em; font-weight: 700; border: 2px solid ${classColor}; color: ${classColor}; margin-top: 20px;">${classification}</div>
            </div>
          </div>
        
          
          <div id="annual-comparison" style="margin-top: 30px;"></div>
        </div>
        
        <!-- DIVIDER -->
        <div style="display: flex; align-items: center; gap: 20px; margin: 60px 0; color: #6b7280;">
          <div style="flex: 1; height: 2px; background: #cbd5e0;"></div>
          <div style="font-size: 1.5em; font-weight: bold; padding: 10px 20px; background: #f3f4f6; border-radius: 30px;">
            FAST FORWARD TO 2100
          </div>
          <div style="flex: 1; height: 2px; background: #cbd5e0;"></div>
        </div>
        
        <!-- SECTION 2: LIFETIME EMISSIONS & VISUALIZATIONS -->
        <div style="background: #fef3c7; border: 3px solid #f59e0b; border-radius: 20px; padding: 40px; margin-bottom: 40px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; border-radius: 30px; font-size: 1.3em; font-weight: bold; margin-bottom: 15px;">
               YOUR LIFETIME IMPACT (BY 2100)
            </div>
            <p style="color: #92400e; font-size: 1.1em; margin: 15px 0 0 0;">
              If you maintain these habits for <strong>75 years</strong>, here's your total environmental impact
            </p>
          </div>
          
          <div style="background: white; border-radius: 16px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto;">
            <div style="text-align: center;">
              <div style="font-size: 0.9em; color: #6b7280; margin-bottom: 10px;">Lifetime Total (2025 → 2100)</div>
              <div style="font-size: 4em; font-weight: bold; color: #f59e0b;">${total2100.toLocaleString()}</div>
              <div style="font-size: 1.2em; color: #6b7280; margin-bottom: 15px;">kg CO₂ total</div>
              <div style="font-size: 0.9em; color: #6b7280; padding: 10px; background: #f9fafb; border-radius: 8px;">
                <strong>${total.toLocaleString()} kg/year</strong> × <strong>75 years</strong> = <strong>${total2100.toLocaleString()} kg</strong>
              </div>
            </div>
          </div>
          
          <div style="background: rgba(245, 158, 11, 0.1); padding: 20px; border-radius: 12px; margin-top: 30px; text-align: center; border: 2px dashed #f59e0b;">
            <strong style="color: #92400e;">💡 Note:</strong>
            <span style="color: #92400e;"> The visualizations below show this 75-year total in real-world terms</span>
          </div>
          
          <div id="co2-equivalency" style="margin-top: 30px;"></div>
        </div>

        <div class="results-info-box" style="background:rgb(230, 245, 255); padding: 30px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border-left: 5px solid #3b82f6;">
          <h4 style="margin: 0 0 15px 0; font-size: 1.2em; color: #1e40af;"> How Carbon Emissions Affect Precipitation</h4>
          <p style="line-height: 1.8; color: #1e40af; margin: 0; font-size: 20px;">
            Carbon dioxide traps heat in Earth's atmosphere. Warmer air holds approximately 7% more moisture 
            per degree Celsius of warming. This extra moisture leads to more intense precipitation events 
            and increases the frequency of extreme rainfall days, resulting in flooding, erosion, and 
            infrastructure damage.
          </p>
        </div>
        
        <div class="results-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px; margin-bottom: 30px;">
          <div class="results-box" style="background:rgb(230, 245, 255); padding: 25px; border-radius: 16px; box-shadow: 0 4px 15px #f0f9ff;">
            <h4 style="margin: 0 0 20px 0; font-size: 1.2em; color: #1e40af;"> Your Precipitation Impact</h4>
            <div id="precipitation-chart"></div>
          </div>
      
          
          <div class="results-box" style="background: rgb(230, 245, 255); padding: 25px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <h4 style="margin: 0 0 20px 0; font-size: 1.2em; color: #1e40af;">Extreme Weather Events</h4>
            <div style="background: #fef3c7; padding: 20px; border-radius: 12px; margin-bottom: 15px; border-left: 4px solid #f59e0b;">
              <div style="font-size: 0.9em; color: #92400e; margin-bottom: 5px;">Your Scenario</div>
              <div style="font-size: 2.5em; font-weight: bold; color: #d97706;">${extremeRainfallDays.current}</div>
              <div style="font-size: 0.9em; color:rgb(171, 168, 166);">extreme rainfall days/year</div>
            </div>
            <div style="background: #d1fae5; padding: 20px; border-radius: 12px; border-left: 4px solid #10b981;">
              <div style="font-size: 0.9em; color: #065f46; margin-bottom: 5px;">Low Emission Goal</div>
              <div style="font-size: 2.5em; font-weight: bold; color: #059669;">${extremeRainfallDays.lowEmission}</div>
              <div style="font-size: 0.9em; color: #065f46;">extreme rainfall days/year</div>
            </div>
            <p style="margin-top: 15px; font-size: 0.85em; color: #6b7280; line-height: 1.5;">
              <em>Extreme rainfall causes flooding, landslides, and infrastructure damage.</em>
            </p>
          </div>
        </div>
        
        <div class="results-info-box" style="background: linear-gradient(135deg, #fef3c7 100%,#fef3c7 100%); padding: 30px; border-radius: 16px; color: white; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          <h4 style="margin: 0 0 15px 0; font-size: 1.5em;color: #d97706;">💡 Understanding Your Impact</h4>
          <p style="line-height: 1.8; color: #d97706; margin: 0; font-size: 20px;">${lowEmissionImpact}</p>
        </div>
        

      `);

    // Create the D3 chart after the HTML is inserted (defer heavy operations)
    requestAnimationFrame(() => {
      createPrecipitationChart("precipitation-chart", total);

      // Create percentile viz in annual section
      setTimeout(() => {
        createPercentileViz('annual-comparison', total);
      }, 100);

      // Create CO2 equivalencies visualization with slight delay
      setTimeout(() => {
        showCO2Equivalencies(total, total2100);
      }, 200);
    });
  });
}
function getExtremeRainfallDays(total) {
  let current, lowEmission;
  
  if (total <= 2300) {  // ≤2 tonnes CO2/year
    // Low Emission Scenario (SSP1-2.6)
    // User is on track with 2030 targets
    current = 15;
    lowEmission = 10;
  } else {
    // High Emission Scenario (SSP5-8.5)
    // User exceeds sustainable pathway
    current = 30;
    lowEmission = 10;
  }
  
  return { current, lowEmission };
}

function getLowEmissionImpact(total) {
  if (total > 2300) {
    return "Your current emissions exceed sustainable levels and contribute to a 4°C+ warming scenario. This pathway leads to dramatically increased extreme weather events, including severe flooding and precipitation extremes. Small changes in your habits can make a significant difference.";
  } else {
    return "You're aligned with the global climate target to limit warming to 1.5-2°C. Your lifestyle choices help prevent the worst impacts of climate change, including extreme rainfall events and flooding.";
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

  // Reset slide index to title slide
  currentSlide = 0;

  // Remove all slides except title slide
  const container = d3.select(".slides-container");
  container.selectAll(".slide:not(.title-slide)").remove();

  // Clear slides array
  slides = [];

  // Recreate all question slides
  createSlides();

  // Show title slide
  updateSlide();
}

function showCO2Equivalencies(total, total2100) {
  // --- Equivalency math based on LIFETIME emissions ---
  const equivalencies = [
    {
      label: "Miles of driving",
      value: Math.round(total2100 / 0.404),
      type: "driving",
    },
    {
      label: "Hours of lighting",
      value: Math.round((total2100 / 0.417) * 10),
      type: "lighting",
    },
    { label: "Burgers 🍔", value: Math.round(total2100 / 5), type: "burgers" },
    {
      label: "Trees to absorb it",
      value: Math.ceil(total2100 / 22),
      type: "trees",
      total2100: total2100,
    },
  ];

  // Clear previous content
  const container = d3.select("#co2-equivalency");
  container.selectAll("*").remove();

  // Create individual viz containers
  equivalencies.forEach((eq, index) => {
    const vizBox = container
      .append("div")
      .style("margin-bottom", "40px")
      .style("padding", "25px")
      .style("background", "#f8f9fa")
      .style("border-radius", "16px")
      .style("border", "2px solid #e2e8f0")
      .style("transition", "all 0.3s ease")
      .on("mouseenter", function() {
        d3.select(this)
          .style("border-color", "#3b82f6")
          .style("box-shadow", "0 4px 12px rgba(59, 130, 246, 0.2)");
      })
      .on("mouseleave", function() {
        d3.select(this)
          .style("border-color", "#e2e8f0")
          .style("box-shadow", "none");
      });

    // Only show the header for non-percentile visualizations
    if (eq.type !== "percentile") {
      vizBox
        .append("h4")
        .style("text-align", "center")
        .style("margin-bottom", "20px")
        .style("color", "#1f2937")
        .style("font-size", "1.4em")
        .html(`<span style="font-size: 2em; font-weight: bold; color: #3b82f6;">${eq.value.toLocaleString()}</span><br><span style="font-size: 0.8em; color: #6b7280;">${eq.label}</span>`);
    }

    // Add city input for driving visualization ONLY (using D3 only)
    if (eq.type === "driving") {
      const inputForm = vizBox
        .append("form")
        .attr("id", "city-input-form")
        .style("text-align", "center")
        .style("margin-bottom", "20px")
        .on("submit", function(event) {
          event.preventDefault();
          const cityName = d3.select("#city-input").property("value").trim();
          if (cityName) {
            d3.select("#city-message")
              .text("Loading new map...")
              .style("color", "#3b82f6");
            d3.select(`#viz-${eq.type}`).selectAll("*").remove();
            createDrivingViz(`viz-${eq.type}`, eq.value, cityName);
          } else {
            d3.select("#city-message")
              .text("Please enter a city name")
              .style("color", "#dc2626");
          }
        });

      inputForm
        .append("label")
        .style("font-size", "14px")
        .style("color", "#475569")
        .style("margin-right", "10px")
        .text("Your city: ");

      inputForm
        .append("input")
        .attr("type", "text")
        .attr("id", "city-input")
        .attr("placeholder", "e.g., San Diego, CA")
        .style("padding", "8px 12px")
        .style("border", "2px solid #cbd5e0")
        .style("border-radius", "6px")
        .style("font-size", "20px")
        .style("width", "200px")
        .style("margin-right", "10px");

      const submitBtn = inputForm
        .append("button")
        .attr("type", "submit")
        .attr("id", "city-submit")
        .style("padding", "8px 16px")
        .style("background", "#3b82f6")
        .style("color", "white")
        .style("border", "none")
        .style("border-radius", "6px")
        .style("font-size", "20px")
        .style("cursor", "pointer")
        .style("font-weight", "600")
        .text("Show Route");

      submitBtn
        .on("mouseenter", function () {
          d3.select(this).style("background", "#2563eb");
        })
        .on("mouseleave", function () {
          d3.select(this).style("background", "#3b82f6");
        });

      vizBox
        .append("div")
        .attr("id", "city-message")
        .style("text-align", "center")
        .style("margin-top", "10px")
        .style("font-size", "13px")
        .style("min-height", "20px")
        .style("color", "#059669")
        .style("font-weight", "600")
        .text("💡 Default: San Diego, CA. Enter your city to update the route!");
    }

    // Create the viz container div
    const vizId = `viz-${eq.type}`;
    vizBox.append("div").attr("id", vizId);

    // Create visualizations with staggered loading for better performance
    // Use requestAnimationFrame for smoother rendering
    setTimeout(() => {
      requestAnimationFrame(() => {
        if (eq.type === "percentile") {
          createPercentileViz(vizId, eq.value);
        } else if (eq.type === "driving") {
          // Show default map with San Diego as starting point
          createDrivingViz(vizId, eq.value, "San Diego, CA");
        } else if (eq.type === "lighting") {
          createLightingViz(vizId, eq.value);
        } else if (eq.type === "burgers") {
          createFoodComparison(`#${vizId}`, eq.value);
        } else if (eq.type === "trees") {
          createTreesViz(vizId, eq.value, eq.total2100);
        }
      });
    }, index * 300); // Increased delay slightly for better performance
  });
}

// Function to calculate percentile based on emissions
function getEmissionsPercentile(totalEmissions) {
  // Updated real-world global distribution (kg CO2 per year per person)
  // Based on Global Carbon Project + OWID
  const benchmarks = [
    { percentile: 1,  emissions: 700,    label: "Ultra Low",      description: "bottom 1% globally" },
    { percentile: 5,  emissions: 1200,   label: "Very Low",       description: "bottom 5% globally" },
    { percentile: 10, emissions: 2000,   label: "Low",            description: "bottom 10% globally" },
    { percentile: 25, emissions: 3000,   label: "Below Average",  description: "bottom 25% globally" },
    { percentile: 50, emissions: 4700,   label: "Average",        description: "global median" },
    { percentile: 75, emissions: 8000,   label: "Above Average",  description: "top 25% globally" },
    { percentile: 90, emissions: 10000,  label: "High",           description: "top 10% globally" },
    { percentile: 95, emissions: 15000,  label: "Very High",      description: "top 5% globally" },
    { percentile: 99, emissions: 25000,  label: "Ultra High",     description: "top 1% globally" }
  ];
  
  for (let i = 0; i < benchmarks.length; i++) {
    if (totalEmissions <= benchmarks[i].emissions) {
      return benchmarks[i];
    }
  }

  return { 
    percentile: 99.9,
    emissions: totalEmissions,
    label: "Extreme",
    description: "top 0.1% globally"
  };
}

// Function to get color based on percentile
function getPercentileColor(percentile) {
  if (percentile <= 10) return "#10b981"; // Green - Low
  if (percentile <= 25) return "#3b82f6"; // Blue - Below Average
  if (percentile <= 50) return "#f59e0b"; // Orange - Average
  if (percentile <= 75) return "#ef4444"; // Red - Above Average
  if (percentile <= 90) return "#dc2626"; // Dark Red - High
  return "#991b1b"; // Darker Red - Very High
}

// Function to create percentile visualization card
function createPercentileViz(containerId, totalEmissions) {
  const container = d3.select(`#${containerId}`);
  container.selectAll("*").remove();
  
  const percentileData = getEmissionsPercentile(totalEmissions);
  const color = getPercentileColor(percentileData.percentile);
  
  // Create card
  const card = container
    .append("div")
    .style("background", "white")
    .style("border-radius", "16px")
    .style("padding", "30px")
    .style("box-shadow", "0 10px 25px rgba(0,0,0,0.1)")
    .style("max-width", "500px")
    .style("margin", "0 auto");
  
  // Title
  card
    .append("h3")
    .style("text-align", "center")
    .style("margin", "0 0 25px 0")
    .style("font-size", "24px")
    .style("font-weight", "700")
    .style("color", "#1f2937")
    .text("How You Compare");
  
  // Emissions label
  card
    .append("div")
    .style("text-align", "center")
    .style("font-size", "16px")
    .style("color", "#6b7280")
    .style("margin-bottom", "10px")
    .text("Your Annual Emissions");
  
  // Emissions amount
  card
    .append("div")
    .style("text-align", "center")
    .style("font-size", "48px")
    .style("font-weight", "bold")
    .style("color", color)
    .style("margin-bottom", "20px")
    .text(`${totalEmissions.toLocaleString()} kg`);
  
  // Percentile badge
  const badge = card
    .append("div")
    .style("text-align", "center")
    .style("margin", "20px 0");
  
  badge
    .append("span")
    .style("display", "inline-block")
    .style("background", color)
    .style("color", "white")
    .style("padding", "12px 30px")
    .style("border-radius", "30px")
    .style("font-weight", "bold")
    .style("font-size", "20px")
    .style("letter-spacing", "1px")
    .text(percentileData.label.toUpperCase());
  
  // Percentile description
  card
    .append("div")
    .style("text-align", "center")
    .style("font-size", "18px")
    .style("color", "#374151")
    .style("margin-top", "15px")
    .style("font-weight", "600")
    .html(`You emit <span...>less than ${100 - percentileData.percentile}%</span> of people`);
  
  // Additional context
  card
    .append("div")
    .style("text-align", "center")
    .style("font-size", "14px")
    .style("color", "#6b7280")
    .style("margin-top", "8px")
    .text(`(You're in the ${percentileData.description})`);
  
  // Divider
  card
    .append("hr")
    .style("border", "none")
    .style("border-top", "1px solid #e5e7eb")
    .style("margin", "25px 0");
  
// Context information container
const contextBox = card
  .append("div")
  .style("background", "#f9fafb")
  .style("border-radius", "8px")
  .style("padding", "15px")
  .style("margin-top", "20px");

// Basic stats
contextBox
  .append("div")
  .style("font-size", "16px") // smaller font
  .style("color", "#374151")
  .style("line-height", "1.5")
  .html(`
    <strong>📊 Context:</strong><br>
    • Global average: ~4,000 kg CO₂/year<br>
    • US average: ~16,000 kg CO₂/year<br>
    • Low emissions pathway target (SSP1-2.6): ~2,300 kg CO₂/year by 2070
  `);

  // Progress bar showing where user falls
  const progressContainer = card
    .append("div")
    .style("margin-top", "25px");
  
  progressContainer
    .append("div")
    .style("font-size", "20px")
    .style("color", "#6b7280")
    .style("margin-bottom", "10px")
    .text("Your position:");
  
  const progressBar = progressContainer
    .append("div")
    .style("width", "100%")
    .style("height", "30px")
    .style("background", "linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #dc2626 100%)")
    .style("border-radius", "15px")
    .style("position", "relative")
    .style("box-shadow", "inset 0 2px 4px rgba(0,0,0,0.1)");
  
  // Marker on progress bar
  progressBar
    .append("div")
    .style("position", "absolute")
    .style("left", `${percentileData.percentile}%`)
    .style("top", "50%")
    .style("transform", "translate(-50%, -50%)")
    .style("width", "20px")
    .style("height", "20px")
    .style("background", "white")
    .style("border", `3px solid ${color}`)
    .style("border-radius", "50%")
    .style("box-shadow", "0 2px 8px rgba(0,0,0,0.3)");
  
  // Labels under progress bar
  const labelsContainer = progressContainer
    .append("div")
    .style("display", "flex")
    .style("justify-content", "space-between")
    .style("margin-top", "8px")
    .style("font-size", "20px")
    .style("color", "#6b7280");
  
  labelsContainer
    .append("span")
    .text("Low");
  
  labelsContainer
    .append("span")
    .text("Average");
  
  labelsContainer
    .append("span")
    .text("High");
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

      // Create map container using D3
      const mapDiv = container
        .append("div")
        .attr("id", `map-${containerId}`)
        .style("width", "100%")
        .style("height", "450px")
        .style("border-radius", "8px")
        .style("overflow", "hidden")
        .style("box-shadow", "0 4px 6px rgba(0,0,0,0.1)");

      // Initialize Mapbox (must use native API, not D3)
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: `map-${containerId}`,
        style: "mapbox://styles/mapbox/streets-v12",
        center: startCoords,
        zoom: 3,
        interactive: true,
      });

      // Add navigation controls (native Mapbox)
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

        // Add start marker - create element with D3
        const startMarkerEl = d3.create("div")
          .attr("class", "custom-marker")
          .style("font-size", "36px")
          .style("cursor", "pointer")
          .text("🏠")
          .node();

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

        // Add end marker - create element with D3
        const endMarkerEl = d3.create("div")
          .attr("class", "custom-marker")
          .style("font-size", "36px")
          .style("cursor", "pointer")
          .text("🏁")
          .node();

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

        // Info text below map - using D3
        container
          .append("p")
          .style("text-align", "center")
          .style("margin-top", "15px")
          .style("color", "#1f2937")
          .style("font-size", "20px")
          .style("line-height", "1.6")
          .html(`🚗 That's like driving from <strong>${
          startCityName.split(",")[0]
        }</strong> to <strong>${destination.name}</strong>!<br>
                 📏 Route distance: <strong>~${actualDistance.toLocaleString()} miles</strong> | 
                 💨 CO₂ equivalent: <strong>${miles.toLocaleString()} miles</strong>`);

        // Optimized car animation using requestAnimationFrame
        const steps = 150;
        let carStep = 0;
        let animationId = null;
        let lastTime = 0;
        const frameDelay = 40; // Target 25fps

        const carMarkerEl = d3.create("div")
          .style("font-size", "32px")
          .style("filter", "drop-shadow(2px 2px 4px rgba(0,0,0,0.3))")
          .text("🚗")
          .node();

        const car = new mapboxgl.Marker({ element: carMarkerEl })
          .setLngLat(startCoords)
          .addTo(map);

        function animateCar(timestamp) {
          if (!lastTime) lastTime = timestamp;
          const elapsed = timestamp - lastTime;

          if (elapsed >= frameDelay) {
            if (carStep <= steps) {
              const progress = carStep / steps;
              const coordIndex = Math.floor(
                progress * (routeCoords.length - 1)
              );
              if (routeCoords[coordIndex]) {
                car.setLngLat(routeCoords[coordIndex]);
              }
              carStep++;
              lastTime = timestamp;
            } else {
              // Loop animation after pause
              carStep = 0;
              lastTime = timestamp + 2000; // Pause for 2 seconds
            }
          }

          animationId = requestAnimationFrame(animateCar);
        }

        // Start animation after initial delay
        setTimeout(() => {
          animationId = requestAnimationFrame(animateCar);
        }, 1500);
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

// food comparison - NOW INTERACTIVE!
function createFoodComparison(containerId, burgers) {
  // DATA
  const foods = [
    { name: "Beef Meals", emoji: "🍔", co2PerItem: 6.0, color: "#ef4444" },       // Avg beef meal footprint
    { name: "Chicken Meals", emoji: "🍗", co2PerItem: 1.8, color: "#f97316" },   // Chicken is ~70% lower than beef
    { name: "Vegetarian Meals", emoji: "🥗", co2PerItem: 0.8, color: "#22c55e" } // Plant-based is lowest
  ];
  

  // Calculate values based on total CO2 (burgers * 5 kg CO2)
  const totalCO2 = burgers * 5;
  foods.forEach(food => {
    food.value = Math.round(totalCO2 / food.co2PerItem);
  });

  const container = d3.select(containerId);
  container.html(""); // clear

  // Add interactive explanation
  container
    .append("div")
    .style("text-align", "center")
    .style("margin-bottom", "5px")
    .style("padding", "15px")
    .style("background", "#eff6ff")
    .style("border-radius", "8px")
    .style("border", "2px solid #3b82f6")
    .html(`
      <div style="font-size: 0.9em; color: #1e40af; line-height: 1.6;">
        <strong>💡 Interactive Comparison</strong><br>
        Your emissions equal <strong>${burgers.toLocaleString()} beef burgers</strong> (${totalCO2.toLocaleString()} kg CO₂).<br>
        Click the bars below to see equivalent meal counts!
      </div>
    `);

  // SVG SETUP
  const width = 800;
  const height = 300;

  const svg = container
    .append("svg")
    .attr("width", width - 10)
    .attr("height", height);

  const maxValue = d3.max(foods, (d) => d.value);
  const barHeight = 50;
  const barSpacing = 80;

  const xScale = d3
    .scaleLinear()
    .domain([0, maxValue])
    .range([0, width - 250]);

  // Info display area
  const infoBox = container
    .append("div")
    .attr("id", "food-info")
    .style("text-align", "center")
    .style("padding", "20px")
    .style("margin-top", "20px")
    .style("background", "#f9fafb")
    .style("border-radius", "12px")
    .style("min-height", "100px")
    .style("border", "2px solid #e5e7eb")
    .html(`<div style="color: #9ca3af; font-size: 1.1em;">👆 Click on a food type to learn more</div>`);

  // DRAW EACH ROW
  foods.forEach((food, i) => {
    const g = svg
      .append("g")
      .attr("transform", `translate(150,${i * barSpacing + 30})`)
      .style("cursor", "pointer");

    // EMOJI
    g.append("text")
      .attr("x", -90)
      .attr("y", barHeight / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "32px")
      .style("pointer-events", "none")
      .text(food.emoji);

    // LABEL
    g.append("text")
    .attr("x", 0)
    .attr("y", -10) // above bar
    .attr("text-anchor", "start")
    .style("font-size", "16px")
    .style("fill", "#666")
    .text(food.name);

    // ANIMATED BAR
    const bar = g.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 0)
      .attr("height", barHeight)
      .attr("fill", food.color)
      .attr("rx", 5)
      .style("transition", "all 0.3s ease");

    bar
      .transition()
      .duration(1500)
      .delay(i * 200)
      .attr("width", xScale(food.value));

    // VALUE TEXT (fade in)
    const valueText = g.append("text")
      .attr("x", 10)
      .attr("y", barHeight / 2 + 5)
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("fill", "white")
      .style("opacity", 0)
      .style("pointer-events", "none")
      .text(food.value.toLocaleString());

    valueText
      .transition()
      .duration(500)
      .delay(i * 200 + 1500)
      .style("opacity", 1);

    // CLICK INTERACTION
    g.on("click", function() {
      // Highlight selected bar
      svg.selectAll("rect")
        .transition()
        .duration(300)
        .style("opacity", 0.4);
      
      bar
        .transition()
        .duration(300)
        .style("opacity", 1);

      // Update info box
      const co2Info = food.co2PerItem === 5 ? "highest" : food.co2PerItem === 2 ? "moderate" : "lowest";
      const comparison = food.name === "Beef Meals"
      ? "Beef has the highest carbon footprint of any common protein. Cattle require large amounts of land, feed, and water, and they produce methane — making beef meals 3–4× more carbon-intensive than chicken and far higher than plant-based options."
      : food.name === "Chicken Meals"
      ? "Chicken has a significantly lower footprint than beef — about 70–80% fewer emissions per meal — because chickens require less land, less feed, and produce no methane."
      : "Plant-based meals have the lowest carbon footprint. They typically use 80–90% fewer emissions than beef and 50–70% fewer than chicken, making them the most climate-friendly choice.";
    

      infoBox
        .transition()
        .duration(300)
        .style("background", food.color === "#ef4444" ? "#fee2e2" : food.color === "#f97316" ? "#ffedd5" : "#dcfce7")
        .style("border-color", food.color);

      infoBox.html(`
        <div style="font-size: 3em; margin-bottom: 10px;">${food.emoji}</div>
        <div style="font-size: 1.5em; font-weight: bold; color: ${food.color}; margin-bottom: 10px;">
          ${food.value.toLocaleString()} ${food.name}
        </div>
        <div style="color: #374151; font-size: 1em; line-height: 1.6; margin-bottom: 10px;">
          <strong>~${food.co2PerItem} kg CO₂</strong> per meal (${co2Info} emissions)
        </div>
        <div style="color: #4b5563; font-size: 0.95em; line-height: 1.6;">
          ${comparison}
        </div>
      `);
    });

    // HOVER EFFECT
    g.on("mouseenter", function() {
      if (bar.style("opacity") !== "0.4") {
        bar
          .transition()
          .duration(200)
          .attr("width", xScale(food.value) + 10);
      }
    }).on("mouseleave", function() {
      if (bar.style("opacity") !== "0.4") {
        bar
          .transition()
          .duration(200)
          .attr("width", xScale(food.value));
      }
    });
  });

  // Reset button
  const resetBtn = container
    .append("button")
    .style("display", "block")
    .style("margin", "15px auto 0")
    .style("padding", "10px 20px")
    .style("background", "#6b7280")
    .style("color", "white")
    .style("border", "none")
    .style("border-radius", "8px")
    .style("cursor", "pointer")
    .style("font-weight", "600")
    .style("font-size", "0.9em")
    .text("Reset View")
    .on("click", function() {
      svg.selectAll("rect")
        .transition()
        .duration(300)
        .style("opacity", 1);
      
      infoBox
        .transition()
        .duration(300)
        .style("background", "#f9fafb")
        .style("border-color", "#e5e7eb");

      infoBox.html(`<div style="color: #9ca3af; font-size: 1.1em;">👆 Click on a food type to learn more</div>`);
    })
    .on("mouseenter", function() {
      d3.select(this).style("background", "#4b5563");
    })
    .on("mouseleave", function() {
      d3.select(this).style("background", "#6b7280");
    });
}
// 2. LIGHTING VISUALIZATION - Electricity bill card
function createLightingViz(containerId, hours) {
  const container = d3.select(`#${containerId}`);
  container.selectAll("*").remove();
  
  // Calculate electricity cost (average $0.13 per kWh, 60W bulb)
  const kWh = (hours * 60) / 1000;
  const cost = (kWh * 0.13).toFixed(2);
  
  // Create electricity bill card
  const card = container
    .append("div")
    .style("background", "linear-gradient(135deg, #667eea 0%, #764ba2 100%)")
    .style("border-radius", "16px")
    .style("padding", "30px")
    .style("color", "white")
    .style("box-shadow", "0 10px 25px rgba(0,0,0,0.2)")
    .style("max-width", "450px")
    .style("margin", "0 auto")
    .style("cursor", "pointer")
    .style("transition", "all 0.3s ease")
    .on("mouseenter", function () {
      d3.select(this)
        .style("transform", "translateY(-5px)")
        .style("box-shadow", "0 15px 35px rgba(0,0,0,0.3)");
    })
    .on("mouseleave", function () {
      d3.select(this)
        .style("transform", "translateY(0)")
        .style("box-shadow", "0 10px 25px rgba(0,0,0,0.2)");
    });
  
  // Header with lightbulb icon
  card
    .append("div")
    .style("text-align", "center")
    .style("font-size", "64px")
    .style("margin-bottom", "20px")
    .text("💡");
  
  // Divider
  card
    .append("hr")
    .style("border", "none")
    .style("border-top", "1px solid rgba(255,255,255,0.3)")
    .style("margin", "25px 0");
  
  // Savings message
  card
    .append("div")
    .style("text-align", "center")
    .style("font-size", "20px")
    .style("margin-bottom", "15px")
    .text("You could've saved:");
  
  // Cost display
  card
    .append("div")
    .style("text-align", "center")
    .style("font-size", "48px")
    .style("font-weight", "bold")
    .style("margin-bottom", "10px")
    .text(`$${cost}`);
  
  // kWh info
  card
    .append("div")
    .style("text-align", "center")
    .style("font-size", "20px")
    .style("opacity", "0.8")
    .style("margin-bottom", "20px")
    .text(`(${kWh.toFixed(1)} kWh @ $0.13/kWh)`);
  
  // Tip
  card
    .append("p")
    .style("text-align", "center")
    .style("margin-top", "20px")
    .style("font-size", "20px")
    .style("opacity", "0.8")
    .style("line-height", "1.5")
    .style("color", "white")
    .text("💡 Tip: LED bulbs use 75% less energy than traditional bulbs!");
}

// 3. TREES VISUALIZATION - Animated growing forest for 2100 emissions
function createTreesViz(containerId, treesNeeded, total2100) {
  const container = d3.select(`#${containerId}`);
  container.selectAll("*").remove();
  
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
      return `That's <strong>an entire forest reserve</strong> of ${Math.round(
        numTrees / 250
      )} acres! 🏔️`;
    }
  }
  
  // Create viz container (this was missing - you need to define vizContainer)
  const vizContainer = container.append("div");
  
  // Bottom info panel
  vizContainer
    .append("div")
    .style("margin-top", "20px")
    .style("padding", "20px")
    .style("background", "#f3f4f6")
    .style("border-radius", "8px")
    .style("text-align", "center")
    .html(`
      <p style="margin: 0 0 15px 0; font-size: 20px; color: #059669; line-height: 1.6; font-weight: 600;">
        📏 ${getTreeComparison(treesNeeded)}
      </p>
      <p style="margin: 0; font-size: 20px; color: #374151; line-height: 1.6;">
        🌲 Each mature tree absorbs approximately <strong>22 kg of CO₂ per year</strong>.<br>
        🌍 It would take <strong>${treesNeeded.toLocaleString()} trees</strong> growing for one year to offset your emissions by 2100.<br>
        💚 Or plant <strong>${Math.ceil(
          treesNeeded / 75
        ).toLocaleString()} trees now</strong> and let them grow for 75 years!
      </p>
    `);
}
