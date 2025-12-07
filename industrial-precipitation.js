// Summer Precipitation Trends by Region (using CSV data from summer_data/)
//
// This version reads 4 CSV files:
//   summer_data/summer-trend-northeast.csv
//   summer_data/summer-trend-south.csv
//   summer_data/summer-trend-midwest.csv
//   summer_data/summer-trend-west.csv
// Each file has columns: year, pr
// Then draws a 4-line chart with hover + legend toggle
// and text-hover highlight for specific year ranges on Slide 2.

let industrialChartInitialized = false;

function createIndustrialPrecipitationChart() {
  if (industrialChartInitialized) return;
  industrialChartInitialized = true;

  const container = d3.select("#industrial-precipitation-chart");
  if (container.empty()) {
    console.warn("#industrial-precipitation-chart not found");
    return;
  }

  container.selectAll("*").remove();

  // Fixed dimensions
  const width = 800;
  const height = 450;
  const margin = { top: 100, right: 50, bottom: 20, left: 120 };
  const svgWidth = width;
  const svgHeight = height;

  const svg = container
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const regions = [
    {
      key: "Northeast",
      file: "summer_data/summer-trend-northeast.csv",
      color: "#2e86ab",
    },
    {
      key: "South",
      file: "summer_data/summer-trend-south.csv",
      color: "#a23b72",
    },
    {
      key: "Midwest",
      file: "summer_data/summer-trend-midwest.csv",
      color: "#f6ae2d",
    },
    {
      key: "West",
      file: "summer_data/summer-trend-west.csv",
      color: "#4caf50",
    },
  ];

  function loadRegionCSV(file) {
    return d3.csv(file, (d) => ({
      year: +d.year,
      pr: parseFloat(d.pr) * 86400,
    }));
  }

  Promise.all(regions.map((r) => loadRegionCSV(r.file))).then((datasets) => {
    regions.forEach((r, i) => {
      r.data = datasets[i].filter((d) => !isNaN(d.year) && !isNaN(d.pr));
      r.data.sort((a, b) => a.year - b.year);
      r.visible = true;
    });

    const allYears = Array.from(
      new Set(regions.flatMap((r) => r.data.map((d) => d.year)))
    ).sort((a, b) => a - b);

    const allValues = regions.flatMap((r) => r.data.map((d) => d.pr));

    // Calculate chart dimensions
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(allYears))
      .range([0, chartWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([d3.min(allValues) * 0.95, d3.max(allValues) * 1.05])
      .range([chartHeight, 0]);

    const line = d3
      .line()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d.pr))
      .curve(d3.curveMonotoneX);

    // Axes
    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(8);
    const yAxis = d3.axisLeft(yScale).ticks(6).tickFormat(d3.format(".1f"));

    svg
      .append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(xAxis)
      .selectAll("text")
      .attr("font-size", "11px")
      .attr("fill", "#666");

    svg
      .append("g")
      .call(yAxis)
      .selectAll("text")
      .attr("font-size", "11px")
      .attr("fill", "#666");

    // Axis labels
    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -60)
      .attr("x", -chartHeight / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#333")
      .text("Summer Precipitation (mm/day)");

    svg
      .append("text")
      .attr("transform", `translate(${chartWidth / 2}, ${chartHeight + 40})`)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#333")
      .text("Year");

    // Title
    svg
      .append("text")
      .attr("x", chartWidth / 2)
      .attr("y", -60)
      .attr("text-anchor", "middle")
      .attr("font-size", "18px")
      .attr("font-weight", "600")
      .attr("font-family", "Georgia, serif")
      .attr("fill", "#2c3e50")
      .text("Summer Precipitation Trends by U.S. Region (1850–2014)");

    // Shaded drought regions
    const droughtPeriods = [
      {
        start: 1930,
        end: 1940,
        color: "rgba(210, 180, 140, 0.3)", // light brown
        label: "Dust Bowl Drought",
      },
      {
        start: 1950,
        end: 1957,
        color: "rgba(128, 128, 128, 0.3)", // grey
        label: "1950s Drought",
      },
    ];

    const droughtGroup = svg.append("g").attr("class", "drought-regions");

    droughtPeriods.forEach((period, index) => {
      // Shaded rectangle
      droughtGroup
        .append("rect")
        .attr("x", xScale(period.start))
        .attr("y", 0)
        .attr("width", xScale(period.end) - xScale(period.start))
        .attr("height", chartHeight)
        .attr("fill", period.color)
        .attr("stroke", "none");

      // Label - alternate vertical positions
      const yPosition = index % 2 === 0 ? 0 : 10;
      // Label text brown and grey respectively
      droughtGroup
        .append("text")
        .attr("x", (xScale(period.start) + xScale(period.end)) / 2)
        .attr("y", yPosition)
        .attr("text-anchor", "middle")
        .attr("font-size", "9px")
        .attr("font-weight", "600")
        .attr("fill", index % 2 === 0 ? "brown" : "grey")
        .attr("opacity", 0.8)
        .text(period.label);
    });

    // Draw lines
    regions.forEach((r) => {
      const className =
        "region-line-" + r.key.replace(/\s+/g, "-").toLowerCase();

      r.path = svg
        .append("path")
        .datum(r.data)
        .attr("class", className)
        .attr("fill", "none")
        .attr("stroke", r.color)
        .attr("stroke-width", 2.5)
        .attr("d", line);
    });

    // Legend
    const legend = svg
      .append("g")
      .attr("transform", `translate(${chartWidth + 20}, 20)`);

    function updateRegionVisibility(region) {
      region.path.style("opacity", region.visible ? 1 : 0.15);
      if (region.hoverCircle) {
        region.hoverCircle.style("opacity", 0);
      }
      if (region.legendLine && region.legendText) {
        region.legendLine.style("opacity", region.visible ? 1 : 0.3);
        region.legendText.style("opacity", region.visible ? 1 : 0.5);
      }
    }

    regions.forEach((r, i) => {
      const row = legend
        .append("g")
        .attr("transform", `translate(0, ${i * 18})`)
        .style("cursor", "pointer")
        .on("click", () => {
          r.visible = !r.visible;
          updateRegionVisibility(r);
        });

      const legendLine = row
        .append("line")
        .attr("x1", 0)
        .attr("x2", 20)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", r.color)
        .attr("stroke-width", 2.5);

      const legendText = row
        .append("text")
        .attr("x", 25)
        .attr("y", 4)
        .attr("font-size", "11px")
        .attr("fill", "#333")
        .text(r.key);

      r.legendLine = legendLine;
      r.legendText = legendText;

      updateRegionVisibility(r);
    });

    // Highlight range group (for text hover)
    let highlightGroup = svg.append("g").attr("class", "range-highlight-group");

    // Hover group for tooltip & circles
    const hoverGroup = svg.append("g").attr("class", "hover-group");

    const hoverLine = hoverGroup
      .append("line")
      .attr("class", "hover-line")
      .attr("stroke", "#999")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3")
      .attr("y1", 0)
      .attr("y2", chartHeight)
      .style("opacity", 0);

    regions.forEach((r) => {
      r.hoverCircle = hoverGroup
        .append("circle")
        .attr("r", 4)
        .attr("fill", r.color)
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .style("opacity", 0);
    });

    // Tooltip
    const tooltip = hoverGroup
      .append("g")
      .attr("class", "multi-tooltip")
      .style("opacity", 0);

    const tooltipRect = tooltip
      .append("rect")
      .attr("fill", "rgba(0,0,0,0.8)")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .attr("rx", 4)
      .attr("ry", 4);

    const tooltipTextGroup = tooltip
      .append("g")
      .attr("transform", "translate(6,6)");

    const tooltipYearText = tooltipTextGroup
      .append("text")
      .attr("font-size", "10px")
      .attr("fill", "#fff")
      .attr("font-weight", "bold")
      .attr("x", 0)
      .attr("y", 10);

    const tooltipValueTexts = regions.map((r, idx) =>
      tooltipTextGroup
        .append("text")
        .attr("font-size", "10px")
        .attr("fill", "#fff")
        .attr("x", 0)
        .attr("y", 24 + idx * 12)
    );

    function findClosestYear(mouseYear) {
      let closest = allYears[0];
      let minDist = Math.abs(mouseYear - closest);
      for (let i = 1; i < allYears.length; i++) {
        const y = allYears[i];
        const dist = Math.abs(mouseYear - y);
        if (dist < minDist) {
          minDist = dist;
          closest = y;
        }
      }
      return closest;
    }

    function findClosestPointForYear(data, year) {
      if (!data || data.length === 0) return null;
      let best = data[0];
      let minDist = Math.abs(data[0].year - year);
      for (let i = 1; i < data.length; i++) {
        const d = data[i];
        const dist = Math.abs(d.year - year);
        if (dist < minDist) {
          minDist = dist;
          best = d;
        }
      }
      return best;
    }

    // Hover overlay
    svg
      .append("rect")
      .attr("class", "overlay")
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .attr("fill", "transparent")
      .style("cursor", "crosshair")
      .on("mouseover", function () {
        hoverLine.style("opacity", 1);
        regions.forEach((r) => {
          if (r.visible) {
            r.hoverCircle.style("opacity", 1);
          }
        });
        tooltip.style("opacity", 1);
      })
      .on("mousemove", function (event) {
        const [mouseX] = d3.pointer(event, this);
        const clampedX = Math.max(0, Math.min(chartWidth, mouseX));
        const mouseYear = xScale.invert(clampedX);
        const closestYear = findClosestYear(mouseYear);
        const xPos = xScale(closestYear);

        hoverLine.attr("x1", xPos).attr("x2", xPos);

        const valuesForTooltip = [];

        regions.forEach((r, idx) => {
          const p = findClosestPointForYear(r.data, closestYear);
          if (p && r.visible) {
            r.hoverCircle
              .attr("cx", xPos)
              .attr("cy", yScale(p.pr))
              .style("opacity", 1);
          } else {
            r.hoverCircle.style("opacity", 0);
          }

          if (p) {
            valuesForTooltip[idx] = {
              text: `${r.key}: ${p.pr.toFixed(1)} mm`,
              visible: r.visible,
            };
          } else {
            valuesForTooltip[idx] = {
              text: `${r.key}: —`,
              visible: r.visible,
            };
          }
        });

        tooltipYearText.text(`Year: ${closestYear}`);

        valuesForTooltip.forEach((v, idx) => {
          tooltipValueTexts[idx]
            .text(v.text)
            .attr("fill", v.visible ? "#fff" : "#ccc");
        });

        const widths = [
          tooltipYearText.node().getComputedTextLength(),
          ...tooltipValueTexts.map((t) => t.node().getComputedTextLength()),
        ];
        const boxWidth = d3.max(widths) + 12;
        const boxHeight = 6 + (regions.length + 1) * 12 + 6;

        tooltipRect.attr("width", boxWidth).attr("height", boxHeight);

        const tooltipX =
          xPos + 10 > chartWidth - boxWidth ? xPos - boxWidth - 10 : xPos + 10;
        const tooltipY = 10;

        tooltip.attr(`transform`, `translate(${tooltipX}, ${tooltipY})`);
      })
      .on("mouseleave", function () {
        hoverLine.style("opacity", 0);
        regions.forEach((r) => r.hoverCircle.style("opacity", 0));
        tooltip.style("opacity", 0);
      });

    // Text hover → highlight specific year ranges
    function clearHighlightRange() {
      highlightGroup.selectAll("*").remove();
      regions.forEach((r) => {
        r.path.style("opacity", 1);
        if (r.legendLine) r.legendLine.style("opacity", 1);
        if (r.legendText) r.legendText.style("opacity", 1);
      });
    }

    function applyHighlightRange(startYear, endYear) {
      highlightGroup.selectAll("*").remove();

      regions.forEach((r) => {
        r.path.style("opacity", 0.15);
        if (r.legendLine) r.legendLine.style("opacity", 0.3);
        if (r.legendText) r.legendText.style("opacity", 0.5);
      });

      regions.forEach((r) => {
        const segment = r.data.filter(
          (d) => d.year >= startYear && d.year <= endYear
        );
        if (segment.length > 1) {
          highlightGroup
            .append("path")
            .datum(segment)
            .attr("fill", "none")
            .attr("stroke", r.color)
            .attr("stroke-width", 3.5)
            .attr("d", line);
        }
      });
    }
  });
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  createIndustrialPrecipitationChart();
  createImpactComparisonChart();
});

// -------------------------------------------------------------------
// Impact-focused comparison chart (High vs Low scenarios)
// -------------------------------------------------------------------

let impactChartInitialized = false;

function createImpactComparisonChart() {
  if (impactChartInitialized) return;
  const container = d3.select("#impact-comparison-chart");
  if (container.empty()) return;
  impactChartInitialized = true;
  container.selectAll("*").remove();

  // Scenario assumptions (illustrative)
  // Metric-specific factors to avoid a uniform % gap
  const scenarioFactors = {
    farms: { low: 1.12, high: 1.55 },
    people: { low: 1.1, high: 1.5 },
    damage: { low: 1.15, high: 1.7 },
  };

  // Exposure baselines per region (illustrative, consistent with other slides)
  const regionExposure = {
    northeast: { farms: 32000, damage: 12_000_000_000, people: 1_300_000 },
    midwest: { farms: 45000, damage: 10_000_000_000, people: 1_000_000 },
    south: { farms: 38000, damage: 11_000_000_000, people: 1_400_000 },
    northwest: { farms: 16000, damage: 6_000_000_000, people: 450_000 },
    west: { farms: 16000, damage: 6_000_000_000, people: 450_000 },
  };

  const regions = [
    { key: "northeast", label: "Northeast" },
    { key: "midwest", label: "Midwest" },
    { key: "south", label: "South" },
    { key: "west", label: "West" },
  ];

  const metrics = [
    { key: "farms", label: "Farms flooded", type: "count" },
    { key: "people", label: "People exposed", type: "count" },
    { key: "damage", label: "Economic losses", type: "currency" },
  ];

  const colors = { low: "#4caf50", high: "#e53935" }; // match scrollytelling green, red for high

  const formatNumber = (num) =>
    num == null ? "—" : Math.round(num).toLocaleString("en-US");
  const formatCurrency = (num) => {
    if (num == null) return "—";
    if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    return `$${num.toLocaleString("en-US")}`;
  };
  const formatValue = (val, type) =>
    type === "currency" ? formatCurrency(val) : formatNumber(val);

  // Precompute impacts
  function computeImpacts(metricKey) {
    const factors = scenarioFactors[metricKey] || scenarioFactors.farms;
    return regions.map((r) => {
      const base = regionExposure[r.key][metricKey];
      const lowVal = base * factors.low;
      const highVal = base * factors.high;
      return {
        ...r,
        low: { [metricKey]: lowVal },
        high: { [metricKey]: highVal },
      };
    });
  }

  const state = { metric: "farms", data: computeImpacts("farms") };

  // Layout
  const width = 920;
  const height = 600;
  const margin = { top: 80, right: 320, bottom: 110, left: 190 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Controls
  const controls = container
    .append("div")
    .style("display", "flex")
    .style("gap", "0.5rem")
    .style("align-items", "center")
    .style("margin-bottom", "0.5rem");

  controls
    .append("span")
    .text("Metric:")
    .style("font-weight", "600")
    .style("color", "#34495e");

  metrics.forEach((m) => {
    controls
      .append("button")
      .text(m.label)
      .style("padding", "0.35rem 0.75rem")
      .style("border", "1px solid #d0d7de")
      .style("border-radius", "6px")
      .style("background", m.key === state.metric ? "#e8f0fe" : "#fff")
      .style("color", "#1f2937")
      .style("cursor", "pointer")
      .style("font-size", "13px")
      .on("click", () => {
        state.metric = m.key;
        controls.selectAll("button").style("background", (d, i, nodes) => {
          const key = metrics[i].key;
          return key === state.metric ? "#e8f0fe" : "#fff";
        });
        update();
      });
  });

  container
    .append("div")
    .style("font-size", "12px")
    .style("color", "#5b6770")
    .style("margin-bottom", "0.75rem")
    .text("High vs low emissions. Gap = avoidable impact.");

  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const infoPanel = container.append("div").attr("class", "impact-info-panel");

  const summarySection = infoPanel
    .append("div")
    .attr("class", "impact-info-section impact-summary-section");
  summarySection
    .append("div")
    .attr("class", "impact-info-label")
    .text("Avoided Impact");
  const summaryValue = summarySection
    .append("div")
    .attr("class", "impact-info-value");

  const contextSection = infoPanel
    .append("div")
    .attr("class", "impact-info-section impact-context-section");
  contextSection
    .append("div")
    .attr("class", "impact-info-label")
    .text("Why It Matters");
  const contextBody = contextSection
    .append("div")
    .attr("class", "impact-info-text");

  const calloutSection = infoPanel
    .append("div")
    .attr("class", "impact-info-section impact-callout-section");
  calloutSection
    .append("div")
    .attr("class", "impact-info-label")
    .text("Key Takeaway");
  const calloutText = calloutSection
    .append("div")
    .attr("class", "impact-info-text");

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Title & subtitle
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 32)
    .attr("text-anchor", "middle")
    .attr("font-size", "18px")
    .attr("font-weight", "600")
    .attr("font-family", "Georgia, serif")
    .attr("fill", "#2c3e50")
    .text("High vs Low Emissions: Who Bears the Impact?");

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 52)
    .attr("text-anchor", "middle")
    .attr("font-size", "13px")
    .attr("fill", "#5b6770")
    .text(
      "Illustrative impacts from higher summer precipitation under two futures"
    );

  const xScale = d3.scaleLinear().range([0, chartWidth]);
  const yScale = d3
    .scaleBand()
    .padding(0.3)
    .domain(regions.map((r) => r.key))
    .range([0, chartHeight]);

  const ySub = d3
    .scaleBand()
    .domain(["low", "high"])
    .range([0, yScale.bandwidth()])
    .padding(0.25);

  const xAxis = g
    .append("g")
    .attr("transform", `translate(0,${chartHeight})`)
    .attr("class", "impact-x-axis");

  const yAxis = g.append("g").attr("class", "impact-y-axis");
  const grid = g.append("g").attr("class", "impact-grid");

  const legend = svg
    .append("g")
    .attr("transform", `translate(${width - 260},${margin.top})`);
  legend
    .append("text")
    .attr("x", 0)
    .attr("y", -16)
    .attr("fill", "#374151")
    .attr("font-size", "12px")
    .attr("font-weight", "700")
    .text("Scenario");
  const legendItems = [
    { key: "low", label: "Low emissions", color: colors.low },
    { key: "high", label: "High emissions", color: colors.high },
  ];
  legendItems.forEach((item, i) => {
    const row = legend.append("g").attr("transform", `translate(0, ${i * 18})`);
    row
      .append("rect")
      .attr("x", 0)
      .attr("y", -10)
      .attr("width", 14)
      .attr("height", 14)
      .attr("fill", item.color)
      .attr("rx", 3);
    row
      .append("text")
      .attr("x", 20)
      .attr("y", 0)
      .attr("fill", "#333")
      .attr("font-size", "12px")
      .text(item.label);
  });

  const deltaGroup = g.append("g").attr("class", "delta-labels");
  const xAxisLabel = svg
    .append("text")
    .attr("class", "impact-axis-label")
    .attr("text-anchor", "middle")
    .attr("x", margin.left + chartWidth / 2)
    .attr("y", height - 20)
    .attr("fill", "#4b5563")
    .attr("font-size", "12px")
    .text("Exposure under illustrative summer precipitation futures");

  function update() {
    const metricDef = metrics.find((m) => m.key === state.metric);
    // refresh data with metric-specific factors
    state.data = computeImpacts(metricDef.key);
    const values = state.data.flatMap((d) => [
      d.low[metricDef.key],
      d.high[metricDef.key],
    ]);
    const totalLow = d3.sum(state.data, (d) => d.low[metricDef.key]);
    const totalHigh = d3.sum(state.data, (d) => d.high[metricDef.key]);
    const totalGap = totalHigh - totalLow;
    const maxVal = d3.max([...values, totalGap]) * 1.2;
    xScale.domain([0, maxVal]);

    // Gridlines
    grid
      .call(d3.axisBottom(xScale).ticks(6).tickSize(chartHeight).tickFormat(""))
      .attr("transform", `translate(0,0)`);
    grid.selectAll("line").attr("stroke", "#e5e7eb");
    grid.selectAll("path").remove();

    // Axes
    xAxis.call(
      d3
        .axisBottom(xScale)
        .ticks(6)
        .tickFormat((d) => formatValue(d, metricDef.type))
    );
    xAxis.selectAll("text").attr("font-size", "11px").attr("fill", "#4b5563");
    yAxis.call(
      d3
        .axisLeft(yScale)
        .tickFormat((d) => regions.find((r) => r.key === d).label)
    );
    yAxis
      .selectAll("text")
      .attr("font-size", "12px")
      .attr("fill", "#111827")
      .attr("font-weight", "600");

    // Per-region delta labels placed to the right of bars (reduced clutter)
    const deltas = deltaGroup.selectAll("text").data(state.data, (d) => d.key);
    deltas
      .enter()
      .append("text")
      .attr("fill", "#1d4ed8")
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .attr("fill", "#1e3a8a")
      .attr("text-anchor", "start")
      .merge(deltas)
      .transition()
      .duration(500)
      .attr("x", chartWidth + 40)
      .attr("y", (d) => yScale(d.key) + ySub("high") + 4)
      .text((d) => {
        const diff = d.high[metricDef.key] - d.low[metricDef.key];
        const pct =
          d.low[metricDef.key] > 0
            ? ((diff / d.low[metricDef.key]) * 100).toFixed(0)
            : "—";
        return `+${formatValue(diff, metricDef.type)} (+${pct}%)`;
      });
    deltas.exit().remove();

    // Bars
    const regionGroups = g
      .selectAll(".region-group")
      .data(state.data, (d) => d.key);

    const regionEnter = regionGroups
      .enter()
      .append("g")
      .attr("class", "region-group")
      .attr("transform", (d) => `translate(0, ${yScale(d.key)})`);

    regionEnter
      .selectAll(".scenario-bar")
      .data((d) => ["low", "high"].map((s) => ({ region: d, scenario: s })))
      .enter()
      .append("rect")
      .attr("class", "scenario-bar")
      .attr("fill", (d) => colors[d.scenario])
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("y", (d) => ySub(d.scenario))
      .attr("height", ySub.bandwidth());

    const allGroups = regionEnter.merge(regionGroups);
    allGroups.attr("transform", (d) => `translate(0, ${yScale(d.key)})`);

    allGroups
      .selectAll(".scenario-bar")
      .data((d) => ["low", "high"].map((s) => ({ region: d, scenario: s })))
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("class", "scenario-bar")
            .attr("fill", (d) => colors[d.scenario])
            .attr("rx", 4)
            .attr("ry", 4)
            .attr("y", (d) => ySub(d.scenario))
            .attr("height", ySub.bandwidth())
            .attr("width", 0),
        (updateSel) => updateSel,
        (exit) => exit.remove()
      )
      .transition()
      .duration(500)
      .attr("width", (d) => xScale(d.region[d.scenario][metricDef.key]));

    // Remove inline gap labels to reduce overlap (deltas handled at right)

    // Value labels on bars
    const valueLabels = g.selectAll(".value-label").data(
      state.data.flatMap((d) => [
        { region: d, scenario: "low" },
        { region: d, scenario: "high" },
      ]),
      (d) => d.region.key + d.scenario
    );

    valueLabels
      .enter()
      .append("text")
      .attr("class", "value-label")
      .attr("font-size", "11px")
      .attr("font-weight", "600")
      .merge(valueLabels)
      .transition()
      .duration(500)
      .attr("x", (d) => xScale(d.region[d.scenario][metricDef.key]) + 6)
      .attr(
        "y",
        (d) =>
          yScale(d.region.key) + ySub(d.scenario) + ySub.bandwidth() / 2 + 3
      )
      .attr("fill", "#1f2937")
      .attr("text-anchor", "start")
      .text((d) =>
        formatValue(d.region[d.scenario][metricDef.key], metricDef.type)
      );

    valueLabels.exit().remove();

    // Callout aggregate + summary (moved outside SVG to avoid overlap)
    const avoidedLabel = `+${formatValue(totalGap, metricDef.type)} (${(
      (totalGap / totalLow) *
      100
    ).toFixed(0)}% vs low)`;
    summaryValue.text(avoidedLabel);
    const metricNarrative = metricNarratives[metricDef.key];
    if (metricNarrative) {
      contextBody.text(metricNarrative);
    }

    const pctAvoided =
      totalLow > 0 ? ((totalGap / totalLow) * 100).toFixed(0) : "—";
    calloutText.text(
      `Low emissions avoid ${formatValue(
        totalGap,
        metricDef.type
      )} (${pctAvoided}% reduction) across all regions. Choosing the low-emissions pathway materially shrinks exposure.`
    );
  }

  update();
}
