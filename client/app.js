/**
 * MachinaPredict Shop-Floor Tablet Dashboard
 * High-performance plain JavaScript with Canvas telemetry waveform rendering.
 */

const machines = [
  {
    id: "CNC-MILL-01",
    name: "DMG MORI 3-Axis Mill",
    tool: "TL-101 (End Mill ø10mm)",
    rpm: 12500,
    feed: 950,
    wear: 48.2,
    rul: 172.5,
    condition: "healthy",
    phase: 0
  },
  {
    id: "CNC-MILL-02",
    name: "Haas VF-2SS Super-Speed",
    tool: "TL-108 (Ball Nose ø6mm)",
    rpm: 14200,
    feed: 1100,
    wear: 260.3,
    rul: 27.4,
    condition: "degraded",
    phase: 1.5
  },
  {
    id: "CNC-5AX-01",
    name: "Hermle C42 5-Axis Center",
    tool: "TL-204 (Face Mill ø50mm)",
    rpm: 16800,
    feed: 1350,
    wear: 308.5,
    rul: 0.0,
    condition: "critical",
    phase: 3.1
  }
];

function renderGrid() {
  const container = document.getElementById("machineGrid");
  container.innerHTML = "";

  machines.forEach((m, idx) => {
    const card = document.createElement("div");
    card.className = `machine-card ${m.condition === "critical" ? "critical-border" : ""}`;

    const statusClass = `status-${m.condition}`;
    const statusText = m.condition.toUpperCase();

    card.innerHTML = `
      <div class="card-top">
        <div>
          <div class="machine-name">${m.name}</div>
          <div class="machine-id">${m.id} • Active: ${m.tool}</div>
        </div>
        <span class="status-pill ${statusClass}">${statusText}</span>
      </div>

      <div class="metrics-row">
        <div class="metric-box">
          <div class="metric-label">Flank Wear (VB)</div>
          <div class="metric-value" style="color: ${m.wear > 280 ? '#ef4444' : m.wear > 150 ? '#f59e0b' : '#22c55e'}">${m.wear} μm</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Remaining Life</div>
          <div class="metric-value">${m.rul} mins</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Spindle Speed</div>
          <div class="metric-value">${m.rpm} RPM</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Feed Rate</div>
          <div class="metric-value">${m.feed} mm/min</div>
        </div>
      </div>

      <div class="waveform-container">
        <div class="waveform-label">
          <span>Live Vibration Harmonic (Acc. RMS)</span>
          <span id="vibVal-${idx}">${(1.0 + (m.wear / 80)).toFixed(2)} mm/s</span>
        </div>
        <canvas id="canvas-${idx}" width="280" height="60"></canvas>
      </div>

      <button class="btn-action" onclick="handleToolAction('${m.id}', '${m.tool}')">
        ${m.condition === "critical" ? "? Urgent Tool Swap" : "? Inspect Offsets"}
      </button>
    `;

    container.appendChild(card);
  });
}

// 60 FPS Real-Time Canvas Vibration Waveform Animation
function drawWaveforms() {
  machines.forEach((m, idx) => {
    const canvas = document.getElementById(`canvas-${idx}`);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = m.condition === "critical" ? "#ef4444" : m.condition === "degraded" ? "#f59e0b" : "#38bdf8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const amplitude = m.condition === "critical" ? 22 : m.condition === "degraded" ? 14 : 7;
    const frequency = 0.08;

    m.phase += 0.12;

    for (let x = 0; x < width; x++) {
      const y = height / 2 + Math.sin(x * frequency + m.phase) * amplitude + (Math.random() - 0.5) * (amplitude * 0.3);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();
  });

  requestAnimationFrame(drawWaveforms);
}

function handleToolAction(machineId, tool) {
  alert(`Maintenance request dispatched for [${machineId}]: Swap and inspect offsets for ${tool}.`);
}

// Initialize on DOM Ready
window.addEventListener("DOMContentLoaded", () => {
  renderGrid();
  requestAnimationFrame(drawWaveforms);
});
