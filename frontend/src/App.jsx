import { useEffect, useState } from "react";
import api from "./services/api";

// ==========================
// THEME TOKENS
// ==========================
const theme = {
  light: {
    // Layout
    pageBg:         "#f8fafc",
    cardBg:         "#ffffff",
    sensorCardBg:   "#f8fafc",
    fanPillBg:      "#f8fafc",
    // Borders
    cardBorder:     "#e2e8f0",
    sensorBorder:   "#f1f5f9",
    divider:        "#f1f5f9",
    roomHeaderBorder:"#f1f5f9",
    // Text
    titleColor:     "#0f172a",
    subtitleColor:  "#64748b",
    roomNameColor:  "#0f172a",
    sensorLabel:    "#64748b",
    sensorSub:      "#94a3b8",
    fanLabel:       "#64748b",
    // Header icon
    headerIconBg:   "#eff6ff",
    // Toggle button
    toggleBg:       "#e2e8f0",
    toggleThumb:    "#ffffff",
    toggleIcon:     "🌙",
    toggleLabel:    "Dark Mode",
    // Spinner
    spinnerTrack:   "#e2e8f0",
    spinnerHead:    "#3b82f6",
    loadingText:    "#64748b",
    // Badge bg (occupied/empty): dynamic per card
  },
  dark: {
    pageBg:         "#0f172a",
    cardBg:         "#1e293b",
    sensorCardBg:   "#0f172a",
    fanPillBg:      "#0f172a",
    cardBorder:     "#334155",
    sensorBorder:   "#1e293b",
    divider:        "#334155",
    roomHeaderBorder:"#334155",
    titleColor:     "#f1f5f9",
    subtitleColor:  "#94a3b8",
    roomNameColor:  "#f1f5f9",
    sensorLabel:    "#94a3b8",
    sensorSub:      "#475569",
    fanLabel:       "#94a3b8",
    headerIconBg:   "#1e3a5f",
    toggleBg:       "#3b82f6",
    toggleThumb:    "#ffffff",
    toggleIcon:     "☀️",
    toggleLabel:    "Light Mode",
    spinnerTrack:   "#334155",
    spinnerHead:    "#60a5fa",
    loadingText:    "#94a3b8",
  },
};

function App() {

  const [rooms, setRooms]   = useState([]);
  const [dark, setDark]     = useState(false);

  const t = dark ? theme.dark : theme.light;

  // ==========================
  // Fetch Data
  // ==========================
  const getData = async () => {
    try {
      const response = await api.get("/latest-all");
      setRooms(response.data);
    } catch (err) {
      console.log(err);
    }
  };

  // ==========================
  // Auto Refresh
  // ==========================
  useEffect(() => {
    getData();
    const interval = setInterval(getData, 3000);
    return () => clearInterval(interval);
  }, []);

  // ==========================
  // Loading
  // ==========================
  if (rooms.length === 0) {
    return (
      <div style={{ ...styles.loading, backgroundColor: t.pageBg }}>
        <div style={styles.loadingInner}>
          <div style={{
            ...styles.spinner,
            border: `3px solid ${t.spinnerTrack}`,
            borderTop: `3px solid ${t.spinnerHead}`,
          }} />
          <p style={{ ...styles.loadingText, color: t.loadingText }}>
            Memuat data...
          </p>
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
          <h1 style={{ ...styles.title, color: t.titleColor }}>
            Smart Room Dashboard
          </h1>
        </div>

        {/* DARK MODE TOGGLE */}
        <button
          onClick={() => setDark(d => !d)}
          style={{ ...styles.toggleBtn, backgroundColor: t.toggleBg }}
          aria-label="Toggle dark mode"
        >
          <span style={{ fontSize: "14px" }}>{t.toggleIcon}</span>
          <span style={{ ...styles.toggleLabel, color: dark ? "#ffffff" : "#374151" }}>
            {t.toggleLabel}
          </span>
          <span style={{
            ...styles.toggleThumb,
            backgroundColor: t.toggleThumb,
            transform: dark ? "translateX(20px)" : "translateX(0px)",
          }} />
        </button>
      </div>

      {/* ROOM GRID */}
      <div style={styles.roomGrid}>
        {rooms.map((data, index) => {

          // ==========================
          // Room Status
          // ==========================
          const isOccupied = data.motion == 1;
          const roomStatus = isOccupied ? "Digunakan" : "Kosong";

          const occupiedBg    = dark ? "#14532d" : "#dcfce7";
          const occupiedColor = dark ? "#86efac" : "#15803d";
          const emptyBg       = dark ? "#450a0a" : "#fee2e2";
          const emptyColor    = dark ? "#fca5a5" : "#b91c1c";

          // ==========================
          // Air Quality
          // ==========================
          let airQualityStatus = "";
          let airQualityColor  = "";
          let airQualitySub    = "";

          if (data.air_quality < 1000) {
            airQualityStatus = "Baik";
            airQualityColor  = dark ? "#4ade80" : "#16a34a";
          } else if (data.air_quality < 1800) {
            airQualityStatus = "Normal";
            airQualityColor  = dark ? "#fbbf24" : "#d97706";
          } else {
            airQualityStatus = "Buruk";
            airQualityColor  = dark ? "#f87171" : "#dc2626";
          }

          const modeIsNormal  = (data.mode || "NORMAL") === "NORMAL";
          const modeBg        = modeIsNormal
            ? (dark ? "#14532d" : "#dcfce7")
            : (dark ? "#422006" : "#fef9c3");
          const modeColor     = modeIsNormal
            ? (dark ? "#86efac" : "#15803d")
            : (dark ? "#fcd34d" : "#92400e");

          const tempColor     = dark ? "#60a5fa" : "#2563eb";
          const fanOnColor    = dark ? "#4ade80" : "#16a34a";
          const fanOffColor   = dark ? "#f87171" : "#dc2626";

          return (
            <div
              key={index}
              style={{
                ...styles.roomCard,
                backgroundColor: t.cardBg,
                border: `1px solid ${t.cardBorder}`,
              }}
            >

              {/* ROOM HEADER */}
              <div style={{
                ...styles.roomHeader,
                borderBottom: `1px solid ${t.roomHeaderBorder}`,
              }}>
                <div style={{ ...styles.roomName, color: t.roomNameColor }}>
                  <span style={{ fontSize: "16px" }}>🚪</span>
                  Ruangan {index + 1}
                </div>
                <span style={{
                  ...styles.badge,
                  backgroundColor: isOccupied ? occupiedBg : emptyBg,
                  color: isOccupied ? occupiedColor : emptyColor,
                }}>
                  {roomStatus}
                </span>
              </div>

              {/* SENSOR GRID */}
              <div style={styles.sensorGrid}>

                {/* Temperature */}
                <div style={{
                  ...styles.sensorCard,
                  backgroundColor: t.sensorCardBg,
                  border: `1px solid ${t.sensorBorder}`,
                }}>
                  <p style={{ ...styles.sensorLabel, color: t.sensorLabel }}>
                    🌡 Temperatur
                  </p>
                  <p style={{ ...styles.sensorValue, color: tempColor }}>
                    {data.temperature.toFixed(1)} °C
                  </p>
                </div>

                {/* Humidity */}
                <div style={{
                  ...styles.sensorCard,
                  backgroundColor: t.sensorCardBg,
                  border: `1px solid ${t.sensorBorder}`,
                }}>
                  <p style={{ ...styles.sensorLabel, color: t.sensorLabel }}>
                    💧 Kelembapan
                  </p>
                  <p style={{ ...styles.sensorValue, color: tempColor }}>
                    {data.humidity.toFixed(1)} %
                  </p>
                </div>

                {/* Air Quality */}
                <div style={{
                  ...styles.sensorCard,
                  backgroundColor: t.sensorCardBg,
                  border: `1px solid ${t.sensorBorder}`,
                }}>
                  <p style={{ ...styles.sensorLabel, color: t.sensorLabel }}>
                    🌫 Kualitas Udara
                  </p>
                  <p style={{ ...styles.sensorValue, color: airQualityColor }}>
                    {airQualityStatus}
                  </p>
                  <p style={{ ...styles.sensorSub, color: t.sensorSub }}>
                    {airQualitySub}
                  </p>
                </div>

                {/* Mode */}
                <div style={{
                  ...styles.sensorCard,
                  backgroundColor: t.sensorCardBg,
                  border: `1px solid ${t.sensorBorder}`,
                }}>
                  <p style={{ ...styles.sensorLabel, color: t.sensorLabel }}>
                    ⚡ Mode Sistem
                  </p>
                  <span style={{
                    ...styles.modeBadge,
                    backgroundColor: modeBg,
                    color: modeColor,
                  }}>
                    {data.mode || "NORMAL"}
                  </span>
                </div>

              </div>

              {/* DIVIDER */}
              <div style={{ ...styles.divider, backgroundColor: t.divider }} />

              {/* FAN ROW */}
              <div style={styles.fanRow}>
                <div style={{
                  ...styles.fanPill,
                  backgroundColor: t.fanPillBg,
                  border: `1px solid ${t.sensorBorder}`,
                }}>
                  <span style={{ ...styles.fanLabel, color: t.fanLabel }}>
                    🌀 Intake Fan
                  </span>
                  <span style={{
                    ...styles.fanValue,
                    color: data.fan_intake == 1 ? fanOnColor : fanOffColor,
                  }}>
                    {data.fan_intake == 1 ? "ON" : "OFF"}
                  </span>
                </div>
                <div style={{
                  ...styles.fanPill,
                  backgroundColor: t.fanPillBg,
                  border: `1px solid ${t.sensorBorder}`,
                }}>
                  <span style={{ ...styles.fanLabel, color: t.fanLabel }}>
                    🌬 Exhaust Fan
                  </span>
                  <span style={{
                    ...styles.fanValue,
                    color: data.fan_exhaust == 1 ? fanOnColor : fanOffColor,
                  }}>
                    {data.fan_exhaust == 1 ? "ON" : "OFF"}
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}

// ==========================
// STATIC STYLES
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

  loadingInner: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },

  spinner: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  loadingText: {
    fontSize: "15px",
  },

  // Header
  header: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "24px",
  },

  headerIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "background-color 0.3s ease",
  },

  title: {
    fontSize: "20px",
    fontWeight: "600",
    margin: 0,
    transition: "color 0.3s ease",
  },

  subtitle: {
    fontSize: "13px",
    margin: "2px 0 0 0",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "color 0.3s ease",
  },

  liveDot: {
    display: "inline-block",
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    backgroundColor: "#22c55e",
    verticalAlign: "middle",
  },

  // Toggle button
  toggleBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 14px",
    borderRadius: "99px",
    border: "none",
    cursor: "pointer",
    flexShrink: 0,
    fontSize: "13px",
    fontWeight: "500",
    transition: "background-color 0.3s ease",
    position: "relative",
  },

  toggleLabel: {
    fontSize: "13px",
    fontWeight: "500",
    transition: "color 0.3s ease",
  },

  toggleThumb: {
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    transition: "transform 0.25s ease",
    display: "none", // hidden — button style itself is the toggle indicator
  },

  // Room grid
  roomGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
    alignItems: "start",
  },

  // Room card
  roomCard: {
    borderRadius: "16px",
    padding: "20px",
    transition: "background-color 0.3s ease, border-color 0.3s ease",
  },

  roomHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
    paddingBottom: "14px",
    transition: "border-color 0.3s ease",
  },

  roomName: {
    fontSize: "15px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "color 0.3s ease",
  },

  badge: {
    fontSize: "11px",
    fontWeight: "600",
    padding: "3px 10px",
    borderRadius: "99px",
    transition: "background-color 0.3s ease, color 0.3s ease",
  },

  // Sensor grid
  sensorGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },

  sensorCard: {
    borderRadius: "10px",
    padding: "14px",
    transition: "background-color 0.3s ease, border-color 0.3s ease",
  },

  sensorLabel: {
    fontSize: "11px",
    margin: "0 0 6px 0",
    fontWeight: "500",
    transition: "color 0.3s ease",
  },

  sensorValue: {
    fontSize: "18px",
    fontWeight: "600",
    margin: 0,
    transition: "color 0.3s ease",
  },

  sensorSub: {
    fontSize: "10px",
    margin: "3px 0 0 0",
    transition: "color 0.3s ease",
  },

  modeBadge: {
    display: "inline-block",
    fontSize: "11px",
    fontWeight: "600",
    padding: "3px 10px",
    borderRadius: "99px",
    marginTop: "4px",
    transition: "background-color 0.3s ease, color 0.3s ease",
  },

  divider: {
    height: "1px",
    margin: "14px 0",
    transition: "background-color 0.3s ease",
  },

  fanRow: {
    display: "flex",
    gap: "8px",
  },

  fanPill: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: "10px",
    padding: "10px 12px",
    transition: "background-color 0.3s ease, border-color 0.3s ease",
  },

  fanLabel: {
    fontSize: "12px",
    transition: "color 0.3s ease",
  },

  fanValue: {
    fontSize: "12px",
    fontWeight: "700",
    transition: "color 0.3s ease",
  },
};

export default App;