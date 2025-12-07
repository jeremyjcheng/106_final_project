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
  const futMean =
    scenario === "low"
      ? meanValue(fut, (d) => +d.low_emissions_pr * 86400)
      : meanValue(fut, (d) => +d.high_emissions_pr * 86400);

  if (histMean == null || futMean == null) return 0;
  return Math.max(futMean - histMean, 0); // mm/day increase
}

function computeImpacts(regionKey) {
  const exposure = regionExposure[regionKey] || regionExposure.northeast;
  const deltaLow = scenarioDelta(regionKey, "low");
  const deltaHigh = scenarioDelta(regionKey, "high");

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

// Core drawing function (called whenever state changes)
function drawChart() {
  if (!regionData || !futureData) {
    console.error("No region data or future data available");
    return;
  }

  const { width, height, margin } = getChartDimensions();

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

  const line = d3
    .line()
    .x((d) => xScale(d.year))
    .y((d) => yScale(d.value))
    .curve(d3.curveBasis);

  const tooltip = d3.select("#tooltip");
  const svgNode = svg.node();

  const showTooltip = function (event, d) {
    const xPos = xScale(d.year);
    const yPos = yScale(d.value);
    const svgRect = svgNode.getBoundingClientRect();
    const tooltipNode = tooltip.node();
    if (!tooltipNode) return;

    const slideElement = tooltipNode.closest(".slide");
    if (!slideElement) return;

    const slideRect = slideElement.getBoundingClientRect();

    // Position tooltip relative to slide container
    const tooltipX = svgRect.left - slideRect.left + xPos + 10;
    const tooltipY = svgRect.top - slideRect.top + yPos - 40;

    const scenarioLabel = scenarioLabelMap[d.type] || "Value";

    // Show bin range if this is binned data
    let tooltipText = `<strong>${scenarioLabel}</strong> — ${currentRegion}<br>Year: ${d.year}`;
    if (d.binStart !== undefined && d.binEnd !== undefined) {
      tooltipText = `<strong>${scenarioLabel}</strong> — ${currentRegion}<br>Years: ${d.binStart}-${d.binEnd}<br>Center: ${d.year}`;
    }
    tooltipText += `<br>Precipitation: ${d.value.toFixed(2)} mm/day`;
    if (d.count !== undefined) {
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

  // Find nearest point on a line path to a given mouse position
  function findNearestPointOnLine(mouseX, mouseY, data, lineClass) {
    if (!data || data.length < 2) return null;

    let minDistance = Infinity;
    let nearestPoint = null;
    let nearestIndex = -1;

    for (let i = 0; i < data.length - 1; i++) {
      const x1 = xScale(data[i].year);
      const y1 = yScale(data[i].value);
      const x2 = xScale(data[i + 1].year);
      const y2 = yScale(data[i + 1].value);

      const distance = pointToLineDistance(mouseX, mouseY, x1, y1, x2, y2);

      if (distance < minDistance) {
        minDistance = distance;
        // Find the closest data point to the nearest point on the line segment
        const segmentLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const t =
          segmentLength > 0
            ? Math.max(
                0,
                Math.min(
                  1,
                  ((mouseX - x1) * (x2 - x1) + (mouseY - y1) * (y2 - y1)) /
                    segmentLength ** 2
                )
              )
            : 0;

        // Use the point that's closer to the mouse
        const distToP1 = Math.sqrt((mouseX - x1) ** 2 + (mouseY - y1) ** 2);
        const distToP2 = Math.sqrt((mouseX - x2) ** 2 + (mouseY - y2) ** 2);

        if (distToP1 < distToP2) {
          nearestPoint = data[i];
          nearestIndex = i;
        } else {
          nearestPoint = data[i + 1];
          nearestIndex = i + 1;
        }
      }
    }

    return minDistance <= 10
      ? { point: nearestPoint, distance: minDistance, lineClass }
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
    defaultYOffset = -10
  ) {
    if (!data || data.length === 0) return;
    const n = data.length;
    const last = data[n - 1];
    const prev = n > 1 ? data[n - 2] : last;

    // Offset label away from the line based on local slope so it does not sit on top of the line
    const slope = n > 1 ? last.value - prev.value : 0;
    const dynamicYOffset =
      slope >= 0 ? defaultYOffset - 6 : defaultYOffset + 10;

    const rawX = xScale(last.year);
    const rawY = yScale(last.value) + dynamicYOffset;

    // Keep labels inside plot area
    const xPadding = 8;
    const yPadding = 6;
    const maxX = width - margin.right - xPadding;
    const minX = margin.left + xPadding;
    const maxY = height - margin.bottom - yPadding;
    const minY = margin.top + yPadding;

    const shouldFlipLeft = rawX > maxX;
    const labelX = Math.min(Math.max(rawX, minX), maxX);
    const labelY = Math.min(Math.max(rawY, minY), maxY);

    const xOffset = shouldFlipLeft ? -10 : 10;
    const anchor = shouldFlipLeft ? "end" : "start";

    svg
      .append("text")
      .attr("class", `endpoint-label ${className}`)
      .attr("x", labelX + xOffset)
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
    svg
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
      -10
    );
  }

  // Low emission (SSP 126)
  if (activeScenarios.includes("low")) {
    svg
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

    addEndpointLabel(binnedLow, "endpoint-label-low", "#1e88e5", "Low", -14);
  }

  // High emission (SSP 585)
  if (activeScenarios.includes("high")) {
    svg
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

    addEndpointLabel(binnedHigh, "endpoint-label-high", "#e53935", "High", -18);
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

  // Add invisible overlay for distance-based line detection
  // This makes it easier to interact with lines by detecting when mouse is within 10px
  const overlay = svg
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom)
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

      // Show tooltip
      if (
        !currentTooltipData ||
        currentTooltipData.year !== nearest.point.year ||
        currentTooltipData.value !== nearest.point.value
      ) {
        showTooltip(event, nearest.point);
        currentTooltipData = nearest.point;
      }
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

// Ensure controls are wired and chart initializes when the regional slide is active
document.addEventListener("DOMContentLoaded", () => {
  // Always wire controls so the nav buttons work even if chart init is delayed
  setupEventListeners();

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
