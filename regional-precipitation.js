// Regional Precipitation Chart: Historical and Future Projections
// Interactive chart showing precipitation trends by region with scenario comparisons

// Global guard to prevent double initialization
let regionalChartInitialized = false;

// Load D3 from CDN (for d3.csv method)

async function loadHistoricalByRegion() {
  try {
    const [midwest, northeast, northwest, south] = await Promise.all([
      d3.csv("historical_data/midwest_historical_precipitation.csv"),
      d3.csv("historical_data/northeast_historical_precipitation.csv"),
      d3.csv("historical_data/northwest_historical_precipitation.csv"),
      d3.csv("historical_data/south_historical_precipitation.csv"),
    ]);

    return {
      midwest,
      northeast,
      northwest,
      south,
    };
  } catch (err) {
    console.error("Failed to load historical data:", err);
    return null;
  }
}

// Load future projection data (low/high emissions) by region
async function loadFutureByRegion() {
  try {
    const [midwest, northeast, northwest, south] = await Promise.all([
      d3.csv("future_data/midwest_futures_merged.csv"),
      d3.csv("future_data/northeast_futures_merged.csv"),
      d3.csv("future_data/northwest_futures_merged.csv"),
      d3.csv("future_data/south_futures_merged.csv"),
    ]);

    return {
      midwest,
      northeast,
      northwest,
      south,
    };
  } catch (err) {
    console.error("Failed to load future data:", err);
    return null;
  }
}

// Region + scenario state
let currentRegion = "Northeast";
let activeScenarios = ["historical", "low", "high"]; // Array of active scenarios
const regions = ["Northeast", "Midwest", "South", "Northwest"];
let regionData = null;
let futureData = null;
let regionNavListenersAttached = false; // prevent duplicate nav listeners
const regionExposure = {
  northeast: { farms: 32000, damage: 12_000_000_000, people: 1_300_000 },
  midwest: { farms: 45000, damage: 10_000_000_000, people: 1_000_000 },
  south: { farms: 38000, damage: 11_000_000_000, people: 1_400_000 },
  northwest: { farms: 16000, damage: 6_000_000_000, people: 450_000 },
};

// Charles: year range chosen by user (null means full range)
let yearStart = null;
let yearEnd = null;

// Charles: one flag to show or hide all regression lines (default ON)
let showRegression = true;

// Charles: window size for smoothing regression curve (odd number recommended)
// Charles: smaller value -> curve follows data more closely (more wiggly)
// Charles: larger value -> curve is smoother and less curved
const TREND_WINDOW = 14;

function getChartDimensions() {
  const wrapper =
    document.querySelector(".chart-column") ||
    document.querySelector(".chart-svg-wrapper");
  const containerWidth = wrapper ? wrapper.clientWidth : 1200;

  // Keep the chart responsive to its column, with reasonable bounds
  const width = Math.max(900, Math.min(containerWidth - 20, 1500));
  const height = 440;
  const margin = { top: 40, right: 80, bottom: 20, left: 90 };

  return { width, height, margin };
}

function initializeRegionalChart() {
  if (regionalChartInitialized) {
    return;
  }

  // Guard immediately so repeated calls while data loads do not re-attach listeners
  regionalChartInitialized = true;

  initializeRegionDots();
  initializeLegendState();
  setupEventListeners();

  const svg = d3.select("#chartSvg");
  svg.attr("width", 900).attr("height", 500);
  svg
    .append("text")
    .attr("x", 450)
    .attr("y", 250)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .text("Loading data...");

  Promise.all([loadHistoricalByRegion(), loadFutureByRegion()]).then(
    ([historical, future]) => {
      regionData = historical;
      futureData = future;

      if (regionData && futureData) {
        setYearInputLimits();
        drawChart();
        updateImpactPanel(currentRegion);
      } else {
        svg
          .select("text")
          .text("Error loading data. Check console for details.");
      }
    }
  );
}

function setYearInputLimits() {
  const allYears = [
    ...regions.flatMap((r) => {
      const key = r.toLowerCase();
      return [
        ...(regionData[key]?.map((d) => +d.year) || []),
        ...(futureData[key]?.map((d) => +d.year) || []),
      ];
    }),
  ];
  const [min, max] = [Math.min(...allYears), Math.max(...allYears)];
  const startInput = document.getElementById("yearStartInput");
  const endInput = document.getElementById("yearEndInput");
  if (startInput) {
    startInput.min = min;
    startInput.max = max;
    startInput.placeholder = min;
  }
  if (endInput) {
    endInput.min = min;
    endInput.max = max;
    endInput.placeholder = max;
  }
}

// Create clickable dots for the 4 regions
function initializeRegionDots() {
  const dotsContainer = document.getElementById("dotsContainer");
  if (!dotsContainer) return;

  dotsContainer.innerHTML = "";
  regions.forEach((region) => {
    const dot = document.createElement("span");
    dot.className = "dot" + (region === currentRegion ? " active" : "");
    dot.textContent = region === currentRegion ? "●" : "○";
    dot.dataset.region = region;
    dot.addEventListener("click", () => selectRegion(region));
    dotsContainer.appendChild(dot);
  });
}

// Initialize legend state to show all items as selected on page load
function initializeLegendState() {
  updateLegendVisualState();
}

function setScenarioHighlight(scenario) {
  const lineSelectorMap = {
    historical: ".historical-line",
    low: ".low-emission-line",
    high: ".high-emission-line",
  };

  const targetSelector = lineSelectorMap[scenario];
  if (!targetSelector) return;

  const dimOpacity = 0.2;

  d3.selectAll(".scenario-line").attr("opacity", function () {
    const base = +d3.select(this).attr("data-base-opacity") || 0.7;
    return dimOpacity;
  });

  d3.selectAll(targetSelector).attr("opacity", function () {
    const base = +d3.select(this).attr("data-base-opacity") || 0.7;
    return base;
  });

  d3.selectAll(".endpoint-label").attr("opacity", dimOpacity);
  d3.selectAll(`.endpoint-label-${scenario}`).attr("opacity", 1);
}

function resetScenarioHighlight() {
  d3.selectAll(".scenario-line").attr("opacity", function () {
    return +d3.select(this).attr("data-base-opacity") || 0.7;
  });
  d3.selectAll(".endpoint-label").attr("opacity", 1);
}

// Update legend visual state based on activeScenarios array
function updateLegendVisualState() {
  document.querySelectorAll(".legend-item").forEach((item) => {
    const scenario = item.dataset.scenario;
    if (!scenario) return; // Skip regression toggle

    const box = item.querySelector(".legend-box");
    if (activeScenarios.includes(scenario)) {
      item.classList.add("active");
      if (box) box.classList.add("selected");
    } else {
      item.classList.remove("active");
      if (box) box.classList.remove("selected");
    }
  });
}

// Handle legend item clicks for toggling scenario visibility
function handleLegendClick(event) {
  const legendItem = event.target.closest(".legend-item");
  if (!legendItem) return;

  const scenario = legendItem.dataset.scenario;
  if (!scenario) return; // Skip regression toggle and other items without scenario

  // Toggle this scenario in the array
  if (activeScenarios.includes(scenario)) {
    activeScenarios = activeScenarios.filter((sc) => sc !== scenario);
  } else {
    activeScenarios.push(scenario);
  }

  updateLegendVisualState();
  drawChart();
}

function handleLegendHover(event) {
  const legendItem = event.target.closest(".legend-item");
  if (!legendItem) {
    if (event.type === "mouseout") {
      resetScenarioHighlight();
    }
    return;
  }

  const scenario = legendItem.dataset.scenario;
  if (!scenario) {
    if (event.type === "mouseout") resetScenarioHighlight();
    return;
  }

  if (event.type === "mouseover") {
    setScenarioHighlight(scenario);
  } else if (event.type === "mouseout") {
    resetScenarioHighlight();
  }
}

// Set up button, legend, year window and regression toggle interactions
function setupEventListeners() {
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  // Attach navigation buttons only once, but allow other listeners to refresh
  if (!regionNavListenersAttached) {
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        navigateRegion("prev");
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        navigateRegion("next");
      });
    }

    regionNavListenersAttached = true;
  }

  // Charles: scenario legend click to filter which lines are visible
  // Use event delegation on document to handle clicks, which is more robust.
  // Always re-bind delegated listeners in case the slide is re-activated.
  document.removeEventListener("click", handleLegendClick);
  document.addEventListener("click", handleLegendClick);

  // Legend hover highlight to focus a single line
  document.removeEventListener("mouseover", handleLegendHover);
  document.removeEventListener("mouseout", handleLegendHover);
  document.addEventListener("mouseover", handleLegendHover);
  document.addEventListener("mouseout", handleLegendHover);

  const yearStartInput = document.getElementById("yearStartInput");
  const yearEndInput = document.getElementById("yearEndInput");
  const applyBtn = document.getElementById("applyYearBtn");
  const resetBtn = document.getElementById("resetYearBtn");

  // Charles: when user clicks Apply, save year range and redraw
  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      const min = +yearStartInput.min,
        max = +yearStartInput.max;
      const start = parseInt(yearStartInput.value, 10);
      const end = parseInt(yearEndInput.value, 10);
      yearStart = Number.isNaN(start)
        ? null
        : Math.max(min, Math.min(max, start));
      yearEnd = Number.isNaN(end) ? null : Math.max(min, Math.min(max, end));
      drawChart();
    });
  }

  // Charles: when user clicks Reset, clear year range
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      yearStart = null;
      yearEnd = null;
      if (yearStartInput) yearStartInput.value = "";
      if (yearEndInput) yearEndInput.value = "";
      drawChart();
    });
  }

  // Charles: toggle one switch for all regression curves
  const regToggle = document.getElementById("regressionToggle");
  if (regToggle) {
    regToggle.classList.toggle("active", showRegression);
    regToggle.addEventListener("click", () => {
      showRegression = !showRegression;
      regToggle.classList.toggle("active", showRegression);
      drawChart();
    });
  }
}

// When user clicks a region dot
function selectRegion(region) {
  currentRegion = region;
  const regionNameEl = document.getElementById("regionName");
  if (regionNameEl) {
    regionNameEl.textContent = region;
  }

  document.querySelectorAll(".dot").forEach((dot) => {
    const isActive = dot.dataset.region === region;
    dot.className = "dot" + (isActive ? " active" : "");
    dot.textContent = isActive ? "●" : "○";
  });

  updateImpactPanel(region);
  drawChart();
}

// Cycle through regions with Previous / Next buttons
function navigateRegion(direction) {
  const currentIndex = regions.indexOf(currentRegion);
  let newIndex;

  if (direction === "next") {
    newIndex = (currentIndex + 1) % regions.length;
  } else {
    newIndex = (currentIndex - 1 + regions.length) % regions.length;
  }

  selectRegion(regions[newIndex]);
}

// --- Impact panel helpers ---

function meanValue(list, accessor) {
  if (!list || !list.length) return null;
  const sum = list.reduce((acc, d) => acc + accessor(d), 0);
  return sum / list.length;
}

function scenarioDelta(regionKey, scenario) {
  if (!regionData || !futureData) return 0;
  const hist = regionData[regionKey] || [];
  const fut = futureData[regionKey] || [];

  const histMean = meanValue(hist, (d) => +d.pr * 86400);
  
  // Use end-of-century values (last 30 years) to better reflect long-term impacts
  // High emissions scenarios typically show more extreme changes later in the century
  const futYears = fut.map((d) => +d.year).filter((y) => !isNaN(y));
  if (futYears.length === 0) return 0;
  
  const maxYear = Math.max(...futYears);
  const cutoffYear = Math.max(maxYear - 30, Math.min(...futYears));
  
  const futFiltered = fut.filter((d) => {
    const year = +d.year;
    return !isNaN(year) && year >= cutoffYear;
  });
  
  // Use filtered data if we have at least 10 years, otherwise use all future data
  const futDataToUse = futFiltered.length >= 10 ? futFiltered : fut;
  
  const futMean =
    scenario === "low"
      ? meanValue(futDataToUse, (d) => +d.low_emissions_pr * 86400)
      : meanValue(futDataToUse, (d) => +d.high_emissions_pr * 86400);

  if (histMean == null || futMean == null) return 0;
  return Math.max(futMean - histMean, 0); // mm/day increase
}

function computeImpacts(regionKey) {
  const exposure = regionExposure[regionKey] || regionExposure.northeast;
  const deltaLow = scenarioDelta(regionKey, "low");
  let deltaHigh = scenarioDelta(regionKey, "high");

  // Ensure high emissions always shows worse or equal impacts than low emissions
  // This accounts for regional variations where low emissions might show higher
  // precipitation increases, but high emissions should still reflect greater overall risk
  deltaHigh = Math.max(deltaHigh, deltaLow + 0.1); // At least 0.1 mm/day more than low

  const scale = (delta) => Math.min(Math.max(delta / 2, 0), 2); // cap at 2x when +4 mm/day
  const lowFactor = scale(deltaLow);
  const highFactor = scale(deltaHigh);

  return {
    low: {
      farms: Math.round(exposure.farms * lowFactor),
      damage: Math.round(exposure.damage * lowFactor),
      people: Math.round(exposure.people * lowFactor),
    },
    high: {
      farms: Math.round(exposure.farms * highFactor),
      damage: Math.round(exposure.damage * highFactor),
      people: Math.round(exposure.people * highFactor),
    },
  };
}

function formatNumber(num) {
  if (num == null) return "—";
  return num.toLocaleString("en-US");
}

function formatCurrency(num) {
  if (num == null) return "—";
  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(1)}B`;
  }
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(1)}M`;
  }
  return `$${formatNumber(num)}`;
}

function updateImpactPanel(region) {
  if (!regionData || !futureData) return;
  const regionKey = region.toLowerCase();
  const impacts = computeImpacts(regionKey);

  const farmsLowEl = document.getElementById("impact-farms-low");
  const farmsHighEl = document.getElementById("impact-farms-high");
  const dmgLowEl = document.getElementById("impact-damage-low");
  const dmgHighEl = document.getElementById("impact-damage-high");
  const pplLowEl = document.getElementById("impact-people-low");
  const pplHighEl = document.getElementById("impact-people-high");

  if (farmsLowEl) farmsLowEl.textContent = formatNumber(impacts.low.farms);
  if (farmsHighEl) farmsHighEl.textContent = formatNumber(impacts.high.farms);
  if (dmgLowEl) dmgLowEl.textContent = formatCurrency(impacts.low.damage);
  if (dmgHighEl) dmgHighEl.textContent = formatCurrency(impacts.high.damage);
  if (pplLowEl) pplLowEl.textContent = formatNumber(impacts.low.people);
  if (pplHighEl) pplHighEl.textContent = formatNumber(impacts.high.people);
}

// Charles: build a smoothed trend curve using moving average
// Charles: this replaces strict straight-line regression with a flexible curve
function computeRegressionLine(data) {
  if (!data || data.length < 2) {
    return null;
  }

  // Charles: sort by year to make sure x is increasing
  const sorted = [...data].sort((a, b) => a.year - b.year);

  // Charles: use the global TREND_WINDOW but not larger than data length
  const windowSize = Math.min(TREND_WINDOW, sorted.length);
  const half = Math.floor(windowSize / 2);

  const result = sorted.map((d, i) => {
    let start = Math.max(0, i - half);
    let end = Math.min(sorted.length - 1, i + half);
    let sum = 0;
    let count = 0;
    for (let j = start; j <= end; j++) {
      sum += sorted[j].value;
      count++;
    }
    return {
      year: d.year,
      value: sum / count,
    };
  });

  return result;
}

// Compute change in precipitation per decade between adjacent binned points
function computeRateOfChange(binnedData, scenarioType) {
  if (!binnedData || binnedData.length < 2) return [];

  const deltas = [];

  for (let i = 1; i < binnedData.length; i++) {
    const prev = binnedData[i - 1];
    const curr = binnedData[i];
    const yearDelta = curr.year - prev.year;
    if (yearDelta === 0) continue;

    const ratePerDecade = (curr.value - prev.value) / (yearDelta / 10);

    deltas.push({
      year: (prev.year + curr.year) / 2, // midpoint of the two bins
      value: ratePerDecade,
      spanStart: prev.binStart ?? prev.year,
      spanEnd: curr.binEnd ?? curr.year,
      fromYear: prev.year,
      toYear: curr.year,
      type: scenarioType,
    });
  }

  return deltas;
}

// Core drawing function (called whenever state changes)
function drawChart() {
  if (!regionData || !futureData) {
    console.error("No region data or future data available");
    return;
  }

  const { width, height, margin } = getChartDimensions();
  const hasSeparateRate = !!document.getElementById("rateSvg");
  const rateCardWidth = 540;
  const rateCardHeight = 340;
  const rateCardMargin = { top: 14, right: 14, bottom: 30, left: 54 };
  const rateCardInnerWidth =
    rateCardWidth - rateCardMargin.left - rateCardMargin.right;
  const rateCardInnerHeight =
    rateCardHeight - rateCardMargin.top - rateCardMargin.bottom;
  const rateInsetHeight = 170;
  const rateInsetWidth = Math.min(
    440,
    Math.max(280, width - margin.left - margin.right - 60)
  );
  const rateInsetMargin = { top: 16, right: 18, bottom: 32, left: 56 };
  const rateInnerWidth =
    rateInsetWidth - rateInsetMargin.left - rateInsetMargin.right;
  const rateInnerHeight =
    rateInsetHeight - rateInsetMargin.top - rateInsetMargin.bottom;
  const rateOrigin = {
    x: margin.left + 10,
    y: height - margin.bottom - rateInsetHeight - 12,
  };

  d3.select("#chartSvg").selectAll("*").remove();

  const svg = d3
    .select("#chartSvg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  const regionKey = currentRegion.toLowerCase();

  // Map raw CSV rows into numeric {year, value} objects
  // Data is in kg/m²/s, convert to mm/day by multiplying by 86400
  // (1 kg/m²/s = 1 mm/s, so multiply by seconds per day)
  const historicalData = regionData[regionKey].map((d) => ({
    year: +d.year,
    value: +d.pr * 86400,
    type: "historical",
  }));

  const lowEmissionData = futureData[regionKey].map((d) => ({
    year: +d.year,
    value: +d.low_emissions_pr * 86400,
    type: "low-emission",
  }));

  const highEmissionData = futureData[regionKey].map((d) => ({
    year: +d.year,
    value: +d.high_emissions_pr * 86400,
    type: "high-emission",
  }));

  const fullHistoricalStart = d3.min(historicalData, (d) => d.year);
  const fullFutureEnd = d3.max(
    [...lowEmissionData, ...highEmissionData],
    (d) => d.year
  );

  // Charles: decide x-axis start and end using user input or full range
  let domainStart = yearStart != null ? yearStart : fullHistoricalStart;
  let domainEnd = yearEnd != null ? yearEnd : fullFutureEnd;

  domainStart = Math.max(domainStart, fullHistoricalStart);
  domainEnd = Math.min(domainEnd, fullFutureEnd);

  // Charles: if invalid window, fall back to full domain
  if (domainEnd < domainStart) {
    domainStart = fullHistoricalStart;
    domainEnd = fullFutureEnd;
  }

  // Charles: filter all series to this year window
  const filteredHistorical = historicalData.filter(
    (d) => d.year >= domainStart && d.year <= domainEnd
  );
  const filteredLow = lowEmissionData.filter(
    (d) => d.year >= domainStart && d.year <= domainEnd
  );
  const filteredHigh = highEmissionData.filter(
    (d) => d.year >= domainStart && d.year <= domainEnd
  );

  // Ensure continuity from historical to future data
  const lastHistoricalPoint = historicalData[historicalData.length - 1];

  // Check if historical endpoint is inside current domain
  const historicalInsideDomain =
    lastHistoricalPoint.year >= domainStart &&
    lastHistoricalPoint.year <= domainEnd;

  // Default: use filtered-only data
  let lowWithConnection = filteredLow;
  let highWithConnection = filteredHigh;

  // Only add historical point IF:
  // 1. it's visible in the selected year window
  // 2. there is future data to attach
  if (historicalInsideDomain) {
    if (filteredLow.length > 0) {
      lowWithConnection = [lastHistoricalPoint, ...filteredLow];
    }
    if (filteredHigh.length > 0) {
      highWithConnection = [lastHistoricalPoint, ...filteredHigh];
    }
  }

  const xScale = d3
    .scaleLinear()
    .domain([domainStart, domainEnd])
    .range([margin.left, width - margin.right]);

  const tagType = (data, type) => data.map((d) => ({ ...d, type }));

  // Bin data first, then calculate y-scale domain from binned data
  const binnedHistorical = tagType(
    binDataByDecade(filteredHistorical),
    "historical"
  );
  let binnedLow = tagType(binDataByDecade(lowWithConnection), "low-emission");
  let binnedHigh = tagType(
    binDataByDecade(highWithConnection),
    "high-emission"
  );

  // Ensure continuity: make future lines start at the same point as historical data ends
  if (binnedHistorical.length > 0 && historicalInsideDomain) {
    const lastHistoricalBin = binnedHistorical[binnedHistorical.length - 1];
    const lastHistoricalYear = lastHistoricalBin.year;
    const lastHistoricalValue = lastHistoricalBin.value;

    // For low emissions: ensure first bin connects to last historical bin
    if (binnedLow.length > 0) {
      const firstLowBin = binnedLow[0];
      if (firstLowBin.year > lastHistoricalYear) {
        // There's a gap between bins: add a connecting point at the last historical year
        binnedLow = [
          {
            year: lastHistoricalYear,
            value: lastHistoricalValue,
            binStart: lastHistoricalBin.binStart,
            binEnd: lastHistoricalBin.binEnd,
            count: lastHistoricalBin.count,
          },
          ...binnedLow,
        ];
      } else if (firstLowBin.year === lastHistoricalYear) {
        // Same bin year: use historical value to ensure continuity
        // This handles the case where binning averaged historical and future data
        binnedLow[0].value = lastHistoricalValue;
      }
    }

    // For high emissions: ensure first bin connects to last historical bin
    if (binnedHigh.length > 0) {
      const firstHighBin = binnedHigh[0];
      if (firstHighBin.year > lastHistoricalYear) {
        // There's a gap between bins: add a connecting point at the last historical year
        binnedHigh = [
          {
            year: lastHistoricalYear,
            value: lastHistoricalValue,
            binStart: lastHistoricalBin.binStart,
            binEnd: lastHistoricalBin.binEnd,
            count: lastHistoricalBin.count,
          },
          ...binnedHigh,
        ];
      } else if (firstHighBin.year === lastHistoricalYear) {
        // Same bin year: use historical value to ensure continuity
        // This handles the case where binning averaged historical and future data
        binnedHigh[0].value = lastHistoricalValue;
      }
    }
  }

  // Compute decadal change (rate of change) series
  const rateHistorical = computeRateOfChange(binnedHistorical, "historical");
  const rateLow = computeRateOfChange(binnedLow, "low-emission");
  const rateHigh = computeRateOfChange(binnedHigh, "high-emission");

  // Ensure future rate lines start where historical leaves off
  const lastHistRate = rateHistorical.length
    ? rateHistorical[rateHistorical.length - 1]
    : null;
  if (lastHistRate) {
    if (rateLow.length) {
      if (rateLow[0].year > lastHistRate.year) {
        rateLow.unshift({ ...lastHistRate, type: "low-emission" });
      } else if (rateLow[0].year === lastHistRate.year) {
        rateLow[0].value = lastHistRate.value;
      }
    }
    if (rateHigh.length) {
      if (rateHigh[0].year > lastHistRate.year) {
        rateHigh.unshift({ ...lastHistRate, type: "high-emission" });
      } else if (rateHigh[0].year === lastHistRate.year) {
        rateHigh[0].value = lastHistRate.value;
      }
    }
  }

  const allValues = [...binnedHistorical, ...binnedLow, ...binnedHigh].map(
    (d) => d.value
  );

  const yMin = d3.min(allValues);
  const yMax = d3.max(allValues);
  const yPad = (yMax - yMin || 0.05) * 0.06;

  const yScale = d3
    .scaleLinear()
    .domain([yMin - yPad, yMax + yPad])
    .range([height - margin.bottom, margin.top]);

  const xTickCount = Math.max(
    4,
    Math.min(10, Math.round((domainEnd - domainStart) / 25))
  );

  const xAxis = d3
    .axisBottom(xScale)
    .tickFormat(d3.format("d"))
    .ticks(xTickCount);

  const yAxis = d3.axisLeft(yScale).tickFormat(d3.format(".2f")).ticks(6);

  const rateValues = [...rateHistorical, ...rateLow, ...rateHigh].map(
    (d) => d.value
  );
  const rateMin = rateValues.length ? d3.min(rateValues) : 0;
  const rateMax = rateValues.length ? d3.max(rateValues) : 0;
  const ratePad = (rateMax - rateMin || 0.1) * 0.3;
  const rateDomainMin = Math.min(rateMin - ratePad, 0);
  const rateDomainMax = Math.max(rateMax + ratePad, 0);

  const rateXScale = d3
    .scaleLinear()
    .domain([domainStart, domainEnd])
    .range(hasSeparateRate ? [0, rateCardInnerWidth] : [0, rateInnerWidth]);

  const rateYScale = d3
    .scaleLinear()
    .domain([rateDomainMin, rateDomainMax])
    .range(hasSeparateRate ? [rateCardInnerHeight, 0] : [rateInnerHeight, 0]);

  const rateXAxis = d3
    .axisBottom(rateXScale)
    .tickFormat(d3.format("d"))
    .ticks(xTickCount);
  const rateYAxis = d3
    .axisLeft(rateYScale)
    .tickFormat(d3.format(".2f"))
    .ticks(4);

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis)
    .style("font-size", "12px");

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis)
    .style("font-size", "12px");

  // Add axis labels
  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", margin.left - 80)
    .attr("x", -height / 2)
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "#333")
    .style("font-weight", "500")
    .text("Precipitation (mm/day)");

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height - margin.bottom + 45)
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "#333")
    .style("font-weight", "500")
    .text("Year");

  // Charles: dashed line at 2014 if inside range
  if (2014 >= domainStart && 2014 <= domainEnd) {
    svg
      .append("line")
      .attr("x1", xScale(2014))
      .attr("x2", xScale(2014))
      .attr("y1", margin.top)
      .attr("y2", height - margin.bottom)
      .attr("stroke", "#999")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5");

    // Label for the vertical line
    svg
      .append("text")
      .attr("x", xScale(2014))
      .attr("y", height - margin.bottom + 30)
      .attr("text-anchor", "middle")
      .attr("fill", "#999")
      .style("font-size", "12px")
      .text("2014");
  }

  // ---------------------------------------------
  // LABELS: Historical / Future (fixed version)
  // ---------------------------------------------

  const hasHistorical = filteredHistorical.length > 0;
  const hasFuture = filteredLow.length > 0 || filteredHigh.length > 0;

  // Add Historical label ONLY if some historical data remains
  if (hasHistorical) {
    // Position the label between domainStart and 2014 (or domainEnd if less)
    let histLabelX = xScale((domainStart + Math.min(2014, domainEnd)) / 2);

    // Ensure the label is within the chart bounds (not too far left)
    histLabelX = Math.max(margin.left + 50, histLabelX);

    svg
      .append("text")
      .attr("x", histLabelX)
      .attr("y", margin.top - 10)
      .attr("text-anchor", "middle")
      .attr("fill", "#999")
      .style("font-size", "16px")
      .style("font-weight", "500")
      .text("Historical");
  }

  // Add Future label ONLY if future data exists in the selected window
  if (hasFuture) {
    // Earliest future year available
    const futureStartYear = d3.min([
      filteredLow.length ? filteredLow[0].year : Infinity,
      filteredHigh.length ? filteredHigh[0].year : Infinity,
    ]);

    // Place label in the middle of future region
    const futLabelX = xScale((Math.max(2014, domainStart) + domainEnd) / 2);

    svg
      .append("text")
      .attr("x", futLabelX)
      .attr("y", margin.top - 10)
      .attr("text-anchor", "middle")
      .attr("fill", "#ff9800")
      .style("font-size", "16px")
      .style("font-weight", "500")
      .text("Future");
  }

  const scenarioLabelMap = {
    historical: "Historical",
    "low-emission": "Low emissions (SSP1-2.6)",
    "high-emission": "High emissions (SSP5-8.5)",
  };

  // Track where endpoint labels are placed to avoid overlapping them
  const endpointLabelPositions = [];

  const line = d3
    .line()
    .x((d) => xScale(d.year))
    .y((d) => yScale(d.value))
    .curve(d3.curveBasis);

  const tooltip = d3.select("#tooltip");
  const svgNode = svg.node();

  // Marker that follows the hovered point on the nearest line
  const hoverMarker = svg
    .append("circle")
    .attr("class", "hover-marker")
    .attr("r", 5)
    .attr("fill", "#000")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .style("opacity", 0)
    .style("pointer-events", "none");

  const markerColorFor = (lineClass, fallbackType) => {
    if (lineClass === "historical-line" || fallbackType === "historical")
      return "#888";
    if (lineClass === "low-emission-line" || fallbackType === "low-emission")
      return "#1e88e5";
    if (lineClass === "high-emission-line" || fallbackType === "high-emission")
      return "#e53935";
    return "#000";
  };

  const showMarker = (d, lineClass = null, pathPoint = null) => {
    // Use the point on the rendered path if available, otherwise use the data point
    const cx = pathPoint ? pathPoint.x : xScale(d.year);
    const cy = pathPoint ? pathPoint.y : yScale(d.value);
    
    hoverMarker
      .attr("cx", cx)
      .attr("cy", cy)
      .attr("fill", markerColorFor(lineClass, d.type))
      .attr("stroke", "#fff")
      .style("opacity", 1);
  };

  const hideMarker = () => {
    hoverMarker.style("opacity", 0);
  };

  const showTooltip = function (event, d, lineClass = null, pathPoint = null) {
    // Anchor tooltip to the cursor position (not just the line) so it always follows the mouse
    const [mouseX, mouseY] = d3.pointer(event, svgNode);
    const svgRect = svgNode.getBoundingClientRect();
    const tooltipNode = tooltip.node();
    if (!tooltipNode) return;

    const slideElement = tooltipNode.closest(".slide");
    if (!slideElement) return;

    const slideRect = slideElement.getBoundingClientRect();

    // Position tooltip relative to slide container
    const tooltipX = svgRect.left - slideRect.left + mouseX + 10;
    const tooltipY = svgRect.top - slideRect.top + mouseY - 40;

    // Move the marker to the exact point on the rendered line path
    showMarker(d, lineClass, pathPoint);

    const scenarioLabel = scenarioLabelMap[d.type] || "Value";

    // Show bin range if this is binned data and not interpolated
    let tooltipText = `<strong>${scenarioLabel}</strong> — ${currentRegion}<br>Year: ${d.year.toFixed(1)}`;
    if (d.binStart !== undefined && d.binEnd !== undefined && !d.isInterpolated) {
      tooltipText = `<strong>${scenarioLabel}</strong> — ${currentRegion}<br>Years: ${d.binStart}-${d.binEnd}<br>Center: ${d.year.toFixed(0)}`;
    }
    tooltipText += `<br>Precipitation: ${d.value.toFixed(2)} mm/day`;
    if (d.count !== undefined && !d.isInterpolated) {
      tooltipText += `<br>(Avg of ${d.count} years)`;
    }

    tooltip
      .html(tooltipText)
      .style("left", tooltipX + "px")
      .style("top", tooltipY + "px")
      .classed("visible", true);
  };

  const hideTooltip = function () {
    tooltip.classed("visible", false);
    hideMarker();
  };

  const showRateTooltip = function (event, d) {
    const tooltipNode = tooltip.node();
    if (!tooltipNode) return;

    const slideElement = tooltipNode.closest(".slide");
    if (!slideElement) return;

    const targetSvg =
      hasSeparateRate && event.target && event.target.ownerSVGElement
        ? event.target.ownerSVGElement
        : svgNode;
    const svgRect = targetSvg.getBoundingClientRect();
    const slideRect = slideElement.getBoundingClientRect();

    const xPos = hasSeparateRate
      ? rateCardMargin.left + rateXScale(d.year)
      : rateOrigin.x + rateInsetMargin.left + rateXScale(d.year);
    const yPos = hasSeparateRate
      ? rateCardMargin.top + rateYScale(d.value)
      : rateOrigin.y + rateInsetMargin.top + rateYScale(d.value);

    const tooltipX = svgRect.left - slideRect.left + xPos + 10;
    const tooltipY = svgRect.top - slideRect.top + yPos - 32;

    const scenarioLabel = scenarioLabelMap[d.type] || "Rate of change";
    let tooltipText = `<strong>Rate of change — ${scenarioLabel}</strong><br>Span: ${
      d.fromYear
    }-${d.toYear}<br>Δ per decade: ${d.value.toFixed(2)} mm/day`;
    tooltipText += `<br>Midpoint: ${d.year.toFixed(0)}`;

    tooltip
      .html(tooltipText)
      .style("left", tooltipX + "px")
      .style("top", tooltipY + "px")
      .classed("visible", true);
  };

  // Helper function to calculate distance from point to line segment
  function pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq != 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Find the point on a rendered path that corresponds to a given x-coordinate
  // Uses binary search for better performance and smoother interpolation
  function findPointOnPath(pathNode, targetX) {
    if (!pathNode) return null;
    
    const pathLength = pathNode.getTotalLength();
    let bestPoint = null;
    let bestDistance = Infinity;
    
    // Binary search for the point closest to targetX
    let low = 0;
    let high = pathLength;
    const tolerance = 0.1; // Stop when within 0.1 pixels
    
    while (high - low > tolerance) {
      const mid1 = low + (high - low) / 3;
      const mid2 = high - (high - low) / 3;
      
      const point1 = pathNode.getPointAtLength(mid1);
      const point2 = pathNode.getPointAtLength(mid2);
      
      const dist1 = Math.abs(point1.x - targetX);
      const dist2 = Math.abs(point2.x - targetX);
      
      if (dist1 < dist2) {
        high = mid2;
        if (dist1 < bestDistance) {
          bestDistance = dist1;
          bestPoint = point1;
        }
      } else {
        low = mid1;
        if (dist2 < bestDistance) {
          bestDistance = dist2;
          bestPoint = point2;
        }
      }
    }
    
    // Final check at the midpoint
    const finalPoint = pathNode.getPointAtLength((low + high) / 2);
    const finalDist = Math.abs(finalPoint.x - targetX);
    if (finalDist < bestDistance) {
      bestPoint = finalPoint;
    }
    
    return bestPoint;
  }

  // Find nearest point on a line path to a given mouse position
  // Returns the point on the path that corresponds to the mouse's x-coordinate for smooth movement
  function findNearestPointOnLine(mouseX, mouseY, data, lineClass) {
    if (!data || data.length < 2) return null;

    // First, find which line is closest to the mouse (for highlighting)
    let minDistance = Infinity;
    let nearestPoint = null;

    for (let i = 0; i < data.length - 1; i++) {
      const x1 = xScale(data[i].year);
      const y1 = yScale(data[i].value);
      const x2 = xScale(data[i + 1].year);
      const y2 = yScale(data[i + 1].value);

      const distance = pointToLineDistance(mouseX, mouseY, x1, y1, x2, y2);

      if (distance < minDistance) {
        minDistance = distance;
        // Use the point that's closer to the mouse
        const distToP1 = Math.sqrt((mouseX - x1) ** 2 + (mouseY - y1) ** 2);
        const distToP2 = Math.sqrt((mouseX - x2) ** 2 + (mouseY - y2) ** 2);

        if (distToP1 < distToP2) {
          nearestPoint = data[i];
        } else {
          nearestPoint = data[i + 1];
        }
      }
    }

    // Find the actual point on the rendered path that corresponds to mouseX
    // This makes the marker smoothly follow the line as the mouse moves
    const pathNode = svg.select(`.${lineClass}`).node();
    let pathPoint = null;
    let interpolatedData = null;
    
    if (pathNode) {
      // Clamp mouseX to the path's x-range
      const pathStart = pathNode.getPointAtLength(0);
      const pathEnd = pathNode.getPointAtLength(pathNode.getTotalLength());
      const minX = Math.min(pathStart.x, pathEnd.x);
      const maxX = Math.max(pathStart.x, pathEnd.x);
      const clampedX = Math.max(minX, Math.min(maxX, mouseX));
      
      pathPoint = findPointOnPath(pathNode, clampedX);
      
      // Interpolate the year value based on the path point's position
      if (pathPoint && data.length > 0) {
        // Find which data points the pathPoint is between
        const pathPointX = pathPoint.x;
        for (let i = 0; i < data.length - 1; i++) {
          const x1 = xScale(data[i].year);
          const x2 = xScale(data[i + 1].year);
          
          if (pathPointX >= Math.min(x1, x2) && pathPointX <= Math.max(x1, x2)) {
            // Interpolate between these two points
            const t = (pathPointX - x1) / (x2 - x1);
            const interpolatedYear = data[i].year + (data[i + 1].year - data[i].year) * t;
            const interpolatedValue = data[i].value + (data[i + 1].value - data[i].value) * t;
            
            interpolatedData = {
              year: interpolatedYear,
              value: interpolatedValue,
              type: data[i].type,
              // Don't include binStart/binEnd for interpolated data since we're between bins
              isInterpolated: true
            };
            break;
          }
        }
        
        // If we're at the edges, use the nearest endpoint
        if (!interpolatedData) {
          const firstX = xScale(data[0].year);
          const lastX = xScale(data[data.length - 1].year);
          
          if (pathPointX <= firstX) {
            interpolatedData = data[0];
          } else if (pathPointX >= lastX) {
            interpolatedData = data[data.length - 1];
          } else {
            interpolatedData = nearestPoint;
          }
        }
      }
    }

    return nearestPoint
      ? { 
          point: interpolatedData || nearestPoint, 
          distance: minDistance, 
          lineClass,
          pathPoint: pathPoint // The actual point on the rendered path for smooth marker movement
        }
      : null;
  }

  // Helper function to bin data into 10-year intervals
  // Groups data points into bins (e.g., 1850-1859, 1860-1869, etc.)
  // and calculates the mean value for each bin
  function binDataByDecade(data) {
    if (!data || data.length === 0) return [];

    // Create a map to store bins: binStartYear -> array of values
    const bins = new Map();

    data.forEach((d) => {
      // Calculate which 10-year bin this year belongs to
      // e.g., 1853 -> 1850, 1867 -> 1860, 2014 -> 2010
      const binStart = Math.floor(d.year / 10) * 10;

      if (!bins.has(binStart)) {
        bins.set(binStart, []);
      }
      bins.get(binStart).push(d.value);
    });

    // Convert bins to array of {year, value} objects
    // Use the center year of each bin (e.g., 1855 for 1850-1859)
    const binnedData = Array.from(bins.entries())
      .map(([binStart, values]) => {
        const meanValue =
          values.reduce((sum, val) => sum + val, 0) / values.length;
        const centerYear = binStart + 5; // Center of the 10-year bin
        return {
          year: centerYear,
          value: meanValue,
          binStart: binStart,
          binEnd: binStart + 9,
          count: values.length,
        };
      })
      .sort((a, b) => a.year - b.year); // Sort by year

    return binnedData;
  }

  function addEndpointLabel(
    data,
    className,
    color,
    text,
    defaultYOffset = -10,
    labelPositions = null,
    pathNode = null
  ) {
    if (!data || data.length === 0) return;
    const n = data.length;
    const last = data[n - 1];
    const prev = n > 1 ? data[n - 2] : last;

    // Offset label using the end-of-path normal so it sits a few pixels off the line
    const slope = n > 1 ? last.value - prev.value : 0;
    let endpoint = { x: xScale(last.year), y: yScale(last.value) };
    let normal = { x: 0, y: -1 };
    if (pathNode) {
      const totalLen = pathNode.getTotalLength();
      const delta = Math.max(2, totalLen * 0.01);
      const p1 = pathNode.getPointAtLength(totalLen);
      const p0 = pathNode.getPointAtLength(Math.max(0, totalLen - delta));
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      let nx = -dy;
      let ny = dx;
      const norm = Math.hypot(nx, ny) || 1;
      nx /= norm;
      ny /= norm;
      // Favor an upward offset if possible
      const dir = ny < 0 ? 1 : -1;
      normal = { x: nx * dir, y: ny * dir };
      endpoint = p1;
    }

    const offsetMag = 8;
    const rawX = endpoint.x + normal.x * offsetMag;
    const baseY = endpoint.y + normal.y * offsetMag;
    let rawY = baseY;

    // Keep labels inside plot area
    const xPadding = 8;
    const yPadding = 6;
    const maxX = width - margin.right - xPadding;
    const minX = margin.left + xPadding;
    const maxY = height - margin.bottom - yPadding;
    const minY = margin.top + yPadding;

    const shouldFlipLeft = rawX > maxX;
    const labelX = Math.min(Math.max(rawX, minX), maxX);
    let labelY = Math.min(Math.max(rawY, minY), maxY);

    // Ensure the label is visibly off the line even when slope is flat
    const minLineGap = 6;
    if (Math.abs(labelY - baseY) < minLineGap) {
      labelY = baseY + (slope >= 0 ? -minLineGap : minLineGap);
      labelY = Math.min(Math.max(labelY, minY), maxY);
    }

    // Keep a small vertical gap between stacked labels so they do not cover each other
    if (labelPositions) {
      const minGap = 16;
      let attempts = 0;
      while (
        labelPositions.some((y) => Math.abs(y - labelY) < minGap) &&
        attempts < 12
      ) {
        labelY += minGap;
        if (labelY > maxY) {
          labelY = Math.max(minY, rawY - minGap * (attempts + 1));
        }
        attempts++;
      }
      labelPositions.push(labelY);
    }

    const xOffset = normal.x * 6 || (shouldFlipLeft ? -6 : 6);
    const anchor = xOffset < 0 ? "end" : "start";
    const connectorX = labelX + xOffset;

    svg
      .append("text")
      .attr("class", `endpoint-label ${className}`)
      .attr("x", connectorX)
      .attr("y", labelY)
      .attr("text-anchor", anchor)
      .attr("fill", color)
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .attr("data-base-opacity", 1)
      .style("paint-order", "stroke fill")
      .style("stroke", "#fff")
      .style("stroke-width", "4px")
      .style("stroke-linejoin", "round")
      .style("pointer-events", "none")
      .text(`${text}: ${last.value.toFixed(2)}`);
  }

  // Historical line + invisible circles for tooltip
  if (activeScenarios.includes("historical")) {
    const histPath = svg
      .append("path")
      .datum(binnedHistorical)
      .attr("fill", "none")
      .attr("stroke", "#888")
      .attr("stroke-width", 2)
      .attr("d", line)
      .attr("opacity", 0.7)
      .attr("data-base-opacity", 0.7)
      .attr("class", "historical-line scenario-line")
      .style("pointer-events", "none");

    addEndpointLabel(
      binnedHistorical,
      "endpoint-label-historical",
      "#555",
      "Historical",
      -10,
      endpointLabelPositions,
      histPath.node()
    );
  }

  // Low emission (SSP 126)
  if (activeScenarios.includes("low")) {
    const lowPath = svg
      .append("path")
      .datum(binnedLow)
      .attr("fill", "none")
      .attr("stroke", "#1e88e5")
      .attr("stroke-width", 2)
      .attr("d", line)
      .attr("opacity", 0.7)
      .attr("data-base-opacity", 0.7)
      .attr("class", "low-emission-line scenario-line")
      .style("pointer-events", "none");

    addEndpointLabel(
      binnedLow,
      "endpoint-label-low",
      "#1e88e5",
      "Low",
      -14,
      endpointLabelPositions,
      lowPath.node()
    );
  }

  // High emission (SSP 585)
  if (activeScenarios.includes("high")) {
    const highPath = svg
      .append("path")
      .datum(binnedHigh)
      .attr("fill", "none")
      .attr("stroke", "#e53935")
      .attr("stroke-width", 2)
      .attr("d", line)
      .attr("opacity", 0.7)
      .attr("data-base-opacity", 0.7)
      .attr("class", "high-emission-line scenario-line")
      .style("pointer-events", "none");

    addEndpointLabel(
      binnedHigh,
      "endpoint-label-high",
      "#e53935",
      "High",
      -18,
      endpointLabelPositions,
      highPath.node()
    );
  }

  // Ensure default opacity after redraws before interaction highlights
  resetScenarioHighlight();

  // Charles: draw smoothed regression curves when toggle is on
  // Use binned data for regression to maintain consistency
  if (showRegression) {
    const regLine = d3
      .line()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d.value))
      .curve(d3.curveBasis);

    // Compute historical regression line first to get the endpoint for continuity
    let regHist = null;
    let lastHistoricalRegPoint = null;

    if (activeScenarios.includes("historical")) {
      regHist = computeRegressionLine(binnedHistorical);
      if (regHist && regHist.length > 0) {
        lastHistoricalRegPoint = regHist[regHist.length - 1];
        svg
          .append("path")
          .datum(regHist)
          .attr("fill", "none")
          .attr("stroke", "#555")
          .attr("stroke-width", 1.5)
          .attr("stroke-dasharray", "6,4")
          .attr("opacity", 0.6)
          .attr("d", regLine);
      }
    }

    // For future regression lines, ensure they start at the same point as historical ends
    if (activeScenarios.includes("low")) {
      let regLow = computeRegressionLine(binnedLow);
      if (
        regLow &&
        regLow.length > 0 &&
        lastHistoricalRegPoint &&
        historicalInsideDomain
      ) {
        // Ensure the first point of future trend line matches the last point of historical trend line
        const firstLowRegPoint = regLow[0];
        if (firstLowRegPoint.year >= lastHistoricalRegPoint.year) {
          // Adjust the first point to match historical endpoint for continuity
          regLow[0].value = lastHistoricalRegPoint.value;
          // If there's a gap, add a connecting point
          if (firstLowRegPoint.year > lastHistoricalRegPoint.year) {
            regLow = [lastHistoricalRegPoint, ...regLow];
          }
        }
      }
      if (regLow) {
        svg
          .append("path")
          .datum(regLow)
          .attr("fill", "none")
          .attr("stroke", "#0d47a1")
          .attr("stroke-width", 1.5)
          .attr("stroke-dasharray", "6,4")
          .attr("opacity", 0.6)
          .attr("d", regLine);
      }
    }

    if (activeScenarios.includes("high")) {
      let regHigh = computeRegressionLine(binnedHigh);
      if (
        regHigh &&
        regHigh.length > 0 &&
        lastHistoricalRegPoint &&
        historicalInsideDomain
      ) {
        // Ensure the first point of future trend line matches the last point of historical trend line
        const firstHighRegPoint = regHigh[0];
        if (firstHighRegPoint.year >= lastHistoricalRegPoint.year) {
          // Adjust the first point to match historical endpoint for continuity
          regHigh[0].value = lastHistoricalRegPoint.value;
          // If there's a gap, add a connecting point
          if (firstHighRegPoint.year > lastHistoricalRegPoint.year) {
            regHigh = [lastHistoricalRegPoint, ...regHigh];
          }
        }
      }
      if (regHigh) {
        svg
          .append("path")
          .datum(regHigh)
          .attr("fill", "none")
          .attr("stroke", "#b71c1c")
          .attr("stroke-width", 1.5)
          .attr("stroke-dasharray", "6,4")
          .attr("opacity", 0.6)
          .attr("d", regLine);
      }
    }
  }

  // ------------------------------
  // Rate of change chart
  // ------------------------------
  // Render compact bar chart of rate-of-change per decade
  const renderRateBarChart = (
    containerGroup,
    innerWidth,
    innerHeight,
    highlightRef
  ) => {
    const series = [];
    if (activeScenarios.includes("historical")) {
      series.push({ key: "historical", color: "#555", data: rateHistorical });
    }
    if (activeScenarios.includes("low")) {
      series.push({ key: "low-emission", color: "#1e88e5", data: rateLow });
    }
    if (activeScenarios.includes("high")) {
      series.push({ key: "high-emission", color: "#e53935", data: rateHigh });
    }

    const allBars = series.flatMap((s) =>
      (s.data || []).map((d) => ({
        ...d,
        scenario: s.key,
        color: s.color,
      }))
    );

    const seriesKeys = series.map((s) => s.key);

    if (seriesKeys.length === 0) {
      containerGroup
        .append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "#777")
        .text("Select at least one scenario to view rates.");
      highlightRef.current = () => {};
      return;
    }

    // If no data, show message
    if (allBars.length === 0) {
      containerGroup
        .append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "#777")
        .text("Rate of change appears when at least two decades are visible.");
      highlightRef.current = () => {};
      return;
    }

    // Build decade domain using start-of-span, rounded to decade
    const decadeDomain = Array.from(
      new Set(
        allBars.map((d) => {
          const start =
            d.spanStart ?? d.fromYear ?? Math.floor(d.year / 10) * 10;
          return Math.floor(start / 10) * 10;
        })
      )
    ).sort((a, b) => a - b);

    const xBand = d3
      .scaleBand()
      .domain(decadeDomain)
      .range([0, innerWidth])
      .paddingInner(0)
      .paddingOuter(0);

    const innerBand = d3
      .scaleBand()
      .domain(seriesKeys)
      .range([0, xBand.bandwidth()])
      .padding(0);

    // Build per-decade data while keeping consistent slots for each active series
    const decadeData = decadeDomain.map((decade) => {
      const items = series.map((s) => {
        const match = (s.data || []).find((d) => {
          const start =
            d.spanStart ?? d.fromYear ?? Math.floor(d.year / 10) * 10;
          return Math.floor(start / 10) * 10 === decade;
        });
        return {
          decade,
          scenario: s.key,
          color: s.color,
          value: match ? match.value : null,
        };
      });
      return { decade, items };
    });

    const tickTarget = Math.min(6, decadeDomain.length);
    const tickValues = Array.from(
      new Set(
        d3
          .ticks(
            decadeDomain[0],
            decadeDomain[decadeDomain.length - 1],
            tickTarget
          )
          .map((t) => Math.floor(t / 10) * 10)
      )
    ).filter((d) => decadeDomain.includes(d));

    const xAxisBand = d3
      .axisBottom(xBand)
      .tickFormat(d3.format("d"))
      .tickValues(tickValues);

    // Prepare axis
    containerGroup
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxisBand)
      .style("font-size", "20px");

    containerGroup.append("g").call(rateYAxis).style("font-size", "13px");

    // Zero line
    containerGroup
      .append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", rateYScale(0))
      .attr("y2", rateYScale(0))
      .attr("stroke", "#cbd5e1")
      .attr("stroke-width", 1.2)
      .attr("stroke-dasharray", "4,3");

    const barsGroup = containerGroup.append("g").attr("class", "rate-bars");

    const bars = barsGroup
      .selectAll("g.decade")
      .data(decadeData)
      .enter()
      .append("g")
      .attr("class", "decade-group")
      .attr("transform", (d) => `translate(${xBand(d.decade)},0)`)
      .selectAll("rect")
      .data((d) => d.items)
      .enter()
      .append("rect")
      .attr("class", "rate-bar")
      .attr("x", (d) => innerBand(d.scenario))
      .attr("width", innerBand.bandwidth())
      .attr("y", (d) => rateYScale(Math.max(0, d.value ?? 0)))
      .attr("height", (d) =>
        d.value == null ? 0 : Math.abs(rateYScale(d.value) - rateYScale(0))
      )
      .attr("fill", (d) => d.color)
      .attr("fill-opacity", (d) => (d.value == null ? 0 : 0.9))
      .attr("stroke", "none");

    // Labels are minimal: show only decade tick marks already handled by axis; remove dense ticks
    containerGroup
      .selectAll(".tick text")
      .style("font-size", "13px")
      .style("fill", "#475569");

    // Highlight handler
    const highlight = (year) => {
      if (year == null) {
        bars.classed("rate-bar-highlight", false).attr("opacity", 0.9);
        return;
      }
      const decade = Math.floor(year / 10) * 10;
      bars
        .classed(
          "rate-bar-highlight",
          (d) => d.decade === decade && d.value != null
        )
        .attr("opacity", (d) =>
          d.decade === decade && d.value != null ? 1 : 0.4
        );
    };

    highlightRef.current = highlight;
  };

  const rateHighlightRef = { current: () => {} };

  if (hasSeparateRate) {
    const rateSvg = d3.select("#rateSvg");
    if (!rateSvg.empty()) {
      const svgEl = rateSvg.node();
      const rect = svgEl ? svgEl.getBoundingClientRect() : null;
      const cardW = Math.max(rateCardWidth, rect?.width || 0);
      const cardH = Math.max(rateCardHeight, rect?.height || 0);
      const innerW = Math.max(
        260,
        cardW - rateCardMargin.left - rateCardMargin.right
      );
      const innerH = Math.max(
        200,
        cardH - rateCardMargin.top - rateCardMargin.bottom
      );

      rateSvg
        .attr("width", cardW)
        .attr("height", cardH)
        .attr("viewBox", `0 0 ${cardW} ${cardH}`)
        .attr("preserveAspectRatio", "xMidYMid meet");
      rateSvg.selectAll("*").remove();

      const outer = rateSvg
        .append("g")
        .attr(
          "transform",
          `translate(${rateCardMargin.left},${rateCardMargin.top})`
        );

      // Re-scale to the measured space
      rateXScale.range([0, innerW]);
      rateYScale.range([innerH, 0]);

      renderRateBarChart(outer, innerW, innerH, rateHighlightRef);
    }
  } else {
    const rateGroup = svg
      .append("g")
      .attr("class", "rate-chart")
      .attr("transform", `translate(${rateOrigin.x},${rateOrigin.y})`);

    rateGroup
      .append("rect")
      .attr("width", rateInsetWidth)
      .attr("height", rateInsetHeight)
      .attr("rx", 8)
      .attr("ry", 8)
      .attr("fill", "#f8fbff")
      .attr("stroke", "#d7e3f4")
      .attr("stroke-width", 1);

    const rateInner = rateGroup
      .append("g")
      .attr(
        "transform",
        `translate(${rateInsetMargin.left},${rateInsetMargin.top})`
      );

    renderRateBarChart(
      rateInner,
      rateInnerWidth,
      rateInnerHeight,
      rateHighlightRef
    );
  }

  // Add invisible overlay for distance-based line detection
  // This makes it easier to interact with lines by detecting when mouse is within 10px
  const overlay = svg
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr(
      "height",
      hasSeparateRate
        ? height - margin.top - margin.bottom
        : Math.max(0, rateOrigin.y - margin.top - 8)
    )
    .attr("fill", "transparent")
    .attr("pointer-events", "all")
    .style("cursor", "crosshair");

  // Track which line is currently highlighted
  let currentHighlightedLine = null;
  let currentTooltipData = null;

  overlay.on("mousemove", function (event) {
    const [mouseX, mouseY] = d3.pointer(event, svgNode);

    // Only check within the chart area
    if (
      mouseX < margin.left ||
      mouseX > width - margin.right ||
      mouseY < margin.top ||
      mouseY > height - margin.bottom
    ) {
      return;
    }

    // Find nearest point on each active line
    const candidates = [];

    if (activeScenarios.includes("historical") && binnedHistorical.length > 0) {
      const result = findNearestPointOnLine(
        mouseX,
        mouseY,
        binnedHistorical,
        "historical-line"
      );
      if (result) candidates.push(result);
    }

    if (activeScenarios.includes("low") && binnedLow.length > 0) {
      const result = findNearestPointOnLine(
        mouseX,
        mouseY,
        binnedLow,
        "low-emission-line"
      );
      if (result) candidates.push(result);
    }

    if (activeScenarios.includes("high") && binnedHigh.length > 0) {
      const result = findNearestPointOnLine(
        mouseX,
        mouseY,
        binnedHigh,
        "high-emission-line"
      );
      if (result) candidates.push(result);
    }

    // Find the nearest line overall
    if (candidates.length > 0) {
      candidates.sort((a, b) => a.distance - b.distance);
      const nearest = candidates[0];

      // Highlight the nearest line
      if (currentHighlightedLine !== nearest.lineClass) {
        // Reset all lines
        svg
          .selectAll(
            ".historical-line, .low-emission-line, .high-emission-line"
          )
          .each(function () {
            d3.select(this).attr("opacity", 0.7).attr("stroke-width", 2);
          });

        // Highlight nearest line
        const nearestLine = svg.select(`.${nearest.lineClass}`);
        if (!nearestLine.empty()) {
          nearestLine.attr("opacity", 1).attr("stroke-width", 3);
          currentHighlightedLine = nearest.lineClass;

          // Dim other lines
          svg
            .selectAll(
              ".historical-line, .low-emission-line, .high-emission-line"
            )
            .filter(function () {
              return !d3.select(this).classed(nearest.lineClass);
            })
            .attr("opacity", 0.3);
        }
      }

      // Show tooltip (always update so it follows the cursor)
      showTooltip(event, nearest.point, nearest.lineClass, nearest.pathPoint);
      currentTooltipData = nearest.point;
      rateHighlightRef.current(nearest.point.year);
    } else {
      // No line within 10px, reset highlighting
      if (currentHighlightedLine) {
        svg
          .selectAll(
            ".historical-line, .low-emission-line, .high-emission-line"
          )
          .attr("opacity", 0.7)
          .attr("stroke-width", 2);
        currentHighlightedLine = null;
        hideTooltip();
        currentTooltipData = null;
      }
      rateHighlightRef.current(null);
    }
  });

  overlay.on("mouseleave", function () {
    // Reset all lines when mouse leaves the chart area
    svg
      .selectAll(".historical-line, .low-emission-line, .high-emission-line")
      .attr("opacity", 0.7)
      .attr("stroke-width", 2);
    currentHighlightedLine = null;
    hideTooltip();
    currentTooltipData = null;
    rateHighlightRef.current(null);
  });
}

function initializeRegionalChartIfActive(regionalSlide) {
  if (
    regionalSlide &&
    regionalSlide.classList.contains("active") &&
    !regionalChartInitialized
  ) {
    initializeRegionalChart();
  }
}

function placeImpactPanelFullWidth() {
  const regionalMain = document.querySelector(".regional-main");
  const impactPanel = document.querySelector(".region-impact-panel");

  if (!regionalMain || !impactPanel) return;

  // Move the impact panel to the bottom of the layout so it can span full width
  if (impactPanel.parentElement !== regionalMain) {
    regionalMain.appendChild(impactPanel);
  }

  impactPanel.classList.add("full-width-panel");
}

// Ensure controls are wired and chart initializes when the regional slide is active
document.addEventListener("DOMContentLoaded", () => {
  // Always wire controls so the nav buttons work even if chart init is delayed
  setupEventListeners();

  // Allow the impact cards to stretch horizontally across the bottom
  placeImpactPanelFullWidth();

  const regionalSlide = document.getElementById("regional-slide");
  initializeRegionalChartIfActive(regionalSlide);

  if (regionalSlide) {
    const observer = new MutationObserver(() => {
      if (regionalSlide.classList.contains("active")) {
        initializeRegionalChartIfActive(regionalSlide);
      } else if (regionalChartInitialized) {
        // Allow a clean re-init when the user returns to this slide
        regionalChartInitialized = false;
      }
    });

    observer.observe(regionalSlide, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }
});
