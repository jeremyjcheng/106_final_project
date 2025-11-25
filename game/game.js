const emissionsData = {
    vacation: { "International flight": 1000, "Domestic flight": 300, "Multiple flights per year": 2000, "Road trip (gas car)": 150, "Road trip (electric vehicle)": 50, "Train or bus vacation": 30 },
    commute: { "Walk/Bike": 0, "Public transit": 20, "Drive small car": 150, "Drive SUV": 300, "Drive EV": 50 },
    distance: { "Short (0–5 miles)": 10, "Medium (5–20 miles)": 50, "Long (20–50+ miles)": 200 },
    shopping: { "Buy frequently from global stores": 100, "Buy less and buy local": 30, "Buy second-hand": 10 },
    diet: { "High-meat diet": 500, "Moderate-meat diet": 250, "Vegetarian": 100, "Vegan": 50 },
    housing: { "Apartment": 100, "Small house": 200, "Large house": 400 }
  };
  
  const imagesData = {
    "International flight": "images/flight.jpg", "Domestic flight": "images/domestic.jpg", "Multiple flights per year": "images/multiple-flights.jpg",
    "Road trip (gas car)": "images/gas-car.jpg", "Road trip (electric vehicle)": "images/ev-car.jpg", "Train or bus vacation": "images/train.jpg",
    "Walk/Bike": "images/walk-bike.jpg", "Public transit": "images/bus.jpg", "Drive small car": "images/small-car.jpg",
    "Drive SUV": "images/suv.jpg", "Drive EV": "images/ev-car.jpg",
    "Short (0–5 miles)": "images/short.jpg", "Medium (5–20 miles)": "images/medium.jpg", "Long (20–50+ miles)": "images/long.jpg",
    "Buy frequently from global stores": "images/global.jpg", "Buy less and buy local": "images/local.jpg", "Buy second-hand": "images/second-hand.jpg",
    "High-meat diet": "images/high-meat.jpg", "Moderate-meat diet": "images/moderate-meat.jpg", "Vegetarian": "images/vegetarian.jpg", "Vegan": "images/vegan.jpg",
    "Apartment": "images/apartment.jpg", "Small house": "images/small-house.jpg", "Large house": "images/large-house.jpg"
  };
  
  let userChoices = { vacation: null, commute: null, distance: null, shopping: null, diet: null, housing: null };
  
  const categories = {
    vacation: "What type of vacation will you take?",
    commute: "How do you commute to work or school?",
    distance: "How far is your commute to work or school?",
    shopping: "What will your shopping habits be?",
    diet: "What will your diet be?",
    housing: "Where will you live?"
  };
  
  let currentSlide = 0;
  let slides = [];
  
  function updateSlide() {
    slides.forEach((s, i) => {
      s.classList.remove("active");
      if(i===currentSlide) s.classList.add("active");
    });
  }
  
  function nextSlide() {
    if(currentSlide < slides.length -1) currentSlide++;
    // If last slide, calculate total emissions
    if(currentSlide === slides.length -1){
      showTotalEmissions();
    }
    updateSlide();
  }
  
  function prevSlide() {
    if(currentSlide >0) currentSlide--;
    updateSlide();
  }
  
  // Initialize start game
  d3.select("#start-game").on("click", () => {
    createSlides();
    nextSlide();
  });
  
  // Generate slides for each category
  function createSlides() {
    const container = d3.select(".slides-container");
    for(const category in categories) {
      const slide = container.append("div").attr("class","slide");
      slide.append("h2").text(categories[category]);
  
      const btnDiv = slide.append("div").attr("class","buttons");
      const options = emissionsData[category];
  
      Object.keys(options).forEach(choice=>{
        const btn = btnDiv.append("div").attr("class","choice-button")
          .attr("data-category", category)
          .attr("data-choice", choice);
  
        btn.append("img").attr("src", imagesData[choice] || "images/placeholder.jpg").attr("alt",choice);
        btn.append("span").text(choice);
  
        btn.on("click", function(){
          d3.select(this.parentNode).selectAll(".choice-button").classed("selected",false);
          d3.select(this).classed("selected",true);
          userChoices[category]=choice;
          nextSlide();
        });
      });
    }
  
    // Add final slide for total emissions
    const resultSlide = container.append("div").attr("class","slide");
    resultSlide.append("h2").text("Your Total Emissions");
    resultSlide.append("div").attr("class","emissions-output").attr("id","final-emissions");
  
    slides = document.querySelectorAll(".slide");
  
    // keyboard navigation
    document.addEventListener("keydown", e=>{
      if(e.key==="ArrowRight") nextSlide();
      else if(e.key==="ArrowLeft") prevSlide();
    });
  }
  
  function showTotalEmissions(){
    let total = 0;
    for(const cat in userChoices){
      if(userChoices[cat]) total+=emissionsData[cat][userChoices[cat]];
    }
    d3.select("#final-emissions").text(`Total Emissions: ${total} kg CO₂`);
  }
  