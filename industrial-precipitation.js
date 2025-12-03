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
      pr: parseFloat(d.pr)* 86400,
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
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(6)
      .tickFormat(d3.format(".1f"));

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
        label: "Dust Bowl Drought"
      },
      {
        start: 1950,
        end: 1957,
        color: "rgba(128, 128, 128, 0.3)", // grey
        label: "1950s Drought"
      }
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
});