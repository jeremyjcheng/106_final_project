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

  const containerWidth = container.node().clientWidth || 800;
  const containerHeight = container.node().clientHeight || 450;

  const margin = { top: 20, right: 10, bottom: 40, left: 55 };
  const width = containerWidth - margin.left - margin.right;
  const height = containerHeight - margin.top - margin.bottom;

  const svgElement = container
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  const svg = svgElement
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
      pr: parseFloat(d.pr),
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

    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(allYears))
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([
        d3.min(allValues) * 0.95,
        d3.max(allValues) * 1.05,
      ])
      .range([height, 0]);

    const line = d3
      .line()
      .x((d) => xScale(d.year))
      .y((d) => yScale(d.pr))
      .curve(d3.curveMonotoneX);

    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(8);
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(6)
      .tickFormat(d3.format(".1e"));

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

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - height / 2)
      .attr("dy", "1em")
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "#333")
      .text("Summer Precipitation (mm)");

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

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "600")
      .attr("fill", "#2e86ab")
      .text("Summer Precipitation Trends by Region (1850–2020)");

    // --- Base lines ---
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

    // --- Legend ---
    const legend = svg
      .append("g")
      .attr("transform", `translate(${width - 80}, 0)`);

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

    // --- High-lighted range group (for text hover) ---
    let highlightGroup = svg.append("g").attr("class", "range-highlight-group");

    // --- Hover group for tooltip & circles ---
    const hoverGroup = svg.append("g").attr("class", "hover-group");

    const hoverLine = hoverGroup
      .append("line")
      .attr("class", "hover-line")
      .attr("stroke", "#999")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3")
      .attr("y1", 0)
      .attr("y2", height)
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

    svg
      .append("rect")
      .attr("class", "overlay")
      .attr("width", width)
      .attr("height", height)
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
        const clampedX = Math.max(0, Math.min(width, mouseX));
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
        const boxHeight = 6 + (regions.length + 1) * 12;

        tooltipRect.attr("width", boxWidth).attr("height", boxHeight);

        const tooltipX =
          xPos + 10 > width - boxWidth ? xPos - boxWidth - 10 : xPos + 10;
        const tooltipY = 10;

        tooltip.attr(`transform`, `translate(${tooltipX}, ${tooltipY})`);
      })
      .on("mouseleave", function () {
        hoverLine.style("opacity", 0);
        regions.forEach((r) => r.hoverCircle.style("opacity", 0));
        tooltip.style("opacity", 0);
      });

    // ----------------------------------------------------------------
    // Text hover → highlight specific year ranges
    // ----------------------------------------------------------------

    function clearHighlightRange() {
      // 删除高亮线段
      highlightGroup.selectAll("*").remove();
      // 恢复所有原始线 & 图例透明度
      regions.forEach((r) => {
        r.path.style("opacity", 1);
        if (r.legendLine) r.legendLine.style("opacity", 1);
        if (r.legendText) r.legendText.style("opacity", 1);
      });
    }

    function applyHighlightRange(startYear, endYear) {
      // 先清空之前的高亮
      highlightGroup.selectAll("*").remove();

      // 让原始折线整体变淡
      regions.forEach((r) => {
        r.path.style("opacity", 0.15);
        if (r.legendLine) r.legendLine.style("opacity", 0.3);
        if (r.legendText) r.legendText.style("opacity", 0.5);
      });

      // 每个 region 画一条高亮的“截断线段”
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

    // 绑定 Slide 2 的两段文字 hover
    const slide2 = document.querySelector(
      ".slides-container .slide:nth-of-type(3)"
    );
    if (slide2) {
      const paras = slide2.querySelectorAll(".slide-text p");
      const firstPara = paras[0];
      const secondPara = paras[1];

      function addDimmedClass(el) {
        if (!el) return;
        el.classList.add("dimmed-text");
      }

      function removeDimmedClass(el) {
        if (!el) return;
        el.classList.remove("dimmed-text");
      }

      if (firstPara) {
        firstPara.addEventListener("mouseenter", () => {
          addDimmedClass(firstPara);
          applyHighlightRange(1908, 1937);
        });
        firstPara.addEventListener("mouseleave", () => {
          removeDimmedClass(firstPara);
          clearHighlightRange();
        });
      }

      if (secondPara) {
        secondPara.addEventListener("mouseenter", () => {
          addDimmedClass(secondPara);
          applyHighlightRange(1946, 1973);
        });
        secondPara.addEventListener("mouseleave", () => {
          removeDimmedClass(secondPara);
          clearHighlightRange();
        });
      }
    }
  });
}

// 简化初始化逻辑：DOM Ready 之后直接画一次图，不再监听 slide class 变化
document.addEventListener("DOMContentLoaded", () => {
  createIndustrialPrecipitationChart();
});