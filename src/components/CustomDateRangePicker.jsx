import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

import { Box, Button, Card, Stack, IconButton } from "@mui/material";

import {
  format,
  addDays,
  endOfDay,
  startOfDay,
  differenceInCalendarDays,
  isSameDay,
} from "date-fns";

import {
  DateRangePicker,
  DateRange,
  defaultStaticRanges,
} from "react-date-range";
import "react-date-range/dist/styles.css"; // main css file
import "react-date-range/dist/theme/default.css"; // theme css file
import styles from "./CustomDateRangePicker.module.css";

import { CalendarToday as CalendarIcon, Close as CloseIcon } from "@mui/icons-material";

const parsePickerDate = (value) => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string") {
    const dt = new Date(`${value}T00:00:00`);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  return null;
};

// Custom input ranges: 0-based (0 = today only, 1 = 1 day back/forward, etc.)
const getDefineds = () => {
  const now = new Date();
  return {
    startOfToday: startOfDay(now),
    endOfToday: endOfDay(now),
  };
};

const customInputRanges = [
  {
    label: "days up to today",
    range(value) {
      const defineds = getDefineds();
      const days = Math.max(Number(value), 0);
      return {
        startDate: addDays(defineds.startOfToday, -days),
        endDate: defineds.endOfToday,
      };
    },
    getCurrentValue(range) {
      const defineds = getDefineds();
      if (!isSameDay(range.endDate, defineds.endOfToday)) return "";
      if (!range.startDate) return "∞";
      return differenceInCalendarDays(defineds.endOfToday, range.startDate);
    },
  },
  {
    label: "days starting today",
    range(value) {
      const today = new Date();
      const days = Math.max(Number(value), 0);
      return {
        startDate: startOfDay(today),
        endDate: endOfDay(addDays(today, days)),
      };
    },
    getCurrentValue(range) {
      const defineds = getDefineds();
      if (!isSameDay(range.startDate, defineds.startOfToday)) return "";
      if (!range.endDate) return "∞";
      return differenceInCalendarDays(range.endDate, defineds.startOfToday);
    },
  },
];

// Returns the start of today in UTC (GMT) as a local Date object
const getTodayGMT = () => {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
};

const CustomDateRangePicker = ({
  onFilterRange,
  start,
  end,
  inputSize,
  btnSize,
  incApply,
  disablePast = false,
  compact = false,
  placeholder = "Filter by Joining Date",
}) => {
  const minDate = disablePast ? getTodayGMT() : undefined;
  const parsedStart = parsePickerDate(start);
  const parsedEnd = parsePickerDate(end);

  const [range, setRange] = useState([
    {
      startDate: parsedStart,
      endDate: parsedEnd,
      key: "selection",
    },
  ]);

  const startTime = parsedStart?.getTime?.() ?? null;
  const endTime = parsedEnd?.getTime?.() ?? null;

  useEffect(() => {
    setRange([
      {
        startDate: parsedStart,
        endDate: parsedEnd,
        key: "selection",
      },
    ]);
  }, [start, end, startTime, endTime]);

  const [calenderOpen, setCalenderOpen] = useState(false);

  const handleCalenderOpen = () => {
    setCalenderOpen(true);
  };
  const handleCalenderClose = () => {
    setCalenderOpen(false);
    if (
      incApply &&
      range[0].startDate &&
      range[0].endDate &&
      typeof onFilterRange === "function"
    ) {
      onFilterRange({
        startDate: range[0].startDate,
        endDate: range[0].endDate,
      });
    }
  };
  const handleClear = (e) => {
    if (e) e.stopPropagation();
    setRange([{ startDate: null, endDate: null, key: "selection" }]);
    if (typeof onFilterRange === "function") {
      onFilterRange(null);
    }
    setCalenderOpen(false);
  };
  const returnFilterValue = () => {
    if (
      range[0].startDate &&
      range[0].endDate &&
      typeof onFilterRange === "function"
    ) {
      onFilterRange({
        startDate: range[0].startDate,
        endDate: range[0].endDate,
      });
    }
    handleCalenderClose();
  };

  const refOne = useRef(null);

  // Hide on click outside calender widget
  const hideOnClickOutside = (e) => {
    if (refOne.current && !refOne.current.contains(e.target)) {
      handleCalenderClose();
    }
  };

  // useEffect(() => {
  //   document.addEventListener("click", hideOnClickOutside, true);
  // }, [range]);

  const formattedRange = range[0].startDate && range[0].endDate
    ? `${format(range[0].startDate, "MMM dd, yyyy")}  →  ${format(range[0].endDate, "MMM dd, yyyy")}`
    : "Select date range";

  const hasSelectedRange = Boolean(range[0].startDate && range[0].endDate);

  return (
    <div style={{ display: 'inline-block' }}>
      <div className={styles.dateRangePickerContainer}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ alignItems: "center" }}
        >
          <Box sx={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <Button
              onClick={handleCalenderOpen}
              variant="outlined"
              color="inherit"
              startIcon={<CalendarIcon sx={{ color: hasSelectedRange ? "#0088ff" : "text.disabled" }} />}
              sx={{
                borderColor: hasSelectedRange ? "#0088ff" : "rgba(145, 158, 171, 0.32)",
                color: hasSelectedRange ? "#0F172A" : "text.secondary",
                textTransform: "none",
                fontWeight: hasSelectedRange ? 600 : 500,
                padding: "6px 16px",
                pr: hasSelectedRange ? "34px" : "16px",
                minWidth: "240px",
                justifyContent: "flex-start",
                borderRadius: "8px",
                backgroundColor: hasSelectedRange ? "rgba(0, 136, 255, 0.04)" : "#fff",
                "&:hover": {
                  borderColor: hasSelectedRange ? "#0077ee" : "rgba(145, 158, 171, 0.5)",
                  backgroundColor: hasSelectedRange ? "rgba(0, 136, 255, 0.08)" : "#fff",
                }
              }}
            >
              {hasSelectedRange ? (
                <>
                  {format(range[0].startDate, "MMM dd, yyyy")}
                  <Box component="span" sx={{ mx: 1, color: "text.disabled", display: "inline-flex", alignItems: "center" }}>&rarr;</Box>
                  {format(range[0].endDate, "MMM dd, yyyy")}
                </>
              ) : (
                placeholder
              )}
            </Button>
            {hasSelectedRange && (
              <IconButton
                size="small"
                onClick={handleClear}
                title="Clear date filter"
                sx={{
                  position: "absolute",
                  right: 4,
                  p: 0.5,
                  color: "#94A3B8",
                  "&:hover": { color: "#EF4444", backgroundColor: "rgba(239, 68, 68, 0.08)" }
                }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}
          </Box>
          {!incApply && (
            <Button
              variant="contained"
              onClick={returnFilterValue}
              size={btnSize || "large"}
            >
              Apply
            </Button>
          )}
        </Stack>
        {createPortal(
          <div>
            {calenderOpen && (
              <Box
                sx={{
                  width: "100vw",
                  height: "100vh",
                  background: "rgb(142 142 142 / 30%)",
                  position: "fixed",
                  top: 0,
                  left: 0,
                  zIndex: 999999,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                onClick={hideOnClickOutside}
              >
                <Card
                  ref={refOne}
                  className={styles.dateRangePicker}
                  sx={{ padding: 1 }}
                >
                  <Stack spacing={1}>
                    <Box
                      sx={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <Button
                        sx={{ padding: 0, minWidth: "25px" }}
                        onClick={handleCalenderClose}
                      >
                        <CloseIcon
                          sx={{ width: "25px", height: "25px" }}
                        />
                      </Button>
                    </Box>
                    <Box sx={{ display: { xs: "none", md: "block" } }}>
                      <DateRangePicker
                        onChange={(item) => setRange([item.selection])}
                        showSelectionPreview={true}
                        moveRangeOnFirstSelection={false}
                        months={2}
                        ranges={range}
                        direction="horizontal"
                        editableDateInputs={true}
                        startDatePlaceholder="Start date..."
                        endDatePlaceholder="End date..."
                        minDate={minDate}
                        inputRanges={customInputRanges}
                        renderStaticRangeLabel={() => <>All Time</>}
                        staticRanges={[
                          ...defaultStaticRanges,
                          {
                            label: "AllTime",
                            hasCustomRendering: true,
                            range: () => ({
                              startDate: new Date("1950-01-01"),
                              endDate: new Date(),
                            }),
                            isSelected() {
                              return true;
                            },
                          },
                        ]}
                      />
                      {incApply && (
                        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", width: "100%", px: 2, pb: 1 }}>
                          <Button
                            onClick={handleClear}
                            variant="outlined"
                            color="inherit"
                            size="small"
                          >
                            Clear
                          </Button>
                          <Button
                            onClick={handleCalenderClose}
                            variant="contained"
                            size="small"
                          >
                            Apply
                          </Button>
                        </Stack>
                      )}
                    </Box>
                    <Box sx={{ display: { xs: "block", md: "none" } }}>
                      <DateRange
                        onChange={(item) => setRange([item.selection])}
                        showSelectionPreview={true}
                        moveRangeOnFirstSelection={false}
                        months={1}
                        ranges={range}
                        direction="vertical"
                        editableDateInputs={true}
                        startDatePlaceholder="Start date..."
                        endDatePlaceholder="End date..."
                        minDate={minDate}
                      />
                      {incApply && (
                        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", width: "100%", px: 2, pb: 1 }}>
                          <Button
                            onClick={handleClear}
                            variant="outlined"
                            color="inherit"
                            size="small"
                          >
                            Clear
                          </Button>
                          <Button
                            onClick={handleCalenderClose}
                            variant="contained"
                            size="small"
                          >
                            Apply
                          </Button>
                        </Stack>
                      )}
                    </Box>
                  </Stack>
                </Card>
              </Box>
            )}
          </div>,
          document.body,
        )}
      </div>
    </div>
  );
};
export default CustomDateRangePicker;
