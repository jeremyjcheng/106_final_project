const gameArea = d3.select("#game-area");

const questions = [
  {
    question: "What type of vacation will you take?",
    info: "Flights use much more energy than ground travel, especially long-haul trips.",
    options: [
      { text: "International flight", img: "images/intl_flight.png" },
      { text: "Domestic flight", img: "images/domestic_flight.png" },
      { text: "Multiple flights per year", img: "images/multiple_flights.png" },
      { text: "Road trip (gas car)", img: "images/road_gas.png" },
      { text: "Road trip (electric vehicle)", img: "images/road_ev.png" },
      { text: "Train or bus vacation", img: "images/train_bus.png" },
    ]
  },
  {
    question: "How do you commute to work or school?",
    info: "Walking or biking uses the least energy, public transit comes next, and driving alone emits the most—especially if the vehicle is large or not electric.",
    options: [
      { text: "Walk/Bike", img: "images/walk.png" },
      { text: "Public transit", img: "images/transit.png" },
      { text: "Drive a small car", img: "images/small_car.png" },
      { text: "Drive an SUV or large vehicle", img: "images/suv.png" },
      { text: "Drive an EV", img: "images/ev_car.png" },
    ]
  },
  {
    question: "How far is your commute to work or school?",
    info: "Longer distances require more energy unless self-powered.",
    options: [
      { text: "Short (0–5 miles)", img: "images/short_distance.png" },
      { text: "Medium (5–20 miles)", img: "images/medium_distance.png" },
      { text: "Long (20–50+ miles)", img: "images/long_distance.png" },
    ]
  },
  {
    question: "What will your shopping habits be?",
    info: "Buying less, choosing local sources, and extending product life reduces emissions.",
    options: [
      { text: "Buy frequently from global stores", img: "images/global_shopping.png" },
      { text: "Buy less and buy local", img: "images/local_shopping.png" },
      { text: "Buy second-hand", img: "images/second_hand.png" },
    ]
  },
  {
    question: "What will your diet be?",
    info: "Animal agriculture produces significantly more greenhouse gases than plant-based foods.",
    options: [
      { text: "High-meat diet", img: "images/high_meat.png" },
      { text: "Moderate-meat diet", img: "images/moderate_meat.png" },
      { text: "Vegetarian", img: "images/vegetarian.png" },
      { text: "Vegan", img: "images/vegan.png" },
    ]
  },
  {
    question: "Where will you live?",
    info: "Larger homes require more materials and energy to heat/cool.",
    options: [
      { text: "Apartment or multi-unit housing", img: "images/apartment.png" },
      { text: "Small house", img: "images/small_house.png" },
      { text: "Large house", img: "images/large_house.png" },
    ]
  }
];

let currentQuestion = -1;
let userChoices = [];

function renderStartScreen() {
  gameArea.html("");
  gameArea.append("div")
    .attr("id", "start-screen")
    .append("button")
    .text("Start Game")
    .attr("class", "start-btn")
    .on("click", () => {
      currentQuestion = 0;
      userChoices = [];
      renderQuestion(currentQuestion);
    });
}

function renderQuestion(index) {
  const q = questions[index];
  gameArea.html("");

  gameArea.append("h2").text(q.question);
  gameArea.append("p").text(q.info);

  const optionsDiv = gameArea.append("div").attr("class", "game-options");

  optionsDiv.selectAll("div")
    .data(q.options)
    .join("div")
    .attr("class", "option-button")
    .on("click", d => {
      userChoices.push(d.text);
      if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        renderQuestion(currentQuestion);
      } else {
        renderResults();
      }
    })
    .html(d => `<img src="${d.img}" alt="${d.text}" /><span>${d.text}</span>`);
}

function renderResults() {
  gameArea.html("");

  gameArea.append("h2").text("Game Results");

  const resultsDiv = gameArea.append("div").attr("id", "results");
  resultsDiv.selectAll("p")
    .data(userChoices)
    .join("p")
    .text((d, i) => `Q${i + 1}: ${d}`);

  gameArea.append("button")
    .text("Play Again")
    .attr("class", "restart-btn")
    .on("click", renderStartScreen);
}

// Initialize
renderStartScreen();
