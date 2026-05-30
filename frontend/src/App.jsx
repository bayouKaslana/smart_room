import { useEffect, useState, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from "recharts";
import api from "./services/api";
import Analytics from "./Analytics";

// ==========================
// THEME TOKENS
// ==========================
const theme = {
  light: {
    pageBg:            "#f8fafc",
    cardBg:            "#ffffff",
    sensorCardBg:      "#f8fafc",
    fanPillBg:         "#f8fafc",
    cardBorder:        "#e2e8f0",
    sensorBorder:      "#f1f5f9",
    divider:           "#f1f5f9",
    roomHeaderBorder:  "#f1f5f9",
    titleColor:        "#0f172a",
    subtitleColor:     "#64748b",
    roomNameColor:     "#0f172a",
    sensorLabel:       "#64748b",
    sensorSub:         "#94a3b8",
    fanLabel:          "#64748b",
    headerIconBg:      "#eff6ff",
    toggleBg:          "#e2e8f0",
    toggleIcon:        "🌙",
    toggleLabel:       "Dark Mode",
    spinnerTrack:      "#e2e8f0",
    spinnerHead:       "#3b82f6",
    loadingText:       "#64748b",
    chartGrid:         "#e2e8f0",
    chartText:         "#64748b",
    chartTooltipBg:    "#ffffff",
    chartTooltipBorder:"#e2e8f0",
    accentColor:       "#2563eb",
    tabActive:         "#0f172a",
    tabActiveBg:       "#ffffff",
    tabInactive:       "#64748b",
    tabBg:             "#f1f5f9",
    rangeBtnActive:    "#0f172a",
    rangeBtnActiveBg:  "#e2e8f0",
    rangeBtnInactive:  "#94a3b8",
  },
  dark: {
    pageBg:            "#0f172a",
    cardBg:            "#1e293b",
    sensorCardBg:      "#0f172a",
    fanPillBg:         "#0f172a",
    cardBorder:        "#334155",
    sensorBorder:      "#1e293b",
    divider:           "#334155",
    roomHeaderBorder:  "#334155",
    titleColor:        "#f1f5f9",
    subtitleColor:     "#94a3b8",
    roomNameColor:     "#f1f5f9",
    sensorLabel:       "#94a3b8",
    sensorSub:         "#475569",
    fanLabel:          "#94a3b8",
    headerIconBg:      "#1e3a5f",
    toggleBg:          "#3b82f6",
    toggleIcon:        "☀️",
    toggleLabel:       "Light Mode",
    spinnerTrack:      "#334155",
    spinnerHead:       "#60a5fa",
    loadingText:       "#94a3b8",
    chartGrid:         "#1e293b",
    chartText:         "#94a3b8",
    chartTooltipBg:    "#1e293b",
    chartTooltipBorder:"#334155",
    accentColor:       "#60a5fa",
    tabActive:         "#f1f5f9",
    tabActiveBg:       "#334155",
    tabInactive:       "#64748b",
    tabBg:             "#0f172a",
    rangeBtnActive:    "#f1f5f9",
    rangeBtnActiveBg:  "#334155",
    rangeBtnInactive:  "#475569",
  },
};

const NODE_COLORS = ["#3b82f6", "#f97316", "#a855f7", "#14b8a6"];

const TIME_RANGES = [
  { label: "30 Menit", minutes: 30   },
  { label: "1 Jam",    minutes: 60   },
  { label: "24 Jam",   minutes: 1440 },
];

function fmtTime(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

// ==========================
// Custom Tooltip
// ==========================
function CustomTooltip({ active, payload, label, unit, t }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      backgroundColor: t.chartTooltipBg,
      border: `1px solid ${t.chartTooltipBorder}`,
      borderRadius: "10px",
      padding: "10px 14px",
      fontSize: "12px",
    }}>
      <p style={{ color: t.chartText, marginBottom: "6px" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: "2px 0", fontWeight: 600 }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value} {unit}
        </p>
      ))}
    </div>
  );
}

// ==========================
// Chart Section
// ==========================
function ChartSection({ history, dark, t, rangeIdx, setRangeIdx }) {
  const [activeTab, setActiveTab] = useState("temperature");

  const tabs = [
    { key: "temperature", label: "🌡 Suhu",    unit: "°C",   thresholds: [] },
    { key: "humidity",    label: "💧 Kelembapan",     unit: "%",    thresholds: [] },
    { key: "air_quality", label: "🌫 Kualitas Udara", unit: " ADC", thresholds: [
      { value: 1000, color: "#22c55e", label: "Baik"   },
      { value: 1800, color: "#f97316", label: "Sedang" },
    ]},
  ];

  const nodeKeys      = Object.keys(history);
  const activeTabData = tabs.find(tb => tb.key === activeTab);
  const { unit, thresholds } = activeTabData;

  const timeMap = {};
  nodeKeys.forEach(nk => {
    history[nk].forEach(row => {
      const tk = fmtTime(row.time);
      if (!timeMap[tk]) timeMap[tk] = { time: tk };
      timeMap[tk][nk] = row[activeTab];
    });
  });
  const chartData = Object.values(timeMap);

  return (
    <div style={{ ...styles.chartCard, backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
      <div style={styles.chartHeader}>
        <div>
          <p style={{ ...styles.chartTitle, color: t.titleColor }}>📈 Grafik Historis</p>
          <p style={{ ...styles.chartSub, color: t.subtitleColor }}>Perbandingan antar ruangan</p>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {TIME_RANGES.map((r, i) => (
            <button key={i} onClick={() => setRangeIdx(i)} style={{
              ...styles.rangeBtn,
              backgroundColor: rangeIdx === i ? t.rangeBtnActiveBg : "transparent",
              color: rangeIdx === i ? t.rangeBtnActive : t.rangeBtnInactive,
              border: `1px solid ${rangeIdx === i ? t.cardBorder : "transparent"}`,
            }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ ...styles.tabRow, backgroundColor: t.tabBg }}>
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setActiveTab(tb.key)} style={{
            ...styles.tabBtn,
            backgroundColor: activeTab === tb.key ? t.tabActiveBg : "transparent",
            color: activeTab === tb.key ? t.tabActive : t.tabInactive,
            fontWeight: activeTab === tb.key ? "600" : "400",
          }}>
            {tb.label}
          </button>
        ))}
      </div>

      {chartData.length === 0 ? (
        <div style={{ ...styles.chartEmpty, color: t.subtitleColor }}>
          Belum ada data untuk rentang waktu ini
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
            <CartesianGrid stroke={t.chartGrid} strokeDasharray="4 4" />
            <XAxis
              dataKey="time"
              tick={{ fill: t.chartText, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval={Math.floor(chartData.length / 6)}
            />
            <YAxis
              tick={{ fill: t.chartText, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `${v}${unit}`}
            />
            <Tooltip content={<CustomTooltip unit={unit} t={t} />} />
            <Legend
              wrapperStyle={{ fontSize: "12px", color: t.chartText, paddingTop: "8px" }}
              formatter={value => value.replace("node_node", "Ruangan ").replace("node_", "Ruangan ")}
            />
            {nodeKeys.map((nk, i) => (
              <Line
                key={nk}
                type="monotone"
                dataKey={nk}
                name={nk.replace("node_node", "Ruangan ").replace("node_", "Ruangan ")}
                stroke={NODE_COLORS[i % NODE_COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
            {thresholds.map((th, i) => (
              <ReferenceLine
                key={i}
                y={th.value}
                stroke={th.color}
                strokeDasharray="6 3"
                strokeWidth={1.5}
                label={{ value: th.label, position: "insideTopRight", fontSize: 10, fill: th.color, fontWeight: 600 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ==========================
// Node Online Check
// ==========================
function isNodeOnline(createdAt) {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < 60 * 1000;
}

// ==========================
// APP
// ==========================
function App() {
  const [rooms,    setRooms]    = useState([]);
  const [history,  setHistory]  = useState({});
  const [dark,     setDark]     = useState(false);
  const [rangeIdx, setRangeIdx] = useState(0);
  const [page,     setPage]     = useState("dashboard");

  const t = dark ? theme.dark : theme.light;

  const getData = useCallback(async () => {
    try {
      const res = await api.get("/latest-all");
      setRooms(res.data);
    } catch (err) { console.log(err); }
  }, []);

  const getHistory = useCallback(async (minutes = 30) => {
    try {
      const res = await api.get(`/history?minutes=${minutes}`);
      setHistory(res.data);
    } catch (err) { console.log(err); }
  }, []);

  // Auto refresh data live — TIDAK DIUBAH
  useEffect(() => {
    getData();
    const interval = setInterval(getData, 3000);
    return () => clearInterval(interval);
  }, [getData]);

  // History refresh tiap 30 detik
  useEffect(() => {
    getHistory(TIME_RANGES[rangeIdx].minutes);
    const interval = setInterval(() => getHistory(TIME_RANGES[rangeIdx].minutes), 30000);
    return () => clearInterval(interval);
  }, [getHistory, rangeIdx]);

  if (rooms.length === 0) {
    return (
      <div style={{ ...styles.loading, backgroundColor: t.pageBg }}>
        <div style={styles.loadingInner}>
          <div style={{ ...styles.spinner, border: `3px solid ${t.spinnerTrack}`, borderTop: `3px solid ${t.spinnerHead}` }} />
          <p style={{ ...styles.loadingText, color: t.loadingText }}>Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.container, backgroundColor: t.pageBg }}>

      {/* HEADER */}
      <div style={styles.header}>
        <div style={{ ...styles.headerIcon, backgroundColor: t.headerIconBg }}>
          <span style={{ fontSize: "22px" }}>🏢</span>
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ ...styles.title, color: t.titleColor }}>Smart Room Dashboard</h1>

        </div>

        {/* NAV TABS */}
        <div style={{ display: "flex", gap: "4px", backgroundColor: t.tabBg, borderRadius: "10px", padding: "4px" }}>
          {[
            { key: "dashboard", label: "🏠 Dashboard" },
            { key: "analytics", label: "📊 Analitik"  },
          ].map(nav => (
            <button key={nav.key} onClick={() => setPage(nav.key)} style={{
              fontSize: "13px",
              fontWeight: page === nav.key ? "600" : "400",
              padding: "6px 14px",
              borderRadius: "7px",
              border: "none",
              cursor: "pointer",
              backgroundColor: page === nav.key ? t.tabActiveBg : "transparent",
              color: page === nav.key ? t.tabActive : t.tabInactive,
              transition: "all 0.2s ease",
            }}>
              {nav.label}
            </button>
          ))}
        </div>

        {/* DARK MODE TOGGLE */}
        <button onClick={() => setDark(d => !d)} style={{ ...styles.toggleBtn, backgroundColor: t.toggleBg }} aria-label="Toggle dark mode">
          <span style={{ fontSize: "14px" }}>{t.toggleIcon}</span>
          <span style={{ ...styles.toggleLabelStyle, color: dark ? "#ffffff" : "#374151" }}>{t.toggleLabel}</span>
        </button>
      </div>

      {/* HALAMAN ANALITIK */}
      {page === "analytics" && (
        <Analytics t={t} dark={dark} />
      )}

      {/* HALAMAN DASHBOARD */}
      {page === "dashboard" && (
        <div>
          {/* ROOM GRID */}
          <div style={styles.roomGrid}>
            {rooms.map((data, index) => {
              const isOccupied     = data.motion == 1;
              const roomStatus     = isOccupied ? "Digunakan" : "Kosong";
              const occupiedBg     = dark ? "#14532d" : "#dcfce7";
              const occupiedColor  = dark ? "#86efac" : "#15803d";
              const emptyBg        = dark ? "#450a0a" : "#fee2e2";
              const emptyColor     = dark ? "#fca5a5" : "#b91c1c";

              let airQualityStatus = "";
              let airQualityColor  = "";
              let airQualitySub    = "";
              if (data.air_quality < 1000) {
                airQualityStatus = "Baik";
                airQualityColor  = dark ? "#4ade80" : "#16a34a";
                airQualitySub    = "CO₂ < 1000 ppm";
              } else if (data.air_quality < 1800) {
                airQualityStatus = "Sedang";
                airQualityColor  = dark ? "#fbbf24" : "#d97706";
                airQualitySub    = "CO₂ < 1800 ppm";
              } else {
                airQualityStatus = "Buruk";
                airQualityColor  = dark ? "#f87171" : "#dc2626";
                airQualitySub    = "CO₂ ≥ 1800 ppm";
              }

              const modeIsNormal   = (data.mode || "NORMAL") === "NORMAL";
              const modeBg         = modeIsNormal ? (dark ? "#14532d" : "#dcfce7") : (dark ? "#422006" : "#fef9c3");
              const modeColor      = modeIsNormal ? (dark ? "#86efac" : "#15803d") : (dark ? "#fcd34d" : "#92400e");
              const tempColor      = dark ? "#60a5fa" : "#2563eb";
              const fanOnColor     = dark ? "#4ade80" : "#16a34a";
              const fanOffColor    = dark ? "#f87171" : "#dc2626";
              const online         = isNodeOnline(data.created_at);
              const nodeDotColor   = online ? "#22c55e" : "#ef4444";
              const nodeStatusLabel = online ? "Online" : "Offline";

              return (
                <div key={index} style={{ ...styles.roomCard, backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}` }}>

                  {/* Room Header */}
                  <div style={{ ...styles.roomHeader, borderBottom: `1px solid ${t.roomHeaderBorder}` }}>
                    <div style={{ ...styles.roomName, color: t.roomNameColor }}>
                      <span style={{ fontSize: "16px" }}>🚪</span>
                      Ruangan {index + 1}
                      <span title={nodeStatusLabel} style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: "500", color: nodeDotColor, marginLeft: "4px" }}>
                        <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: nodeDotColor, display: "inline-block", boxShadow: online ? `0 0 0 2px ${dark ? "#0f172a" : "#ffffff"}, 0 0 0 3px ${nodeDotColor}` : "none" }} />
                        {nodeStatusLabel}
                      </span>
                    </div>
                    <span style={{ ...styles.badge, backgroundColor: isOccupied ? occupiedBg : emptyBg, color: isOccupied ? occupiedColor : emptyColor }}>
                      {roomStatus}
                    </span>
                  </div>

                  {/* Sensor Grid */}
                  <div style={styles.sensorGrid}>
                    <div style={{ ...styles.sensorCard, backgroundColor: t.sensorCardBg, border: `1px solid ${t.sensorBorder}` }}>
                      <p style={{ ...styles.sensorLabel, color: t.sensorLabel }}>🌡 Suhu</p>
                      <p style={{ ...styles.sensorValue, color: tempColor }}>{data.temperature.toFixed(1)} °C</p>
                    </div>
                    <div style={{ ...styles.sensorCard, backgroundColor: t.sensorCardBg, border: `1px solid ${t.sensorBorder}` }}>
                      <p style={{ ...styles.sensorLabel, color: t.sensorLabel }}>💧 Kelembapan</p>
                      <p style={{ ...styles.sensorValue, color: tempColor }}>{data.humidity.toFixed(1)} %</p>
                    </div>
                    <div style={{ ...styles.sensorCard, backgroundColor: t.sensorCardBg, border: `1px solid ${t.sensorBorder}` }}>
                      <p style={{ ...styles.sensorLabel, color: t.sensorLabel }}>🌫 Kualitas Udara</p>
                      <p style={{ ...styles.sensorValue, color: airQualityColor }}>{airQualityStatus}</p>
                    </div>
                    <div style={{ ...styles.sensorCard, backgroundColor: t.sensorCardBg, border: `1px solid ${t.sensorBorder}` }}>
                      <p style={{ ...styles.sensorLabel, color: t.sensorLabel }}>⚡ Mode Sistem</p>
                      <span style={{ ...styles.modeBadge, backgroundColor: modeBg, color: modeColor }}>
                        {data.mode || "NORMAL"}
                      </span>
                    </div>
                  </div>

                  <div style={{ ...styles.divider, backgroundColor: t.divider }} />

                  {/* Fan Row */}
                  <div style={styles.fanRow}>
                    <div style={{ ...styles.fanPill, backgroundColor: t.fanPillBg, border: `1px solid ${t.sensorBorder}` }}>
                      <span style={{ ...styles.fanLabel, color: t.fanLabel }}>🌀 Intake Fan</span>
                      <span style={{ ...styles.fanValue, color: data.fan_intake == 1 ? fanOnColor : fanOffColor }}>
                        {data.fan_intake == 1 ? "ON" : "OFF"}
                      </span>
                    </div>
                    <div style={{ ...styles.fanPill, backgroundColor: t.fanPillBg, border: `1px solid ${t.sensorBorder}` }}>
                      <span style={{ ...styles.fanLabel, color: t.fanLabel }}>🌬 Exhaust Fan</span>
                      <span style={{ ...styles.fanValue, color: data.fan_exhaust == 1 ? fanOnColor : fanOffColor }}>
                        {data.fan_exhaust == 1 ? "ON" : "OFF"}
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {/* CHART SECTION */}
          {Object.keys(history).length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <ChartSection history={history} dark={dark} t={t} rangeIdx={rangeIdx} setRangeIdx={setRangeIdx} />
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// ==========================
// STYLES
// ==========================
const styles = {
  container: {
    minHeight: "100vh",
    width: "100%",
    padding: "24px",
    fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
    overflowX: "hidden",
    transition: "background-color 0.3s ease",
  },
  loading: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    transition: "background-color 0.3s ease",
  },
  loadingInner: { display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" },
  spinner: { width: "36px", height: "36px", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  loadingText: { fontSize: "15px" },
  header: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" },
  headerIcon: { width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background-color 0.3s ease" },
  title: { fontSize: "20px", fontWeight: "600", margin: 0, transition: "color 0.3s ease" },
  subtitle: { fontSize: "13px", margin: "2px 0 0 0", display: "flex", alignItems: "center", gap: "6px", transition: "color 0.3s ease" },
  liveDot: { display: "inline-block", width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#22c55e", verticalAlign: "middle" },
  toggleBtn: { display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px", borderRadius: "99px", border: "none", cursor: "pointer", flexShrink: 0, transition: "background-color 0.3s ease" },
  toggleLabelStyle: { fontSize: "13px", fontWeight: "500", transition: "color 0.3s ease" },
  roomGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", alignItems: "start" },
  roomCard: { borderRadius: "16px", padding: "20px", transition: "background-color 0.3s ease, border-color 0.3s ease" },
  roomHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "14px", transition: "border-color 0.3s ease" },
  roomName: { fontSize: "15px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", transition: "color 0.3s ease" },
  badge: { fontSize: "11px", fontWeight: "600", padding: "3px 10px", borderRadius: "99px", transition: "background-color 0.3s ease, color 0.3s ease" },
  sensorGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  sensorCard: { borderRadius: "10px", padding: "14px", transition: "background-color 0.3s ease, border-color 0.3s ease" },
  sensorLabel: { fontSize: "11px", margin: "0 0 6px 0", fontWeight: "500", transition: "color 0.3s ease" },
  sensorValue: { fontSize: "18px", fontWeight: "600", margin: 0, transition: "color 0.3s ease" },
  sensorSub: { fontSize: "10px", margin: "3px 0 0 0", transition: "color 0.3s ease" },
  modeBadge: { display: "inline-block", fontSize: "11px", fontWeight: "600", padding: "3px 10px", borderRadius: "99px", marginTop: "4px", transition: "background-color 0.3s ease, color 0.3s ease" },
  divider: { height: "1px", margin: "14px 0", transition: "background-color 0.3s ease" },
  fanRow: { display: "flex", gap: "8px" },
  fanPill: { flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "10px", padding: "10px 12px", transition: "background-color 0.3s ease, border-color 0.3s ease" },
  fanLabel: { fontSize: "12px", transition: "color 0.3s ease" },
  fanValue: { fontSize: "12px", fontWeight: "700", transition: "color 0.3s ease" },
  chartCard: { borderRadius: "16px", padding: "20px", transition: "background-color 0.3s ease, border-color 0.3s ease" },
  chartHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" },
  chartTitle: { fontSize: "15px", fontWeight: "600", margin: 0, transition: "color 0.3s ease" },
  chartSub: { fontSize: "12px", margin: "2px 0 0 0", transition: "color 0.3s ease" },
  rangeBtn: { fontSize: "12px", fontWeight: "500", padding: "5px 12px", borderRadius: "99px", cursor: "pointer", transition: "all 0.2s ease" },
  tabRow: { display: "flex", borderRadius: "10px", padding: "4px", marginBottom: "16px", width: "fit-content", transition: "background-color 0.3s ease" },
  tabBtn: { fontSize: "12px", padding: "6px 16px", borderRadius: "7px", border: "none", cursor: "pointer", transition: "all 0.2s ease" },
  chartEmpty: { textAlign: "center", padding: "40px 0", fontSize: "13px" },
};

export default App;