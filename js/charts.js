/* ===========================================================
   薄荷减脂打卡 · 原生 SVG 图表
   无外部依赖，支持体重折线图、目标进度环。
   =========================================================== */
(function () {
  "use strict";

  window.Charts = {
    lineChart: lineChart,
    progressRing: progressRing,
  };

  function setSvgSize(svg, width, height) {
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("preserveAspectRatio", "none");
  }

  /**
   * 绘制折线/面积图
   * @param {string|HTMLElement} container
   * @param {Array} data - [{date:'08-01', value:55.2}, ...]
   * @param {Object} opts - {color:'#5DCAA5', area:true, pad:20}
   */
  function lineChart(container, data, opts) {
    opts = opts || {};
    var color = opts.color || "#5DCAA5";
    var showArea = opts.area !== false;
    var el = typeof container === "string" ? document.getElementById(container) : container;
    if (!el) return;
    el.innerHTML = "";

    if (!data || data.length === 0) {
      el.innerHTML = '<div class="chart-empty">还没有足够数据，坚持记录就能看到趋势～</div>';
      return;
    }

    var rect = el.getBoundingClientRect();
    var W = Math.max(rect.width || el.clientWidth || 300, 200);
    var H = Math.max(rect.height || el.clientHeight || 200, 160);
    var pad = opts.pad || { top: 22, right: 18, bottom: 28, left: 34 };
    var w = W - pad.left - pad.right;
    var h = H - pad.top - pad.bottom;

    var values = data.map(function (d) { return d.value; });
    var min = Math.min.apply(null, values);
    var max = Math.max.apply(null, values);
    var padY = (max - min) * 0.2 || 1;
    var yMin = Math.max(0, min - padY);
    var yMax = max + padY;

    function x(i) { return pad.left + (w * i) / (data.length - 1); }
    function y(v) { return pad.top + h - ((v - yMin) / (yMax - yMin)) * h; }

    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    setSvgSize(svg, W, H);

    // 网格线
    var gridCount = 4;
    for (var i = 0; i <= gridCount; i++) {
      var gy = pad.top + (h * i) / gridCount;
      var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", pad.left);
      line.setAttribute("y1", gy);
      line.setAttribute("x2", W - pad.right);
      line.setAttribute("y2", gy);
      line.setAttribute("stroke", "#e3e8e6");
      line.setAttribute("stroke-width", "1");
      svg.appendChild(line);

      var label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", pad.left - 8);
      label.setAttribute("y", gy + 4);
      label.setAttribute("text-anchor", "end");
      label.setAttribute("fill", "#8a9a94");
      label.setAttribute("font-size", "10");
      label.textContent = (yMax - ((yMax - yMin) * i) / gridCount).toFixed(1);
      svg.appendChild(label);
    }

    // 折线路径
    var d = data
      .map(function (p, idx) {
        return (idx === 0 ? "M" : "L") + x(idx).toFixed(1) + "," + y(p.value).toFixed(1);
      })
      .join(" ");

    if (showArea) {
      var areaD =
        d +
        " L" +
        x(data.length - 1).toFixed(1) +
        "," +
        (pad.top + h).toFixed(1) +
        " L" +
        x(0).toFixed(1) +
        "," +
        (pad.top + h).toFixed(1) +
        " Z";
      var area = document.createElementNS("http://www.w3.org/2000/svg", "path");
      area.setAttribute("d", areaD);
      area.setAttribute("fill", color);
      area.setAttribute("fill-opacity", "0.14");
      svg.appendChild(area);
    }

    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", color);
    path.setAttribute("stroke-width", "2.5");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(path);

    // 数据点
    data.forEach(function (p, idx) {
      var cx = x(idx);
      var cy = y(p.value);
      var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", cx.toFixed(1));
      circle.setAttribute("cy", cy.toFixed(1));
      circle.setAttribute("r", "3.5");
      circle.setAttribute("fill", "#fff");
      circle.setAttribute("stroke", color);
      circle.setAttribute("stroke-width", "2");
      svg.appendChild(circle);
    });

    // X 轴标签（只显示首尾和中间一个，避免拥挤）
    var labelIndices = [0, Math.floor((data.length - 1) / 2), data.length - 1];
    labelIndices.forEach(function (idx) {
      var txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
      txt.setAttribute("x", x(idx).toFixed(1));
      txt.setAttribute("y", H - 8);
      txt.setAttribute("text-anchor", "middle");
      txt.setAttribute("fill", "#8a9a94");
      txt.setAttribute("font-size", "10");
      txt.textContent = data[idx].date;
      svg.appendChild(txt);
    });

    el.appendChild(svg);
  }

  /**
   * 绘制目标进度环
   * @param {string|HTMLElement} container
   * @param {number} percent - 0~100
   * @param {Object} opts
   */
  function progressRing(container, percent, opts) {
    opts = opts || {};
    var el = typeof container === "string" ? document.getElementById(container) : container;
    if (!el) return;
    el.innerHTML = "";

    var size = opts.size || 140;
    var stroke = opts.stroke || 10;
    var color = opts.color || "#5DCAA5";
    var track = opts.track || "#e1f5ee";
    var r = (size - stroke) / 2;
    var c = 2 * Math.PI * r;
    var p = Math.max(0, Math.min(100, percent));
    var dash = (p / 100) * c;

    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("viewBox", "0 0 " + size + " " + size);

    var bg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    bg.setAttribute("cx", size / 2);
    bg.setAttribute("cy", size / 2);
    bg.setAttribute("r", r);
    bg.setAttribute("fill", "none");
    bg.setAttribute("stroke", track);
    bg.setAttribute("stroke-width", stroke);
    svg.appendChild(bg);

    var fg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    fg.setAttribute("cx", size / 2);
    fg.setAttribute("cy", size / 2);
    fg.setAttribute("r", r);
    fg.setAttribute("fill", "none");
    fg.setAttribute("stroke", color);
    fg.setAttribute("stroke-width", stroke);
    fg.setAttribute("stroke-linecap", "round");
    fg.setAttribute("stroke-dasharray", dash + " " + c);
    fg.setAttribute("stroke-dashoffset", "0");
    fg.setAttribute("transform", "rotate(-90 " + size / 2 + " " + size / 2 + ")");
    svg.appendChild(fg);

    el.appendChild(svg);
  }
})();
