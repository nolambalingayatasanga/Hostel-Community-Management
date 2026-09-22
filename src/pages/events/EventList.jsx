import React, { useState, useMemo, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
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
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Link,
  ClickAwayListener,
  Chip,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  AddRounded as AddRoundedIcon,
  LocationOn as LocationIcon,
  Search as SearchIcon,
  OpenInNew as OpenInNewIcon,
  Check as CheckIcon,
  Palette as PaletteIcon,
  Link as LinkIcon,
  AutoAwesome as AutoAwesomeIcon,
  MyLocation as MyLocationIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  CalendarMonth as CalendarMonthIcon,
  AccessTime as AccessTimeIcon,
  Event as EventIcon,
  MoreVert as MoreVertIcon,
  ContentCopy as ContentCopyIcon,
  Edit as EditIcon,
  DeleteOutlineRounded as DeleteIcon,
} from "@mui/icons-material";

import { useAuth } from "../../context/AuthContext";
import API from "../../api";
import { LocalizationProvider, DatePicker, TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useSnackbar } from "notistack";
import { formatTime, isEventOnDate } from "./eventConstants";

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
function CalendarToolbar({ view, onViewChange, currentDate, onPrev, onNext, onToday, eventsCount, onOpenCreate, canCreate }) {
  const weekStart = currentDate.startOf("week").add(1, "day");
  const weekEnd = weekStart.add(6, "day");
  const label =
    view === "all"
      ? "All Events"
      : view === "week"
      ? `${weekStart.format("D MMM")} – ${weekEnd.format("D MMM YYYY")}`
      : view === "day"
        ? currentDate.format("dddd, D MMM YYYY")
        : currentDate.format("MMMM YYYY");

  return (
    <Box
      sx={{
        width: "100%",
        px: { xs: 1.5, sm: 2.5 },
        pt: { xs: 1.25, sm: 1.5 },
        pb: { xs: 1.25, sm: 1.5 },
        borderBottom: "1px solid #F1F5F9",
        bgcolor: "#fff"
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 1.25, sm: 2 }}
        alignItems="center"
        justifyContent="space-between"
        sx={{ width: "100%" }}
      >
        {/* View switcher: On mobile, only 'All Events' tab is displayed */}
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(_, v) => v && onViewChange(v)}
          size="small"
          sx={{
            bgcolor: "#F4F4F5",
            p: 0.25,
            borderRadius: "8px",
            width: { xs: "100%", sm: "auto" },
            display: "flex",
            "& .MuiToggleButton-root": {
              border: "none",
              borderRadius: "6px !important",
              textTransform: "none",
              flex: { xs: 1, sm: "initial" },
              px: { xs: 1.5, sm: 2 },
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
          <ToggleButton value="all">All Events</ToggleButton>
          <ToggleButton value="month" sx={{ display: { xs: "none", sm: "inline-flex" } }}>Month</ToggleButton>
          <ToggleButton value="week" sx={{ display: { xs: "none", sm: "inline-flex" } }}>Week</ToggleButton>
          <ToggleButton value="day" sx={{ display: { xs: "none", sm: "inline-flex" } }}>Day</ToggleButton>
        </ToggleButtonGroup>

        <Box
          sx={{
            width: { xs: "100%", sm: "auto" },
            alignSelf: "stretch",
            display: { xs: view === "all" ? "none" : "flex", sm: "flex" },
            alignItems: "center",
            justifyContent: { xs: "flex-end", sm: "flex-end" },
            flex: { sm: 1 },
            ml: { sm: 2 }
          }}
        >
          {view === "all" ? (
            canCreate && onOpenCreate ? (
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon sx={{ fontSize: 18 }} />}
                onClick={onOpenCreate}
                sx={{
                  display: { xs: "none", sm: "inline-flex" },
                  bgcolor: "#0088ff",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "13px",
                  textTransform: "none",
                  borderRadius: "8px",
                  px: 2,
                  py: 0.65,
                  boxShadow: "0 1px 3px rgba(0, 136, 255, 0.25)",
                  "&:hover": { bgcolor: "#0077e6" },
                }}
              >
                Add Event
              </Button>
            ) : null
          ) : (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mx: { sm: "auto" } }}>
              <IconButton
                size="small"
                onClick={onPrev}
                sx={{ color: "#475467", p: 0.5, "&:hover": { bgcolor: "#F1F5F9" } }}
              >
                <ChevronLeftIcon fontSize="small" sx={{ display: "block" }} />
              </IconButton>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  color: "#111827",
                  minWidth: { xs: "auto", sm: 170 },
                  textAlign: "center",
                  fontSize: { xs: "14px", sm: "16px" },
                  whiteSpace: "nowrap",
                  lineHeight: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {label}
              </Typography>
              <IconButton
                size="small"
                onClick={onNext}
                sx={{ color: "#475467", p: 0.5, "&:hover": { bgcolor: "#F1F5F9" } }}
              >
                <ChevronRightIcon fontSize="small" sx={{ display: "block" }} />
              </IconButton>
            </Stack>
          )}

          {view !== "all" && (
            <Button
              variant="outlined"
              size="small"
              onClick={onToday}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "13px",
                borderColor: "#D0D5DD",
                color: "#344054",
                bgcolor: "#fff",
                px: { xs: 1.5, sm: 2 },
                py: 0.5,
                flexShrink: 0,
                "&:hover": { bgcolor: "#F9FAFB", borderColor: "#D0D5DD" },
              }}
            >
              Today
            </Button>
          )}
        </Box>
      </Stack>
    </Box>
  );
}

// ─── Event pill (like in the screenshot) ─────────────────────────────────────
function EventPill({ event, onClick }) {
  const color = event.color || "#0088ff";

  return (
    <Tooltip
      title={`${event.title}${event.startTime ? ` (${formatTime(event.startTime)}${event.endTime ? ` – ${formatTime(event.endTime)}` : ""})` : ""}`}
      placement="top"
      arrow
    >
      <Box
        onClick={(e) => { e.stopPropagation(); onClick(event); }}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.6,
          bgcolor: `${color}16`,
          borderLeft: `3.5px solid ${color}`,
          borderTop: `1px solid ${color}28`,
          borderRight: `1px solid ${color}28`,
          borderBottom: `1px solid ${color}28`,
          borderRadius: "5px",
          px: 0.75,
          py: 0.4,
          cursor: "pointer",
          transition: "all 0.15s ease",
          "&:hover": {
            bgcolor: `${color}25`,
            transform: "translateY(-1px)",
            boxShadow: `0 2px 6px ${color}35`,
          },
          overflow: "hidden",
        }}
      >
 
        <Typography
          sx={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#1E293B",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            flex: 1,
            minWidth: 0,
            lineHeight: 1.25,
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
    <Stack spacing={0.4} sx={{ mt: 0.5, minWidth: 0, width: "100%" }}>
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
        minWidth: 0,
        width: "100%",
        boxSizing: "border-box",
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
        <Box sx={{ flex: 1, overflowY: "auto", minWidth: 0, width: "100%", "&::-webkit-scrollbar": { width: 2 } }}>
          <PillList events={events} onNavigate={onNavigate} />
        </Box>
      </>
      )}
    </Paper>
  );
}


// ─── All Events View (Desktop & Mobile Event Cards) ──────────────────────────
function AllEventsView({
  events,
  onOpenCreate,
  onNavigate,
  onOpenEdit,
  onDeleteEvent,
  isLoading,
  canCreate,
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);

  const handleMenuOpen = (e, ev) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setActiveEvent(ev);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setActiveEvent(null);
  };

  const handleCopy = (e, ev) => {
    e?.stopPropagation();
    const target = ev || activeEvent;
    if (!target) return;
    const url = `${window.location.origin}/events/${target._id}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url);
    } else {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    enqueueSnackbar("Event link copied to clipboard!", { variant: "success" });
    if (menuAnchor) handleMenuClose();
  };

  // Chronologically sort events (earliest first)
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const timeA = a.startDate || a.eventDate ? dayjs(a.startDate || a.eventDate).valueOf() : 0;
      const timeB = b.startDate || b.eventDate ? dayjs(b.startDate || b.eventDate).valueOf() : 0;
      if (timeA !== timeB) return timeA - timeB;
      return (a.startTime || "").localeCompare(b.startTime || "");
    });
  }, [events]);

  if (isLoading) {
    return (
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: { xs: 1.5, sm: 2.5 }, bgcolor: "#FAFAFA" }}>
        <Stack spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={110} sx={{ borderRadius: "14px" }} />
          ))}
        </Stack>
      </Box>
    );
  }

  if (sortedEvents.length === 0) {
    return (
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", py: { xs: 6, sm: 8 }, px: 3, textAlign: "center", bgcolor: "#FAFAFA" }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: "16px",
            bgcolor: "#F1F5F9",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#64748B",
            mb: 2,
          }}
        >
          <CalendarMonthIcon sx={{ fontSize: 32 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#1E293B", mb: 0.5 }}>
          No Events Scheduled
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748B", maxWidth: 420, mx: "auto", mb: canCreate ? 3 : 0 }}>
          There are currently no events found on the calendar. Check back later or schedule a new event.
        </Typography>
        {canCreate && (
          <Button
            variant="contained"
            onClick={() => onOpenCreate()}
            startIcon={<AddRoundedIcon />}
            sx={{
              bgcolor: "#0088ff",
              textTransform: "none",
              fontWeight: 700,
              borderRadius: "10px",
              px: 2.5,
              py: 0.85,
              boxShadow: "0 2px 8px rgba(0,136,255,0.25)",
              "&:hover": { bgcolor: "#0077ee" },
            }}
          >
            Create Event
          </Button>
        )}
      </Box>
    );
  }

  const todayStr = dayjs().format("YYYY-MM-DD");

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        p: { xs: 1.5, sm: 2.5 },
        bgcolor: "#FAFAFA",
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      {sortedEvents.map((ev) => {
        const startD = dayjs(ev.startDate || ev.eventDate);
        const endD = ev.endDate ? dayjs(ev.endDate) : startD;
        const isMultiDay = ev.endDate && !startD.isSame(endD, "day");
        const daysTotal = isMultiDay ? endD.diff(startD, "day") + 1 : 1;

        let weekday, dayNum, monthYear;
        if (!isMultiDay) {
          weekday = startD.format("ddd").toUpperCase();
          dayNum = startD.format("D");
          monthYear = startD.format("MMM YYYY").toUpperCase();
        } else {
          if (startD.format("YYYY-MM") === endD.format("YYYY-MM")) {
            weekday = `${startD.format("ddd")} – ${endD.format("ddd")}`.toUpperCase();
            dayNum = `${startD.format("D")}–${endD.format("D")}`;
            monthYear = startD.format("MMM YYYY").toUpperCase();
          } else if (startD.format("YYYY") === endD.format("YYYY")) {
            weekday = `${startD.format("MMM")} – ${endD.format("MMM")}`.toUpperCase();
            dayNum = `${startD.format("D")}–${endD.format("D")}`;
            monthYear = startD.format("YYYY");
          } else {
            weekday = "MULTI-DAY";
            dayNum = `${startD.format("D/M")}–${endD.format("D/M")}`;
            monthYear = `${startD.format("YY")}–${endD.format("YY")}`;
          }
        }

        let statusLabel = "Upcoming";
        let statusBg = "#ECFDF5";
        let statusColor = "#059669";
        let dotColor = "#10B981";

        const today = dayjs().startOf("day");
        const startDay = startD.startOf("day");
        const endDay = endD.startOf("day");

        if (today.isSame(startDay, "day") && today.isSame(endDay, "day")) {
          statusLabel = "Today";
          statusBg = "#EFF6FF";
          statusColor = "#0088ff";
          dotColor = "#0088ff";
        } else if (!today.isBefore(startDay) && !today.isAfter(endDay)) {
          statusLabel = "Ongoing";
          statusBg = "#EFF6FF";
          statusColor = "#0088ff";
          dotColor = "#0088ff";
        } else if (endDay.isBefore(today)) {
          statusLabel = "Completed";
          statusBg = "#F3F4F6";
          statusColor = "#6B7280";
          dotColor = "#9CA3AF";
        }

        return (
          <Paper
            key={ev._id}
            elevation={0}
            sx={{
              position: "relative",
              borderRadius: "14px",
              border: "1px solid #EAECF0",
              borderLeft: `4px solid ${ev.color || "#0088ff"}`,
              bgcolor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              p: { xs: 1.5, sm: 2 },
              transition: "all 0.2s ease",
              "&:hover": {
                boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                borderColor: "#D0D5DD",
                borderLeftColor: ev.color || "#0088ff",
              },
            }}
          >
            {/* Desktop Layout */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              {/* Left Section: Date Badge & Middle Info */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, flex: 1, minWidth: 0, mr: 2 }}>
                {/* Date Badge */}
                <Box
                  sx={{
                    width: 78,
                    minWidth: 78,
                    bgcolor: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                    py: 1,
                    px: 0.5,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: isMultiDay ? "9.5px" : "11px",
                      fontWeight: 800,
                      color: "#64748B",
                      textTransform: "uppercase",
                      letterSpacing: isMultiDay ? "0.02em" : "0.06em",
                      lineHeight: 1,
                      mb: 0.5,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {weekday}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: isMultiDay ? (dayNum.length > 5 ? "16px" : "19px") : "26px",
                      fontWeight: 800,
                      color: "#0F172A",
                      lineHeight: 1,
                      my: 0.25,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {dayNum}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#64748B",
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                      lineHeight: 1,
                      mt: 0.5,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {monthYear}
                  </Typography>
                </Box>

                {/* Middle Info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {/* Title & Multi-day chip */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.75 }}>
                    <Typography
                      onClick={() => onNavigate(ev)}
                      sx={{
                        fontSize: "18px",
                        fontWeight: 800,
                        color: "#0F172A",
                        lineHeight: 1.25,
                        cursor: "pointer",
                        "&:hover": { color: "#0088ff" },
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {ev.title}
                    </Typography>
                    {isMultiDay && (
                      <Chip
                        label={`${daysTotal} Days`}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "11px",
                          fontWeight: 700,
                          bgcolor: "#F1F5F9",
                          color: "#475569",
                          borderRadius: "6px",
                          "& .MuiChip-label": { px: 0.75 },
                        }}
                      />
                    )}
                  </Box>

                  {/* Meta items: Time & Location */}
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    {ev.startTime && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                        <Box
                          sx={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            bgcolor: "#EFF6FF",
                            color: "#0088ff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <AccessTimeIcon sx={{ fontSize: 13 }} />
                        </Box>
                        <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#475467" }}>
                          {formatTime(ev.startTime)}{ev.endTime ? ` – ${formatTime(ev.endTime)}` : ""}
                        </Typography>
                      </Box>
                    )}

                    {ev.startTime && ev.location && (
                      <Divider orientation="vertical" flexItem sx={{ height: 14, alignSelf: "center", borderColor: "#E2E8F0" }} />
                    )}

                    {ev.location && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, minWidth: 0 }}>
                        <Box
                          sx={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            bgcolor: "#F5F3FF",
                            color: "#7C3AED",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <LocationIcon sx={{ fontSize: 13 }} />
                        </Box>
                        <Typography
                          sx={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#475467",
                            maxWidth: 320,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {ev.location}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>
              </Box>

              {/* Vertical divider */}
              <Divider
                orientation="vertical"
                flexItem
                sx={{ mx: 2.5, borderColor: "#EAECF0" }}
              />

              {/* Right Section: Status & Actions */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  gap: 1.5,
                  minWidth: 200,
                  flexShrink: 0,
                }}
              >
                {/* Top: Status Pill + Copy Link */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, justifyContent: "flex-end", width: "100%" }}>
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.6,
                      bgcolor: statusBg,
                      color: statusColor,
                      borderRadius: "16px",
                      px: 1.25,
                      py: 0.35,
                      fontSize: "12px",
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: dotColor }} />
                    {statusLabel}
                  </Box>

                  <IconButton
                    size="small"
                    onClick={(e) => handleCopy(e, ev)}
                    title="Copy event link"
                    sx={{
                      border: "1px solid #EAECF0",
                      borderRadius: "8px",
                      width: 32,
                      height: 32,
                      color: "#475467",
                      "&:hover": { bgcolor: "#F8FAFC", borderColor: "#D0D5DD" },
                    }}
                  >
                    <ContentCopyIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Box>

                {/* Bottom: View Details + 3-dots Menu */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: "flex-end", width: "100%" }}>
                  <Button
                    variant="contained"
                    disableElevation
                    startIcon={<CalendarMonthIcon sx={{ fontSize: 16 }} />}
                    onClick={() => onNavigate(ev)}
                    sx={{
                      bgcolor: "#F0F7FF",
                      color: "#0088ff",
                      textTransform: "none",
                      fontWeight: 700,
                      borderRadius: "8px",
                      px: 2,
                      py: 0.75,
                      fontSize: "13px",
                      "&:hover": { bgcolor: "#E0F2FE" },
                    }}
                  >
                    View Details
                  </Button>

                  {canCreate && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, ev)}
                      title="More actions"
                      sx={{
                        bgcolor: "#F8FAFC",
                        border: "1px solid #EAECF0",
                        borderRadius: "8px",
                        width: 34,
                        height: 34,
                        color: "#475467",
                        "&:hover": { bgcolor: "#F1F5F9" },
                      }}
                    >
                      <MoreVertIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Mobile Layout */}
            <Box
              sx={{
                display: { xs: "flex", md: "none" },
                flexDirection: "column",
                gap: 1.5,
              }}
            >
              {/* Mobile Top Row: Date Badge + Details */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                {/* Date Badge */}
                <Box
                  sx={{
                    width: 68,
                    minWidth: 68,
                    bgcolor: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                    py: 1,
                    px: 0.75,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: isMultiDay ? "9px" : "11px",
                      fontWeight: 800,
                      color: "#64748B",
                      textTransform: "uppercase",
                      letterSpacing: isMultiDay ? "0.02em" : "0.05em",
                      lineHeight: 1,
                      mb: 0.5,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {weekday}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: isMultiDay ? (dayNum.length > 5 ? "15px" : "17px") : "22px",
                      fontWeight: 800,
                      color: "#0F172A",
                      lineHeight: 1,
                      my: 0.25,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {dayNum}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "9.5px",
                      fontWeight: 700,
                      color: "#64748B",
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                      lineHeight: 1,
                      mt: 0.5,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {monthYear}
                  </Typography>
                </Box>

                {/* Mobile Details */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap", mb: 0.75 }}>
                    <Typography
                      onClick={() => onNavigate(ev)}
                      sx={{
                        fontSize: "16px",
                        fontWeight: 800,
                        color: "#0F172A",
                        lineHeight: 1.3,
                        cursor: "pointer",
                        "&:hover": { color: "#0088ff" },
                      }}
                    >
                      {ev.title}
                    </Typography>
                    {isMultiDay && (
                      <Chip
                        label={`${daysTotal} Days`}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: "10px",
                          fontWeight: 700,
                          bgcolor: "#F1F5F9",
                          color: "#475569",
                          borderRadius: "4px",
                          "& .MuiChip-label": { px: 0.6 },
                        }}
                      />
                    )}
                  </Box>

                  <Stack spacing={0.5}>
                    {ev.startTime && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                        <AccessTimeIcon sx={{ fontSize: 13, color: "#0088ff" }} />
                        <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#475467" }}>
                          {formatTime(ev.startTime)}{ev.endTime ? ` – ${formatTime(ev.endTime)}` : ""}
                        </Typography>
                      </Box>
                    )}
                    {ev.location && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                        <LocationIcon sx={{ fontSize: 13, color: "#7C3AED" }} />
                        <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#475467" }} noWrap>
                          {ev.location}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>
              </Box>

              {/* Mobile Actions Bar */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  pt: 1,
                  borderTop: "1px solid #F1F5F9",
                }}
              >
                <Button
                  variant="contained"
                  disableElevation
                  fullWidth
                  startIcon={<CalendarMonthIcon sx={{ fontSize: 15 }} />}
                  onClick={() => onNavigate(ev)}
                  sx={{
                    flex: 1,
                    bgcolor: "#F0F7FF",
                    color: "#0088ff",
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: "8px",
                    py: 0.75,
                    fontSize: "12.5px",
                    "&:hover": { bgcolor: "#E0F2FE" },
                  }}
                >
                  View Details
                </Button>

                <IconButton
                  size="small"
                  onClick={(e) => handleCopy(e, ev)}
                  title="Copy link"
                  sx={{
                    border: "1px solid #EAECF0",
                    borderRadius: "8px",
                    width: 34,
                    height: 34,
                    color: "#475467",
                    "&:hover": { bgcolor: "#F8FAFC" },
                  }}
                >
                  <ContentCopyIcon sx={{ fontSize: 16 }} />
                </IconButton>

       
              </Box>
            </Box>
          </Paper>
        );
      })}

      {/* Shared Dropdown Menu for More Options */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          sx: {
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            border: "1px solid #EAECF0",
            minWidth: 170,
            py: 0.5,
          },
        }}
      >



        {canCreate && onOpenEdit && (
          <MenuItem
            onClick={() => {
              const evToEdit = activeEvent;
              handleMenuClose();
              onOpenEdit(evToEdit);
            }}
            sx={{ fontSize: "13.5px", fontWeight: 600, py: 1, gap: 1.25 }}
          >
            <ListItemIcon sx={{ minWidth: "auto", color: "#475467" }}>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: "13.5px", fontWeight: 600 }}>
              Edit Event
            </ListItemText>
          </MenuItem>
        )}

        {canCreate && onDeleteEvent && (
          <MenuItem
            onClick={() => {
              const evToDelete = activeEvent;
              handleMenuClose();
              onDeleteEvent(evToDelete);
            }}
            sx={{ fontSize: "13.5px", fontWeight: 600, py: 1, gap: 1.25, color: "#EF4444" }}
          >
            <ListItemIcon sx={{ minWidth: "auto", color: "#EF4444" }}>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: "13.5px", fontWeight: 600, color: "#EF4444" }}>
              Delete Event
            </ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
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
    <Box sx={{ bgcolor: "#F8FAFC", pb: "16px", overflowX: "auto", overflowY: "auto", flex: 1, minHeight: 0, width: "100%", WebkitOverflowScrolling: "touch" }}>
      <Box sx={{ width: "100%" }}>
        {/* Column labels */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(7, minmax(0, 1fr))", md: "repeat(7, 1fr)" },
            gap: { xs: "10px", md: "12px" },
            px: { xs: "10px", md: "12px" },
            pt: "12px",
            width: { xs: "calc(306% - 15px)", md: "100%" },
            minWidth: { xs: "calc(306% - 15px)", md: "100%" }
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
              <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#1E293B" }}>
                <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>{l}</Box>
                <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>{l.slice(0, 3)}</Box>
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* Date cells */}
        <Box
          onMouseLeave={() => setHoveredDate(null)}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(7, minmax(0, 1fr))", md: "repeat(7, 1fr)" },
            gap: { xs: "10px", md: "12px" },
            px: { xs: "10px", md: "12px" },
            pt: "8px",
            width: { xs: "calc(306% - 15px)", md: "100%" },
            minWidth: { xs: "calc(306% - 15px)", md: "100%" }
          }}
        >
          {days.map((date) => {
            const ds = date.format("YYYY-MM-DD");
            const isToday = ds === today;
            const isTodayActive = isToday && (!hoveredDate || hoveredDate === today);
            const dayEvents = events.filter((ev) => isEventOnDate(ev, ds));
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
    </Box>
  );
}

// ─── Week view ────────────────────────────────────────────────────────────────
function WeekView({ events, currentDate, onOpenCreate, onNavigate, isLoading, canCreate }) {
  const weekStart = currentDate.startOf("week").add(1, "day");
  const days = Array.from({ length: 7 }, (_, i) => weekStart.add(i, "day"));
  const todayStr = dayjs().format("YYYY-MM-DD");

  return (
    <Box sx={{ bgcolor: "#F8FAFC", pb: "16px", overflowX: "auto", overflowY: "auto", flex: 1, minHeight: 0, width: "100%", WebkitOverflowScrolling: "touch" }}>
      <Box sx={{ width: "100%" }}>
        {/* Column labels */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(7, minmax(0, 1fr))", md: "repeat(7, 1fr)" },
            gap: { xs: "10px", md: "12px" },
            px: { xs: "10px", md: "12px" },
            pt: "12px",
            width: { xs: "calc(306% - 15px)", md: "100%" },
            minWidth: { xs: "calc(306% - 15px)", md: "100%" }
          }}
        >
          {days.map((date) => (
              <Paper
                key={date.toString()}
                variant="outlined"
                sx={{
                  py: { xs: 1, sm: 1.25 },
                  px: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.75,
                  borderRadius: "12px",
                  borderColor: "#EAECF0",
                  bgcolor: "#fff",
                  boxShadow: "none"
                }}
              >
                <Typography sx={{ fontSize: "13px", fontWeight: 700, color: "#1E293B", lineHeight: 1 }}>
                  <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>{date.format("dddd")}</Box>
                  <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>{date.format("ddd")}</Box>
                </Typography>
                <Typography sx={{ fontSize: "13px", fontWeight: 600, color: "#64748B", lineHeight: 1 }}>
                  {date.date()}
                </Typography>
              </Paper>
          ))}
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(7, minmax(0, 1fr))", md: "repeat(7, 1fr)" },
            gap: { xs: "10px", md: "12px" },
            px: { xs: "10px", md: "12px" },
            pt: "8px",
            width: { xs: "calc(306% - 15px)", md: "100%" },
            minWidth: { xs: "calc(306% - 15px)", md: "100%" }
          }}
        >
          {days.map((date) => {
            const ds = date.format("YYYY-MM-DD");
            const dayEvents = events.filter((ev) => isEventOnDate(ev, ds));
            return (
              <DayCell
                key={ds}
                dateStr={ds}
                events={dayEvents}
                onOpenCreate={onOpenCreate}
                onNavigate={onNavigate}
                isLoading={isLoading}
                canCreate={canCreate}
                isCurrentMonth={true}
                isTodayActive={ds === todayStr}
                onMouseEnter={() => {}}
              />
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

// ─── Day view ─────────────────────────────────────────────────────────────────
function DayView({ currentDate, events, onOpenCreate, onNavigate, isLoading, canCreate }) {
  const dateStr = currentDate.format("YYYY-MM-DD");
  const dayEvents = events.filter((ev) => isEventOnDate(ev, dateStr));

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
    <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <Box sx={{ py: 1.5, textAlign: "center", borderBottom: "1px solid #F1F5F9", bgcolor: "#FAFAFA", flexShrink: 0 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#111827" }}>
          {currentDate.format("dddd, D MMMM YYYY")}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
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
const DEFAULT_COORDS = { lat: 12.9716, lng: 77.5946 };
const DEFAULT_PLACE_NAME = "Bengaluru, Karnataka, India";

function EventFormDialog({ open, onClose, onSubmit, isEdit, defaultDate, initialData, submitting, formError }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [locationCoordinates, setLocationCoordinates] = useState(DEFAULT_COORDS);
  const [color, setColor] = useState("#0088ff");

  // Location search suggestions & Direct Link Scraping state
  const [locationMode, setLocationMode] = useState("search"); // "search" | "link"
  const [pastedMapUrl, setPastedMapUrl] = useState("");
  const [isScrapingMap, setIsScrapingMap] = useState(false);
  const [scrapeError, setScrapeError] = useState("");
  const [scrapedSuccess, setScrapedSuccess] = useState(false);

  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState(null);

  // Prevent background page scrolling when popup is open
  useEffect(() => {
    if (open) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      const handleTouchMove = (e) => {
        if (!e.target.closest(".MuiDialogContent-root")) {
          e.preventDefault();
        }
      };

      document.addEventListener("touchmove", handleTouchMove, { passive: false });

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.removeEventListener("touchmove", handleTouchMove);
      };
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setTitle(initialData.title || "");
        setDescription(initialData.description || "");
        const initStart = initialData.startDate
          ? initialData.startDate.substring(0, 10)
          : (initialData.eventDate ? initialData.eventDate.substring(0, 10) : defaultDate || "");
        const initEnd = initialData.endDate
          ? initialData.endDate.substring(0, 10)
          : initStart;
        setStartDate(initStart);
        setEndDate(initEnd);
        setStartTime(initialData.startTime || "");
        setEndTime(initialData.endTime || "");
        setLocation(initialData.location || "");
        setLocationQuery(initialData.location || "");
        setLocationUrl(initialData.locationUrl || "");
        setPastedMapUrl(initialData.locationUrl || "");
        const coords = initialData.locationCoordinates || DEFAULT_COORDS;
        setLocationCoordinates(coords);
        setColor(initialData.color || "#0088ff");
        if (initialData.location) {
          const item = {
            display_name: initialData.location,
            lat: coords?.lat || DEFAULT_COORDS.lat,
            lon: coords?.lng || DEFAULT_COORDS.lng,
            isCurrentLocation: false,
          };
          setDetectedLocation(item);
          setLocationSuggestions([item]);
        } else {
          setDetectedLocation(null);
          setLocationSuggestions([]);
        }
      } else {
        setTitle("");
        setDescription("");
        setStartDate(defaultDate || "");
        setEndDate(defaultDate || "");
        setStartTime("");
        setEndTime("");
        setColor("#0088ff");
        setPastedMapUrl("");

        // Before typing any input: load and show map immediately with fallback
        setLocationCoordinates(DEFAULT_COORDS);
        const fallbackItem = {
          display_name: DEFAULT_PLACE_NAME,
          lat: DEFAULT_COORDS.lat,
          lon: DEFAULT_COORDS.lng,
          isCurrentLocation: false,
        };
        setDetectedLocation(fallbackItem);
        setLocationSuggestions([fallbackItem]);
        setLocation(DEFAULT_PLACE_NAME);
        setLocationQuery(DEFAULT_PLACE_NAME);
        setLocationUrl(`https://www.google.com/maps/search/?api=1&query=${DEFAULT_COORDS.lat},${DEFAULT_COORDS.lng}`);

        // Automatically detect user location via browser geolocation
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              setLocationCoordinates({ lat, lng });
              setLocationUrl(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
              try {
                const res = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                  { headers: { "Accept-Language": "en" } }
                );
                const data = await res.json();
                const resolvedName = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                const currentItem = {
                  display_name: resolvedName,
                  name: (data.address ? (data.address.road || data.address.suburb || data.address.neighbourhood || data.address.city || data.address.town) : null) || resolvedName.split(",")[0],
                  lat,
                  lon: lng,
                  isCurrentLocation: true,
                };
                setDetectedLocation(currentItem);
                setLocation(resolvedName);
                setLocationQuery(resolvedName);
                setLocationSuggestions([currentItem]);
              } catch (e) {
                const genericName = `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
                const currentItem = {
                  display_name: genericName,
                  lat,
                  lon: lng,
                  isCurrentLocation: true,
                };
                setDetectedLocation(currentItem);
                setLocation(genericName);
                setLocationQuery(genericName);
                setLocationSuggestions([currentItem]);
              }
            },
            (err) => {
              console.warn("Geolocation query error or denied:", err);
            },
            { timeout: 7000, enableHighAccuracy: true }
          );
        }
      }
      setShowLocationSuggestions(false);
      setLocationMode("search");
      setIsScrapingMap(false);
      setScrapeError("");
      setScrapedSuccess(false);
    }
  }, [open, initialData, defaultDate]);

  const handleScrapeMapLink = async (urlInput) => {
    const rawUrl = (urlInput || pastedMapUrl || "").trim();
    if (!rawUrl) {
      setScrapeError("Please paste a valid Google Maps, Apple Maps, or OpenStreetMap link.");
      return;
    }

    setIsScrapingMap(true);
    setScrapeError("");
    setScrapedSuccess(false);

    try {
      const res = await API.post("/events/parse-map-url", { url: rawUrl });
      if (res.data?.success && res.data?.data) {
        const item = res.data.data;
        const resolvedName = item.displayName || item.name || "Pinned Location";
        setLocation(resolvedName);
        setLocationQuery(resolvedName);
        if (item.locationCoordinates) {
          setLocationCoordinates(item.locationCoordinates);
        } else if (item.lat && item.lng) {
          setLocationCoordinates({ lat: item.lat, lng: item.lng });
        }
        setLocationUrl(item.locationUrl || rawUrl);
        setPastedMapUrl(rawUrl);
        setScrapedSuccess(true);
        setShowLocationSuggestions(false);
      } else {
        setScrapeError(res.data?.message || "Could not resolve details from this map link.");
      }
    } catch (err) {
      console.error("Map parse error:", err);
      let clientParsed = false;
      try {
        const atMatch = rawUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        const qMatch = rawUrl.match(/[?&](?:q|query|ll)=(-?\d+\.\d+)[,;](-?\d+\.\d+)/);
        const placeMatch = rawUrl.match(/\/place\/([^/@?#]+)/);
        const lat = atMatch ? parseFloat(atMatch[1]) : (qMatch ? parseFloat(qMatch[1]) : null);
        const lng = atMatch ? parseFloat(atMatch[2]) : (qMatch ? parseFloat(qMatch[2]) : null);
        let placeName = placeMatch ? decodeURIComponent(placeMatch[1].replace(/\+/g, " ")).trim() : "";

        if (lat && lng) {
          setLocationCoordinates({ lat, lng });
          setLocationUrl(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
          const finalName = placeName || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setLocation(finalName);
          setLocationQuery(finalName);
          setScrapedSuccess(true);
          clientParsed = true;
        } else if (placeName) {
          setLocation(placeName);
          setLocationQuery(placeName);
          setLocationUrl(rawUrl);
          setScrapedSuccess(true);
          clientParsed = true;
        }
      } catch (e) {
        // Fallback ignored
      }

      if (!clientParsed) {
        setScrapeError(err.response?.data?.message || "Failed to extract map details. Please check the URL or type the location manually.");
      }
    } finally {
      setIsScrapingMap(false);
    }
  };

  // Debounced search using OpenStreetMap Nominatim for exact place resolution
  useEffect(() => {
    if (!locationQuery || locationQuery.trim().length < 3) {
      if (detectedLocation) {
        setLocationSuggestions([detectedLocation]);
      } else {
        setLocationSuggestions([]);
      }
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
          const suggestions = detectedLocation
            ? [detectedLocation, ...data.filter((d) => d.display_name !== detectedLocation.display_name)]
            : data;
          setLocationSuggestions(suggestions);
          setShowLocationSuggestions(true);
        }
      } catch (err) {
        console.error("Location search error:", err);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [locationQuery, detectedLocation]);

  const handleSelectPlace = (place) => {
    const displayName = place.display_name;
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    setLocation(displayName);
    setLocationQuery(displayName);
    if (!isNaN(lat) && !isNaN(lon)) {
      setLocationCoordinates({ lat, lng: lon });
      setLocationUrl(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`);
    } else {
      setLocationUrl(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayName)}`);
    }
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
    const actualStart = startDate;
    const actualEnd = endDate || startDate;
    onSubmit({
      title,
      description,
      startDate: actualStart,
      endDate: actualEnd,
      eventDate: actualStart,
      startTime,
      endTime,
      location,
      locationUrl: locationUrl || (location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}` : ""),
      locationCoordinates,
      color,
    });
  };

  const currentMapLink = locationUrl || (location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}` : "");
  const displayCoords = locationCoordinates || DEFAULT_COORDS;
  const embedMapUrl = locationCoordinates?.lat && locationCoordinates?.lng
    ? `https://maps.google.com/maps?q=${locationCoordinates.lat},${locationCoordinates.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    : location && location.trim().length > 2
    ? `https://maps.google.com/maps?q=${encodeURIComponent(location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`
    : `https://maps.google.com/maps?q=${displayCoords.lat},${displayCoords.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableScrollLock={false}
      sx={{
        overscrollBehavior: "contain",
        "& .MuiBackdrop-root": {
          touchAction: "none",
        },
        "& .MuiDialog-container": {
          overscrollBehavior: "contain",
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: "24px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
          maxHeight: "calc(100vh - 48px)",
          height: "auto",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <DialogContent
          sx={{
            px: 3.5,
            pt: 3.5,
            pb: 2.5,
            backgroundColor: "#FFF",
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {formError && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: "10px", fontSize: "13px" }}>
              {formError}
            </Alert>
          )}

          <Stack spacing={1.8}>
            {/* Top Color Palette Selector */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
              <Stack direction="row" spacing={1.1} alignItems="center" sx={{ flexWrap: "wrap", gap: 1 }}>
                {EVENT_COLORS.map((c) => {
                  const isSelected = (color || "#0088ff").toLowerCase() === c.value.toLowerCase();
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
                        {isSelected && <CheckIcon sx={{ color: "#FFF", fontSize: 16, strokeWidth: 2.5 }} />}
                      </Box>
                    </Tooltip>
                  );
                })}

                {/* Custom Color Input */}
                <Tooltip title="Custom Color" arrow placement="top">
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
                      value={color || "#0088ff"}
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

            {/* Event Title */}
            <Box>
              <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#344054", mb: 0.6 }}>
                Event Title <span style={{ color: "#D92D20" }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: "40px",
                    borderRadius: "10px",
                    backgroundColor: "#FFF",
                    fontSize: "13.5px",
                    "& fieldset": { borderColor: "#D0D5DD" },
                    "&:hover fieldset": { borderColor: "#98A2B3" },
                    "&.Mui-focused fieldset": { borderColor: "#0088ff" },
                  },
                  "& .MuiInputBase-input": {
                    py: "8.5px",
                    px: "12px",
                  },
                }}
              />
            </Box>

            {/* Description */}
            <Box>
              <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#344054", mb: 0.6 }}>
                Description <span style={{ color: "#D92D20" }}>*</span>
              </Typography>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    backgroundColor: "#FFF",
                    fontSize: "13.5px",
                    "& fieldset": { borderColor: "#D0D5DD" },
                    "&:hover fieldset": { borderColor: "#98A2B3" },
                    "&.Mui-focused fieldset": { borderColor: "#0088ff" },
                  },
                  "& .MuiInputBase-input": {
                    px: "12px",
                    py: "8px",
                  },
                }}
              />
            </Box>

            {/* Date & Time Section */}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#344054", mb: 0.6 }}>
                    Start Date <span style={{ color: "#D92D20" }}>*</span>
                  </Typography>
                  <DatePicker
                    format="DD/MM/YYYY"
                    value={startDate ? dayjs(startDate) : null}
                    onChange={(newValue) => {
                      const val = newValue ? newValue.format("YYYY-MM-DD") : "";
                      setStartDate(val);
                      if (!endDate || (val && dayjs(endDate).isBefore(dayjs(val), "day"))) {
                        setEndDate(val);
                      }
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "small",
                        required: true,
                        placeholder: "DD/MM/YYYY",
                        sx: {
                          "& .MuiOutlinedInput-root": {
                            height: "38px",
                            borderRadius: "10px",
                            backgroundColor: "#FFF",
                            fontSize: "13px",
                            "& fieldset": { borderColor: "#D0D5DD" },
                            "&:hover fieldset": { borderColor: "#98A2B3" },
                            "&.Mui-focused fieldset": { borderColor: "#0088ff" },
                          },
                          "& .MuiInputBase-input": {
                            py: "7px",
                            px: "10px",
                            fontSize: "13px",
                            height: "auto",
                          },
                          "& .MuiIconButton-root": {
                            p: "4px",
                            color: "#667085",
                          },
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#344054", mb: 0.6 }}>
                    End Date <span style={{ color: "#D92D20" }}>*</span>
                  </Typography>
                  <DatePicker
                    format="DD/MM/YYYY"
                    minDate={startDate ? dayjs(startDate) : undefined}
                    value={endDate ? dayjs(endDate) : (startDate ? dayjs(startDate) : null)}
                    onChange={(newValue) => setEndDate(newValue ? newValue.format("YYYY-MM-DD") : "")}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "small",
                        required: true,
                        placeholder: "DD/MM/YYYY",
                        sx: {
                          "& .MuiOutlinedInput-root": {
                            height: "38px",
                            borderRadius: "10px",
                            backgroundColor: "#FFF",
                            fontSize: "13px",
                            "& fieldset": { borderColor: "#D0D5DD" },
                            "&:hover fieldset": { borderColor: "#98A2B3" },
                            "&.Mui-focused fieldset": { borderColor: "#0088ff" },
                          },
                          "& .MuiInputBase-input": {
                            py: "7px",
                            px: "10px",
                            fontSize: "13px",
                            height: "auto",
                          },
                          "& .MuiIconButton-root": {
                            p: "4px",
                            color: "#667085",
                          },
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 6, sm: 6 }}>
                  <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#344054", mb: 0.6 }}>
                    Start Time <span style={{ color: "#D92D20" }}>*</span>
                  </Typography>
                  <TimePicker
                    value={startTime ? dayjs(`2000-01-01T${startTime}`) : null}
                    onChange={(newValue) => setStartTime(newValue ? newValue.format("HH:mm") : "")}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "small",
                        required: true,
                        sx: {
                          "& .MuiOutlinedInput-root": {
                            height: "38px",
                            borderRadius: "10px",
                            backgroundColor: "#FFF",
                            fontSize: "13px",
                            "& fieldset": { borderColor: "#D0D5DD" },
                            "&:hover fieldset": { borderColor: "#98A2B3" },
                            "&.Mui-focused fieldset": { borderColor: "#0088ff" },
                          },
                          "& .MuiInputBase-input": {
                            py: "7px",
                            px: "10px",
                            fontSize: "13px",
                            height: "auto",
                          },
                          "& .MuiIconButton-root": {
                            p: "4px",
                            color: "#667085",
                          },
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 6, sm: 6 }}>
                  <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#344054", mb: 0.6 }}>
                    End Time <span style={{ color: "#D92D20" }}>*</span>
                  </Typography>
                  <TimePicker
                    value={endTime ? dayjs(`2000-01-01T${endTime}`) : null}
                    onChange={(newValue) => setEndTime(newValue ? newValue.format("HH:mm") : "")}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "small",
                        required: true,
                        sx: {
                          "& .MuiOutlinedInput-root": {
                            height: "38px",
                            borderRadius: "10px",
                            backgroundColor: "#FFF",
                            fontSize: "13px",
                            "& fieldset": { borderColor: "#D0D5DD" },
                            "&:hover fieldset": { borderColor: "#98A2B3" },
                            "&.Mui-focused fieldset": { borderColor: "#0088ff" },
                          },
                          "& .MuiInputBase-input": {
                            py: "7px",
                            px: "10px",
                            fontSize: "13px",
                            height: "auto",
                          },
                          "& .MuiIconButton-root": {
                            p: "4px",
                            color: "#667085",
                          },
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>

            {/* Location Mode Tabs (Full Width) */}
            <Box
              sx={{
                display: "flex",
                width: "100%",
                bgcolor: "#F2F4F7",
                p: "3px",
                borderRadius: "10px",
                border: "1px solid #EAECF0",
              }}
            >
              <Button
                fullWidth
                size="small"
                onClick={() => {
                  setLocationMode("search");
                  setScrapeError("");
                }}
                startIcon={<SearchIcon sx={{ fontSize: 16 }} />}
                sx={{
                  py: 0.6,
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: locationMode === "search" ? 700 : 500,
                  color: locationMode === "search" ? "#0088ff" : "#667085",
                  bgcolor: locationMode === "search" ? "#FFF" : "transparent",
                  border: locationMode === "search" ? "1px solid #0088ff" : "1px solid transparent",
                  boxShadow: locationMode === "search" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                  textTransform: "none",
                  "&:hover": {
                    bgcolor: locationMode === "search" ? "#FFF" : "#E4E7EC",
                  },
                }}
              >
                Search Location
              </Button>
              <Button
                fullWidth
                size="small"
                onClick={() => {
                  setLocationMode("link");
                  setScrapeError("");
                }}
                startIcon={<LinkIcon sx={{ fontSize: 16 }} />}
                sx={{
                  py: 0.6,
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: locationMode === "link" ? 700 : 500,
                  color: locationMode === "link" ? "#0088ff" : "#667085",
                  bgcolor: locationMode === "link" ? "#FFF" : "transparent",
                  border: locationMode === "link" ? "1px solid #0088ff" : "1px solid transparent",
                  boxShadow: locationMode === "link" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                  textTransform: "none",
                  "&:hover": {
                    bgcolor: locationMode === "link" ? "#FFF" : "#E4E7EC",
                  },
                }}
              >
                Paste Map Link
              </Button>
            </Box>

            {/* Location Tab Content Container - maintains identical height across tabs */}
            <Box>
              {/* Mode A: Search by Name */}
              {locationMode === "search" && (
                <ClickAwayListener onClickAway={() => setShowLocationSuggestions(false)}>
                  <Box sx={{ position: "relative" }}>
                    <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#344054", mb: 0.6 }}>
                      Search Location <span style={{ color: "#D92D20" }}>*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      required
                      value={location}
                      onChange={handleManualLocationChange}
                      onFocus={() => locationSuggestions.length > 0 && setShowLocationSuggestions(true)}
                      onClick={() => locationSuggestions.length > 0 && setShowLocationSuggestions(true)}
                      InputProps={{
                        startAdornment: <LocationIcon sx={{ color: "#0088ff", mr: 1, fontSize: 19 }} />,
                        endAdornment: (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            {isSearchingLocation && <CircularProgress size={16} sx={{ color: "#0088ff" }} />}
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowLocationSuggestions((prev) => !prev);
                              }}
                              sx={{ p: "2px", color: "#667085" }}
                            >
                              {showLocationSuggestions ? (
                                <KeyboardArrowDownIcon sx={{ fontSize: 19 }} />
                              ) : (
                                <KeyboardArrowUpIcon sx={{ fontSize: 19 }} />
                              )}
                            </IconButton>
                          </Stack>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "40px",
                          borderRadius: "10px",
                          backgroundColor: "#FFF",
                          fontSize: "13px",
                          "& fieldset": { borderColor: "#D0D5DD" },
                          "&:hover fieldset": { borderColor: "#98A2B3" },
                          "&.Mui-focused fieldset": { borderColor: "#0088ff" },
                        },
                        "& .MuiInputBase-input": {
                          py: "8.5px",
                          px: "8px",
                        },
                      }}
                    />

                    {/* Upward Autocomplete suggestions dropdown */}
                    {showLocationSuggestions && locationSuggestions.length > 0 && (
                      <Paper
                        elevation={6}
                        sx={{
                          position: "absolute",
                          bottom: "calc(100% + 6px)",
                          left: 0,
                          right: 0,
                          zIndex: 1300,
                          borderRadius: "12px",
                          maxHeight: "220px",
                          overflowY: "auto",
                          border: "1px solid #D0D5DD",
                          bgcolor: "#FFF",
                          boxShadow: "0 -8px 24px rgba(16, 24, 40, 0.12), 0 -2px 6px rgba(16, 24, 40, 0.08)",
                        }}
                      >
                        {locationSuggestions.map((place, idx) => (
                          <Box
                            key={idx}
                            onClick={() => handleSelectPlace(place)}
                            sx={{
                              p: 1.25,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 1.25,
                              borderBottom: idx < locationSuggestions.length - 1 ? "1px solid #F2F4F7" : "none",
                              bgcolor: place.isCurrentLocation ? "#F0F7FF" : "transparent",
                              "&:hover": { bgcolor: place.isCurrentLocation ? "#E0EFFF" : "#F8FAFC" },
                            }}
                          >
                            {place.isCurrentLocation ? (
                              <MyLocationIcon sx={{ color: "#0088ff", fontSize: 18, mt: 0.25, flexShrink: 0 }} />
                            ) : (
                              <LocationIcon sx={{ color: "#667085", fontSize: 18, mt: 0.25, flexShrink: 0 }} />
                            )}
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap" }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: "#1E293B", fontSize: "13px" }}>
                                  {place.name || place.display_name.split(",")[0]}
                                </Typography>
                                {place.isCurrentLocation && (
                                  <Chip
                                    size="small"
                                    label="Current Location"
                                    sx={{
                                      height: 18,
                                      fontSize: "10px",
                                      fontWeight: 700,
                                      bgcolor: "#DCEAFD",
                                      color: "#0070d6",
                                      borderRadius: "4px",
                                      px: 0.5,
                                    }}
                                  />
                                )}
                              </Box>
                              <Typography
                                variant="caption"
                                sx={{ color: "#64748B", fontSize: "11.5px", display: "block", wordBreak: "break-word" }}
                              >
                                {place.display_name}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Paper>
                    )}
                  </Box>
                </ClickAwayListener>
              )}

              {/* Mode B: Direct Map Link Paste & Scraper */}
              {locationMode === "link" && (
                <Stack spacing={1.5}>
                  <Box>
                    <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#344054", mb: 0.6 }}>
                      Paste Direct Map Link <span style={{ color: "#D92D20" }}>*</span>
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TextField
                        fullWidth
                        size="small"
                        value={pastedMapUrl}
                        onChange={(e) => setPastedMapUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleScrapeMapLink(pastedMapUrl);
                          }
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            height: "40px",
                            borderRadius: "10px",
                            backgroundColor: "#FFF",
                            fontSize: "13px",
                            "& fieldset": { borderColor: "#D0D5DD" },
                            "&:hover fieldset": { borderColor: "#98A2B3" },
                            "&.Mui-focused fieldset": { borderColor: "#0088ff" },
                          },
                          "& .MuiInputBase-input": {
                            py: "8.5px",
                            px: "12px",
                          },
                        }}
                      />
                      <Button
                        variant="contained"
                        onClick={() => handleScrapeMapLink(pastedMapUrl)}
                        disabled={isScrapingMap || !pastedMapUrl.trim()}
                        startIcon={isScrapingMap ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon sx={{ fontSize: 16 }} />}
                        sx={{
                          height: "40px",
                          borderRadius: "10px",
                          bgcolor: "#EBF3FE",
                          color: "#0088ff",
                          fontWeight: 700,
                          fontSize: "13px",
                          textTransform: "none",
                          px: 2.2,
                          whiteSpace: "nowrap",
                          boxShadow: "none",
                          border: "1px solid #CCE1FD",
                          "&:hover": { bgcolor: "#DCEAFD", boxShadow: "none" },
                          "&.Mui-disabled": { bgcolor: "#F2F4F7", color: "#98A2B3", borderColor: "#EAECF0" },
                        }}
                      >
                        Search
                      </Button>
                    </Stack>
                    {scrapeError && (
                      <Alert severity="error" sx={{ mt: 1, py: 0.2, px: 1.5, borderRadius: "8px", fontSize: "12px" }}>
                        {scrapeError}
                      </Alert>
                    )}
                  </Box>

                  {/* Location display/edit input */}
                  <Box>
                    <Typography sx={{ fontSize: "12px", fontWeight: 700, color: "#344054", mb: 0.6 }}>
                      Location Name & Address <span style={{ color: "#D92D20" }}>*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: "40px",
                          borderRadius: "10px",
                          backgroundColor: "#FFF",
                          fontSize: "13px",
                          "& fieldset": { borderColor: "#D0D5DD" },
                          "&:hover fieldset": { borderColor: "#98A2B3" },
                          "&.Mui-focused fieldset": { borderColor: "#0088ff" },
                        },
                        "& .MuiInputBase-input": {
                          py: "8.5px",
                          px: "12px",
                        },
                      }}
                    />
                  </Box>
                </Stack>
              )}
            </Box>

            {/* Open in Maps Link */}
            {/* {currentMapLink && (
              <Box>
                <Link
                  href={currentMapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: "#0088ff",
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  Open in Maps <OpenInNewIcon sx={{ fontSize: "13px !important" }} />
                </Link>
              </Box>
            )} */}

            {/* Live Embedded Map Preview */}
            {embedMapUrl && (
              <Box sx={{ borderRadius: "14px", overflow: "hidden", border: "1px solid #E4E7EC", bgcolor: "#F8FAFC" }}>
                <iframe
                  title="Event Location Pin"
                  width="100%"
                   height={locationMode === "search" ? "200" : "130"}
                  style={{ border: 0, display: "block" }}
                  loading="lazy"
                  src={embedMapUrl}
                />
              </Box>
            )}
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3.5,
            py: 2,
            bgcolor: "#FFF",
            borderTop: "1px solid #EAECF0",
            flexShrink: 0,
          }}
        >
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              borderColor: "#D0D5DD",
              color: "#344054",
              px: 2.5,
              py: 0.8,
              fontSize: "13px",
              fontWeight: 600,
              "&:hover": { borderColor: "#98A2B3", bgcolor: "#F9FAFB" },
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            sx={{
              bgcolor: "#0088ff",
              color: "#FFF",
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "13px",
              boxShadow: "none",
              px: 3,
              py: 0.8,
              "&:hover": { bgcolor: "#0070d6", boxShadow: "none" },
            }}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : isEdit ? "Save Changes" : "Schedule Event"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// ─── Header Action Button (Teleported to DashboardLayout header) ─────────────
function EventHeaderActions({ portalNode, canCreate, onOpenCreate }) {
  if (!canCreate || !onOpenCreate) return null;

  const actionButton = (
    <Stack direction="row" spacing={1} alignItems="center">
      <Button
        variant="contained"
        startIcon={<AddRoundedIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
        onClick={onOpenCreate}
        sx={{
          backgroundColor: '#0088ff',
          color: '#FFFFFF',
          fontWeight: 700,
          fontSize: { xs: '12px', sm: '13.5px' },
          borderRadius: '10px',
          textTransform: 'none',
          px: { xs: 1.5, sm: 2.2 },
          py: { xs: 0.6, sm: 0.8 },
          minWidth: 'auto',
          whiteSpace: 'nowrap',
          boxShadow: 'none',
          transition: 'all 0.15s ease',
          '&:hover': {
            backgroundColor: '#1465D0',
            boxShadow: '0 6px 18px rgba(24, 119, 242, 0.45)'
          }
        }}
      >
        Add Event
      </Button>
    </Stack>
  );

  if (portalNode) {
    return ReactDOM.createPortal(actionButton, portalNode);
  }

  return null;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EventList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const canManage = ["ADMIN", "WARDEN"].includes(user?.role);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Portal node to teleport 'Add Event' button to the dashboard layout header (matching Access Control)
  const [portalNode, setPortalNode] = useState(null);

  useEffect(() => {
    const el = document.getElementById("dashboard-header-actions");
    if (el) {
      setPortalNode(el);
    } else {
      const timer = setTimeout(() => {
        const delayedEl = document.getElementById("dashboard-header-actions");
        if (delayedEl) setPortalNode(delayedEl);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, []);

  // By default open All events tab
  const [view, setView] = useState("all");
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Lock mobile users to "all" events view
  useEffect(() => {
    if (isMobile && view !== "all") {
      setView("all");
    }
  }, [isMobile, view]);

  const [createOpen, setCreateOpen] = useState(false);
  const [defaultDate, setDefaultDate] = useState("");
  const [editData, setEditData] = useState(null);
  const [editId, setEditId] = useState(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Date range for the current calendar viewport (undefined for "all" to fetch all events)
  const { dateFrom, dateTo } = useMemo(() => {
    if (view === "all") {
      return { dateFrom: undefined, dateTo: undefined };
    }
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
      const params = { filter: "all" };
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await API.get("/events", { params });
      setEvents(res.data?.success ? res.data.data : []);
    } catch {
      setError("Could not load events.");
      enqueueSnackbar("Could not load events.", { variant: "error" });
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

  const handleOpenEdit = (ev) => {
    if (!canManage) return;
    setEditId(ev._id);
    setEditData({
      title: ev.title,
      description: ev.description,
      startDate: ev.startDate || ev.eventDate,
      endDate: ev.endDate || ev.startDate || ev.eventDate,
      eventDate: ev.startDate || ev.eventDate,
      startTime: ev.startTime,
      endTime: ev.endTime,
      location: ev.location,
      locationUrl: ev.locationUrl,
      locationCoordinates: ev.locationCoordinates,
      color: ev.color,
    });
    setDefaultDate("");
    setFormError("");
    setCreateOpen(true);
  };

  const [deleteEventTarget, setDeleteEventTarget] = useState(null);
  const [deletingEvent, setDeletingEvent] = useState(false);

  const handleOpenDeleteEventDialog = (ev) => {
    if (!canManage) return;
    setDeleteEventTarget(ev);
  };

  const handleConfirmDeleteEvent = async () => {
    if (!deleteEventTarget) return;
    setDeletingEvent(true);
    try {
      await API.delete(`/events/${deleteEventTarget._id}`);
      enqueueSnackbar("Event deleted successfully.", { variant: "success" });
      setDeleteEventTarget(null);
      fetchEvents();
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || "Failed to delete event.", { variant: "error" });
    } finally {
      setDeletingEvent(false);
    }
  };

  // Navigate to event detail page
  const handleNavigateToEvent = (ev) => {
    navigate(`/events/${ev._id}`);
  };

  const handleFormSubmit = async ({ title, description, startDate, endDate, eventDate, startTime, endTime, location, locationUrl, locationCoordinates, color }) => {
    const sDate = startDate || eventDate;
    const eDate = endDate || sDate;
    if (!title || !description || !sDate || !startTime || !endTime || !location) {
      setFormError("Please fill in all required fields."); return;
    }
    if (dayjs(eDate).isBefore(dayjs(sDate), "day")) {
      setFormError("End date cannot be earlier than start date."); return;
    }
    setFormError(""); setSubmitting(true);

    const payload = {
      title,
      description,
      startDate: sDate,
      endDate: eDate,
      eventDate: sDate,
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
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        height: { xs: "calc(100vh - 80px)", sm: "calc(100vh - 95px)", md: "calc(100vh - 110px)" },
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Header action button teleported to Dashboard header next to profile avatar (matching Access Control) */}
      <EventHeaderActions
        portalNode={portalNode}
        canCreate={canManage}
        onOpenCreate={() => handleOpenCreate()}
      />

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: "10px", flexShrink: 0 }} onClose={() => setError("")}>{error}</Alert>}

      {/* Calendar Card in full viewport height */}
      <Card
        sx={{
          p: 0,
          borderRadius: "16px",
          border: "1px solid #EAECF0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          bgcolor: "#fff",
          overflow: "hidden",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <CalendarToolbar
          view={view}
          onViewChange={setView}
          currentDate={currentDate}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={() => setCurrentDate(dayjs())}
          eventsCount={events.length}
          onOpenCreate={handleOpenCreate}
          canCreate={canManage}
        />

        {view === "all" && (
          <AllEventsView
            events={events}
            onOpenCreate={handleOpenCreate}
            onNavigate={handleNavigateToEvent}
            onOpenEdit={handleOpenEdit}
            onDeleteEvent={handleOpenDeleteEventDialog}
            isLoading={loading}
            canCreate={canManage}
          />
        )}
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

      {/* Delete Event Confirmation Modal */}
      <Dialog
        open={Boolean(deleteEventTarget)}
        onClose={deletingEvent ? undefined : () => setDeleteEventTarget(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            p: 1,
            boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
          },
        }}
      >
        <DialogContent sx={{ pt: 3, pb: 2, textAlign: "center" }}>
          <Box
            sx={{
              width: 54,
              height: 54,
              borderRadius: "50%",
              bgcolor: "#FEF2F2",
              color: "#DC2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <DeleteIcon sx={{ fontSize: 28 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#0F172A", mb: 1, fontSize: "18px" }}>
            Delete Event?
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748B", fontSize: "13.5px", lineHeight: 1.5 }}>
            Are you sure you want to delete this event and all its associated media assets? This action cannot be undone.
          </Typography>
          {deleteEventTarget?.title && (
            <Box
              sx={{
                p: 1.25,
                borderRadius: "8px",
                bgcolor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                mt: 2,
                fontWeight: 700,
                fontSize: "13px",
                color: "#1E293B",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {deleteEventTarget.title}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1.5, justifyContent: "center" }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={() => setDeleteEventTarget(null)}
            disabled={deletingEvent}
            sx={{
              borderRadius: "10px",
              borderColor: "#E2E8F0",
              color: "#475569",
              fontWeight: 700,
              textTransform: "none",
              fontSize: "13px",
              py: 1,
              "&:hover": { bgcolor: "#F8FAFC", borderColor: "#CBD5E1" },
            }}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleConfirmDeleteEvent}
            disabled={deletingEvent}
            sx={{
              borderRadius: "10px",
              bgcolor: "#DC2626",
              color: "#FFFFFF",
              fontWeight: 700,
              textTransform: "none",
              fontSize: "13px",
              py: 1,
              boxShadow: "0 2px 8px rgba(220, 38, 38, 0.25)",
              "&:hover": { bgcolor: "#B91C1C" },
            }}
          >
            {deletingEvent ? <CircularProgress size={18} color="inherit" /> : "Delete Event"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
