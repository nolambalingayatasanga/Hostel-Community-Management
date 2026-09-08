



import React, { useState, useMemo } from "react";
import {
  Box,
  Card,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import ReactApexChart from "react-apexcharts";
import Iconify from "src/components/Iconify";
import { useChart } from "src/components/chart";

// --- SVG Donut helpers ---
const toRad = (deg) => (deg * Math.PI) / 180;
const polarToCartesian = (cx, cy, r, angleDeg) => {
  const rad = toRad(angleDeg);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const describeSegment = (cx, cy, outerR, innerR, startAngle, endAngle, cornerR) => {
  const segSpan = endAngle - startAngle;
  const maxCorner = Math.min(
    cornerR,
    (outerR - innerR) / 2,
    (segSpan * (Math.PI / 180) * innerR) / 2.2
  );
  const c = Math.max(maxCorner, 0);
  const toDeg = (rad) => (rad * 180) / Math.PI;
  const offOuter = toDeg(c / outerR);
  const offInner = toDeg(c / innerR);
  const pOuterA = polarToCartesian(cx, cy, outerR, startAngle + offOuter);
  const pOuterB = polarToCartesian(cx, cy, outerR, endAngle - offOuter);
  const pEndOuter = polarToCartesian(cx, cy, outerR - c, endAngle);
  const pEndInner = polarToCartesian(cx, cy, innerR + c, endAngle);
  const pInnerB = polarToCartesian(cx, cy, innerR, endAngle - offInner);
  const pInnerA = polarToCartesian(cx, cy, innerR, startAngle + offInner);
  const pStartInner = polarToCartesian(cx, cy, innerR + c, startAngle);
  const pStartOuter = polarToCartesian(cx, cy, outerR - c, startAngle);
  const outerLarge = endAngle - startAngle - 2 * offOuter > 180 ? 1 : 0;
  const innerLarge = endAngle - startAngle - 2 * offInner > 180 ? 1 : 0;
  return [
    `M ${pOuterA.x} ${pOuterA.y}`,
    `A ${outerR} ${outerR} 0 ${outerLarge} 1 ${pOuterB.x} ${pOuterB.y}`,
    c > 0 ? `A ${c} ${c} 0 0 1 ${pEndOuter.x} ${pEndOuter.y}` : "",
    `L ${pEndInner.x} ${pEndInner.y}`,
    c > 0 ? `A ${c} ${c} 0 0 1 ${pInnerB.x} ${pInnerB.y}` : "",
    `A ${innerR} ${innerR} 0 ${innerLarge} 0 ${pInnerA.x} ${pInnerA.y}`,
    c > 0 ? `A ${c} ${c} 0 0 1 ${pStartInner.x} ${pStartInner.y}` : "",
    `L ${pStartOuter.x} ${pStartOuter.y}`,
    c > 0 ? `A ${c} ${c} 0 0 1 ${pOuterA.x} ${pOuterA.y}` : "",
    "Z",
  ].filter(Boolean).join(" ");
};

function LeadsDonutChart({ activeTab, setActiveTab }) {
  const [hoverIdx, setHoverIdx] = useState(null);

  const data = useMemo(() => {
    if (activeTab === "source") {
      // Order matters here: it controls the clockwise placement of each
      // wedge around the ring (starting near the top). Reordered so the
      // rendered wedge positions match the reference design:
      // blue (top) -> red (right) -> orange (bottom, largest)
      // -> purple (left) -> pink (top-left).
      return {
        total: 32,
        segments: [
          { id: "blue", count: 4, gradId: "grad-blue", pastel: "#CEDFFB", label: "Commercial" },
          { id: "red", count: 8, gradId: "grad-red", pastel: "#F29989", label: "Whatsapp Landing Page" },
          { id: "orange", count: 12, gradId: "grad-orange", pastel: "#FFEEDF", label: "Just Dial / Telecmi" },
          { id: "purple", count: 3, gradId: "grad-purple", pastel: "#F8DFFF", label: "Talk To sales" },
          { id: "pink", count: 5, gradId: "grad-pink", pastel: "#FAD9F1", label: "Signups" },
        ],
        legendRow1: [
          { label: "Just Dial", color: "#FEAC49" },
          { label: "Signups", color: "#116DFF" },
          { label: "Talk To sales", color: "#C758E7" },
        ],
        legendRow2: [
          { label: "Telecmi", color: "#FEAC49" },
          { label: "Whatsapp Landing Page", color: "#E25EBD" },
          { label: "Commercial", color: "#116DFF" },
        ],
      };
    }
    return {
      total: 45,
      segments: [
        { id: "blue", count: 15, gradId: "grad-blue", pastel: "#CEDFFB", label: "New" },
        { id: "orange", count: 12, gradId: "grad-orange", pastel: "#FFEEDF", label: "Contacted" },
        { id: "purple", count: 8, gradId: "grad-purple", pastel: "#F8DFFF", label: "In Progress" },
        { id: "pink", count: 6, gradId: "grad-pink", pastel: "#FAD9F1", label: "Qualified" },
        { id: "red", count: 4, gradId: "grad-red", pastel: "#F29989", label: "Lost" },
      ],
      legendRow1: [
        { label: "New", color: "#116DFF" },
        { label: "Contacted", color: "#FEAC49" },
        { label: "In Progress", color: "#C758E7" },
      ],
      legendRow2: [
        { label: "Qualified", color: "#E25EBD" },
        { label: "Lost", color: "#F03421" },
      ],
    };
  }, [activeTab]);

  const SZ = 220;
  const cx = SZ / 2;
  const cy = SZ / 2;
  const GAP = 5;
  const CORNER = 6;
  const ringThickness = SZ * 0.16;
  const outerR = SZ / 2 - 6;
  const innerR = outerR - ringThickness;

  const total = data.total;
  const totalGap = GAP * data.segments.length;
  const availDeg = 360 - totalGap;

  let cur = -98;
  const segments = data.segments.map((s) => {
    const pct = (s.count / Math.max(total, 1)) * 100;
    const segDeg = (pct / 100) * availDeg;
    const start = cur;
    const end = cur + segDeg;
    cur = end + GAP;
    const mid = (start + end) / 2;
    return { ...s, start, end, mid, pct };
  });

  return (
    <Card sx={{ p: 3, width: "100%", height: "100%", borderRadius: "14px", border: "1px solid #E5E7EB", boxShadow: "none", display: "flex", flexDirection: "column" }}>
      {/* Header Tabs */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 3, borderBottom: "1px solid #F1F5F9", pb: 2 }}>
        <Button
          onClick={() => setActiveTab("source")}
          sx={{
            px: 2.5,
            py: 0.75,
            borderRadius: "8px",
            textTransform: "none",
            fontSize: "13px",
            fontWeight: 600,
            transition: "all 0.2s",
            ...(activeTab === "source" ? {
              bgcolor: "#F0F6FF",
              color: "#0088FF",
              border: "1px solid #CFE3FF",
              "&:hover": { bgcolor: "#E0F2FE" }
            } : {
              bgcolor: "white",
              color: "#4B5563",
              border: "1px solid #E5E7EB",
              "&:hover": { bgcolor: "#F9FAFB", borderColor: "#D1D5DB" }
            })
          }}
        >
          Leads By Source
        </Button>
        <Button
          onClick={() => setActiveTab("status")}
          sx={{
            px: 2.5,
            py: 0.75,
            borderRadius: "8px",
            textTransform: "none",
            fontSize: "13px",
            fontWeight: 600,
            transition: "all 0.2s",
            ...(activeTab === "status" ? {
              bgcolor: "#F0F6FF",
              color: "#0088FF",
              border: "1px solid #CFE3FF",
              "&:hover": { bgcolor: "#E0F2FE" }
            } : {
              bgcolor: "white",
              color: "#4B5563",
              border: "1px solid #E5E7EB",
              "&:hover": { bgcolor: "#F9FAFB", borderColor: "#D1D5DB" }
            })
          }}
        >
          Status Group
        </Button>
      </Stack>

      {/* Donut Chart Visual */}
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", position: "relative", my: 2, flexGrow: 1 }}>
        <Box
          sx={{ position: "relative", width: SZ, height: SZ }}
          onMouseLeave={() => setHoverIdx(null)}
        >
          <svg width={SZ} height={SZ} viewBox={`0 0 ${SZ} ${SZ}`} style={{ display: "block" }}>
            <defs>
              <linearGradient id="grad-pink" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#FAD9F1" />
                <stop offset="100%" stopColor="#E25EBD" />
              </linearGradient>
              <linearGradient id="grad-blue" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#CEDFFB" />
                <stop offset="100%" stopColor="#116DFF" />
              </linearGradient>
              <linearGradient id="grad-red" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#F29989" />
                <stop offset="100%" stopColor="#F03421" />
              </linearGradient>
              <linearGradient id="grad-orange" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#FFEEDF" />
                <stop offset="100%" stopColor="#FEAC49" />
              </linearGradient>
              <linearGradient id="grad-purple" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#F8DFFF" />
                <stop offset="100%" stopColor="#C758E7" />
              </linearGradient>
            </defs>

            {segments.map((seg, i) => (
              <path
                key={seg.id}
                d={describeSegment(cx, cy, outerR, innerR, seg.start, seg.end, CORNER)}
                // Always render the saturated gradient fill (matches the
                // reference design) — hover just adds emphasis, it doesn't
                // switch the wedge from a flat pastel to the gradient.
                fill={`url(#${seg.gradId})`}
                stroke="none"
                onMouseEnter={() => setHoverIdx(i)}
                style={{
                  cursor: "pointer",
                  transition: "all 200ms ease",
                  transformOrigin: `${cx}px ${cy}px`,
                  transform: hoverIdx === i ? "scale(1.04)" : "scale(1)",
                  opacity: hoverIdx === null || hoverIdx === i ? 1 : 0.75,
                  filter: hoverIdx === i ? "drop-shadow(0px 4px 8px rgba(0,0,0,0.15))" : "none",
                }}
              />
            ))}
          </svg>

          {/* Center Text */}
          <Box sx={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            pointerEvents: "none",
          }}>
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#6B7280", lineHeight: 1 }}>
              Total
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: 24, fontWeight: 700, color: "#111827", lineHeight: 1 }}>
              {total}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Legends */}
      <Box sx={{ mt: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
        <Stack direction="row" spacing={3} justifyContent="center" flexWrap="wrap">
          {data.legendRow1.map((item, idx) => (
            <Stack key={idx} direction="row" alignItems="center" spacing={1}>
              <Box sx={{ width: 12, height: 12, borderRadius: "4px", bgcolor: item.color, flexShrink: 0 }} />
              <Typography sx={{ fontSize: "12px", color: "#6B7280", fontWeight: 500 }}>
                {item.label}
              </Typography>
            </Stack>
          ))}
        </Stack>
        <Stack direction="row" spacing={3} justifyContent="center" flexWrap="wrap">
          {data.legendRow2.map((item, idx) => (
            <Stack key={idx} direction="row" alignItems="center" spacing={1}>
              <Box sx={{ width: 12, height: 12, borderRadius: "4px", bgcolor: item.color, flexShrink: 0 }} />
              <Typography sx={{ fontSize: "12px", color: "#6B7280", fontWeight: 500 }}>
                {item.label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Card>
  );
}

function LeadsByTagChart() {
  const chartSeries = [{
    name: "Percentage",
    data: [57.0, 18.0, 10.0, 25.0]
  }];

  const chartOptions = useChart({
    chart: {
      type: "bar",
      toolbar: { show: false },
      background: "transparent",
    },
    plotOptions: {
      bar: {
        columnWidth: "45%",
        borderRadius: 5,
        borderRadiusApplication: "end",
        distributed: true,
      }
    },
    // 4th bar is orange in the reference design, not red.
    colors: ["#FEAC49", "#E25EBD", "#C758E7", "#FF9142"],
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false
    },
    xaxis: {
      categories: ["Truevalue for buyers", "Message 2", "Message 3", "Message 4"],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        rotate: 0,
        rotateAlways: false,
        hideOverlappingLabels: true,
        trim: true,
        style: {
          colors: "#6B7280",
          fontSize: "11px",
          fontWeight: 500,
          fontFamily: "Inter, sans-serif"
        }
      }
    },
    yaxis: {
      min: 0,
      max: 80,
      tickAmount: 4,
      title: {
        text: "Percentage (%)",
        style: {
          color: "#6B7280",
          fontSize: "12px",
          fontWeight: 500,
          fontFamily: "Inter, sans-serif"
        }
      },
      labels: {
        style: {
          colors: "#6B7280",
          fontSize: "12px",
          fontFamily: "Inter, sans-serif"
        },
        formatter: (val) => val.toFixed(1)
      }
    },
    grid: {
      borderColor: "#F1F5F9",
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: (val) => `${val.toFixed(1)}%`
      }
    }
  });

  return (
    <Card sx={{ p: 4, width: "100%", height: "100%", borderRadius: "14px", border: "1px solid #E5E7EB", boxShadow: "none" }}>
      <Typography sx={{ fontSize: "16px", fontWeight: 700, color: "#111827", mb: 4 }}>
        Leads By Tag
      </Typography>
      <ReactApexChart
        type="bar"
        series={chartSeries}
        options={chartOptions}
        height={260}
      />
    </Card>
  );
}

export default function Row1Graphs({ totalLeads, newLeads, inProgress, converted }) {
  const [donutTab, setDonutTab] = useState("source");

  return (
    <>
      {/* Replicated KPI Cards layout and styling */}
      <Box
        sx={{
          display: "grid",
          gap: "20px",
          gridTemplateColumns: {
            xs: "repeat(1, 1fr)",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          mb: 3,
        }}
      >
        {[
          { title: "Total Leads", value: totalLeads, icon: "eva:paper-plane-fill", iconColor: "#0088FF", bgColor: "#F0F6FF", borderColor: "#CFE3FF" },
          { title: "New Leads", value: newLeads, icon: "eva:checkmark-circle-2-fill", iconColor: "#F97316", bgColor: "#FFF7ED", borderColor: "#FFEDD5" },
          { title: "In Progress", value: inProgress, icon: "eva:file-text-fill", iconColor: "#CA8A04", bgColor: "#FEF9C3", borderColor: "#FEF08A" },
          { title: "Converted", value: converted, icon: "eva:eye-fill", iconColor: "#D94683", bgColor: "#FCE7F3", borderColor: "#FBCFE8" }
        ].map((kpi, index) => (
          <Card
            key={index}
            sx={{
              width: "100%",
              height: 89,
              p: 2,
              borderRadius: 2,
              border: "1px solid #F3F4F6",
              display: "flex",
              alignItems: "center",
              gap: 2,
              boxShadow: "none",
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
                backgroundColor: kpi.bgColor,
                border: `0.5px solid ${kpi.borderColor}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Iconify
                icon={kpi.icon}
                width={24}
                height={24}
                sx={{ color: kpi.iconColor }}
              />
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: 400,
                  color: "#6B7280",
                  mb: 0.5,
                  lineHeight: 1,
                }}
              >
                {kpi.title}
              </Typography>
              <Typography
                sx={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#131313",
                  lineHeight: 1,
                }}
              >
                {kpi.value.toLocaleString()}
              </Typography>
            </Box>
          </Card>
        ))}
      </Box>

      {/* Leads By Tag and Donut Charts Grid.
          Using an explicit CSS grid (same approach as the KPI row above)
          instead of MUI's <Grid> so the two cards reliably stretch to
          fill the full row width instead of shrinking to content size. */}
      <Box
        sx={{
          display: "grid",
          gap: "20px",
          width: "100%",
          gridTemplateColumns: {
            xs: "1fr",
            md: "1fr 1fr",
          },
          mb: 4,
        }}
      >
        <LeadsByTagChart />
        <LeadsDonutChart activeTab={donutTab} setActiveTab={setDonutTab} />
      </Box>
    </>
  );
}