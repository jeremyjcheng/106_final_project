// Historical Precipitation Trends: Industrial Revolution Impact
// This visualization shows how industrial pollution and land use changes affected seasonal precipitation

// Global guard to prevent double initialization
let industrialChartInitialized = false;

function createIndustrialPrecipitationChart() {
  const container = d3.select("#industrial-precipitation-chart");
  container.selectAll("*").remove();

  // Set up dimensions
  const margin = { top: 20, right: 30, bottom: 50, left: 60 };
  const width = 500 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Create SVG
  const svgElement = container
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  const svg = svgElement
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Generate synthetic data representing historical trends
  // Based on the narrative: Industrial Revolution effects, pollution suppression, recovery
  const years = d3.range(1850, 2020, 5);

  // Winter precipitation: gradually increasing due to warming/moistening atmosphere
  const winterData = years.map((year) => {
    const base = 200;
    const trend = (year - 1850) * 0.15; // Gradual increase
    const variation = Math.sin((year - 1850) / 30) * 15; // Natural variation
    return {
      year: year,
      value: base + trend + variation,
    };
  });

  // Summer precipitation: suppressed by pollution early on, then recovering
  const summerData = years.map((year) => {
    const base = 180;
    const trend = (year - 1850) * 0.12;
    const variation = Math.sin((year - 1850) / 25) * 12;

    // Pollution suppression effect (strongest 1880-1970, declining after)
    let pollutionEffect = 0;
    if (year >= 1880 && year <= 1970) {
      const peakYear = 1930;
      const distance = Math.abs(year - peakYear);
      pollutionEffect = -20 * Math.exp(-distance / 30); // Peak suppression around 1930
    }

    // Recovery phase (1970-2020)
    if (year > 1970) {
      const recovery = (year - 1970) * 0.3;
      pollutionEffect = -20 + recovery * 0.4; // Gradual recovery
    }

    return {
      year: year,
      value: base + trend + variation + pollutionEffect,
    };
  });

  // Set up scales
  const xScale = d3.scaleLinear().domain(d3.extent(years)).range([0, width]);

  const yScale = d3
    .scaleLinear()
    .domain([
      d3.min([...winterData, ...summerData], (d) => d.value) - 10,
      d3.max([...winterData, ...summerData], (d) => d.value) + 10,
    ])
    .range([height, 0]);

  // Create line generators
  const winterLine = d3
    .line()
    .x((d) => xScale(d.year))
    .y((d) => yScale(d.value))
    .curve(d3.curveMonotoneX);

  const summerLine = d3
    .line()
    .x((d) => xScale(d.year))
    .y((d) => yScale(d.value))
    .curve(d3.curveMonotoneX);

  // Add shaded region for pollution period (interactive)
  const pollutionStart = 1880;
  const pollutionEnd = 1970;
  const pollutionRect = svg
    .append("rect")
    .attr("x", xScale(pollutionStart))
    .attr("y", 0)
    .attr("width", xScale(pollutionEnd) - xScale(pollutionStart))
    .attr("height", height)
    .attr("fill", "rgba(200, 200, 200, 0.15)")
    .attr("stroke", "rgba(150, 150, 150, 0.3)")
    .attr("stroke-width", 1);

  // Add label for pollution period
  const pollutionLabel = svg
    .append("text")
    .attr("x", xScale((pollutionStart + pollutionEnd) / 2))
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .attr("font-size", "11px")
    .attr("fill", "#666")
    .text("Pollution Suppression Period");

  // State for interactive features
  let winterVisible = true;
  let summerVisible = true;

  // Add winter precipitation line
  const winterPath = svg
    .append("path")
    .datum(winterData)
    .attr("class", "winter-line")
    .attr("fill", "none")
    .attr("stroke", "#2e86ab")
    .attr("stroke-width", 2.5)
    .attr("d", winterLine);

  // Add summer precipitation line
  const summerPath = svg
    .append("path")
    .datum(summerData)
    .attr("class", "summer-line")
    .attr("fill", "none")
    .attr("stroke", "#a23b72")
    .attr("stroke-width", 2.5)
    .attr("d", summerLine);

  // Add circles for data points (every 20 years for clarity)
  const winterPoints = winterData.filter((d) => d.year % 20 === 0);
  const summerPoints = summerData.filter((d) => d.year % 20 === 0);

  svg
    .selectAll(".winter-dot")
    .data(winterPoints)
    .enter()
    .append("circle")
    .attr("class", "winter-dot")
    .attr("cx", (d) => xScale(d.year))
    .attr("cy", (d) => yScale(d.value))
    .attr("r", 3)
    .attr("fill", "#2e86ab");

  svg
    .selectAll(".summer-dot")
    .data(summerPoints)
    .enter()
    .append("circle")
    .attr("class", "summer-dot")
    .attr("cx", (d) => xScale(d.year))
    .attr("cy", (d) => yScale(d.value))
    .attr("r", 3)
    .attr("fill", "#a23b72");

  // Add axes
  const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(8);
  const yAxis = d3.axisLeft(yScale).ticks(6);

  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
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

  // Add axis labels
  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - height / 2)
    .attr("dy", "1em")
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("fill", "#333")
    .text("Precipitation (mm)");

  svg
    .append("text")
    .attr(
      "transform",
      `translate(${width / 2}, ${height + margin.bottom - 10})`
    )
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("fill", "#333")
    .text("Year");

  // Add legend
  const legend = svg
    .append("g")
    .attr("transform", `translate(${width - 150}, 30)`);

  const legendData = [
    { label: "Winter Precipitation", color: "#2e86ab" },
    { label: "Summer Precipitation", color: "#a23b72" },
  ];

  // Function to toggle line visibility
  function toggleLine(season, visible) {
    if (season === "winter") {
      winterVisible = visible;
      winterPath.style("opacity", visible ? 1 : 0.3);
      svg.selectAll(".winter-dot").style("opacity", visible ? 1 : 0.3);
    } else {
      summerVisible = visible;
      summerPath.style("opacity", visible ? 1 : 0.3);
      svg.selectAll(".summer-dot").style("opacity", visible ? 1 : 0.3);
    }
  }

  legendData.forEach((item, i) => {
    const season = item.label.includes("Winter") ? "winter" : "summer";
    const legendRow = legend
      .append("g")
      .attr("transform", `translate(0, ${i * 20})`)
      .style("cursor", "pointer")
      .on("click", function () {
        const isVisible = season === "winter" ? winterVisible : summerVisible;
        toggleLine(season, !isVisible);

        // Update legend appearance
        const line = legendRow.select("line");
        const text = legendRow.select("text");
        if (!isVisible) {
          line.style("opacity", 1).attr("stroke-width", 2.5);
          text.style("opacity", 1).style("font-weight", "normal");
        } else {
          line.style("opacity", 0.3).attr("stroke-width", 1.5);
          text.style("opacity", 0.5).style("font-weight", "normal");
        }
      });

    legendRow
      .append("line")
      .attr("x1", 0)
      .attr("x2", 20)
      .attr("y1", 0)
      .attr("y2", 0)
      .attr("stroke", item.color)
      .attr("stroke-width", 2.5);

    legendRow
      .append("text")
      .attr("x", 25)
      .attr("y", 4)
      .attr("font-size", "11px")
      .attr("fill", "#333")
      .text(item.label);
  });

  // Add title
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", -5)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("font-weight", "600")
    .attr("fill", "#2e86ab")
    .text("Seasonal Precipitation Trends (1850-2020)");

  // Create tooltip group
  const tooltipGroup = svg.append("g").attr("class", "tooltip-group");

  // Create vertical line indicator
  const verticalLine = tooltipGroup
    .append("line")
    .attr("class", "hover-line")
    .attr("stroke", "#999")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "3,3")
    .attr("y1", 0)
    .attr("y2", height)
    .style("opacity", 0);

  // Create hover circles for both lines
  const winterHoverCircle = tooltipGroup
    .append("circle")
    .attr("class", "winter-hover-circle")
    .attr("r", 5)
    .attr("fill", "#2e86ab")
    .attr("stroke", "#fff")
    .attr("stroke-width", 2)
    .style("opacity", 0);

  const summerHoverCircle = tooltipGroup
    .append("circle")
    .attr("class", "summer-hover-circle")
    .attr("r", 5)
    .attr("fill", "#a23b72")
    .attr("stroke", "#fff")
    .attr("stroke-width", 2)
    .style("opacity", 0);

  // Create tooltip boxes
  const winterTooltip = tooltipGroup
    .append("g")
    .attr("class", "winter-tooltip")
    .style("opacity", 0);

  const summerTooltip = tooltipGroup
    .append("g")
    .attr("class", "summer-tooltip")
    .style("opacity", 0);

  // Helper function to create tooltip box
  function createTooltipBox(tooltipGroup, color) {
    const rect = tooltipGroup
      .append("rect")
      .attr("fill", color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .attr("rx", 4)
      .attr("ry", 4);

    const textGroup = tooltipGroup.append("g");

    const yearText = textGroup
      .append("text")
      .attr("font-size", "10px")
      .attr("fill", "#fff")
      .attr("font-weight", "bold")
      .attr("x", 6)
      .attr("y", 14);

    const valueText = textGroup
      .append("text")
      .attr("font-size", "10px")
      .attr("fill", "#fff")
      .attr("x", 6)
      .attr("y", 28);

    return { rect, yearText, valueText };
  }

  const winterTooltipBox = createTooltipBox(winterTooltip, "#2e86ab");
  const summerTooltipBox = createTooltipBox(summerTooltip, "#a23b72");

  // Helper function to find closest data point
  function findClosestPoint(mouseX, data) {
    const mouseYear = xScale.invert(mouseX);
    let closest = data[0];
    let minDistance = Math.abs(data[0].year - mouseYear);

    for (let i = 1; i < data.length; i++) {
      const distance = Math.abs(data[i].year - mouseYear);
      if (distance < minDistance) {
        minDistance = distance;
        closest = data[i];
      }
    }
    return closest;
  }

  // Create invisible overlay for mouse tracking
  const overlay = svg
    .append("rect")
    .attr("class", "overlay")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "transparent")
    .style("cursor", "crosshair")
    .on("mouseover", function () {
      verticalLine.style("opacity", 1);
      winterHoverCircle.style("opacity", 1);
      summerHoverCircle.style("opacity", 1);
      winterTooltip.style("opacity", 1);
      summerTooltip.style("opacity", 1);
    })
    .on("mousemove", function (event) {
      const [mouseX, mouseY] = d3.pointer(event, this);
      const clampedX = Math.max(0, Math.min(width, mouseX));

      // Find closest year to mouse position (synchronized for both lines)
      const closestPoint = findClosestPoint(clampedX, winterData);
      const syncYear = closestPoint.year;

      // Get data points for the same year from both datasets
      const winterPoint =
        winterData.find((d) => d.year === syncYear) || closestPoint;
      const summerPoint =
        summerData.find((d) => d.year === syncYear) ||
        findClosestPoint(clampedX, summerData);

      const xPos = xScale(syncYear);

      // Update vertical line
      verticalLine.attr("x1", xPos).attr("x2", xPos);

      // Update hover circles
      if (winterVisible) {
        winterHoverCircle
          .attr("cx", xPos)
          .attr("cy", yScale(winterPoint.value))
          .style("opacity", 1);
      } else {
        winterHoverCircle.style("opacity", 0);
      }

      if (summerVisible) {
        summerHoverCircle
          .attr("cx", xPos)
          .attr("cy", yScale(summerPoint.value))
          .style("opacity", 1);
      } else {
        summerHoverCircle.style("opacity", 0);
      }

      // Update winter tooltip
      winterTooltipBox.yearText.text(`Year: ${syncYear}`);
      winterTooltipBox.valueText.text(
        `Winter: ${winterPoint.value.toFixed(1)} mm`
      );

      const winterTextWidth = Math.max(
        winterTooltipBox.yearText.node().getComputedTextLength(),
        winterTooltipBox.valueText.node().getComputedTextLength()
      );

      winterTooltipBox.rect
        .attr("width", winterTextWidth + 12)
        .attr("height", 32);

      const winterTooltipX =
        xPos + 10 > width - 80 ? xPos - winterTextWidth - 20 : xPos + 10;
      const winterTooltipY = yScale(winterPoint.value) - 40;

      winterTooltip.attr(
        "transform",
        `translate(${winterTooltipX}, ${winterTooltipY})`
      );

      // Update summer tooltip
      summerTooltipBox.yearText.text(`Year: ${syncYear}`);
      summerTooltipBox.valueText.text(
        `Summer: ${summerPoint.value.toFixed(1)} mm`
      );

      const summerTextWidth = Math.max(
        summerTooltipBox.yearText.node().getComputedTextLength(),
        summerTooltipBox.valueText.node().getComputedTextLength()
      );

      summerTooltipBox.rect
        .attr("width", summerTextWidth + 12)
        .attr("height", 32);

      const summerTooltipX =
        xPos + 10 > width - 80 ? xPos - summerTextWidth - 20 : xPos + 10;
      const summerTooltipY = yScale(summerPoint.value) - 40;

      summerTooltip.attr(
        "transform",
        `translate(${summerTooltipX}, ${summerTooltipY})`
      );
    })
    .on("mouseleave", function () {
      verticalLine.style("opacity", 0);
      winterHoverCircle.style("opacity", 0);
      summerHoverCircle.style("opacity", 0);
      winterTooltip.style("opacity", 0);
      summerTooltip.style("opacity", 0);
    });
}

// Initialize chart when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    if (!industrialChartInitialized) {
      const slide2 = document.querySelector(".slide:nth-child(3)");
      if (slide2 && slide2.classList.contains("active")) {
        createIndustrialPrecipitationChart();
        industrialChartInitialized = true;
      }
    }
  });
} else {
  if (!industrialChartInitialized) {
    const slide2 = document.querySelector(".slide:nth-child(3)");
    if (slide2 && slide2.classList.contains("active")) {
      createIndustrialPrecipitationChart();
      industrialChartInitialized = true;
    }
  }
}

// Recreate chart when slide becomes active (for slide transitions)
document.addEventListener("DOMContentLoaded", () => {
  const observer = new MutationObserver(() => {
    const slide2 = document.querySelector(".slide:nth-child(3)");
    if (slide2) {
      const isActive = slide2.classList.contains("active");

      if (isActive && !industrialChartInitialized) {
        setTimeout(() => {
          if (!industrialChartInitialized) {
            createIndustrialPrecipitationChart();
            industrialChartInitialized = true;
          }
        }, 100);
      } else if (!isActive && industrialChartInitialized) {
        // Reset flag when slide becomes inactive
        industrialChartInitialized = false;
      }
    }
  });

  const slidesContainer = document.querySelector(".slides-container");
  if (slidesContainer) {
    observer.observe(slidesContainer, {
      attributes: true,
      attributeFilter: ["class"],
      subtree: true,
    });
  }
});
