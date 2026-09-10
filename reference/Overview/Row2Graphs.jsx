import React from "react";
import {
  Card,
  Stack,
  Typography,
  Button,
  Box,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ReactApexChart from "react-apexcharts";
import Iconify from "src/components/Iconify";
import { useChart } from "src/components/chart";

export default function Row2Graphs({ apiFrp, apiByStatusAndDate }) {
  const theme = useTheme();

  // X-axis categories
  const dateCategories = ["28 Jul", "29 Jul", "30 Jul", "31 Jul", "01 Aug", "02 Aug", "03 Aug", "04 Aug", "05 Aug", "06 Aug"];

  // --- 3. First Response Time (Glowing Orange Area Line Chart) ---
  const frpChartSeries = [{
    name: "Average FRP",
    data: apiFrp?.series || [1520, 1480, 1390, 1950, 1420, 1240, 1780, 1690, 2410, 2600, 2900, 2450].slice(0, 10),
  }];

  const frpChartOptions = useChart({
    chart: {
      type: "area",
      toolbar: { show: false },
      zoom: { enabled: false },
      background: "transparent",
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      width: 3,
      colors: ["#FFA100"],
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.001,
        colorStops: [
          {
            offset: 0,
            color: "#FFA100",
            opacity: 0.2,
          },
          {
            offset: 100,
            color: "#FFFFFF",
            opacity: 0.0001,
          },
        ],
      },
    },
    xaxis: {
      categories: apiFrp?.labels || dateCategories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: theme.palette.text.secondary, fontSize: "11px", fontWeight: 500, fontFamily: "Inter, sans-serif" } },
    },
    yaxis: {
      min: 500,
      max: 3000,
      tickAmount: 5,
      title: {
        text: "Average FRP",
        style: { color: theme.palette.text.secondary, fontSize: "11px", fontWeight: 500, fontFamily: "Inter, sans-serif" }
      },
      labels: { style: { colors: theme.palette.text.secondary, fontSize: "11px", fontFamily: "Inter, sans-serif" } },
    },
    grid: {
      borderColor: "#F1F5F9",
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    tooltip: { enabled: true },
  });

  // --- 4. Lead Overview (Stacked Column Bar Chart) ---
  const leadOverviewSeries = apiByStatusAndDate?.series || [
    { name: "Manual", data: [22.8, 6.4, 6.5, 6.6, 6.7, 19.8] },
    { name: "Signups", data: [5.7, 24.8, 38.6, 24.4, 13.6, 23.6] },
    { name: "Just Dial", data: [28.7, 11.9, 3.2, 14.3, 28.9, 12.4] },
    { name: "Chatapp", data: [0.0, 0.0, 2.1, 0.0, 0.0, 2.3] }
  ];

  const leadOverviewChartOptions = useChart({
    chart: { type: "bar", stacked: true, toolbar: { show: false }, background: "transparent" },
    plotOptions: {
      bar: {
        columnWidth: "15%",
        borderRadius: 4,
        borderRadiusApplication: "end",
      },
    },
    colors: ["#9008BC", "#D94683", "#FFB547", "#F97316"],
    xaxis: {
      categories: apiByStatusAndDate?.labels || ["Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026", "Jul 2026"],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: theme.palette.text.secondary, fontSize: "11px", fontWeight: 500, fontFamily: "Inter, sans-serif" } },
    },
    yaxis: {
      min: 0,
      max: 80,
      tickAmount: 4,
      title: {
        text: "Percentage (%)",
        style: { color: theme.palette.text.secondary, fontSize: "11px", fontWeight: 500, fontFamily: "Inter, sans-serif" }
      },
      labels: {
        style: { colors: theme.palette.text.secondary, fontSize: "11px", fontFamily: "Inter, sans-serif" },
        formatter: (val) => val.toFixed(1)
      }
    },
    grid: {
      borderColor: "#F1F5F9",
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    tooltip: { enabled: true },
  });

  const leadOverviewLegend = [
    { name: "Just Dial", color: "#FFB547" },
    { name: "Signups", color: "#D94683" },
    { name: "Manual", color: "#9008BC" },
    { name: "Chatapp", color: "#F97316" }
  ];

  // --- 5. Total Lead (Glowing Purple Area Line Chart) ---
  const totalLeadChartSeries = [{
    name: "Average FRP",
    data: apiFrp?.series || [1520, 1480, 1390, 1950, 1420, 1240, 1780, 1690, 2410, 2600, 2900, 2450].slice(0, 10),
  }];

  const totalLeadChartOptions = useChart({
    chart: {
      type: "area",
      toolbar: { show: false },
      zoom: { enabled: false },
      background: "transparent",
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      width: 3,
      colors: ["#9008BC"],
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.001,
        colorStops: [
          {
            offset: 0,
            color: "#9008BC",
            opacity: 0.2,
          },
          {
            offset: 100,
            color: "#FFFFFF",
            opacity: 0.0001,
          },
        ],
      },
    },
    xaxis: {
      categories: apiFrp?.labels || dateCategories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: theme.palette.text.secondary, fontSize: "11px", fontWeight: 500, fontFamily: "Inter, sans-serif" } },
    },
    yaxis: {
      min: 500,
      max: 3000,
      tickAmount: 5,
      title: {
        text: "Average FRP",
        style: { color: theme.palette.text.secondary, fontSize: "11px", fontWeight: 500, fontFamily: "Inter, sans-serif" }
      },
      labels: { style: { colors: theme.palette.text.secondary, fontSize: "11px", fontFamily: "Inter, sans-serif" } },
    },
    grid: {
      borderColor: "#F1F5F9",
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    tooltip: { enabled: true },
  });

  return (
    <>
      {/* Second Row Chart: First Response Time */}
      <Card sx={{ p: 4, borderRadius: "8px", border: "1px solid #E5E7EB", boxShadow: "none", mb: 4 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
            First Response Time
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Iconify icon="eva:download-outline" width={14} height={14} />}
            sx={{
              borderColor: "#E5E7EB",
              color: "#4B5563",
              borderRadius: "8px",
              textTransform: "none",
              fontSize: "12px",
              fontWeight: 600,
              px: 2,
              py: 0.5,
              bgcolor: "white",
              "&:hover": { borderColor: "#D1D5DB", bgcolor: "#F9FAFB" },
            }}
          >
            Export
          </Button>
        </Stack>
        <ReactApexChart
          type="area"
          series={frpChartSeries}
          options={frpChartOptions}
          height={260}
        />
      </Card>

      {/* Third Row Chart: Lead Overview (Stacked bar) */}
      <Card sx={{ p: 4, borderRadius: "8px", border: "1px solid #E5E7EB", boxShadow: "none", mb: 4 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
            Lead Overview
          </Typography>
          {/* Custom Legend for stacked columns */}
          <Stack direction="row" spacing={3}>
            {leadOverviewLegend.map((item, i) => (
              <Stack key={i} direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: item.color,
                  }}
                />
                <Typography sx={{ fontSize: "11px", color: "#4B5563", fontWeight: 500 }}>
                  {item.name}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
        <ReactApexChart
          type="bar"
          series={leadOverviewSeries}
          options={leadOverviewChartOptions}
          height={260}
        />
      </Card>

      {/* Fourth Row Chart: Total Lead (Purple area curve) */}
      <Card sx={{ p: 4, borderRadius: "8px", border: "1px solid #E5E7EB", boxShadow: "none" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>
            Total Lead
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Iconify icon="eva:download-outline" width={14} height={14} />}
            sx={{
              borderColor: "#E5E7EB",
              color: "#4B5563",
              borderRadius: "8px",
              textTransform: "none",
              fontSize: "12px",
              fontWeight: 600,
              px: 2,
              py: 0.5,
              bgcolor: "white",
              "&:hover": { borderColor: "#D1D5DB", bgcolor: "#F9FAFB" },
            }}
          >
            Export
          </Button>
        </Stack>
        <ReactApexChart
          type="area"
          series={totalLeadChartSeries}
          options={totalLeadChartOptions}
          height={260}
        />
      </Card>
    </>
  );
}
