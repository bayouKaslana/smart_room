import { useEffect, useState, useCallback } from "react";
import api from "./services/api";

// ==========================
// NODE NAME HELPER
// ==========================
function nodeName(node_id) {
  return node_id
    .replace("node_node", "Ruangan ")
    .replace("node", "Ruangan ");
}

// ==========================
// FORMAT WAKTU
// ==========================
function fmtDateTime(isoStr) {
  if (!isoStr) return "-";
  const d = new Date(isoStr);
  return d.toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

// ==========================
// TREND BADGE
// perbandingan nilai hari ini vs kemarin
// ==========================
function TrendBadge({ current, prev, unit, dark }) {
  if (prev === null || prev === undefined) {
    return <span style={{ fontSize: "11px", color: dark ? "#475569" : "#94a3b8" }}>— Tidak ada data kemarin</span>;
  }
  const diff   = +(current - prev).toFixed(1);
  const isUp   = diff > 0;
  const isZero = diff === 0;
  const color  = isZero ? (dark ? "#94a3b8" : "#64748b")
               : isUp   ? "#ef4444"
               :           "#22c55e";
  const arrow  = isZero ? "→" : isUp ? "▲" : "▼";
  return (
    <span style={{ fontSize: "11px", color, fontWeight: 600 }}>
      {arrow} {Math.abs(diff).toFixed(1)}{unit} vs kemarin
    </span>
  );
}

// ==========================
// STAT CARD
// ==========================
function StatCard({ label, icon, avg, min, max, prevAvg, unit, t, dark }) {
  return (
    <div style={{
      backgroundColor: t.sensorCardBg,
      border: `1px solid ${t.cardBorder}`,
      borderRadius: "12px",
      padding: "16px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
        <span style={{ fontSize: "16px" }}>{icon}</span>
        <span style={{ fontSize: "13px", fontWeight: "600", color: t.titleColor }}>{label}</span>
      </div>

      {/* AVG besar */}
      <div style={{ marginBottom: "10px" }}>
        <p style={{ fontSize: "11px", color: t.sensorLabel, margin: "0 0 2px 0" }}>Rata-rata</p>
        <p style={{ fontSize: "28px", fontWeight: "700", color: t.accentColor, margin: 0 }}>
          {typeof avg === "number" ? avg.toFixed(1) : avg}<span style={{ fontSize: "14px", fontWeight: "400", marginLeft: "2px" }}>{unit}</span>
        </p>
        <TrendBadge current={avg} prev={prevAvg} unit={unit} dark={dark} />
      </div>

      {/* Min Max */}
      <div style={{ display: "flex", gap: "8px" }}>
        <div style={{
          flex: 1, backgroundColor: t.pageBg,
          borderRadius: "8px", padding: "8px 10px",
          border: `1px solid ${t.divider}`,
        }}>
          <p style={{ fontSize: "10px", color: t.sensorLabel, margin: "0 0 2px 0" }}>Min</p>
          <p style={{ fontSize: "14px", fontWeight: "600", color: "#22c55e", margin: 0 }}>{typeof min === "number" ? min.toFixed(1) : min}{unit}</p>
        </div>
        <div style={{
          flex: 1, backgroundColor: t.pageBg,
          borderRadius: "8px", padding: "8px 10px",
          border: `1px solid ${t.divider}`,
        }}>
          <p style={{ fontSize: "10px", color: t.sensorLabel, margin: "0 0 2px 0" }}>Max</p>
          <p style={{ fontSize: "14px", fontWeight: "600", color: "#ef4444", margin: 0 }}>{typeof max === "number" ? max.toFixed(1) : max}{unit}</p>
        </div>
      </div>
    </div>
  );
}

// ==========================
// ANOMALY ITEM
// ==========================
function AnomalyItem({ item, t }) {
  const typeConfig = {
    temperature : { icon: "🌡", color: "#ef4444", bg: "#fee2e2", bgDark: "#450a0a", colorDark: "#fca5a5" },
    humidity    : { icon: "💧", color: "#3b82f6", bg: "#dbeafe", bgDark: "#1e3a5f", colorDark: "#93c5fd" },
    air_quality : { icon: "🌫", color: "#f97316", bg: "#ffedd5", bgDark: "#431407", colorDark: "#fdba74" },
  };
  const cfg   = typeConfig[item.type] || typeConfig.temperature;
  const isDark = t.pageBg === "#0f172a";
  const badgeBg    = isDark ? cfg.bgDark    : cfg.bg;
  const badgeColor = isDark ? cfg.colorDark : cfg.color;

  const unit = item.type === "temperature" ? "°C"
             : item.type === "humidity"    ? "%"
             : " ADC";

  const diffAbs   = typeof item.diff === "number" ? Math.abs(item.diff).toFixed(1) : item.diff;
  const diffLabel = item.diff > 0
    ? `▲ +${diffAbs}${unit}`
    : `▼ -${diffAbs}${unit}`;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 14px",
      backgroundColor: t.cardBg,
      border: `1px solid ${t.cardBorder}`,
      borderRadius: "10px",
    }}>
      {/* Icon */}
      <div style={{
        width: "36px", height: "36px", borderRadius: "8px",
        backgroundColor: badgeBg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "18px", flexShrink: 0,
      }}>
        {cfg.icon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
          <span style={{ fontSize: "13px", fontWeight: "600", color: t.titleColor }}>
            {item.label}
          </span>
          <span style={{
            fontSize: "10px", fontWeight: "600",
            padding: "1px 7px", borderRadius: "99px",
            backgroundColor: badgeBg, color: badgeColor,
          }}>
            {nodeName(item.node_id)}
          </span>
        </div>
        <p style={{ fontSize: "12px", color: t.sensorLabel, margin: 0 }}>
          {typeof item.prev_value === "number" ? item.prev_value.toFixed(1) : item.prev_value}{unit} → {typeof item.value === "number" ? item.value.toFixed(1) : item.value}{unit}
          <span style={{ color: badgeColor, fontWeight: "600", marginLeft: "6px" }}>
            {diffLabel}
          </span>
        </p>
      </div>

      {/* Waktu */}
      <div style={{ fontSize: "11px", color: t.sensorSub, flexShrink: 0, textAlign: "right" }}>
        {fmtDateTime(item.time)}
      </div>
    </div>
  );
}

// ==========================
// ANALYTICS PAGE
// ==========================
export default function Analytics({ t, dark, selDate, setSelDate }) {

  const [stats,     setStats]     = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [anomalyFilter, setAnomalyFilter] = useState("all"); // all | temperature | humidity | air_quality

  // ==========================
  // Fetch Stats
  // ==========================
  const fetchStats = useCallback(async (date = "") => {
    try {
      const url = date ? `/stats?date=${date}` : "/stats";
      const res = await api.get(url);
      setStats(res.data);
      if (!date && !selDate) setSelDate(res.data.date);
    } catch (err) {
      console.log(err);
    }
  }, []);

  // ==========================
  // Fetch Anomalies
  // ==========================
  const fetchAnomalies = useCallback(async () => {
    try {
      const res = await api.get("/anomalies?limit=50");
      setAnomalies(res.data);
    } catch (err) {
      console.log(err);
    }
  }, []);

  useEffect(() => {
    // Kalau selDate sudah ada (dari props), langsung pakai
    // Kalau belum, fetchStats akan set selDate ke tanggal terbaru
    Promise.all([fetchStats(selDate || ""), fetchAnomalies()])
      .finally(() => setLoading(false));
  }, []); // hanya run sekali saat mount

  // Re-fetch stats saat tanggal berubah oleh user
  useEffect(() => {
    if (selDate) fetchStats(selDate);
  }, [selDate]);

  // ==========================
  // Filtered Anomalies
  // ==========================
  const filteredAnomalies = anomalyFilter === "all"
    ? anomalies
    : anomalies.filter(a => a.type === anomalyFilter);

  // ==========================
  // Loading
  // ==========================
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
        <p style={{ color: t.subtitleColor, fontSize: "14px" }}>Memuat data analitik...</p>
      </div>
    );
  }

  return (
    <div>

      {/* ========================
          STATISTIK HARIAN
      ======================== */}
      <div style={{ marginBottom: "24px" }}>

        {/* Section Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: t.titleColor, margin: 0 }}>
              📊 Statistik Harian
            </h2>
            <p style={{ fontSize: "12px", color: t.subtitleColor, margin: "2px 0 0 0" }}>
              Data Rata-rata, min & max per ruangan
            </p>
          </div>

          {/* Date Picker */}
          <input
            type="date"
            value={selDate}
            onChange={e => setSelDate(e.target.value)}
            style={{
              fontSize: "13px",
              padding: "6px 12px",
              borderRadius: "8px",
              border: `1px solid ${t.cardBorder}`,
              backgroundColor: t.cardBg,
              color: t.titleColor,
              cursor: "pointer",
              outline: "none",
            }}
          />
        </div>

        {/* Stats Per Node */}
        {!stats || stats.nodes.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "40px",
            backgroundColor: t.cardBg, borderRadius: "12px",
            border: `1px solid ${t.cardBorder}`,
            color: t.subtitleColor, fontSize: "13px",
          }}>
            Tidak ada data untuk tanggal ini
          </div>
        ) : (
          stats.nodes.map((node, ni) => (
            <div key={ni} style={{
              backgroundColor: t.cardBg,
              border: `1px solid ${t.cardBorder}`,
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "12px",
            }}>
              {/* Node Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "12px", borderBottom: `1px solid ${t.divider}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "16px" }}>🚪</span>
                  <span style={{ fontSize: "15px", fontWeight: "600", color: t.titleColor }}>
                    {nodeName(node.node_id)}
                  </span>
                </div>
                <span style={{
                  fontSize: "11px", color: t.subtitleColor,
                  backgroundColor: t.sensorCardBg,
                  padding: "3px 10px", borderRadius: "99px",
                  border: `1px solid ${t.cardBorder}`,
                }}>
                  {node.total_data.toLocaleString()} data terkumpul
                </span>
              </div>

              {/* Stat Cards Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                <StatCard
                  label="Temperatur" icon="🌡"
                  avg={node.temperature.avg} min={node.temperature.min} max={node.temperature.max}
                  prevAvg={node.temperature.prev_avg} unit="°C" t={t} dark={dark}
                />
                <StatCard
                  label="Kelembapan" icon="💧"
                  avg={node.humidity.avg} min={node.humidity.min} max={node.humidity.max}
                  prevAvg={node.humidity.prev_avg} unit="%" t={t} dark={dark}
                />
                <StatCard
                  label="Kualitas Udara (ADC)" icon="🌫"
                  avg={node.air_quality.avg} min={node.air_quality.min} max={node.air_quality.max}
                  prevAvg={node.air_quality.prev_avg} unit="" t={t} dark={dark}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* ========================
          DETEKSI ANOMALI
      ======================== */}
      <div>
        {/* Section Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: t.titleColor, margin: 0 }}>
              🚨 Deteksi Anomali
            </h2>
            <p style={{ fontSize: "12px", color: t.subtitleColor, margin: "2px 0 0 0" }}>
              Lonjakan nilai yang tidak wajar
            </p>
          </div>

          {/* Filter */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {[
              { key: "all",         label: "Semua"        },
              { key: "temperature", label: "🌡 Suhu"       },
              { key: "humidity",    label: "💧 Kelembapan" },
              { key: "air_quality", label: "🌫 Udara"      },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setAnomalyFilter(f.key)}
                style={{
                  fontSize: "12px", fontWeight: "500",
                  padding: "5px 12px", borderRadius: "99px", border: "none", cursor: "pointer",
                  backgroundColor: anomalyFilter === f.key ? t.titleColor : t.sensorCardBg,
                  color: anomalyFilter === f.key ? t.pageBg : t.sensorLabel,
                  transition: "all 0.2s ease",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Anomaly Count Badge */}
        {filteredAnomalies.length > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            marginBottom: "12px",
            padding: "10px 14px",
            backgroundColor: dark ? "#450a0a" : "#fee2e2",
            borderRadius: "10px",
            border: `1px solid ${dark ? "#7f1d1d" : "#fecaca"}`,
          }}>
            <span style={{ fontSize: "14px" }}>⚠️</span>
            <span style={{ fontSize: "13px", fontWeight: "500", color: dark ? "#fca5a5" : "#b91c1c" }}>
              {filteredAnomalies.length} anomali terdeteksi dari 2000 data terakhir
            </span>
          </div>
        )}

        {/* Anomaly List */}
        {filteredAnomalies.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "40px",
            backgroundColor: t.cardBg, borderRadius: "12px",
            border: `1px solid ${t.cardBorder}`,
            color: t.subtitleColor, fontSize: "13px",
          }}>
            ✅ Tidak ada anomali terdeteksi
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredAnomalies.map((item, i) => (
              <AnomalyItem key={i} item={item} t={t} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}