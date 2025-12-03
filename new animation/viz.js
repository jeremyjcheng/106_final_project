// =======================================================
// viz.js 说明版（优化版）
// - 区域 1：画布尺寸 & 全局图层
// - 区域 2：背景渐变（天空 + 地面）
// - 区域 3：云层形状与动画
// - 区域 4：工厂 3D 小楼 & 三排工厂布局
// - 区域 5：滚动驱动（控制工厂出现数量 + 每排透明度 + 云变化）
// - 区域 6：气溶胶颗粒（从工厂冒出 → 飞向云）
// =======================================================

document.addEventListener("DOMContentLoaded", () => {
  // =======================
  // 区域 1：基础尺寸 & 图层
  // =======================

  const container = document.getElementById("viz");

  // 整个 SVG 宽高：跟容器走
  const width = container.clientWidth;
  const height = container.clientHeight || 400;

  const svg = d3
    .select("#viz")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // skyHeight：天空区域高度
  //  - 调大：天空更高，地面区域变少
  //  - 调小：天空变矮，地面区域变多
  const skyHeight = height * 0.77;

  // groundY：工厂“地面”在画布中的 y 位置
  //  - 越大越靠近底部
  //  - 越小越往上抬
  const groundY = height * 0.93;

  // 图层顺序：背景 → 云 → 工厂 → 颗粒
  const background = svg.append("g");
  const cloudLayer = svg.append("g").attr("class", "cloud-layer");
  const factoryLayer = svg.append("g").attr("class", "factory-layer");
  const particleLayer = svg.append("g").attr("class", "particle-layer");

  // 工厂三排：第三排（最远） → 第二排 → 第一排（最近）
  const farBackFactoryGroup = factoryLayer.append("g").attr("class", "factory-farback-row");
  const backFactoryGroup = factoryLayer.append("g").attr("class", "factory-back-row");
  const frontFactoryGroup = factoryLayer.append("g").attr("class", "factory-front-row");

  // =======================
  // 区域 2：背景渐变（天空 + 地面）
  // =======================

  const defs = svg.append("defs");

  // --- 天空渐变颜色 ---
  const skyGrad = defs
    .append("linearGradient")
    .attr("id", "skyGradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%");
  skyGrad.append("stop").attr("offset", "0%").attr("stop-color", "#c2d4feff");
  skyGrad.append("stop").attr("offset", "100%").attr("stop-color", "#afbcf4ff");

  // --- 地面渐变颜色 ---
  const groundGrad = defs
    .append("linearGradient")
    .attr("id", "groundGradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%");
  groundGrad.append("stop").attr("offset", "0%").attr("stop-color", "#a8aecaff");
  groundGrad.append("stop").attr("offset", "100%").attr("stop-color", "#3b3a50ff");

  // 上半部分：天空
  background
    .append("rect")
    .attr("width", width)
    .attr("height", skyHeight)
    .attr("fill", "url(#skyGradient)");

  // 下半部分：地面
  background
    .append("rect")
    .attr("y", skyHeight)
    .attr("width", width)
    .attr("height", height - skyHeight)
    .attr("fill", "url(#groundGradient)");

  // =======================
  // 区域 3：云层（形状 & 初始位置）
  // =======================

  // 模糊滤镜，让云更柔和
  const cloudFilter = defs.append("filter").attr("id", "cloudBlur");
  cloudFilter.append("feGaussianBlur").attr("stdDeviation", 6);

  const cloudGroup = cloudLayer.append("g").attr("filter", "url(#cloudBlur)");

  // 主云中心（供轮廓线和粒子目标用）
  const cloudCenterX = width * 0.55;
  const cloudCenterY = skyHeight * 0.32;

  // 一朵云内部的“云块模板”
  const baseCloudPieces = [
    { rx: 130, ry: 45, dx: 0, dy: 0 },
    { rx: 90,  ry: 35, dx: -90, dy: 8 },
    { rx: 80,  ry: 32, dx:  90, dy: 10 },
    { rx: 70,  ry: 28, dx: -40, dy: -25 },
    { rx: 65,  ry: 26, dx:  55, dy: -22 }
  ];

  // 想要几朵云：在这里加中心点
  const cloudCenters = [
    { cx: cloudCenterX,          cy: cloudCenterY },        // 中间主云
    { cx: width * 0.30,          cy: skyHeight * 0.30 },    // 左侧云
    { cx: width * 0.78,          cy: skyHeight * 0.28 }     // 右侧云
  ];

  // 3）把“模板云片”复制到每个中心上，生成总的云片数据
  //    这里额外加了：
  //    - group：0 = 中间那朵云，1 = 左边那朵，2 = 右边那朵
  //    - baseCx / baseCy：每块云片的“原始位置”，方便后面在动画里做偏移
  const cloudPiecesData = [];
  cloudCenters.forEach((center, idx) => {
    baseCloudPieces.forEach(p => {
      const bx = center.cx + p.dx;
      const by = center.cy + p.dy;
      cloudPiecesData.push({
        group: idx,   // 0 / 1 / 2，对应 cloudCenters 的顺序
        rx: p.rx,
        ry: p.ry,
        baseCx: bx,
        baseCy: by,
        cx: bx,       // 当前帧位置（初始化 = 原始位置）
        cy: by
      });
    });
  });

  // 画出云块
  const cloudPieces = cloudGroup
    .selectAll("ellipse")
    .data(cloudPiecesData)
    .enter()
    .append("ellipse")
    .attr("cx", d => d.cx)
    .attr("cy", d => d.cy)
    .attr("rx", d => d.rx)
    .attr("ry", d => d.ry)
    .attr("fill", "#e5f3ff")
    .attr("opacity", 0.92);

  // 主云底部轮廓线
  cloudGroup
    .append("path")
    .attr(
      "d",
      d3
        .line()
        .curve(d3.curveBasis)([
          [cloudCenterX - 150, cloudCenterY + 10],
          [cloudCenterX - 100, cloudCenterY - 40],
          [cloudCenterX,        cloudCenterY - 60],
          [cloudCenterX + 100,  cloudCenterY - 35],
          [cloudCenterX + 150,  cloudCenterY + 5]
        ])
    )
    .attr("stroke", "#dbeafe")
    .attr("stroke-width", 3)
    .attr("fill", "none")
    .attr("opacity", 0.85);

  // =======================
  // 区域 4：工厂 3D 小楼 & 布局
  // =======================

  // -------- 4.1 单栋小楼的形状 --------
  // 所有工厂园区都是由这个 3D 小楼组合出来的
  function drawBuilding(g, opts) {
    const {
      cx = 0,            // 小楼中心 x（相对当前 g 原点）
      baseY = 0,         // 小楼底部 y（相对 g 原点）
      width = 60,        // 前墙宽度
      height = 40,       // 前墙高度
      depth = 16,        // 右侧“透视深度”
      colorFront = "#0f172a",
      colorSide  = "#020617",
      colorRoof  = "#111827"
    } = opts;

    const frontLeftX  = cx - width / 2;
    const frontRightX = cx + width / 2;
    const topY        = baseY - height;

    // —— 地面阴影：椭圆越大 → 楼看起来越“压地” —— 
    g.append("ellipse")
      .attr("cx", cx + depth * 0.3)
      .attr("cy", baseY + 3)
      .attr("rx", width * 0.65)
      .attr("ry", 6)
      .attr("fill", "#020617")
      .attr("opacity", 0.55);

    // —— 正面矩形墙 —— 
    g.append("rect")
      .attr("x", frontLeftX)
      .attr("y", topY)
      .attr("width", width)
      .attr("height", height)
      .attr("fill", colorFront)
      .attr("stroke", "#1f2937")
      .attr("stroke-width", 1.5);

    // —— 右侧墙：四边形模拟 3D 面 —— 
    g.append("polygon")
      .attr(
        "points",
        [
          [frontRightX,             topY],
          [frontRightX + depth,     topY - depth * 0.35],
          [frontRightX + depth,     baseY - depth * 0.35],
          [frontRightX,             baseY]
        ].map(p => p.join(",")).join(" ")
      )
      .attr("fill", colorSide)
      .attr("stroke", "#020617")
      .attr("stroke-width", 1.3);

    // —— 屋顶 —— 
    g.append("polygon")
      .attr(
        "points",
        [
          [frontLeftX,              topY],
          [frontRightX,             topY],
          [frontRightX + depth,     topY - depth * 0.35],
          [frontLeftX + depth * 0.4, topY - depth * 0.35]
        ].map(p => p.join(",")).join(" ")
      )
      .attr("fill", colorRoof)
      .attr("stroke", "#020617")
      .attr("stroke-width", 1.2);

    // —— 窗户 —— 
    const colsWin = 3;
    const rowsWin = 2;
    const padX = 10;
    const padY = 3;
    const winW = 10;
    const winH = 12;
    const gapX = (width - 2 * padX - colsWin * winW) / (colsWin - 1);
    const gapY = 3;

    for (let r = 0; r < rowsWin; r++) {
      for (let c = 0; c < colsWin; c++) {
        g.append("rect")
          .attr("x", frontLeftX + padX + c * (winW + gapX))
          .attr("y", topY + padY + r * (winH + gapY))
          .attr("width", winW)
          .attr("height", winH)
          .attr("fill", "#22c55e")
          .attr("opacity", 0.6);
      }
    }

    // 返回给烟囱对齐用的几何信息
    return { frontRightX, topY, baseY, depth };
  }

  // -------- 4.2 烟囱（附着在某个 building 上） --------
  function drawChimney(g, baseGeom, heightFactor = 1) {
    const { frontRightX, topY } = baseGeom;

    const chimneyW = 10;
    const chimneyH = 26 * heightFactor;

    const x = frontRightX - chimneyW * 0.5;
    const y = topY - chimneyH;

    g.append("rect")
      .attr("x", x)
      .attr("y", y)
      .attr("width", chimneyW)
      .attr("height", chimneyH)
      .attr("fill", "#020617")
      .attr("stroke", "#1f2937")
      .attr("stroke-width", 1.3);

    // 顶部小帽
    g.append("rect")
      .attr("x", x - 2)
      .attr("y", y - 4)
      .attr("width", chimneyW + 4)
      .attr("height", 4)
      .attr("fill", "#111827");
  }

  // -------- 4.3 一个工厂园区 = 三栋楼 + 烟囱 --------
  function drawFactoryComplex(g, baseY = 0) {
    // 中间主楼
    const main = drawBuilding(g, {
      cx: 0,
      baseY: baseY,
      width: 70,
      height: 45,
      depth: 18,
      colorFront: "#0f172a",
      colorSide: "#020617",
      colorRoof: "#111827"
    });
    drawChimney(g, main, 1.1);

    // 左侧楼
    const left = drawBuilding(g, {
      cx: -40,
      baseY: baseY + 4,
      width: 46,
      height: 34,
      depth: 14,
      colorFront: "#020617",
      colorSide: "#020617",
      colorRoof: "#111827"
    });
    drawChimney(g, left, 0.9);

    // 右侧楼
    drawBuilding(g, {
      cx: 48,
      baseY: baseY + 6,
      width: 50,
      height: 30,
      depth: 14,
      colorFront: "#020617",
      colorSide: "#020617",
      colorRoof: "#111827"
    });
  }

  // -------- 4.4 三排工厂园区的布局 + 每排透明度控制 --------
  // 需求：
  //  - 第一排：贴近地面，最多 7 个工厂，不等间距，不重叠
  //  - 初始只出现 3 个，随着滚动补满这一排
  //  - 第二排：位置更高、整体缩小，透明度略低
  //  - 第三排：更高更小，透明度最低（最远最淡）
  //  - 同一排内：每个工厂透明度始终完全一致（只按“排”区分，不按“出现顺序”区分）

  const baseCenterX = width * 0.5;

  // 每排的基础透明度（整排一起控制）
  //  - 调大：这一排整体更“实”
  //  - 调小：这一排整体更“淡”
  const frontRowOpacity   = 0.95; // 第一排：最近、最实
  const backRowOpacity    = 0.80; // 第二排：中间
  const farBackRowOpacity = 0.60; // 第三排：最远、最淡

  // ====== 第一排（前排，贴近地面） ======
  const frontRowY = groundY;

  // frontRowSpacing：控制一排左右大致间距
  //  - 数字越大：工厂之间越紧
  //  - 数字越小：一排摊得越开
  const frontRowSpacing = width / 10;

  // 7 个位置（dx 相对中心，不等间距）
  const frontRowOffsets = [
    { dx: -3.0 * frontRowSpacing, dy: 0 },
    { dx: -1.6 * frontRowSpacing, dy: 0 },
    { dx: -0.2 * frontRowSpacing, dy: 0 },
    { dx:  1.4 * frontRowSpacing, dy: 0 },
    { dx:  2.7 * frontRowSpacing, dy: 0 },
    { dx:  0.7 * frontRowSpacing, dy: 0 },
    { dx: -2.2 * frontRowSpacing, dy: 0 }
  ];

  const frontFactoriesData = frontRowOffsets.map((o, i) => ({
    id: i,
    row: "front",
    x: baseCenterX + o.dx,
    y: frontRowY + o.dy,
    scale: 1.0              // 想让第一排整体变大/变小：改这个数
  }));
  const totalFrontFactories = frontFactoriesData.length; // 7

  // ====== 第二排（中排） ======
  // backRowY：整体行的基准高度（在 groundY 附近微调）
  const backRowY = groundY + 20;

  const backRowOffsets = [
    { dx: -1.0 * frontRowSpacing, dy: -70 },
    { dx:  1.8 * frontRowSpacing, dy: -70 },
    { dx:  1.2 * frontRowSpacing, dy: -70 },
    { dx: -0.2 * frontRowSpacing, dy: -70 },
    { dx: -2.0 * frontRowSpacing, dy: -70 },
    { dx:  0.4 * frontRowSpacing, dy: -70 }
  ];

  const backFactoriesData = backRowOffsets.map((o, i) => ({
    id: i,
    row: "back",
    x: baseCenterX + o.dx,
    y: backRowY + o.dy,
    scale: 0.8              // 想让第二排整体缩放：改这个数
  }));
  const totalBackFactories = backFactoriesData.length;

  // ====== 第三排（最远） ======
  const farBackRowY = groundY + 50;

  const farBackRowOffsets = [
    { dx: -0.8 * frontRowSpacing, dy: -140 },
    { dx: -0.2 * frontRowSpacing, dy: -140 },
    { dx: -1.5 * frontRowSpacing, dy: -140 },
    { dx:  0.5 * frontRowSpacing, dy: -140 },
    { dx:  1.0 * frontRowSpacing, dy: -140 }
  ];

  const farBackFactoriesData = farBackRowOffsets.map((o, i) => ({
    id: i,
    row: "farback",
    x: baseCenterX + o.dx,
    y: farBackRowY + o.dy,
    scale: 0.6              // 想让第三排看起来更远（更小）：改这个数
  }));
  const totalFarBackFactories = farBackFactoriesData.length;

  // ====== 合并给颗粒用（区域 6） ======
  const factoryData = frontFactoriesData
    .concat(backFactoriesData)
    .concat(farBackFactoriesData);
  const maxFactories = factoryData.length;

  // ====== 真正画出三排工厂：先画最远，再画中排，再画前排 ======

  // 第三排（最远）
  const farBackFactories = farBackFactoryGroup
    .selectAll(".factory-farback")
    .data(farBackFactoriesData)
    .enter()
    .append("g")
    .attr("class", "factory-farback")
    .attr("transform", d => `translate(${d.x},${d.y}) scale(${d.scale})`)
    .attr("opacity", 0);   // 初始全部不可见，统一由 updateScene 控制

  farBackFactories.each(function (d) {
    const g = d3.select(this);
    drawFactoryComplex(g, 0);
  });

  // 第二排（中排）
  const backFactories = backFactoryGroup
    .selectAll(".factory-back")
    .data(backFactoriesData)
    .enter()
    .append("g")
    .attr("class", "factory-back")
    .attr("transform", d => `translate(${d.x},${d.y}) scale(${d.scale})`)
    .attr("opacity", 0);

  backFactories.each(function (d) {
    const g = d3.select(this);
    drawFactoryComplex(g, 0);
  });

  // 第一排（前排）
  const frontFactories = frontFactoryGroup
    .selectAll(".factory-front")
    .data(frontFactoriesData)
    .enter()
    .append("g")
    .attr("class", "factory-front")
    .attr("transform", d => `translate(${d.x},${d.y}) scale(${d.scale})`)
    .attr("opacity", 0);

  frontFactories.each(function (d) {
    const g = d3.select(this);
    drawFactoryComplex(g, 0);
  });

  // 第一排出现顺序（只控制“先出现哪几个”，不再用来控制透明度）
  const frontAppearOrder = [2, 0, 4, 1, 5, 3, 6];

  // z 顺序：让“先出现的工厂”在同一排中更靠上层（避免后出现的挡住前出现的）
  frontFactories.sort((a, b) => {
    const ra = frontAppearOrder.indexOf(a.id);
    const rb = frontAppearOrder.indexOf(b.id);
    return rb - ra; // 先出现的排在后面 → SVG 中层级更高
  });

  backFactories.sort((a, b) => b.id - a.id);
  farBackFactories.sort((a, b) => b.id - a.id);

  // =======================
  // 区域 5：滚动驱动（工厂 + 云）
  // =======================

  let scrollProgress = 0; // 0 ~ 1：页面整体滚动比例

  function computeScrollProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const raw = docHeight > 0 ? scrollTop / docHeight : 0;
    scrollProgress = Math.max(0, Math.min(1, raw));
    updateScene();
  }

  window.addEventListener("scroll", computeScrollProgress);
  window.addEventListener("resize", computeScrollProgress);
  computeScrollProgress(); // 初始渲染一次（保证没滚动时就有 3 个前排工厂）

  function updateScene() {
    // ---- 5.1 工厂显露逻辑（3 排，整排统一透明度）----

    // 第一排：0 ~ 0.5 滚动区间内，从 3 个逐渐补满 7 个
    const frontMin = 3;
    const frontMax = totalFrontFactories; // 7
    const frontExtra = frontMax - frontMin;

    const frontPhase = Math.min(scrollProgress / 0.5, 1); // 0~0.5 阶段补满前排
    const frontCount = frontMin + Math.round(frontExtra * frontPhase);

    frontFactories.attr("opacity", d => {
      const orderIndex = frontAppearOrder.indexOf(d.id);
      if (orderIndex === -1) return 0;

      const visible = orderIndex < frontCount;
      // 可见 → 使用这一排统一的透明度；不可见 → 0
      return visible ? frontRowOpacity : 0;
    });

    // 第二排：在前排基本补满后逐渐亮起（滚动 0.5 ~ 0.75）
    const backPhaseRaw = (scrollProgress - 0.5) / 0.25;
    const backPhase = Math.max(0, Math.min(1, backPhaseRaw));
    const backCount = Math.round(totalBackFactories * backPhase);

    backFactories.attr("opacity", (d, i) => {
      if (i >= backCount) return 0;
      // 第二排可见的全部使用统一透明度 backRowOpacity
      return backRowOpacity;
    });

    // 第三排：在第二排出现一段时间后才逐渐亮起（滚动 0.75 ~ 1）
    const farBackPhaseRaw = (scrollProgress - 0.75) / 0.25;
    const farBackPhase = Math.max(0, Math.min(1, farBackPhaseRaw));
    const farBackCount = Math.round(totalFarBackFactories * farBackPhase);

    farBackFactories.attr("opacity", (d, i) => {
      if (i >= farBackCount) return 0;
      // 第三排统一使用 farBackRowOpacity（最淡）
      return farBackRowOpacity;
    });

    // ---- 5.2 三朵云往不同方向飘 + 变薄 ----
    const thinFactor = scrollProgress; // 0~1，对应整体滚动进度

    // 1）定义每朵云的“飘动方向”
    //    你可以改下面 dx/dy 来控制方向和距离：
    //    - dx > 0 往右飘，dx < 0 往左飘
    //    - dy < 0 往上飘，dy > 0 往下飘
    const driftConfig = [
      // group = 0：中间这朵 → 主要是往上飘
      { dx: 0,   dy: -60 },

      // group = 1：左边这朵 → 往左上飘
      { dx: -80, dy: -20 },

      // group = 2：右边这朵 → 往右上飘
      { dx: 80,  dy: -30 }
    ];

    // 2）整体缩放系数：云越往后滚越小一点（可选）
    const scale = 1 - thinFactor * 0.15; // 想缩小得多就把 0.15 调大

    // 3）根据 group 给每一块云片计算新位置
    cloudPieces
      .attr("cx", d => {
        const drift = driftConfig[d.group] || driftConfig[0];
        // baseCx 是原始位置，后面加上“飘动偏移 + 缩放”的效果
        return d.baseCx + drift.dx * thinFactor;
      })
      .attr("cy", d => {
        const drift = driftConfig[d.group] || driftConfig[0];
        return d.baseCy + drift.dy * thinFactor;
      })
      .attr("transform", d => {
        // 以每块云片自己的中心为基准做缩放
        const drift = driftConfig[d.group] || driftConfig[0];
        const x = d.baseCx + drift.dx * thinFactor;
        const y = d.baseCy + drift.dy * thinFactor;
        return `translate(${x},${y}) scale(${scale}) translate(${-x},${-y})`;
      });

    // 4）透明度控制：
    //    - 中间那朵云（group=0）变薄得慢一点
    //    - 两侧的云变薄得快一点，看起来更容易消散
    cloudPieces.attr("opacity", d => {
      const isSide = d.group !== 0;
      const base   = isSide ? 0.9 : 0.95;   // 初始透明度
      const slope  = isSide ? 1.3 : 0.7;    // 变淡速度
      const op     = base - thinFactor * slope;
      return Math.max(0, Math.min(1, op));
    });

    // 5）云底轮廓线：跟“中间那朵云”的方向一起移动和变薄
    const centerDrift = driftConfig[0];
    const pathOffsetX = centerDrift.dx * thinFactor;
    const pathOffsetY = centerDrift.dy * thinFactor;

    cloudGroup
      .select("path")
      .attr(
        "transform",
        `translate(${pathOffsetX},${pathOffsetY}) scale(${scale})`
      )
      .attr("opacity", 0.9 - thinFactor * 0.7);

    // 6）如果你还想“只剩下中间那一团”，可以加上这段：
    //    滚动到 0.8 之后，把左右两朵整团隐藏掉
    cloudPieces.attr("display", d => {
      if (thinFactor < 0.8) return null;
      return d.group === 0 ? null : "none";
    });
   }


  // =======================
  // 区域 6：气溶胶颗粒（冒烟动画）
  // =======================

  // 颗粒飞向云底部附近
  const cloudBaseY = cloudCenterY + 10;

  function spawnParticle() {
    // 即使 scroll 很小，也让中心工厂有一点排放
    const effectiveProgress = Math.max(scrollProgress, 0.05);

    // 与滚动 & 工厂数量相关的排放强度
    const activeFactories =
      1 + Math.floor(effectiveProgress * (maxFactories - 1));
    const emissionStrength = 0.15 + effectiveProgress * 1.6;
    const numParticles = Math.round(emissionStrength * activeFactories);

    for (let i = 0; i < numParticles; i++) {
      // 从已激活工厂中随机选一个作为排放源
      const idx = Math.floor(Math.random() * activeFactories);
      const fd = factoryData[idx];

      // startX/startY：颗粒起点（工厂楼体上方一点）
      const startX =
        fd.x + (Math.random() * 18 - 9) * fd.scale;
      const startY =
        fd.y - (50 * fd.scale) + (Math.random() * 14 - 4);

      // targetX/targetY：颗粒靠近云底部的目标位置
      const targetX =
        cloudCenterX +
        (Math.random() - 0.5) * 160 * (0.6 + effectiveProgress);
      const targetY =
        cloudBaseY +
        (Math.random() - 0.5) * 40 * (0.5 + effectiveProgress);

      const particle = particleLayer
        .append("circle")
        .attr("cx", startX)
        .attr("cy", startY)
        .attr("r", 2 + Math.random() * 2)
        .attr("fill", "#e5e7eb")
        .attr("opacity", 0.9);

      particle
        .transition()
        .duration(2200 + Math.random() * 1800)
        .ease(d3.easeCubicOut)
        .attr("cx", targetX)
        .attr("cy", targetY)
        .attr("r", 1.1)
        .attr("opacity", 0.2 + Math.random() * 0.2)
        .remove();
    }
  }

  // 每 260ms 生成一批颗粒
  d3.interval(spawnParticle, 260);
});