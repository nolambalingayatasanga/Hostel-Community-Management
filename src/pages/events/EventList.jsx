import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import {
  Box,
  Button,
  Card,
  Container,
  IconButton,
  Stack,
  Typography,
  Paper,
  Skeleton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
  Dialog,
  Divider,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
} from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  AddRounded as AddRoundedIcon,
  Close as CloseIcon,
  PhotoCamera as CameraIcon,
  FilterList as FilterListIcon,
  LocationOn as LocationIcon,
  Search as SearchIcon,
  OpenInNew as OpenInNewIcon,
  Check as CheckIcon,
  Palette as PaletteIcon,
} from "@mui/icons-material";

import { useAuth } from "../../context/AuthContext";
import API from "../../api";
import { LocalizationProvider, DatePicker, TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useSnackbar } from "notistack";

dayjs.extend(isoWeek);

const WEEK_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const EVENT_COLORS = [
  { label: "Ocean Blue", value: "#0088ff" },
  { label: "Royal Purple", value: "#7c3aed" },
  { label: "Emerald Green", value: "#059669" },
  { label: "Vibrant Orange", value: "#ea580c" },
  { label: "Crimson Red", value: "#dc2626" },
  { label: "Amber Gold", value: "#d97706" },
  { label: "Sky Cyan", value: "#0284c7" },
  { label: "Hot Pink", value: "#db2777" },
  { label: "Deep Indigo", value: "#4f46e5" },
  { label: "Slate Gray", value: "#475569" },
];

// ─── Toolbar ─────────────────────────────────────────────────────────────────
function CalendarToolbar({ view, onViewChange, currentDate, onPrev, onNext, onToday }) {
  const weekStart = currentDate.startOf("week").add(1, "day");
  const weekEnd = weekStart.add(6, "day");
  const label =
    view === "week"
      ? `${weekStart.format("D MMM")} – ${weekEnd.format("D MMM YYYY")}`
      : view === "day"
        ? currentDate.format("dddd, D MMM YYYY")
        : currentDate.format("MMMM YYYY");

  return (
    <Stack
      direction="row"
      sx={{
        width: "100%",
        justifyContent: "space-between",
        alignItems: "center",
        px: 3,
        py: 1.5,
        borderBottom: "1px solid #F1F5F9",
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      {/* View switcher */}
      <ToggleButtonGroup
        value={view}
        exclusive
        onChange={(_, v) => v && onViewChange(v)}
        size="small"
        sx={{
          bgcolor: "#F4F4F5",
          p: 0.25,
          borderRadius: "8px",
          "& .MuiToggleButton-root": {
            border: "none",
            borderRadius: "6px !important",
            textTransform: "none",
            px: 2,
            py: 0.5,
            fontSize: "13px",
            fontWeight: 600,
            color: "#475467",
            "&:hover": { bgcolor: "#E4E4E7" },
            "&.Mui-selected": {
              bgcolor: "#0088ff",
              color: "#fff",
              boxShadow: "none",
              "&:hover": { bgcolor: "#0088ff" },
            },
          },
        }}
      >
        <ToggleButton value="month">Month</ToggleButton>
        <ToggleButton value="week">Week</ToggleButton>
        <ToggleButton value="day">Day</ToggleButton>
      </ToggleButtonGroup>

      {/* Navigation */}
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <IconButton
          size="small"
          onClick={onPrev}
          sx={{ color: "#475467", "&:hover": { bgcolor: "#F1F5F9" } }}
        >
          <ChevronLeftIcon fontSize="small" />
        </IconButton>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, color: "#111827", minWidth: 170, textAlign: "center" }}
        >
          {label}
        </Typography>
        <IconButton
          size="small"
          onClick={onNext}
          sx={{ color: "#475467", "&:hover": { bgcolor: "#F1F5F9" } }}
        >
          <ChevronRightIcon fontSize="small" />
        </IconButton>
      </Stack>

      {/* Actions (Today & Filter) */}
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Button
          variant="outlined"
          onClick={onToday}
          sx={{
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "13px",
            borderColor: "#D0D5DD",
            color: "#344054",
            bgcolor: "#fff",
            "&:hover": { bgcolor: "#F9FAFB", borderColor: "#D0D5DD" },
          }}
        >
          Today
        </Button>
      </Stack>
    </Stack>
  );
}

// ─── Event pill (like in the screenshot) ─────────────────────────────────────
function EventPill({ event, onClick }) {
  const color = event.color || "#0088ff";

  return (
    <Tooltip title={event.title} placement="top" arrow>
      <Box
        onClick={(e) => { e.stopPropagation(); onClick(event); }}
        sx={{
          display: "flex",
          alignItems: "center",
          bgcolor: `${color}10`,
          border: `1px solid ${color}20`,
          borderRadius: "6px",
          px: 1,
          py: 0.5,
          cursor: "pointer",
          transition: "all 0.12s ease",
          "&:hover": { bgcolor: `${color}18`, transform: "translateY(-1px)" },
          overflow: "hidden",
        }}
      >
        <Typography
          sx={{
            fontSize: "11px",
            fontWeight: 600,
            color,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            flex: 1,
            minWidth: 0,
          }}
        >
          {event.title}
        </Typography>
      </Box>
    </Tooltip>
  );
}

// ─── Overflow pill list ───────────────────────────────────────────────────────
function PillList({ events, onNavigate }) {
  const [showAll, setShowAll] = useState(false);
  const max = 2;
  const visible = showAll ? events : events.slice(0, max);
  const hidden = events.length - max;

  return (
    <Stack spacing={0.4} sx={{ mt: 0.5 }}>
      {visible.map((ev) => (
        <EventPill key={ev._id} event={ev} onClick={onNavigate} />
      ))}
      {!showAll && hidden > 0 && (
        <Typography
          onClick={(e) => { e.stopPropagation(); setShowAll(true); }}
          sx={{
            fontSize: "11px",
            fontWeight: 600,
            color: "#0088ff",
            cursor: "pointer",
            pl: 0.5,
            "&:hover": { textDecoration: "underline" },
          }}
        >
          +{hidden} more
        </Typography>
      )}
    </Stack>
  );
}

// ─── Day Cell ─────────────────────────────────────────────────────────────────
function DayCell({
  dateStr,
  events,
  onOpenCreate,
  onNavigate,
  isLoading,
  canCreate,
  isCurrentMonth,
  isTodayActive,
  onMouseEnter,
}) {
  const isToday = dayjs().format("YYYY-MM-DD") === dateStr;

  return (
    <Paper
      variant="outlined"
      onClick={() => canCreate && onOpenCreate(dateStr)}
      onMouseEnter={onMouseEnter}
      sx={{
        height: 130, // uniform grid height
        p: "10px 12px",
        borderRadius: "12px",
        borderColor: isTodayActive ? "#0088ff" : "#EAECF0",
        bgcolor: isTodayActive ? "#F0F7FF" : "#ffffff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        cursor: canCreate ? "pointer" : "default",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        "&:hover": {
          bgcolor: isToday ? "#E6F0FA" : "rgba(0, 136, 255, 0.015)",
          borderColor: isToday ? "#0077ee" : "#0088ff",
          boxShadow: "0 4px 12px rgba(0, 136, 255, 0.05)",
          "& .add-btn": { opacity: 1 }
        },
        position: "relative",
      }}
    >
      {isLoading ? (
        <Skeleton variant="rounded" height={100} sx={{ borderRadius: "6px" }} />
      ) : (<>
        <Box sx={{ mb: 1, flexShrink: 0, display: "flex", alignItems: "center" }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              fontSize: 14,
              color: isTodayActive
                ? "#0088ff"
                : isCurrentMonth
                  ? "#1E293B"
                  : "#94A3B8",
              lineHeight: 1,
            }}
          >
            {dayjs(dateStr).date()}
          </Typography>

          {canCreate && (
            <Box
              className="add-btn"
              sx={{
                opacity: isTodayActive ? 1 : 0,
                transition: "opacity 0.15s, transform 0.15s",
                cursor: "pointer",
                width: 22,
                height: 22,
                borderRadius: "6px",
                bgcolor: "#0088ff",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "absolute",
                top: 10,
                right: 12,
                zIndex: 2,
                "&:hover": {
                  bgcolor: "#0077ee",
                  transform: "scale(1.05)"
                },
                "&:active": {
                  transform: "scale(0.95)"
                }
              }}
              onClick={(e) => { e.stopPropagation(); onOpenCreate(dateStr); }}
            >
              <AddRoundedIcon sx={{ fontSize: 14 }} />
            </Box>
          )}
        </Box>

        {/* Scrollable pill area */}
        <Box sx={{ flex: 1, overflowY: "auto", "&::-webkit-scrollbar": { width: 2 } }}>
          <PillList events={events} onNavigate={onNavigate} />
        </Box>
      </>
      )}
    </Paper>
  );
}


// ─── Month view ───────────────────────────────────────────────────────────────
function MonthView({ events, currentDate, onOpenCreate, onNavigate, isLoading, canCreate }) {
  const [hoveredDate, setHoveredDate] = useState(null);
  const today = dayjs().format("YYYY-MM-DD");

  const startOfMonth = currentDate.startOf("month");
  const endOfMonth = currentDate.endOf("month");
  const startDate =
    startOfMonth.day() === 0 ? startOfMonth.subtract(6, "day") : startOfMonth.startOf("week").add(1, "day");
  const endDate =
    endOfMonth.day() === 0 ? endOfMonth : endOfMonth.endOf("week").add(1, "day");

  const days = [];
  let d = startDate;
  while (d.isBefore(endDate) || d.isSame(endDate, "day")) {
    days.push(d);
    d = d.add(1, "day");
  }

  return (
    <Box sx={{ bgcolor: "#F8FAFC", pb: "16px" }}>
      {/* Column labels */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "12px",
          px: "12px",
          pt: "12px",
        }}
      >
        {WEEK_LABELS.map((l) => (
          <Paper
            key={l}
            variant="outlined"
            sx={{
              py: 1.25,
              textAlign: "center",
              borderRadius: "12px",
              borderColor: "#EAECF0",
              bgcolor: "#fff",
              boxShadow: "none"
            }}
          >
            <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#1E293B" }}>{l}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Date cells */}
      <Box
        onMouseLeave={() => setHoveredDate(null)}
        sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "12px", px: "12px", pt: "12px" }}
      >
        {days.map((date) => {
          const ds = date.format("YYYY-MM-DD");
          const isToday = ds === today;
          const isTodayActive = isToday && (!hoveredDate || hoveredDate === today);
          const dayEvents = events.filter(
            (ev) => ev.eventDate && dayjs(ev.eventDate).format("YYYY-MM-DD") === ds
          );
          return (
            <DayCell
              key={ds}
              dateStr={ds}
              events={dayEvents}
              onOpenCreate={onOpenCreate}
              onNavigate={onNavigate}
              isLoading={isLoading}
              canCreate={canCreate}
              isCurrentMonth={date.month() === currentDate.month()}
              isTodayActive={isTodayActive}
              onMouseEnter={() => setHoveredDate(ds)}
            />
          );
        })}
      </Box>
    </Box>
  );
}

// ─── Week view ────────────────────────────────────────────────────────────────
function WeekView({ events, currentDate, onOpenCreate, onNavigate, isLoading, canCreate }) {
  const weekStart = currentDate.startOf("week").add(1, "day");
  const days = Array.from({ length: 7 }, (_, i) => weekStart.add(i, "day"));
  const todayStr = dayjs().format("YYYY-MM-DD");

  return (
    <Box sx={{ bgcolor: "#F8FAFC", pb: "16px" }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "12px",
          px: "12px",
          pt: "12px",
        }}
      >
        {days.map((date) => {
          const isToday = date.format("YYYY-MM-DD") === todayStr;
          return (
            <Paper
              key={date.toString()}
              variant="outlined"
              sx={{
                py: 1.5,
                textAlign: "center",
                borderRadius: "12px",
                borderColor: "#EAECF0",
                bgcolor: "#fff",
                boxShadow: "none"
              }}
            >
              <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#6B7280", display: "block" }}>
                {date.format("dddd")}
              </Typography>
              <Box
                sx={{
                  width: 30, height: 30, borderRadius: "50%",
                  bgcolor: isToday ? "#0088ff" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  mx: "auto", mt: 0.5,
                }}
              >
                <Typography sx={{ fontWeight: isToday ? 700 : 500, color: isToday ? "#fff" : "#374151", fontSize: 14 }}>
                  {date.date()}
                </Typography>
              </Box>
            </Paper>
          );
        })}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "12px", px: "12px", pt: "12px" }}>
        {days.map((date) => {
          const ds = date.format("YYYY-MM-DD");
          const dayEvents = events.filter(
            (ev) => ev.eventDate && dayjs(ev.eventDate).format("YYYY-MM-DD") === ds
          );
          return (
            <DayCell
              key={ds}
              dateStr={ds}
              events={dayEvents}
              onOpenCreate={onOpenCreate}
              onNavigate={onNavigate}
              isLoading={isLoading}
              canCreate={canCreate}
              isCurrentMonth
            />
          );
        })}
      </Box>
    </Box>
  );
}

// ─── Day view ─────────────────────────────────────────────────────────────────
function DayView({ currentDate, events, onOpenCreate, onNavigate, isLoading, canCreate }) {
  const dateStr = currentDate.format("YYYY-MM-DD");
  const dayEvents = events.filter(
    (ev) => ev.eventDate && dayjs(ev.eventDate).format("YYYY-MM-DD") === dateStr
  );

  const hours = Array.from({ length: 24 }, (_, h) => ({
    value: h,
    label: `${h % 12 === 0 ? 12 : h % 12}${h >= 12 ? "pm" : "am"}`,
  }));

  const byHour = useMemo(() => {
    const map = {};
    for (let h = 0; h < 24; h++) map[h] = [];
    dayEvents.forEach((ev) => {
      if (ev.startTime) {
        const [hStr] = ev.startTime.split(":");
        const h = parseInt(hStr, 10);
        if (map[h]) map[h].push(ev);
      } else {
        map[0].push(ev);
      }
    });
    return map;
  }, [dayEvents]);

  if (isLoading)
    return (
      <Box>
        <Box sx={{ py: 1.5, px: 3, borderBottom: "1px solid #F1F5F9", bgcolor: "#FAFAFA", display: "flex", justifyContent: "center" }}>
          <Skeleton variant="text" width={220} height={28} />
        </Box>
        <Box sx={{ maxHeight: 600, overflowY: "auto" }}>
          {Array.from({ length: 14 }).map((_, i) => (
            <Box
              key={i}
              sx={{ display: "grid", gridTemplateColumns: "72px 1fr", borderBottom: "1px solid #F5F5F5" }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", pr: 2, py: 1.5, borderRight: "1px solid #F5F5F5" }}>
                <Skeleton variant="text" width={40} height={18} />
              </Box>

            </Box>
          ))}
        </Box>
      </Box>
    );

  return (
    <Box>
      <Box sx={{ py: 1.5, textAlign: "center", borderBottom: "1px solid #F1F5F9", bgcolor: "#FAFAFA" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#111827" }}>
          {currentDate.format("dddd, D MMMM YYYY")}
        </Typography>
      </Box>
      <Box sx={{ maxHeight: 600, overflowY: "auto" }}>
        {hours.map((h) => (
          <Box
            key={h.value}
            sx={{ display: "grid", gridTemplateColumns: "72px 1fr", borderBottom: "1px solid #F5F5F5" }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", pr: 2, py: 1.5, borderRight: "1px solid #F5F5F5" }}>
              <Typography sx={{ fontSize: "12px", color: "#9CA3AF", fontWeight: 500 }}>{h.label}</Typography>
            </Box>
            <Box
              onClick={() => canCreate && onOpenCreate(dateStr)}
              sx={{ p: 1, minHeight: 48, display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center", cursor: canCreate ? "pointer" : "default" }}
            >
              {(byHour[h.value] || []).map((ev) => (
                <Box key={ev._id} sx={{ minWidth: 140 }}>
                  <EventPill event={ev} onClick={onNavigate} />
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ─── Create/Edit Dialog ───────────────────────────────────────────────────────
function EventFormDialog({ open, onClose, onSubmit, isEdit, defaultDate, initialData, submitting, formError }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [locationCoordinates, setLocationCoordinates] = useState(null);
  const [color, setColor] = useState("#0088ff");

  // Location search suggestions state
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setTitle(initialData.title || "");
        setDescription(initialData.description || "");
        setEventDate(initialData.eventDate ? initialData.eventDate.substring(0, 10) : defaultDate || "");
        setStartTime(initialData.startTime || "");
        setEndTime(initialData.endTime || "");
        setLocation(initialData.location || "");
        setLocationQuery(initialData.location || "");
        setLocationUrl(initialData.locationUrl || "");
        setLocationCoordinates(initialData.locationCoordinates || null);
        setColor(initialData.color || "#0088ff");
      } else {
        setTitle("");
        setDescription("");
        setEventDate(defaultDate || "");
        setStartTime("");
        setEndTime("");
        setLocation("");
        setLocationQuery("");
        setLocationUrl("");
        setLocationCoordinates(null);
        setColor("#0088ff");
      }
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
    }
  }, [open, initialData, defaultDate]);

  // Debounced search using OpenStreetMap Nominatim for exact place resolution
  useEffect(() => {
    if (!locationQuery || locationQuery.trim().length < 3) {
      setLocationSuggestions([]);
      setIsSearchingLocation(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationQuery)}&limit=5&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          setLocationSuggestions(data);
          setShowLocationSuggestions(true);
        }
      } catch (err) {
        console.error("Location search error:", err);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [locationQuery]);

  const handleSelectPlace = (place) => {
    const displayName = place.display_name;
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    setLocation(displayName);
    setLocationQuery(displayName);
    setLocationCoordinates({ lat, lng: lon });
    setLocationUrl(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`);
    setShowLocationSuggestions(false);
  };

  const handleManualLocationChange = (e) => {
    const val = e.target.value;
    setLocation(val);
    setLocationQuery(val);
    setShowLocationSuggestions(true);
    setLocationUrl(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(val)}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      eventDate,
      startTime,
      endTime,
      location,
      locationUrl: locationUrl || (location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}` : ""),
      locationCoordinates,
      color,
    });
  };

  const currentMapLink = locationUrl || (location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}` : "");
  const embedMapUrl = locationCoordinates?.lat && locationCoordinates?.lng
    ? `https://maps.google.com/maps?q=${locationCoordinates.lat},${locationCoordinates.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    : location && location.trim().length > 2
    ? `https://maps.google.com/maps?q=${encodeURIComponent(location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    : "";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "24px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
          overflow: "hidden"
        }
      }}
    >
      {/* <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #EAECF0", py: 2.5, px: 3.5, bgcolor: "#F8FAFC" }}>
        <Typography variant="h6" sx={{ fontWeight: 800, fontSize: 17, color: "#1E293B", letterSpacing: "-0.02em" }}>
          {isEdit ? "Edit Event Details" : "Schedule Community Event"}
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: "#94A3B8", bgcolor: "#FFF", border: "1px solid #E2E8F0", "&:hover": { bgcolor: "#F1F5F9", color: "#1E293B" } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle> */}

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ px: 3.5, py: 3, backgroundColor: "#FFF" }}>
          {formError && <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }}>{formError}</Alert>}

          <Stack spacing={3}>
            {/* Section 1: General Info */}
            <Box>
              <Typography variant="caption" sx={{ color: "#0088ff", fontWeight: 800, textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.05em", display: "block", mb: 1.5 }}>
                General Information
              </Typography>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Event Title *"
                  required
                  placeholder="e.g. Annual Alumni Meet 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", backgroundColor: "#F8FAFC", "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#0088ff30" } } }}
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Description *"
                  multiline
                  rows={3}
                  required
                  placeholder="Provide an engaging description of what will happen at this event..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", backgroundColor: "#F8FAFC", "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#0088ff30" } } }}
                />

                {/* Color Selector */}
                <Box sx={{ pt: 0.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: "#475569", fontWeight: 700, fontSize: "12px" }}>
                      Event Theme Color *
                    </Typography>
                    {/* Live Calendar Pill Preview */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: "11px", fontWeight: 600 }}>
                        Calendar Preview:
                      </Typography>
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          bgcolor: `${color}14`,
                          border: `1px solid ${color}35`,
                          borderRadius: "6px",
                          px: 1,
                          py: 0.25,
                        }}
                      >
                        <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: color, mr: 0.75 }} />
                        <Typography sx={{ fontSize: "11px", fontWeight: 700, color, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {title ? title : "Event Title"}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap", gap: 1 }}>
                    {EVENT_COLORS.map((c) => {
                      const isSelected = color.toLowerCase() === c.value.toLowerCase();
                      return (
                        <Tooltip key={c.value} title={c.label} arrow placement="top">
                          <Box
                            onClick={() => setColor(c.value)}
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              bgcolor: c.value,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              border: isSelected ? "3px solid #FFF" : "2px solid transparent",
                              outline: isSelected ? `2.5px solid ${c.value}` : "none",
                              boxShadow: isSelected ? `0 2px 8px ${c.value}60` : "none",
                              "&:hover": {
                                transform: "scale(1.15)",
                              },
                            }}
                          >
                            {isSelected && <CheckIcon sx={{ color: "#FFF", fontSize: 16, strokeWidth: 2 }} />}
                          </Box>
                        </Tooltip>
                      );
                    })}

                    {/* Custom Color Input */}
                    <Tooltip title="Choose Custom Hex Color" arrow placement="top">
                      <Box
                        component="label"
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          border: "1.5px dashed #94A3B8",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          position: "relative",
                          overflow: "hidden",
                          transition: "all 0.15s ease",
                          "&:hover": {
                            borderColor: "#0088ff",
                            transform: "scale(1.15)",
                          },
                        }}
                      >
                        <PaletteIcon sx={{ fontSize: 16, color: "#64748B" }} />
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          style={{
                            position: "absolute",
                            opacity: 0,
                            width: "100%",
                            height: "100%",
                            cursor: "pointer",
                          }}
                        />
                      </Box>
                    </Tooltip>
                  </Stack>
                </Box>
              </Stack>
            </Box>

            <Divider />

            {/* Section 2: Scheduling */}
            <Box>
              <Typography variant="caption" sx={{ color: "#0088ff", fontWeight: 800, textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.05em", display: "block", mb: 1.5 }}>
                Date & Time
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <DatePicker
                      label="Event Date *"
                      value={eventDate ? dayjs(eventDate) : null}
                      onChange={(newValue) => setEventDate(newValue ? newValue.format("YYYY-MM-DD") : "")}
                      renderInput={(params) => <TextField {...params} fullWidth size="small" required sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", backgroundColor: "#F8FAFC" } }} />}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TimePicker
                      label="Start *"
                      value={startTime ? dayjs(`2000-01-01T${startTime}`) : null}
                      onChange={(newValue) => setStartTime(newValue ? newValue.format("HH:mm") : "")}
                      renderInput={(params) => <TextField {...params} fullWidth size="small" required sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", backgroundColor: "#F8FAFC" } }} />}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TimePicker
                      label="End *"
                      value={endTime ? dayjs(`2000-01-01T${endTime}`) : null}
                      onChange={(newValue) => setEndTime(newValue ? newValue.format("HH:mm") : "")}
                      renderInput={(params) => <TextField {...params} fullWidth size="small" required sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", backgroundColor: "#F8FAFC" } }} />}
                    />
                  </Grid>
                </Grid>
              </LocalizationProvider>
            </Box>

            <Divider />

            {/* Section 3: Location & Map Search */}
            <Box>
              <Typography variant="caption" sx={{ color: "#0088ff", fontWeight: 800, textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.05em", display: "block", mb: 1.5 }}>
                Location & Map
              </Typography>
              <Box sx={{ position: "relative" }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search & Select Exact Location *"
                  placeholder="e.g. Auditorium, Hostel Campus, Bangalore"
                  required
                  value={location}
                  onChange={handleManualLocationChange}
                  onFocus={() => locationSuggestions.length > 0 && setShowLocationSuggestions(true)}
                  InputProps={{
                    startAdornment: <LocationIcon sx={{ color: "#0088ff", mr: 1, fontSize: 20 }} />,
                    endAdornment: isSearchingLocation ? (
                      <CircularProgress size={16} sx={{ color: "#0088ff" }} />
                    ) : (
                      <SearchIcon sx={{ color: "#94A3B8", fontSize: 20 }} />
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px",
                      backgroundColor: "#F8FAFC",
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#0088ff30" },
                    },
                  }}
                />

                {/* Autocomplete suggestions dropdown */}
                {showLocationSuggestions && locationSuggestions.length > 0 && (
                  <Paper
                    elevation={4}
                    sx={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      left: 0,
                      right: 0,
                      zIndex: 20,
                      borderRadius: "12px",
                      maxHeight: "220px",
                      overflowY: "auto",
                      border: "1px solid #E2E8F0",
                      bgcolor: "#FFF",
                    }}
                  >
                    {locationSuggestions.map((place, idx) => (
                      <Box
                        key={idx}
                        onClick={() => handleSelectPlace(place)}
                        sx={{
                          p: 1.5,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 1.25,
                          borderBottom: idx < locationSuggestions.length - 1 ? "1px solid #F1F5F9" : "none",
                          "&:hover": { bgcolor: "#F0F7FF" },
                        }}
                      >
                        <LocationIcon sx={{ color: "#0088ff", fontSize: 18, mt: 0.25, flexShrink: 0 }} />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "#1E293B", fontSize: "13px" }}>
                            {place.display_name.split(",")[0]}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#64748B", fontSize: "11.5px", display: "block", wordBreak: "break-word" }}>
                            {place.display_name}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Paper>
                )}
              </Box>

              {/* Live Embedded Map Preview */}
              {embedMapUrl && (
                <Box sx={{ mt: 2, borderRadius: "14px", overflow: "hidden", border: "1px solid #E2E8F0", bgcolor: "#F8FAFC" }}>
                  <iframe
                    title="Event Location Pin"
                    width="100%"
                    height="170"
                    style={{ border: 0, display: "block" }}
                    loading="lazy"
                    src={embedMapUrl}
                  />
                  <Box sx={{ px: 2, py: 1.25, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#F8FAFC", borderTop: "1px solid #EAECF0" }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#10B981" }} />
                      <Typography variant="caption" sx={{ color: "#475569", fontWeight: 700, fontSize: "11.5px" }}>
                        Location Pin Mapped
                      </Typography>
                    </Stack>
                    {currentMapLink && (
                      <Button
                        size="small"
                        component="a"
                        href={currentMapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        endIcon={<OpenInNewIcon sx={{ fontSize: "14px !important" }} />}
                        sx={{
                          fontSize: "11.5px",
                          fontWeight: 700,
                          color: "#0088ff",
                          textTransform: "none",
                          p: 0,
                          minWidth: 0,
                          "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                        }}
                      >
                        Open in Google Maps
                      </Button>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3.5, pb: 3, pt: 2, borderTop: "1px solid #EAECF0", bgcolor: "#F8FAFC" }}>
          <Button variant="outlined" onClick={onClose} sx={{ borderRadius: "10px", textTransform: "none", borderColor: "#D0D5DD", color: "#475569", px: 2.5, fontWeight: 600 }}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            sx={{
              bgcolor: color || "#0088ff",
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              boxShadow: "none",
              px: 3,
              "&:hover": { bgcolor: color || "#0077EE", filter: "brightness(0.92)", boxShadow: "none" }
            }}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : isEdit ? "Save Changes" : "Schedule Event"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EventList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const canManage = ["ADMIN", "CHAIRPERSON"].includes(user?.role);

  const [view, setView] = useState("month");
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [defaultDate, setDefaultDate] = useState("");
  const [editData, setEditData] = useState(null);
  const [editId, setEditId] = useState(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Date range for the current calendar viewport
  const { dateFrom, dateTo } = useMemo(() => {
    if (view === "month") {
      const s = currentDate.startOf("month");
      const e = currentDate.endOf("month");
      const start = s.day() === 0 ? s.subtract(6, "day") : s.startOf("week").add(1, "day");
      const end = e.day() === 0 ? e : e.endOf("week").add(1, "day");
      return { dateFrom: start.format("YYYY-MM-DD"), dateTo: end.format("YYYY-MM-DD") };
    }
    if (view === "week") {
      const start = currentDate.startOf("week").add(1, "day");
      return { dateFrom: start.format("YYYY-MM-DD"), dateTo: start.add(6, "day").format("YYYY-MM-DD") };
    }
    const today = currentDate.format("YYYY-MM-DD");
    return { dateFrom: today, dateTo: today };
  }, [view, currentDate]);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const res = await API.get("/events", { params: { filter: "all", dateFrom, dateTo } });
      setEvents(res.data?.success ? res.data.data : []);
    } catch {
      setError("Could not load events.");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handlePrev = () => setCurrentDate((d) => d.subtract(1, view === "day" ? "day" : view === "week" ? "week" : "month"));
  const handleNext = () => setCurrentDate((d) => d.add(1, view === "day" ? "day" : view === "week" ? "week" : "month"));

  const handleOpenCreate = (dateStr = "") => {
    if (!canManage) return;
    setDefaultDate(dateStr); setEditData(null); setEditId(null); setFormError(""); setCreateOpen(true);
  };

  // Navigate to event detail page
  const handleNavigateToEvent = (ev) => {
    navigate(`/events/${ev._id}`);
  };

  const handleFormSubmit = async ({ title, description, eventDate, startTime, endTime, location, locationUrl, locationCoordinates, color }) => {
    if (!title || !description || !eventDate || !startTime || !endTime || !location) {
      setFormError("Please fill in all required fields."); return;
    }
    setFormError(""); setSubmitting(true);

    const payload = {
      title,
      description,
      eventDate,
      startTime,
      endTime,
      location,
      locationUrl: locationUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`,
      locationCoordinates,
      color: color || "#0088ff",
    };

    try {
      const res = editId
        ? await API.patch(`/events/${editId}`, payload)
        : await API.post("/events", payload);

      if (res.data?.success) {
        enqueueSnackbar(editId ? "Event updated successfully!" : "Event scheduled successfully!", { variant: "success" });
        setCreateOpen(false);
        fetchEvents();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save event.");
      enqueueSnackbar(err.response?.data?.message || "Failed to save event.", { variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth={false} sx={{ pb: 4 }}>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: "10px" }} onClose={() => setError("")}>{error}</Alert>}

      {/* Calendar */}
      <Card
        sx={{
          p: 0, borderRadius: "16px",
          border: "1px solid #EAECF0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          bgcolor: "#fff",
          overflow: "hidden",
        }}
      >
        <CalendarToolbar
          view={view}
          onViewChange={setView}
          currentDate={currentDate}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={() => setCurrentDate(dayjs())}
        />

        {view === "month" && (
          <MonthView events={events} currentDate={currentDate} onOpenCreate={handleOpenCreate} onNavigate={handleNavigateToEvent} isLoading={loading} canCreate={canManage} />
        )}
        {view === "week" && (
          <WeekView events={events} currentDate={currentDate} onOpenCreate={handleOpenCreate} onNavigate={handleNavigateToEvent} isLoading={loading} canCreate={canManage} />
        )}
        {view === "day" && (
          <DayView currentDate={currentDate} events={events} onOpenCreate={handleOpenCreate} onNavigate={handleNavigateToEvent} isLoading={loading} canCreate={canManage} />
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <EventFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleFormSubmit}
        isEdit={Boolean(editId)}
        defaultDate={defaultDate}
        initialData={editData}
        submitting={submitting}
        formError={formError}
      />
    </Container>
  );
}
