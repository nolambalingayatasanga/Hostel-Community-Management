import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  Box,
  Container,
  Stack,
  Typography,
  Button,
  IconButton,
  Chip,
  Avatar,
  Card,
  TextField,
  CircularProgress,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Menu,
  Popover,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  EditRounded as EditIcon,
  DeleteOutlineRounded as DeleteIcon,
  CalendarTodayRounded as DateIcon,
  AccessTimeRounded as TimeIcon,
  LocationOnRounded as LocationIcon,
  PersonRounded as PersonIcon,
  StarRounded as StarIcon,
  StarBorderRounded as StarBorderIcon,
  Close as CloseIcon,
  CloudUploadRounded as CloudUploadIcon,
  ZoomInRounded as ZoomInIcon,
  ChevronLeftRounded as ChevronLeftIcon,
  ChevronRightRounded as ChevronRightIcon,
  ChatBubbleOutlineRounded as ChatIcon,
  ThumbUpRounded as ThumbUpFilledIcon,
  ThumbUpOutlined as ThumbUpOutlinedIcon,
  ReplyRounded as ReplyIcon,
  SentimentSatisfiedAltRounded as EmojiIcon,
  SecurityRounded as AdminShieldIcon,
  LockRounded as LockIcon,
  AddPhotoAlternateRounded as AddPhotoIcon,
  SwapVertRounded as ReorderIcon,
  GridViewRounded as GridViewIcon,
  MoreHorizRounded as MoreHorizIcon,
  ArrowUpwardRounded as ArrowUpwardIcon,
  ArrowDownwardRounded as ArrowDownwardIcon,
  FileDownloadRounded as DownloadIcon,
  CheckRounded as CheckIcon,
  CheckCircleRounded as CheckCircleIcon,
  SelectAllRounded as SelectAllIcon,
  OpenInNewRounded as OpenInNewIcon,
  SearchRounded as SearchIcon,
  PaletteRounded as PaletteIcon,
} from "@mui/icons-material";

import { useAuth } from "../../context/AuthContext";
import API from "../../api";
import { LocalizationProvider, DatePicker, TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useSnackbar } from "notistack";

dayjs.extend(relativeTime);

const EMOJI_LIST = ["👍", "❤️", "🎉", "🔥", "👏", "😊", "✨", "🙌", "☕", "🤩", "🥳", "💯"];

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

// ─── Star Rating Component ────────────────────────────────────────────────────
function StarRating({ value, onChange, readOnly = false, size = 28 }) {
  const [hovered, setHovered] = useState(0);
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Box
          key={star}
          onClick={() => !readOnly && onChange && onChange(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          sx={{
            cursor: readOnly ? "default" : "pointer",
            color: star <= (hovered || value) ? "#F59E0B" : "#CBD5E1",
            display: "inline-flex",
            transition: "transform 0.12s ease, color 0.12s ease",
            "&:hover": !readOnly ? { transform: "scale(1.2)" } : {},
          }}
        >
          {star <= (hovered || value) ? (
            <StarIcon sx={{ fontSize: size, color: "#F59E0B" }} />
          ) : (
            <StarBorderIcon sx={{ fontSize: size, color: "#CBD5E1" }} />
          )}
        </Box>
      ))}
    </Stack>
  );
}

// ─── Edit Event Dialog ─────────────────────────────────────────────────────────
function EditEventDialog({ open, onClose, event, onSaved }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [locationCoordinates, setLocationCoordinates] = useState(null);
  const [color, setColor] = useState("#0088ff");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Location suggestions state
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);

  useEffect(() => {
    if (open && event) {
      setTitle(event.title || "");
      setDescription(event.description || "");
      setEventDate(event.eventDate ? dayjs(event.eventDate).format("YYYY-MM-DD") : "");
      setStartTime(event.startTime || "");
      setEndTime(event.endTime || "");
      setLocation(event.location || "");
      setLocationQuery(event.location || "");
      setLocationUrl(event.locationUrl || "");
      setLocationCoordinates(event.locationCoordinates || null);
      setColor(event.color || "#0088ff");
      setFormError("");
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
    }
  }, [open, event]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !eventDate || !startTime || !endTime || !location) {
      setFormError("Please fill in all required fields.");
      return;
    }
    setFormError("");
    setSubmitting(true);

    const payload = {
      title,
      description,
      eventDate,
      startTime,
      endTime,
      location,
      locationUrl: locationUrl || (location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}` : ""),
      locationCoordinates,
      color: color || "#0088ff",
    };

    try {
      const res = await API.patch(`/events/${event._id}`, payload);
      if (res.data?.success) {
        onSaved(res.data.data.event);
        onClose();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save event.");
    } finally {
      setSubmitting(false);
    }
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
          borderRadius: "20px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #EAECF0",
          py: 2.5,
          px: 3.5,
          bgcolor: "#F8FAFC",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, fontSize: 17, color: "#1E293B" }}>
          Edit Event Details
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: "#94A3B8",
            bgcolor: "#FFF",
            border: "1px solid #E2E8F0",
            "&:hover": { bgcolor: "#F1F5F9", color: "#1E293B" },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ px: 3.5, py: 3, backgroundColor: "#FFF" }}>
          {formError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }}>
              {formError}
            </Alert>
          )}

          <Stack spacing={2.5}>
            <TextField
              fullWidth
              size="small"
              label="Event Title *"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  backgroundColor: "#F8FAFC",
                },
              }}
            />

            <TextField
              fullWidth
              size="small"
              label="Description *"
              multiline
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  backgroundColor: "#F8FAFC",
                },
              }}
            />

            {/* Event Color Picker */}
            <Box sx={{ pt: 0.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ color: "#475569", fontWeight: 700, fontSize: "12px" }}>
                  Event Theme Color *
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
                    {title || "Event Theme"}
                  </Typography>
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

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Event Date *"
                    value={eventDate ? dayjs(eventDate) : null}
                    onChange={(newValue) =>
                      setEventDate(newValue ? newValue.format("YYYY-MM-DD") : "")
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        size="small"
                        required
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "12px",
                            backgroundColor: "#F8FAFC",
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TimePicker
                    label="Start *"
                    value={startTime ? dayjs(`2000-01-01T${startTime}`) : null}
                    onChange={(newValue) =>
                      setStartTime(newValue ? newValue.format("HH:mm") : "")
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        size="small"
                        required
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "12px",
                            backgroundColor: "#F8FAFC",
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TimePicker
                    label="End *"
                    value={endTime ? dayjs(`2000-01-01T${endTime}`) : null}
                    onChange={(newValue) =>
                      setEndTime(newValue ? newValue.format("HH:mm") : "")
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        size="small"
                        required
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "12px",
                            backgroundColor: "#F8FAFC",
                          },
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>

            {/* Location & Map Search */}
            <Box sx={{ position: "relative" }}>
              <TextField
                fullWidth
                size="small"
                label="Venue / Location *"
                placeholder="Search or enter exact location"
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
                  },
                }}
              />

              {/* Suggestions dropdown */}
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

            {/* Embedded Live Map Preview */}
            {embedMapUrl && (
              <Box sx={{ borderRadius: "14px", overflow: "hidden", border: "1px solid #E2E8F0", bgcolor: "#F8FAFC" }}>
                <iframe
                  title="Edit Location Pin"
                  width="100%"
                  height="160"
                  style={{ border: 0, display: "block" }}
                  loading="lazy"
                  src={embedMapUrl}
                />
                <Box sx={{ px: 2, py: 1.25, display: "flex", justifyContent: "space-between", alignItems: "center", bgcolor: "#F8FAFC", borderTop: "1px solid #EAECF0" }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#10B981" }} />
                    <Typography variant="caption" sx={{ color: "#475569", fontWeight: 700, fontSize: "11.5px" }}>
                      Location Pin Ready
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
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3.5, pb: 3, pt: 2, borderTop: "1px solid #EAECF0", bgcolor: "#F8FAFC" }}>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              borderColor: "#D0D5DD",
              color: "#475569",
              px: 2.5,
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              bgcolor: color || "#0088ff",
              color: "#FFFFFF",
              px: 3,
              boxShadow: "none",
              "&:hover": { bgcolor: color || "#0077EE", filter: "brightness(0.92)", boxShadow: "none" },
            }}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : "Save Changes"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// ─── Top Media Carousel & Thumbnail Strip Component ───────────────────────────
function EventMediaHero({
  coverImage,
  additionalImages,
  onOpenAllMedia,
  onZoom,
  canManage = false,
  onManageMedia,
  sx = {},
}) {
  const images = useMemo(() => {
    const list = [];
    if (coverImage?.url) list.push({ url: coverImage.url, isCover: true });
    if (additionalImages && Array.isArray(additionalImages) && additionalImages.length > 0) {
      additionalImages.forEach((img) => {
        if (img?.url) list.push({ url: img.url, id: img._id });
      });
    }
    return list;
  }, [coverImage, additionalImages]);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeIndex >= images.length && images.length > 0) {
      setActiveIndex(0);
    }
  }, [images.length, activeIndex]);

  if (images.length === 0) {
    return (
      <Card
        sx={{
          borderRadius: "20px",
          border: "1px solid #E2E8F0",
          background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)",
          color: "#FFFFFF",
          p: { xs: 2.5, sm: 3.5 },
          mb: 3,
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 6px 24px rgba(67, 56, 202, 0.12)",
          ...sx,
        }}
      >
        {/* Decorative background glow circles */}
        <Box
          sx={{
            position: "absolute",
            top: -40,
            right: -30,
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.14) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: -30,
            left: "35%",
            width: 130,
            height: 130,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={2}
          sx={{ position: "relative", zIndex: 1 }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "8px",
                bgcolor: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#E0E7FF",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                flexShrink: 0,
              }}
            >
              <AddPhotoIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "15px" }}>
                No event photos yet
              </Typography>
              <Typography variant="body2" sx={{ color: "#C7D2FE", fontSize: "12.5px" }}>
                {canManage
                  ? "Upload a cover photo or event highlights to showcase this event."
                  : "Photos will appear here once uploaded by organizers."}
              </Typography>
            </Box>
          </Stack>

          {canManage && (
            <Button
              variant="contained"
              onClick={onManageMedia}
              startIcon={<AddPhotoIcon sx={{ fontSize: 18 }} />}
              sx={{
                bgcolor: "#FFFFFF",
                color: "#4338CA",
                fontWeight: 800,
                fontSize: "12.5px",
                textTransform: "none",
                borderRadius: "10px",
                px: 2,
                py: 0.85,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                whiteSpace: "nowrap",
                "&:hover": {
                  bgcolor: "#EEF2FF",
                },
              }}
            >
              Add Photos
            </Button>
          )}
        </Stack>
      </Card>
    );
  }

  const currentMedia = images[activeIndex] || images[0];

  const handleNext = (e) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Card
      sx={{
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid #EAECF0",
        boxShadow: "none",
        p: { xs: 1.5, sm: 2 },
        bgcolor: "#FFFFFF",
        mb: 3,
        display: "flex",
        flexDirection: "column",
        ...sx,
      }}
    >
      {/* Main Image Banner - balanced 16:9 proportion */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: { xs: 220, sm: 300, md: 350 },
          borderRadius: "16px",
          overflow: "hidden",
          bgcolor: "#0F172A",
          cursor: "pointer",
        }}
        onClick={() => onZoom(currentMedia.url)}
      >
        <Box
          component="img"
          src={currentMedia.url}
          alt="Event Media"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.4s ease",
            "&:hover": { transform: "scale(1.02)" },
          }}
        />

        {/* Count Pill Badge on Top-Right */}
        <Box
          sx={{
            position: "absolute",
            top: 14,
            right: 14,
            bgcolor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(6px)",
            color: "#FFFFFF",
            px: 1.5,
            py: 0.5,
            borderRadius: "16px",
            fontSize: "11.5px",
            fontWeight: 700,
            letterSpacing: "0.03em",
            zIndex: 3,
          }}
        >
          {activeIndex + 1} / {images.length}
        </Box>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <IconButton
              onClick={handlePrev}
              sx={{
                position: "absolute",
                top: "50%",
                left: 12,
                transform: "translateY(-50%)",
                bgcolor: "rgba(15, 23, 42, 0.65)",
                backdropFilter: "blur(4px)",
                color: "#FFFFFF",
                width: 36,
                height: 36,
                zIndex: 3,
                transition: "all 0.2s",
                "&:hover": { bgcolor: "rgba(15, 23, 42, 0.9)", transform: "translateY(-50%) scale(1.08)" },
              }}
              size="small"
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <IconButton
              onClick={handleNext}
              sx={{
                position: "absolute",
                top: "50%",
                right: 12,
                transform: "translateY(-50%)",
                bgcolor: "rgba(15, 23, 42, 0.65)",
                backdropFilter: "blur(4px)",
                color: "#FFFFFF",
                width: 36,
                height: 36,
                zIndex: 3,
                transition: "all 0.2s",
                "&:hover": { bgcolor: "rgba(15, 23, 42, 0.9)", transform: "translateY(-50%) scale(1.08)" },
              }}
              size="small"
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </>
        )}
      </Box>

      {/* Thumbnail Strip Below Main Image */}
      <Stack
        direction="row"
        spacing={1.25}
        alignItems="center"
        sx={{
          mt: 1.75,
          overflowX: "auto",
          py: 0.5,
          "&::-webkit-scrollbar": { height: 5 },
          "&::-webkit-scrollbar-thumb": { bgcolor: "#E2E8F0", borderRadius: 3 },
        }}
      >
        <Stack direction="row" spacing={1.25} sx={{ flex: 1, overflowX: "auto" }}>
          {images.map((img, idx) => {
            const isActive = activeIndex === idx;
            return (
              <Tooltip key={idx} title={`Photo ${idx + 1}`} arrow placement="top">
                <Box
                  onClick={() => setActiveIndex(idx)}
                  sx={{
                    position: "relative",
                    width: { xs: 56, sm: 72 },
                    height: { xs: 40, sm: 50 },
                    flexShrink: 0,
                    borderRadius: "8px",
                    overflow: "hidden",
                    cursor: "pointer",
                    border: isActive ? "2.5px solid #7C3AED" : "2px solid #F1F5F9",
                    opacity: isActive ? 1 : 0.7,
                    transition: "all 0.2s ease",
                    "&:hover": { opacity: 1, transform: "translateY(-1px)" },
                  }}
                >
                  <Box
                    component="img"
                    src={img.url}
                    alt={`thumbnail-${idx}`}
                    sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </Box>
              </Tooltip>
            );
          })}
        </Stack>

        {/* View All Media Button on the Far Right */}
        <Button
          variant="outlined"
          onClick={onOpenAllMedia}
          startIcon={<GridViewIcon sx={{ fontSize: 16, color: "#7C3AED" }} />}
          sx={{
            flexShrink: 0,
            borderRadius: "10px",
            borderColor: "#DDD6FE",
            bgcolor: "#F5F3FF",
            color: "#7C3AED",
            textTransform: "none",
            fontWeight: 700,
            fontSize: "12px",
            px: 1.5,
            py: 0.75,
            "&:hover": {
              borderColor: "#7C3AED",
              bgcolor: "#EDE9FE",
            },
          }}
        >
          View all ({images.length})
        </Button>
      </Stack>
    </Card>
  );
}

// ─── Delete Confirmation Modal ───────────────────────────────────────────────
function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Delete Event",
  message = "",
  confirmText = "Delete Event",
  loading = false,
  itemName = "",
}) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
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
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748B", fontSize: "13.5px", lineHeight: 1.5 }}>
          {message}
        </Typography>
        {itemName && (
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
            {itemName}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1.5, justifyContent: "center" }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={onClose}
          disabled={loading}
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
          onClick={onConfirm}
          disabled={loading}
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
          {loading ? <CircularProgress size={18} color="inherit" /> : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── View All Media Dialog ───────────────────────────────────────────────────
function ViewAllMediaDialog({
  open,
  onClose,
  images = [],
  eventId,
  canManage = false,
  eventAdditionalImages = [],
  onUpdated = () => { },
  onZoom = () => { },
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  // Reset selections when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
    }
  }, [open]);

  // Helper for single download
  const downloadSingleImage = async (url, customName = "KSH_Gallery.jpg") => {
    try {
      const response = await fetch(url, { mode: "cors" });
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = customName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (corsErr) {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.download = customName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Toggle single item selection
  const handleToggleSelect = (id, e) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select all or deselect all
  const handleToggleSelectAll = () => {
    if (selectedIds.length === images.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(images.map((img) => img._id || img.id));
    }
  };

  // Batch download selected
  const handleDownloadSelected = async () => {
    if (selectedIds.length === 0) return;
    setDownloading(true);
    try {
      let index = 1;
      for (const id of selectedIds) {
        const item = images.find((img) => (img._id || img.id) === id);
        if (!item) continue;
        const filename =
          selectedIds.length > 1
            ? `KSH_Gallery_${index}.jpg`
            : "KSH_Gallery.jpg";
        index++;
        await downloadSingleImage(item.url, filename);
      }
      enqueueSnackbar(`Downloaded ${selectedIds.length} item(s)`, {
        variant: "success",
      });
    } catch (err) {
      enqueueSnackbar("Error downloading items", { variant: "error" });
    } finally {
      setDownloading(false);
    }
  };

  // Batch delete selected (Admin only)
  const handleDeleteSelected = async () => {
    const deletableList = images.filter(
      (img) => selectedIds.includes(img._id || img.id) && !img.isCover
    );

    if (deletableList.length === 0) {
      enqueueSnackbar(
        "Cover image cannot be deleted here. Change it in Edit Event.",
        { variant: "warning" }
      );
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete ${deletableList.length} selected photo(s) from Cloudinary & this event?`
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      let latestList = eventAdditionalImages || [];
      for (const img of deletableList) {
        const imgId = img._id || img.id;
        const res = await API.delete(`/events/${eventId}/gallery/${imgId}`);
        if (res.data?.success) {
          latestList = res.data.data.additionalImages || [];
        }
      }
      onUpdated(latestList);
      setSelectedIds([]);
      enqueueSnackbar(`Successfully deleted ${deletableList.length} photo(s)`, {
        variant: "success",
      });
    } catch (err) {
      enqueueSnackbar(
        err.response?.data?.message || "Failed to delete selected photos",
        { variant: "error" }
      );
    } finally {
      setDeleting(false);
    }
  };

  // Single delete (Admin only)
  const handleDeleteSingle = async (img, e) => {
    if (e) e.stopPropagation();
    if (img.isCover) {
      enqueueSnackbar(
        "Cover photo cannot be deleted here. Change it in Edit Event.",
        { variant: "warning" }
      );
      return;
    }

    if (
      !window.confirm(
        ""
      )
    ) {
      return;
    }

    try {
      const imgId = img._id || img.id;
      const res = await API.delete(`/events/${eventId}/gallery/${imgId}`);
      if (res.data?.success) {
        const updatedList = res.data.data.additionalImages || [];
        onUpdated(updatedList);
        setSelectedIds((prev) => prev.filter((id) => id !== imgId));
        enqueueSnackbar("Photo deleted successfully", { variant: "success" });
      }
    } catch (err) {
      enqueueSnackbar(
        err.response?.data?.message || "Failed to delete photo",
        { variant: "error" }
      );
    }
  };

  const deletableSelectedCount = images.filter(
    (img) => selectedIds.includes(img._id || img.id) && !img.isCover
  ).length;

  const isAllSelected = images.length > 0 && selectedIds.length === images.length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          height: "90dvh",
          minHeight: "90dvh",

          borderRadius: "24px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          bgcolor: "#FFFFFF",
        },
      }}
    >

      {/* ── Action Bar / Selection Controls Toolbar ── */}
      <Box
        sx={{
          px: 3.5,
          py: 1.5,
          bgcolor: "#F8FAFC",
          borderBottom: "1px solid #EAECF0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            size="small"
            variant="outlined"
            onClick={handleToggleSelectAll}
            startIcon={<SelectAllIcon sx={{ fontSize: 18 }} />}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "13px",
              borderColor: "#E2E8F0",
              color: "#334155",
              bgcolor: "#FFFFFF",
              "&:hover": {
                borderColor: "#CBD5E1",
                bgcolor: "#F1F5F9",
              },
            }}
          >
            {isAllSelected ? "Deselect All" : "Select All"}
          </Button>

          {selectedIds.length > 0 && (
            <Chip
              label={`${selectedIds.length} Selected`}
              size="small"
              onDelete={() => setSelectedIds([])}
              sx={{
                bgcolor: "#EDE9FE",
                color: "#7C3AED",
                fontWeight: 700,
                fontSize: "12px",
                "& .MuiChip-deleteIcon": {
                  color: "#7C3AED",
                  "&:hover": { color: "#6D28D9" },
                },
              }}
            />
          )}
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          {/* Download Selected (Available for all users) */}
          <Button
            size="small"
            variant="contained"
            disabled={selectedIds.length === 0 || downloading}
            onClick={handleDownloadSelected}
            startIcon={
              downloading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <DownloadIcon sx={{ fontSize: 18 }} />
              )
            }
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "13px",
              bgcolor: "#7C3AED",
              color: "#FFFFFF",
              boxShadow: "none",
              "&:hover": {
                bgcolor: "#6D28D9",
                boxShadow: "0 4px 12px rgba(124, 58, 237, 0.25)",
              },
              "&.Mui-disabled": {
                bgcolor: "#E2E8F0",
                color: "#94A3B8",
              },
            }}
          >
            {downloading
              ? "Downloading..."
              : `Download${selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}`}
          </Button>

          {/* Delete Selected (Admin / Staff only) */}
          {canManage && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              disabled={deletableSelectedCount === 0 || deleting}
              onClick={handleDeleteSelected}
              startIcon={
                deleting ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <DeleteIcon sx={{ fontSize: 18 }} />
                )
              }
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "13px",
                borderColor: "#FCA5A5",
                color: "#DC2626",
                bgcolor: "#FEF2F2",
                "&:hover": {
                  bgcolor: "#FEE2E2",
                  borderColor: "#EF4444",
                },
                "&.Mui-disabled": {
                  borderColor: "#E2E8F0",
                  bgcolor: "transparent",
                  color: "#94A3B8",
                },
              }}
            >
              {deleting
                ? "Deleting..."
                : `Delete${deletableSelectedCount > 0 ? ` (${deletableSelectedCount})` : ""}`}
            </Button>
          )}

          <IconButton
            onClick={onClose}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "13px",
              borderColor: "#FCA5A5",
              color: "#DC2626",
              bgcolor: "#FEF2F2",
              "&:hover": {
                bgcolor: "#FEE2E2",
                borderColor: "#EF4444",
              },
              "&.Mui-disabled": {
                borderColor: "#E2E8F0",
                bgcolor: "transparent",
                color: "#94A3B8",
              },
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>


      </Box>

      {/* ── Dialog Content: Cards Grid ── */}
      <DialogContent sx={{ p: 3.5, bgcolor: "#F8FAFC", flex: 1, overflowY: "auto" }}>
        {images.length === 0 ? (
          <Box
            sx={{
              py: 10,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: "#EDE9FE",
                color: "#7C3AED",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <GridViewIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#1E293B" }}>
              No Media Uploaded
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748B" }}>
              There are no photos or videos attached to this event yet.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2.5}>
            {images.map((img, index) => {
              const imgId = img._id || img.id;
              const isSelected = selectedIds.includes(imgId);

              return (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={imgId || index}>
                  <Card
                    sx={{
                      borderRadius: "16px",
                      overflow: "hidden",
                      border: isSelected ? "2px solid #7C3AED" : "1px solid #EAECF0",
                      boxShadow: isSelected
                        ? "0 10px 24px rgba(124, 58, 237, 0.18)"
                        : "0 2px 8px rgba(0,0,0,0.04)",
                      position: "relative",
                      bgcolor: "#FFFFFF",
                      transition:
                        "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 12px 28px rgba(15, 23, 42, 0.1)",
                        "& .card-hover-overlay": { opacity: 1 },
                        "& .card-media-img": { transform: "scale(1.06)" },
                        "& .card-select-btn": { opacity: 1 },
                      },
                    }}
                  >
                    {/* Media Aspect Ratio Container */}
                    <Box
                      onClick={() => {
                        onZoom(img.url);
                      }}
                      sx={{
                        position: "relative",
                        paddingTop: "72%",
                        cursor: "pointer",
                        overflow: "hidden",
                        bgcolor: "#F1F5F9",
                      }}
                    >
                      <Box
                        component="img"
                        src={img.url}
                        alt={img.caption || `Media ${index + 1}`}
                        className="card-media-img"
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          transition: "transform 0.35s ease",
                        }}
                      />

                      {/* Top-Left Selection Checkbox */}
                      <Box
                        className="card-select-btn"
                        onClick={(e) => handleToggleSelect(imgId, e)}
                        sx={{
                          position: "absolute",
                          top: 10,
                          left: 10,
                          zIndex: 4,
                          width: 28,
                          height: 28,
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          bgcolor: isSelected
                            ? "#7C3AED"
                            : "rgba(255, 255, 255, 0.85)",
                          border: isSelected
                            ? "none"
                            : "1.5px solid rgba(0, 0, 0, 0.2)",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                          backdropFilter: "blur(4px)",
                          opacity: isSelected ? 1 : 0.85,
                          "&:hover": {
                            transform: "scale(1.1)",
                            bgcolor: isSelected ? "#6D28D9" : "#FFFFFF",
                          },
                        }}
                      >
                        {isSelected && (
                          <CheckIcon
                            sx={{ color: "#FFFFFF", fontSize: 18, fontWeight: 900 }}
                          />
                        )}
                      </Box>

                      {/* Top-Right: Cover Badge OR Admin Single Delete */}
                      {img.isCover ? (
                        <Box
                          sx={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            zIndex: 4,
                            bgcolor: "rgba(124, 58, 237, 0.92)",
                            backdropFilter: "blur(4px)",
                            color: "#FFFFFF",
                            px: 1.2,
                            py: 0.4,
                            borderRadius: "8px",
                            fontSize: "11px",
                            fontWeight: 800,
                            letterSpacing: "0.02em",
                            pointerEvents: "none",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                          }}
                        >
                          Cover Photo
                        </Box>
                      ) : (
                        canManage && (
                          <IconButton
                            onClick={(e) => handleDeleteSingle(img, e)}
                            size="small"
                            sx={{
                              position: "absolute",
                              top: 10,
                              right: 10,
                              zIndex: 4,
                              width: 30,
                              height: 30,
                              borderRadius: "8px",
                              bgcolor: "rgba(15, 23, 42, 0.65)",
                              color: "#FFFFFF",
                              backdropFilter: "blur(4px)",
                              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                              "&:hover": {
                                bgcolor: "rgba(239, 68, 68, 0.95)",
                                transform: "scale(1.08)",
                              },
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        )
                      )}

                      {/* Bottom Gradient Hover Overlay with Quick Actions */}
                      <Box
                        className="card-hover-overlay"
                        sx={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: "60px",
                          background:
                            "linear-gradient(to top, rgba(15, 23, 42, 0.88) 0%, rgba(15, 23, 42, 0.4) 60%, transparent 100%)",
                          opacity: 0,
                          transition: "opacity 0.25s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          px: 2,
                          pb: 1,
                          zIndex: 3,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#FFFFFF",
                            fontWeight: 700,
                            fontSize: "12px",
                            textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                          }}
                        >
                          {img.isCover ? "Cover Photo" : `Photo #${index + 1}`}
                        </Typography>

                        <Stack direction="row" spacing={1} alignItems="center">
                          {/* Zoom Action */}
                          <Tooltip title="Preview / Fullscreen" arrow>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onZoom(img.url);
                              }}
                              sx={{
                                width: 28,
                                height: 28,
                                bgcolor: "rgba(255, 255, 255, 0.2)",
                                color: "#FFFFFF",
                                backdropFilter: "blur(4px)",
                                "&:hover": {
                                  bgcolor: "rgba(255, 255, 255, 0.4)",
                                  transform: "scale(1.1)",
                                },
                              }}
                            >
                              <ZoomInIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>

                          {/* Single Download Action */}
                          <Tooltip title="Download Photo (KSH_Gallery)" arrow>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadSingleImage(img.url, "KSH_Gallery.jpg");
                                enqueueSnackbar("Downloaded photo", {
                                  variant: "success",
                                });
                              }}
                              sx={{
                                width: 28,
                                height: 28,
                                bgcolor: "rgba(255, 255, 255, 0.2)",
                                color: "#FFFFFF",
                                backdropFilter: "blur(4px)",
                                "&:hover": {
                                  bgcolor: "rgba(255, 255, 255, 0.4)",
                                  transform: "scale(1.1)",
                                },
                              }}
                            >
                              <DownloadIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Image Lightbox Component ────────────────────────────────────────────────
function ImageLightbox({ open, onClose, imageUrl, canManage = false, currentImage = null, eventId, onDeleted }) {
  const { enqueueSnackbar } = useSnackbar();
  const [deleteLoading, setDeleteLoading] = useState(false);

  const downloadCurrentImage = async (url) => {
    try {
      const response = await fetch(url, { mode: "cors" });
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "KSH_Gallery.jpg";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (corsErr) {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.download = "KSH_Gallery.jpg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleDeleteFromLightbox = async () => {
    if (!currentImage || currentImage.isCover) {
      enqueueSnackbar("Cover photo cannot be deleted here. Change it in Edit Event.", { variant: "warning" });
      return;
    }
    if (!window.confirm("Are you sure you want to permanently delete this photo from Cloudinary & this event?")) return;
    setDeleteLoading(true);
    try {
      const imgId = currentImage._id || currentImage.id;
      const res = await API.delete(`/events/${eventId}/gallery/${imgId}`);
      if (res.data?.success) {
        const updatedList = res.data.data.additionalImages || [];
        if (onDeleted) onDeleted(updatedList);
        enqueueSnackbar("Photo deleted successfully", { variant: "success" });
        onClose();
      }
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || "Failed to delete photo", { variant: "error" });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!open) return null;

  const isDeletable = canManage && currentImage && !currentImage.isCover;

  return (
    <Box
      onClick={onClose}
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1700,
        bgcolor: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(14px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "zoom-out",
      }}
    >
      {/* Top-Right Action Icons — fixed to viewport corner */}
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          position: "fixed",
          top: 20,
          right: 24,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          zIndex: 1800,
        }}
      >
        <Tooltip title="Download (KSH_Gallery)" arrow>
          <IconButton
            onClick={() => downloadCurrentImage(imageUrl)}
            sx={{
              color: "#FFFFFF",
              bgcolor: "rgba(30, 30, 30, 0.85)",
              border: "1px solid rgba(255,255,255,0.18)",
              width: 40,
              height: 40,
              backdropFilter: "blur(6px)",
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: "#7C3AED",
                borderColor: "#7C3AED",
                transform: "scale(1.1)",
              },
            }}
          >
            <DownloadIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>

        {isDeletable && (
          <Tooltip title="Delete Photo" arrow>
            <IconButton
              onClick={handleDeleteFromLightbox}
              disabled={deleteLoading}
              sx={{
                color: "#FFFFFF",
                bgcolor: "rgba(30, 30, 30, 0.85)",
                border: "1px solid rgba(255,255,255,0.18)",
                width: 40,
                height: 40,
                backdropFilter: "blur(6px)",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: "rgba(239, 68, 68, 0.95)",
                  borderColor: "#EF4444",
                  transform: "scale(1.1)",
                },
              }}
            >
              {deleteLoading ? <CircularProgress size={18} sx={{ color: "#FFF" }} /> : <DeleteIcon sx={{ fontSize: 20 }} />}
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title="Close (Esc)" arrow>
          <IconButton
            onClick={onClose}
            aria-label="close preview"
            sx={{
              color: "#FFFFFF",
              bgcolor: "rgba(30, 30, 30, 0.85)",
              border: "1px solid rgba(255,255,255,0.18)",
              width: 40,
              height: 40,
              backdropFilter: "blur(6px)",
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: "rgba(239, 68, 68, 0.95)",
                borderColor: "#EF4444",
                transform: "scale(1.1)",
              },
            }}
          >
            <CloseIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Centered Image */}
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          maxWidth: "88vw",
          maxHeight: "88vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "default",
        }}
      >
        <Box
          component="img"
          src={imageUrl}
          alt="Fullscreen media preview"
          sx={{
            maxWidth: "100%",
            maxHeight: "86vh",
            objectFit: "contain",
            borderRadius: "12px",
            boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.6)",
            userSelect: "none",
          }}
        />
      </Box>
    </Box>
  );
}

// ─── Manage Media / Add Photos Dialog ─────────────────────────────────────────
function ManageMediaDialog({
  open,
  onClose,
  eventId,
  additionalImages = [],
  onUpdated,
}) {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (open) {
      setImages(additionalImages || []);
      setError("");
    }
  }, [open, additionalImages]);

  const handleFileSelectAndUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files).filter((file) =>
      file.type.startsWith("image/")
    );
    if (files.length === 0) {
      setError("Please select valid image files.");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("galleryImages", file);
    });

    try {
      const res = await API.post(`/events/${eventId}/gallery`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.success) {
        const updatedList = res.data.data.additionalImages || [];
        setImages(updatedList);
        onUpdated(updatedList);
        enqueueSnackbar("Photos uploaded successfully to Cloudinary!", { variant: "success" });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload images.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm("Delete this photo permanently from Cloudinary & Event?")) return;
    try {
      const res = await API.delete(`/events/${eventId}/gallery/${imageId}`);
      if (res.data?.success) {
        const updatedList = res.data.data.additionalImages || [];
        setImages(updatedList);
        onUpdated(updatedList);
        enqueueSnackbar("Photo deleted", { variant: "info" });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete image.");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: "20px", overflow: "hidden" },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #EAECF0",
          py: 2.5,
          px: 3.5,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <AddPhotoIcon sx={{ color: "#7C3AED" }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#1E293B" }}>
            Manage Media / Add Photos
          </Typography>
        </Stack>
        <IconButton onClick={onClose} size="small" sx={{ color: "#94A3B8" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3.5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }}>
            {error}
          </Alert>
        )}

        {/* Upload Button Section */}
        <Box
          sx={{
            border: "2px dashed #D0D5DD",
            p: 3,
            borderRadius: "8px",
            textAlign: "center",
            bgcolor: "#F8FAFC",
            cursor: uploading ? "default" : "pointer",
            mb: 3.5,
            transition: "all 0.2s",
            "&:hover": { borderColor: "#7C3AED", bgcolor: "rgba(124, 58, 237, 0.03)" },
          }}
          onClick={() => {
            if (!uploading) document.getElementById("manage-media-direct-upload").click();
          }}
        >
          <input
            id="manage-media-direct-upload"
            type="file"
            multiple
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileSelectAndUpload}
            disabled={uploading}
          />
          {uploading ? (
            <Stack alignItems="center" spacing={1}>
              <CircularProgress size={32} sx={{ color: "#7C3AED" }} />
              <Typography variant="body2" sx={{ fontWeight: 700, color: "#7C3AED" }}>
                Uploading to Cloudinary...
              </Typography>
            </Stack>
          ) : (
            <>
              <CloudUploadIcon sx={{ fontSize: 36, color: "#7C3AED", mb: 1 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#334155", mb: 0.5 }}>
                Click to Select and Upload Photos
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748B" }}>
                Supports JPG, PNG, WEBP (Multiple files supported)
              </Typography>
            </>
          )}
        </Box>

        {/* Existing Photos List */}
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1E293B", mb: 2 }}>
          Gallery Photos ({images.length})
        </Typography>

        {images.length === 0 ? (
          <Typography variant="body2" sx={{ color: "#94A3B8", fontStyle: "italic", textAlign: "center", py: 3 }}>
            No additional gallery photos yet. Upload photos above.
          </Typography>
        ) : (
          <Stack spacing={1.5} sx={{ maxHeight: 300, overflowY: "auto", pr: 1 }}>
            {images.map((img, idx) => (
              <Stack
                key={img._id || idx}
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  border: "1px solid #EAECF0",
                  bgcolor: "#FFFFFF",
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#94A3B8", width: 24 }}>
                  #{idx + 1}
                </Typography>
                <Box
                  component="img"
                  src={img.url}
                  alt={`Photo ${idx + 1}`}
                  sx={{ width: 56, height: 44, borderRadius: "8px", objectFit: "cover" }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Tooltip title={`Photo ${idx + 1}`} arrow placement="top">
                    <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: "#334155" }}>
                      Photo {idx + 1}
                    </Typography>
                  </Tooltip>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => handleDeleteImage(img._id)}
                  sx={{ color: "#EF4444", "&:hover": { bgcolor: "#FEE2E2" } }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3.5, pb: 2.5, pt: 2, borderTop: "1px solid #EAECF0", bgcolor: "#F8FAFC" }}>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            bgcolor: "#7C3AED",
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 700,
            px: 3,
            "&:hover": { bgcolor: "#6D28D9" },
          }}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Reorder Media Dialog ─────────────────────────────────────────────────────
function ReorderMediaDialog({
  open,
  onClose,
  eventId,
  additionalImages = [],
  onUpdated,
}) {
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (open) {
      setImages(additionalImages || []);
      setError("");
    }
  }, [open, additionalImages]);

  const handleMove = (index, direction) => {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= images.length) return;
    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    setImages(updated);
  };

  const handleSaveOrder = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await API.patch(`/events/${eventId}/gallery/reorder`, {
        orderedImages: images,
      });
      if (res.data?.success) {
        onUpdated(res.data.data.additionalImages);
        enqueueSnackbar("Media order updated successfully!", { variant: "success" });
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save order.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: "20px", overflow: "hidden" },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #EAECF0",
          py: 2.5,
          px: 3.5,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <ReorderIcon sx={{ color: "#7C3AED" }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#1E293B" }}>
            Reorder Media
          </Typography>
        </Stack>
        <IconButton onClick={onClose} size="small" sx={{ color: "#94A3B8" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3.5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }}>
            {error}
          </Alert>
        )}

        <Typography variant="body2" sx={{ color: "#64748B", mb: 2.5 }}>
          Use the up and down arrows to change the sequence of photos displayed in the thumbnail preview strip.
        </Typography>

        {images.length === 0 ? (
          <Typography variant="body2" sx={{ color: "#94A3B8", fontStyle: "italic", textAlign: "center", py: 4 }}>
            No additional gallery photos to reorder.
          </Typography>
        ) : (
          <Stack spacing={1.5} sx={{ maxHeight: 360, overflowY: "auto", pr: 1 }}>
            {images.map((img, idx) => (
              <Stack
                key={img._id || idx}
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{
                  p: 1.5,
                  borderRadius: "12px",
                  border: "1px solid #EAECF0",
                  bgcolor: "#FFFFFF",
                  "&:hover": { bgcolor: "#F8FAFC" },
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#94A3B8", width: 24 }}>
                  #{idx + 1}
                </Typography>
                <Box
                  component="img"
                  src={img.url}
                  alt={`Photo ${idx + 1}`}
                  sx={{ width: 64, height: 48, borderRadius: "8px", objectFit: "cover" }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Tooltip title={`Photo ${idx + 1}`} arrow placement="top">
                    <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: "#334155" }}>
                      Photo {idx + 1}
                    </Typography>
                  </Tooltip>
                </Box>
                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    size="small"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, -1)}
                    sx={{ color: "#64748B" }}
                  >
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={idx === images.length - 1}
                    onClick={() => handleMove(idx, 1)}
                    sx={{ color: "#64748B" }}
                  >
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3.5, pb: 2.5, pt: 2, borderTop: "1px solid #EAECF0", bgcolor: "#F8FAFC" }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ borderRadius: "10px", textTransform: "none", color: "#475569", borderColor: "#D0D5DD" }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSaveOrder}
          disabled={saving || images.length === 0}
          sx={{
            bgcolor: "#7C3AED",
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 700,
            px: 3,
            "&:hover": { bgcolor: "#6D28D9" },
          }}
        >
          {saving ? <CircularProgress size={20} color="inherit" /> : "Save Order"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Visitor Rating Card Component (For users only) ───────────────────────────
function VisitorOneLineRatingCard({ myRating, onRate, submitting, sx = {} }) {
  return (
    <Card
      sx={{
        borderRadius: "12px",
        border: "1px solid #EAECF0",
        boxShadow: "none",
        bgcolor: "#FFFFFF",
        p: 2.5,
        mb: 3,
        ...sx,
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "12px",
              bgcolor: "#FEF3C7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <StarIcon sx={{ fontSize: 22, color: "#F59E0B" }} />
          </Box>
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 800,
                color: "#0F172A",
                fontSize: "14px",
                letterSpacing: "-0.01em",
              }}
            >
              {myRating > 0 ? "Your Rating" : "Rate this event"}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B", fontSize: "11px", display: "block" }}>
              {myRating > 0 ? `You rated this ${myRating} star${myRating > 1 ? "s" : ""}` : "Tap stars to share feedback"}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ pt: 0.5 }}>
          <StarRating value={myRating} onChange={onRate} size={28} />
          {submitting && <CircularProgress size={16} sx={{ color: "#7C3AED", ml: 1 }} />}
        </Stack>
      </Stack>
    </Card>
  );
}

// ─── Nested Comments System Component ────────────────────────────────────────
function EventCommentsSection({
  eventId,
  comments = [],
  onCommentsUpdated,
  user,
}) {
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [postingReply, setPostingReply] = useState(false);

  // Emoji Popover
  const [emojiAnchor, setEmojiAnchor] = useState(null);

  // Menu for delete
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);

  // Helper to render text with @mentions highlighted in #0088ff
  const renderMentionText = (text) => {
    if (!text) return null;

    // Collect all user names from comments and replies for accurate mention matching
    const namesSet = new Set();
    comments.forEach((c) => {
      if (c.user?.name) namesSet.add(c.user.name.trim());
      if (c.replies) {
        c.replies.forEach((r) => {
          if (r.user?.name) namesSet.add(r.user.name.trim());
        });
      }
    });

    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const sortedNames = Array.from(namesSet).sort((a, b) => b.length - a.length);
    const namesPattern = sortedNames.length > 0 
      ? sortedNames.map(escapeRegExp).join("|") + "|" 
      : "";

    const regex = new RegExp(`(@(?:${namesPattern}[A-Za-z0-9_.-]+))`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (part.startsWith("@") && part.length > 1) {
        return (
          <Box
            component="span"
            key={index}
            sx={{
              color: "#0088ff",
              fontWeight: 700,
              display: "inline",
            }}
          >
            {part}
          </Box>
        );
      }
      return part;
    });
  };

  const handlePostComment = async () => {
    if (!commentText.trim() || postingComment) return;
    setPostingComment(true);
    try {
      const res = await API.post(`/events/${eventId}/comments`, { text: commentText.trim() });
      if (res.data?.success) {
        onCommentsUpdated(res.data.data.comments);
        setCommentText("");
      }
    } catch {
      /* ignore */
    } finally {
      setPostingComment(false);
    }
  };

  const handlePostReply = async (commentId) => {
    if (!replyText.trim() || postingReply) return;
    setPostingReply(true);
    try {
      const res = await API.post(`/events/${eventId}/comments/${commentId}/reply`, {
        text: replyText.trim(),
      });
      if (res.data?.success) {
        onCommentsUpdated(res.data.data.comments);
        setReplyText("");
        setReplyingToCommentId(null);
      }
    } catch {
      /* ignore */
    } finally {
      setPostingReply(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const res = await API.post(`/events/${eventId}/comments/${commentId}/like`);
      if (res.data?.success) {
        onCommentsUpdated(res.data.data.comments);
      }
    } catch {
      /* ignore */
    }
  };

  const handleLikeReply = async (commentId, replyId) => {
    try {
      const res = await API.post(
        `/events/${eventId}/comments/${commentId}/replies/${replyId}/like`
      );
      if (res.data?.success) {
        onCommentsUpdated(res.data.data.comments);
      }
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async () => {
    if (!selectedTarget) return;
    const { commentId, replyId } = selectedTarget;
    setMenuAnchor(null);
    setSelectedTarget(null);

    try {
      if (replyId) {
        const res = await API.delete(
          `/events/${eventId}/comments/${commentId}/replies/${replyId}`
        );
        if (res.data?.success) onCommentsUpdated(res.data.data.comments);
      } else {
        const res = await API.delete(`/events/${eventId}/comments/${commentId}`);
        if (res.data?.success) onCommentsUpdated(res.data.data.comments);
      }
    } catch {
      /* ignore */
    }
  };

  const isLikedByMe = (likesArray = []) => {
    if (!user?._id) return false;
    return likesArray.some((id) => String(id?._id || id) === String(user._id));
  };

  return (
    <Card
      sx={{
        borderRadius: "12px",
        border: "1px solid #EAECF0",
        boxShadow: "none",
        bgcolor: "#FFFFFF",
        p: { xs: 2.5, md: 3.5 },
      }}
    >
      {/* Header */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2, alignItems: "center" }}>
        <ChatIcon sx={{ color: "#7C3AED", fontSize: 26 }} />
        <Typography variant="h6" sx={{ fontWeight: 800, color: "#0F172A", fontSize: "19px" }}>
          Comments
        </Typography>
      </Stack>

      {/* Main Comment Input Box */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4 }}>
        <Avatar
          src={user?.profilePhoto?.url || ""}
          sx={{
            width: 38,
            height: 38,
            bgcolor: "#EDE9FE",
            color: "#7C3AED",
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          {user?.name?.charAt(0) || "U"}
        </Avatar>

        <Box sx={{ position: "relative", flex: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handlePostComment();
              }
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                bgcolor: "#F8FAFC",
                pr: 4.5,
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#CBD5E1" },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#7C3AED" },
              },
            }}
          />
          <IconButton
            size="small"
            onClick={(e) => setEmojiAnchor(e.currentTarget)}
            sx={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94A3B8",
              "&:hover": { color: "#7C3AED" },
            }}
          >
            <EmojiIcon fontSize="small" />
          </IconButton>
        </Box>

        <Button
          variant="contained"
          disabled={!commentText.trim() || postingComment}
          onClick={handlePostComment}
          sx={{
            bgcolor: "#7C3AED",
            color: "#FFFFFF",
            borderRadius: "12px",
            textTransform: "none",
            fontWeight: 700,
            px: { xs: 2, sm: 2.5 },
            py: 1,
            boxShadow: "none",
            flexShrink: 0,
            "&:hover": { bgcolor: "#6D28D9", boxShadow: "none" },
          }}
        >
          {postingComment ? <CircularProgress size={18} color="inherit" /> : "Post Comment"}
        </Button>
      </Stack>

      {/* Emoji Picker Popover */}
      <Popover
        open={Boolean(emojiAnchor)}
        anchorEl={emojiAnchor}
        onClose={() => setEmojiAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: { p: 1.5, borderRadius: "8px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" },
        }}
      >
        <Grid container spacing={1} sx={{ width: 180 }}>
          {EMOJI_LIST.map((emoji) => (
            <Grid size={{ xs: 3 }} key={emoji} sx={{ textAlign: "center" }}>
              <Box
                onClick={() => {
                  setCommentText((prev) => prev + emoji);
                  setEmojiAnchor(null);
                }}
                sx={{
                  cursor: "pointer",
                  fontSize: "18px",
                  p: 0.5,
                  borderRadius: "8px",
                  "&:hover": { bgcolor: "#F1F5F9" },
                }}
              >
                {emoji}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Popover>

      {/* Comments List */}
      <Stack spacing={3}>
        {comments.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body2" sx={{ color: "#94A3B8" }}>
              No comments yet. Be the first to share your thoughts!
            </Typography>
          </Box>
        ) : (
          comments.map((comment) => {
            const commentLikesCount = comment.likes?.length || 0;
            const likedComment = isLikedByMe(comment.likes);
            const canManageComment =
              ["ADMIN", "CHAIRPERSON"].includes(user?.role) ||
              String(comment.user?._id || comment.user) === String(user?._id);

            return (
              <Box key={comment._id} sx={{ position: "relative" }}>
                {/* Top-Level Comment */}
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Avatar
                    src={comment.user?.profilePhoto?.url || ""}
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: "#EDE9FE",
                      color: "#7C3AED",
                      fontWeight: 700,
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {comment.user?.name?.charAt(0) || "U"}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* User name & timestamp */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Tooltip title={comment.user?.name || "Member"} arrow placement="top">
                          <Typography
                            variant="subtitle2"
                            noWrap
                            sx={{ fontWeight: 800, color: "#1E293B", fontSize: "14px", maxWidth: 200 }}
                          >
                            {comment.user?.name || "Member"}
                          </Typography>
                        </Tooltip>
                        <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: "12px", flexShrink: 0 }}>
                          • {dayjs(comment.createdAt).fromNow()}
                        </Typography>
                      </Stack>

                      {canManageComment && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setMenuAnchor(e.currentTarget);
                            setSelectedTarget({ commentId: comment._id });
                          }}
                          sx={{ color: "#94A3B8", p: 0.5 }}
                        >
                          <MoreHorizIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>

                    {/* Text */}
                    <Typography
                      variant="body2"
                      sx={{ color: "#334155", mt: 0.5, lineHeight: 1.6, fontSize: "14px", wordBreak: "break-word", whiteSpace: "pre-wrap" }}
                    >
                      {renderMentionText(comment.text)}
                    </Typography>

                    {/* Action row (Like & Reply) */}
                    <Stack direction="row" spacing={2.5} alignItems="center" sx={{ mt: 1 }}>
                      <Button
                        size="small"
                        startIcon={
                          likedComment ? (
                            <ThumbUpFilledIcon sx={{ fontSize: "15px !important", color: "#7C3AED" }} />
                          ) : (
                            <ThumbUpOutlinedIcon sx={{ fontSize: "15px !important", color: "#64748B" }} />
                          )
                        }
                        onClick={() => handleLikeComment(comment._id)}
                        sx={{
                          textTransform: "none",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: likedComment ? "#7C3AED" : "#64748B",
                          p: 0,
                          minWidth: 0,
                          "&:hover": { bgcolor: "transparent", color: "#7C3AED" },
                        }}
                      >
                        {commentLikesCount > 0 ? commentLikesCount : "Like"}
                      </Button>

                      <Button
                        size="small"
                        startIcon={<ReplyIcon sx={{ fontSize: "16px !important", color: "#64748B" }} />}
                        onClick={() => {
                          if (replyingToCommentId === comment._id) {
                            setReplyingToCommentId(null);
                            setReplyText("");
                          } else {
                            setReplyingToCommentId(comment._id);
                            const targetName = comment.user?.name || "member";
                            setReplyText(`@${targetName} `);
                          }
                        }}
                        sx={{
                          textTransform: "none",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#64748B",
                          p: 0,
                          minWidth: 0,
                          "&:hover": { bgcolor: "transparent", color: "#7C3AED" },
                        }}
                      >
                        Reply
                      </Button>
                    </Stack>

                    {/* Nested Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <Stack spacing={2} sx={{ mt: 2.5, pl: { xs: 2, sm: 3 } }}>
                        {comment.replies.map((reply) => {
                          const replyLikesCount = reply.likes?.length || 0;
                          const likedReply = isLikedByMe(reply.likes);
                          const canManageReply =
                            ["ADMIN", "CHAIRPERSON"].includes(user?.role) ||
                            String(reply.user?._id || reply.user) === String(user?._id);

                          return (
                            <Stack
                              key={reply._id}
                              direction="row"
                              spacing={1.5}
                              alignItems="flex-start"
                              sx={{
                                position: "relative",
                                "&::before": {
                                  content: '""',
                                  position: "absolute",
                                  left: { xs: -16, sm: -24 },
                                  top: 14,
                                  width: { xs: 12, sm: 18 },
                                  height: "1px",
                                  bgcolor: "#E2E8F0",
                                },
                              }}
                            >
                              <Avatar
                                src={reply.user?.profilePhoto?.url || ""}
                                sx={{
                                  width: 30,
                                  height: 30,
                                  bgcolor: "#F1F5F9",
                                  color: "#7C3AED",
                                  fontWeight: 700,
                                  fontSize: 12,
                                  flexShrink: 0,
                                }}
                              >
                                {reply.user?.name?.charAt(0) || "U"}
                              </Avatar>

                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Tooltip title={reply.user?.name || "Member"} arrow placement="top">
                                      <Typography
                                        variant="subtitle2"
                                        noWrap
                                        sx={{ fontWeight: 800, color: "#1E293B", fontSize: "13px", maxWidth: 180 }}
                                      >
                                        {reply.user?.name || "Member"}
                                      </Typography>
                                    </Tooltip>
                                    <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: "11px", flexShrink: 0 }}>
                                      • {dayjs(reply.createdAt).fromNow()}
                                    </Typography>
                                  </Stack>

                                  {canManageReply && (
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        setMenuAnchor(e.currentTarget);
                                        setSelectedTarget({
                                          commentId: comment._id,
                                          replyId: reply._id,
                                        });
                                      }}
                                      sx={{ color: "#94A3B8", p: 0.5 }}
                                    >
                                      <MoreHorizIcon fontSize="small" />
                                    </IconButton>
                                  )}
                                </Stack>

                                <Typography
                                  variant="body2"
                                  sx={{ color: "#334155", mt: 0.5, lineHeight: 1.5, fontSize: "13px", wordBreak: "break-word", whiteSpace: "pre-wrap" }}
                                >
                                  {renderMentionText(reply.text)}
                                </Typography>

                                <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.75 }}>
                                  <Button
                                    size="small"
                                    startIcon={
                                      likedReply ? (
                                        <ThumbUpFilledIcon
                                          sx={{ fontSize: "14px !important", color: "#7C3AED" }}
                                        />
                                      ) : (
                                        <ThumbUpOutlinedIcon
                                          sx={{ fontSize: "14px !important", color: "#64748B" }}
                                        />
                                      )
                                    }
                                    onClick={() => handleLikeReply(comment._id, reply._id)}
                                    sx={{
                                      textTransform: "none",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                      color: likedReply ? "#7C3AED" : "#64748B",
                                      p: 0,
                                      minWidth: 0,
                                      "&:hover": { bgcolor: "transparent", color: "#7C3AED" },
                                    }}
                                  >
                                    {replyLikesCount > 0 ? replyLikesCount : "Like"}
                                  </Button>

                                  <Button
                                    size="small"
                                    startIcon={
                                      <ReplyIcon sx={{ fontSize: "15px !important", color: "#64748B" }} />
                                    }
                                    onClick={() => {
                                      setReplyingToCommentId(comment._id);
                                      setReplyText(`@${reply.user?.name || "member"} `);
                                    }}
                                    sx={{
                                      textTransform: "none",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                      color: "#64748B",
                                      p: 0,
                                      minWidth: 0,
                                      "&:hover": { bgcolor: "transparent", color: "#7C3AED" },
                                    }}
                                  >
                                    Reply
                                  </Button>
                                </Stack>
                              </Box>
                            </Stack>
                          );
                        })}
                      </Stack>
                    )}

                    {/* Inline Reply Input Box */}
                    {replyingToCommentId === comment._id && (
                      <Stack
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                        sx={{ mt: 2, pl: { xs: 2, sm: 3 } }}
                      >
                        <Avatar
                          src={user?.profilePhoto?.url || ""}
                          sx={{
                            width: 28,
                            height: 28,
                            bgcolor: "#EDE9FE",
                            color: "#7C3AED",
                            fontSize: 11,
                          }}
                        >
                          {user?.name?.charAt(0) || "U"}
                        </Avatar>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Write a reply..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handlePostReply(comment._id);
                            }
                          }}
                          autoFocus
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "10px",
                              bgcolor: "#F8FAFC",
                              fontSize: "13px",
                            },
                          }}
                        />
                        <Button
                          variant="contained"
                          size="small"
                          disabled={!replyText.trim() || postingReply}
                          onClick={() => handlePostReply(comment._id)}
                          sx={{
                            bgcolor: "#7C3AED",
                            borderRadius: "10px",
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: "12px",
                            "&:hover": { bgcolor: "#6D28D9" },
                          }}
                        >
                          {postingReply ? <CircularProgress size={14} color="inherit" /> : "Reply"}
                        </Button>
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => setReplyingToCommentId(null)}
                          sx={{
                            color: "#64748B",
                            textTransform: "none",
                            fontSize: "12px",
                          }}
                        >
                          Cancel
                        </Button>
                      </Stack>
                    )}
                  </Box>
                </Stack>
              </Box>
            );
          })
        )}
      </Stack>

      {/* Delete Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        PaperProps={{ sx: { borderRadius: "8px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" } }}
      >
        <MenuItem onClick={handleDelete} sx={{ color: "#EF4444", fontSize: "13px", fontWeight: 600 }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Card>
  );
}

// ─── Admin Controls Card Component ───────────────────────────────────────────
function AdminControlsCard({ onEdit, onDelete, onManageMedia, onReorderMedia, photoCount = 0, sx = {} }) {
  return (
    <Card
      sx={{
        borderRadius: "12px",
        border: "1px solid #EAECF0",
        boxShadow: "none",
        bgcolor: "#FFFFFF",
        p: { xs: 2.5, md: 3 },
        mb: 3,
        ...sx,
      }}
    >
      {/* Card Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          gap: 1.5,
          mb: 1,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <AdminShieldIcon sx={{ color: "#7C3AED", fontSize: 22 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#0F172A", fontSize: "16px" }}>
            Admin Controls
          </Typography>
        </Stack>
        <Chip
          label="Admin only"
          size="small"
          sx={{
            bgcolor: "#F3E8FF",
            color: "#7C3AED",
            fontWeight: 700,
            fontSize: "10.5px",
            borderRadius: "6px",
            height: 22,
            flexShrink: 0,
          }}
        />
      </Box>

      {/* Subtitle */}
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 2.5 }}>
        <LockIcon sx={{ fontSize: 13, color: "#94A3B8" }} />
        <Typography variant="caption" sx={{ color: "#64748B", fontSize: "11.5px", fontWeight: 500 }}>
          Visible to event administrators only
        </Typography>
      </Stack>

      {/* Action Buttons List */}
      <Stack spacing={1.5}>
        {/* 1. Edit Event */}
        <Box
          onClick={onEdit}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 1.75,
            borderRadius: "8px",
            bgcolor: "#F8FAFC",
            border: "1px solid #F1F5F9",
            cursor: "pointer",
            transition: "all 0.2s ease",
            "&:hover": {
              bgcolor: "#F5F3FF",
              borderColor: "#DDD6FE",
              transform: "translateY(-1px)",
            },
          }}
        >
          <Stack direction="row" spacing={1.75} alignItems="center">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                bgcolor: "#EDE9FE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#7C3AED",
                flexShrink: 0,
              }}
            >
              <EditIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1E293B", fontSize: "13.5px" }}>
                Edit Event
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748B", fontSize: "11px", display: "block" }}>
                Update title, date, time, venue
              </Typography>
            </Box>
          </Stack>
          <ChevronRightIcon sx={{ color: "#94A3B8", fontSize: 18 }} />
        </Box>

        {/* 2. Manage Media / Add Photos */}
        <Box
          onClick={onManageMedia}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 1.75,
            borderRadius: "8px",
            bgcolor: "#F8FAFC",
            border: "1px solid #F1F5F9",
            cursor: "pointer",
            transition: "all 0.2s ease",
            "&:hover": {
              bgcolor: "#F5F3FF",
              borderColor: "#DDD6FE",
              transform: "translateY(-1px)",
            },
          }}
        >
          <Stack direction="row" spacing={1.75} alignItems="center">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "8px",
                bgcolor: "#EDE9FE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#7C3AED",
                flexShrink: 0,
              }}
            >
              <AddPhotoIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1E293B", fontSize: "13.5px" }}>
                  Manage Media
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: "#64748B", fontSize: "11px", display: "block" }}>
                Upload or remove event photos
              </Typography>
            </Box>
          </Stack>
          <ChevronRightIcon sx={{ color: "#94A3B8", fontSize: 18 }} />
        </Box>

        {/* 3. Reorder Media */}
        <Box
          onClick={onReorderMedia}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 1.75,
            borderRadius: "8px",
            bgcolor: "#F8FAFC",
            border: "1px solid #F1F5F9",
            cursor: "pointer",
            transition: "all 0.2s ease",
            "&:hover": {
              bgcolor: "#F5F3FF",
              borderColor: "#DDD6FE",
              transform: "translateY(-1px)",
            },
          }}
        >
          <Stack direction="row" spacing={1.75} alignItems="center">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "8px",
                bgcolor: "#EDE9FE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#7C3AED",
                flexShrink: 0,
              }}
            >
              <ReorderIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#1E293B", fontSize: "13.5px" }}>
                Reorder Gallery
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748B", fontSize: "11px", display: "block" }}>
                Change photo display sequence
              </Typography>
            </Box>
          </Stack>
          <ChevronRightIcon sx={{ color: "#94A3B8", fontSize: 18 }} />
        </Box>
      </Stack>

      {/* Danger Zone: Delete Event */}
      <Box sx={{ mt: 2.5, pt: 2, borderTop: "1px solid #F1F5F9" }}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          onClick={onDelete}
          startIcon={<DeleteIcon sx={{ fontSize: 18 }} />}
          sx={{
            borderRadius: "8px",
            borderColor: "#FECACA",
            bgcolor: "#FEF2F2",
            color: "#DC2626",
            textTransform: "none",
            fontWeight: 700,
            fontSize: "12.5px",
            py: 0.85,
            "&:hover": {
              bgcolor: "#FEE2E2",
              borderColor: "#F87171",
            },
          }}
        >
          Delete Event
        </Button>
      </Box>
    </Card>
  );
}

// ─── Event Quick Summary Card Component ───────────────────────────────────────
function EventQuickSummaryCard({ event, allImagesList, avgRating, sx = {} }) {
  const eventDay = event?.eventDate ? dayjs(event.eventDate) : null;
  const today = dayjs().startOf("day");
  const daysDiff = eventDay ? eventDay.startOf("day").diff(today, "day") : 0;

  let statusLabel = "Upcoming";
  let statusBg = "#DCFCE7";
  let statusColor = "#15803D";

  if (daysDiff === 0) {
    statusLabel = "Happening Today";
    statusBg = "#FEF3C7";
    statusColor = "#B45309";
  } else if (daysDiff > 0) {
    statusLabel = `In ${daysDiff} ${daysDiff === 1 ? "day" : "days"}`;
    statusBg = "#DCFCE7";
    statusColor = "#15803D";
  } else {
    statusLabel = "Past Event";
    statusBg = "#F1F5F9";
    statusColor = "#64748B";
  }

  return (
    <Card
      sx={{
        borderRadius: "12px",
        border: "1px solid #EAECF0",
        boxShadow: "none",
        bgcolor: "#FFFFFF",
        p: 2.5,
        mb: 3,
        ...sx,
      }}
    >
      <Stack spacing={2}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            gap: 1.5,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0F172A", fontSize: "14px" }}>
            Event Status
          </Typography>
          <Chip
            label={statusLabel}
            size="small"
            sx={{
              bgcolor: statusBg,
              color: statusColor,
              fontWeight: 800,
              fontSize: "11px",
              borderRadius: "6px",
              height: 22,
              flexShrink: 0,
            }}
          />
        </Box>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            bgcolor: "#F8FAFC",
            p: 1.5,
            borderRadius: "8px",
            border: "1px solid #F1F5F9",
          }}
        >
          <Box sx={{ flex: 1, textAlign: "center", borderRight: "1px solid #E2E8F0" }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#1E293B", fontSize: "16px", lineHeight: 1.2 }}>
              {allImagesList.length}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B", fontSize: "11px", fontWeight: 600 }}>
              Photos
            </Typography>
          </Box>
          <Box sx={{ flex: 1, textAlign: "center", borderRight: "1px solid #E2E8F0" }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#1E293B", fontSize: "16px", lineHeight: 1.2 }}>
              {event?.comments?.length || 0}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B", fontSize: "11px", fontWeight: 600 }}>
              Comments
            </Typography>
          </Box>
          <Box sx={{ flex: 1, textAlign: "center" }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#1E293B", fontSize: "16px", lineHeight: 1.2 }}>
              {event?.reviews?.length ? avgRating.toFixed(1) : "—"}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748B", fontSize: "11px", fontWeight: 600 }}>
              Rating
            </Typography>
          </Box>
        </Stack>
      </Stack>
    </Card>
  );
}

// ─── Event Header & Details Card Component ─────────────────────────────────────
function EventDetailsCard({
  event,
  avgRating,
  formattedDate,
  formattedTime,
  organizerDisplay,
  isFullWidth = false,
  sx = {},
}) {
  return (
    <Card
      sx={{
        borderRadius: "12px",
        border: "1px solid #EAECF0",
        boxShadow: "none",
        bgcolor: "#FFFFFF",
        p: { xs: 2.5, sm: 3.5 },
        mb: 3,
        ...sx,
      }}
    >
      {/* Title */}
      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          color: "#0F172A",
          lineHeight: 1.25,
          mb: 1.5,
          letterSpacing: "-0.025em",
          fontSize: { xs: "22px", sm: "28px", md: "32px" },
          wordBreak: "break-word",
        }}
      >
        {event.title}
      </Typography>

      {/* Rating Summary Row */}
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 3 }}>
        <StarRating value={Math.round(avgRating)} readOnly size={22} />
        <Typography variant="body2" sx={{ color: "#64748B", fontSize: "13px", fontWeight: 600 }}>
          {event.reviews?.length > 0
            ? `${avgRating.toFixed(1)} (${event.reviews.length} ${event.reviews.length === 1 ? "review" : "reviews"
            })`
            : "No reviews yet"}
        </Typography>
      </Stack>

      {/* 4 Info Tiles - 4 across on desktop when full width, or 2x2 grid when in column */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Tile 1: Date */}
        <Grid size={{ xs: 12, sm: 6, md: isFullWidth ? 3 : 6 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: "8px",
              bgcolor: "#F8FAFC",
              border: "1px solid #F1F5F9",
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
              height: "100%",
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                bgcolor: "#EDE9FE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#7C3AED",
                flexShrink: 0,
              }}
            >
              <DateIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  color: "#64748B",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  fontSize: "10.5px",
                  letterSpacing: "0.05em",
                  display: "block",
                  mb: 0.25,
                }}
              >
                DATE
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: "#0F172A",
                  fontSize: "14px",
                  lineHeight: 1.4,
                }}
              >
                {formattedDate}
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Tile 2: Time */}
        <Grid size={{ xs: 12, sm: 6, md: isFullWidth ? 3 : 6 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: "8px",
              bgcolor: "#F8FAFC",
              border: "1px solid #F1F5F9",
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
              height: "100%",
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                bgcolor: "#EDE9FE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#7C3AED",
                flexShrink: 0,
              }}
            >
              <TimeIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  color: "#64748B",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  fontSize: "10.5px",
                  letterSpacing: "0.05em",
                  display: "block",
                  mb: 0.25,
                }}
              >
                TIME
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: "#0F172A",
                  fontSize: "14px",
                  lineHeight: 1.4,
                }}
              >
                {formattedTime}
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Tile 3: Venue (Click to open Google Maps) */}
        <Grid size={{ xs: 12, sm: 6, md: isFullWidth ? 3 : 6 }}>
          <Tooltip title="Click to open location in Google Maps" arrow placement="top">
            <Box
              onClick={() => {
                if (event.location) {
                  const url = event.locationUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`;
                  window.open(url, "_blank", "noopener,noreferrer");
                }
              }}
              sx={{
                p: 2,
                borderRadius: "8px",
                bgcolor: "#F8FAFC",
                border: "1px solid #F1F5F9",
                display: "flex",
                alignItems: "flex-start",
                gap: 1.5,
                height: "100%",
                cursor: event.location ? "pointer" : "default",
                transition: "all 0.2s ease",
                "&:hover": event.location
                  ? {
                      bgcolor: "#F0F7FF",
                      borderColor: "#0088ff50",
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 14px rgba(0,136,255,0.08)",
                    }
                  : {},
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "10px",
                  bgcolor: "#EDE9FE",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#7C3AED",
                  flexShrink: 0,
                }}
              >
                <LocationIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#64748B",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      fontSize: "10.5px",
                      letterSpacing: "0.05em",
                      display: "block",
                      mb: 0.25,
                    }}
                  >
                    VENUE
                  </Typography>
                  {event.location && (
                    <OpenInNewIcon sx={{ fontSize: 13, color: "#0088ff", opacity: 0.8 }} />
                  )}
                </Stack>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: "#0F172A",
                    fontSize: "14px",
                    lineHeight: 1.4,
                    wordBreak: "break-word",
                  }}
                >
                  {event.location || "Location not specified"}
                </Typography>
              </Box>
            </Box>
          </Tooltip>
        </Grid>

        {/* Tile 4: Organizer */}
        <Grid size={{ xs: 12, sm: 6, md: isFullWidth ? 3 : 6 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: "8px",
              bgcolor: "#F8FAFC",
              border: "1px solid #F1F5F9",
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
              height: "100%",
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                bgcolor: "#EDE9FE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#7C3AED",
                flexShrink: 0,
              }}
            >
              <PersonIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  color: "#64748B",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  fontSize: "10.5px",
                  letterSpacing: "0.05em",
                  display: "block",
                  mb: 0.25,
                }}
              >
                ORGANIZER
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: "#0F172A",
                  fontSize: "14px",
                  lineHeight: 1.4,
                  wordBreak: "break-word",
                }}
              >
                {organizerDisplay}
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Description Divider & Header */}
      <Divider sx={{ mb: 2.5, borderColor: "#F1F5F9" }} />
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 800,
          color: "#1E293B",
          fontSize: "13px",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          mb: 1.5,
        }}
      >
        About this event
      </Typography>
      <Typography
        variant="body1"
        sx={{
          color: "#334155",
          lineHeight: 1.8,
          fontSize: "15px",
          whiteSpace: "pre-wrap",
        }}
      >
        {event.description || "No description provided."}
      </Typography>
    </Card>
  );
}

// ─── Main EventDetail Page ────────────────────────────────────────────────────
export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // Role checks:
  // 1. Staff/Admin roles: ADMIN, CHAIRPERSON, WARDEN
  const isStaffOrAdmin = ["ADMIN", "CHAIRPERSON", "WARDEN"].includes(user?.role);
  // 2. Can manage events: ADMIN & CHAIRPERSON
  const canManage = ["ADMIN", "CHAIRPERSON"].includes(user?.role);

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Dialog states
  const [editOpen, setEditOpen] = useState(false);
  const [manageMediaOpen, setManageMediaOpen] = useState(false);
  const [reorderMediaOpen, setReorderMediaOpen] = useState(false);
  const [viewAllMediaOpen, setViewAllMediaOpen] = useState(false);
  const [activeImageUrl, setActiveImageUrl] = useState(null);
  const [deleteEventOpen, setDeleteEventOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);

  // Quick Rating states (for visitors / non-staff only)
  const [myRating, setMyRating] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const fetchEvent = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get(`/events/${id}`);
      if (res.data?.success) {
        const ev = res.data.data.event;
        setEvent(ev);

        // Pre-fill user's existing rating if any
        const mine = ev.reviews?.find(
          (r) => r.user?._id === user?._id || String(r.user) === String(user?._id)
        );
        if (mine) {
          setMyRating(mine.rating);
        }
      }
    } catch {
      setError("Could not load event details.");
    } finally {
      setLoading(false);
    }
  }, [id, user?._id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  // Quick Rate (instant submission on click, no comment requested)
  const handleQuickRate = async (starValue) => {
    setMyRating(starValue);
    setRatingSubmitting(true);
    try {
      const res = await API.post(`/events/${id}/reviews`, {
        rating: starValue,
        text: "",
      });
      if (res.data?.success) {
        setEvent((prev) => ({ ...prev, reviews: res.data.data.reviews }));
        enqueueSnackbar("Thank you for your rating!", { variant: "success" });
      }
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || "Failed to submit rating", {
        variant: "error",
      });
    } finally {
      setRatingSubmitting(false);
    }
  };

  // Delete event with popup confirmation modal
  const handleConfirmDeleteEvent = async () => {
    setDeletingEvent(true);
    try {
      await API.delete(`/events/${id}`);
      enqueueSnackbar("Event deleted successfully", { variant: "info" });
      setDeleteEventOpen(false);
      navigate("/events");
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || "Failed to delete event", {
        variant: "error",
      });
    } finally {
      setDeletingEvent(false);
    }
  };

  // Format times nicely
  const formatTime = (t) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const allImagesList = useMemo(() => {
    if (!event) return [];
    const list = [];
    if (event.coverImage?.url) {
      list.push({
        _id: "cover_image",
        id: "cover_image",
        url: event.coverImage.url,
        isCover: true,
        caption: "Cover Photo",
        publicId: event.coverImage.publicId,
      });
    }
    if (
      event.additionalImages &&
      Array.isArray(event.additionalImages) &&
      event.additionalImages.length > 0
    ) {
      event.additionalImages.forEach((img, idx) => {
        if (img?.url) {
          list.push({
            _id: img._id,
            id: img._id,
            url: img.url,
            isCover: false,
            caption: img.caption || `Gallery Photo #${idx + 1}`,
            publicId: img.publicId,
          });
        }
      });
    }
    return list;
  }, [event]);

  const avgRating = useMemo(() => {
    if (!event?.reviews || event.reviews.length === 0) return 0;
    return event.reviews.reduce((sum, r) => sum + r.rating, 0) / event.reviews.length;
  }, [event?.reviews]);

  const formattedDate = event?.eventDate ? dayjs(event.eventDate).format("dddd, D MMMM YYYY") : "—";
  const formattedTime = `${formatTime(event?.startTime)} – ${formatTime(event?.endTime)}`;
  const organizerDisplay = `${event?.createdBy?.name || "Organizer"} (${event?.createdBy?.role || "ADMIN"})`;

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ pb: 6, pt: 3 }}>
        <Skeleton variant="rectangular" height={380} sx={{ borderRadius: "24px", mb: 3 }} />
        <Skeleton variant="text" height={50} width="60%" sx={{ mb: 1 }} />
        <Skeleton variant="text" height={28} width="35%" />
      </Container>
    );
  }

  if (error || !event) {
    return (
      <Container maxWidth="lg" sx={{ pb: 6, pt: 3 }}>
        <Alert severity="error" sx={{ borderRadius: "8px", mb: 3 }}>
          {error || "Event not found."}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/events")}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          Back to Events
        </Button>
      </Container>
    );
  }


  return (
    <Container maxWidth="xl" sx={{ pb: 8, px: 2 }}>


      {/* ── Conditional Layout: Admin vs Other Users ── */}
      {canManage ? (
        /* ── ADMIN VIEW: Fixed/Sticky Right Controls, Left Side Scrolls ── */
        <Grid container spacing={3.5} alignItems="flex-start">
          {/* Left Column (Scrolls smoothly) */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <EventMediaHero
              coverImage={event.coverImage}
              additionalImages={event.additionalImages}
              onOpenAllMedia={() => setViewAllMediaOpen(true)}
              onZoom={(url) => setActiveImageUrl(url)}
              canManage={canManage}
              onManageMedia={() => setManageMediaOpen(true)}
              sx={{ mb: 3 }}
            />

            <EventDetailsCard
              event={event}
              avgRating={avgRating}
              formattedDate={formattedDate}
              formattedTime={formattedTime}
              organizerDisplay={organizerDisplay}
              isFullWidth={false}
              sx={{ mb: 3 }}
            />

            <EventCommentsSection
              eventId={event._id}
              comments={event.comments || []}
              onCommentsUpdated={(updatedComments) =>
                setEvent((prev) => ({ ...prev, comments: updatedComments }))
              }
              user={user}
            />
          </Grid>

          {/* Right Column: Fixed in position as left side scrolls */}
          <Grid
            size={{ xs: 12, lg: 4 }}
            sx={{
              position: { lg: "sticky" },
              top: { lg: 84 },
              alignSelf: "flex-start",
              zIndex: 10,
            }}
          >
            <Box
              sx={{
                position: { lg: "sticky" },
                top: { lg: 84 },
                display: "flex",
                flexDirection: "column",
                gap: 2.5,
                maxHeight: { lg: "calc(100vh - 100px)" },
                overflowY: { lg: "auto" },
                pr: { lg: 0.5 },
                "&::-webkit-scrollbar": { width: 4 },
                "&::-webkit-scrollbar-thumb": { bgcolor: "#E2E8F0", borderRadius: 2 },
              }}
            >
              <EventQuickSummaryCard
                event={event}
                allImagesList={allImagesList}
                avgRating={avgRating}
                sx={{ mb: 0 }}
              />

              <AdminControlsCard
                onEdit={() => setEditOpen(true)}
                onDelete={() => setDeleteEventOpen(true)}
                onManageMedia={() => setManageMediaOpen(true)}
                onReorderMedia={() => setReorderMediaOpen(true)}
                photoCount={allImagesList.length}
                sx={{ mb: 0 }}
              />
            </Box>
          </Grid>
        </Grid>
      ) : (
        /* ── OTHER USERS VIEW: Top row preview + 2 cards with matching height; Full-width details & comments below ── */
        <Box>
          {/* Top Row: Preview on left, 2 cards on right with exact matching height */}
          <Grid container spacing={3} alignItems="stretch" sx={{ mb: 3 }}>
            {/* Left: Preview Card */}
            <Grid size={{ xs: 12, md: 7, lg: 7.5 }} sx={{ display: "flex" }}>
              <EventMediaHero
                coverImage={event.coverImage}
                additionalImages={event.additionalImages}
                onOpenAllMedia={() => setViewAllMediaOpen(true)}
                onZoom={(url) => setActiveImageUrl(url)}
                canManage={false}
                sx={{
                  flex: 1,
                  width: "100%",
                  height: "100%",
                  mb: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              />
            </Grid>

            {/* Right: 2 Cards taking full matching height of preview card */}
            <Grid size={{ xs: 12, md: 5, lg: 4.5 }} sx={{ display: "flex" }}>
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2.5,
                }}
              >
                <Box sx={{ flex: 1, display: "flex" }}>
                  <EventQuickSummaryCard
                    event={event}
                    allImagesList={allImagesList}
                    avgRating={avgRating}
                    sx={{
                      flex: 1,
                      width: "100%",
                      height: "100%",
                      mb: 0,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  />
                </Box>
                {!isStaffOrAdmin && (
                  <Box sx={{ flex: 1, display: "flex" }}>
                    <VisitorOneLineRatingCard
                      myRating={myRating}
                      onRate={handleQuickRate}
                      submitting={ratingSubmitting}
                      sx={{
                        flex: 1,
                        width: "100%",
                        height: "100%",
                        mb: 0,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Full Width Event Info Card Below */}
          <EventDetailsCard
            event={event}
            avgRating={avgRating}
            formattedDate={formattedDate}
            formattedTime={formattedTime}
            organizerDisplay={organizerDisplay}
            isFullWidth={true}
            sx={{ mb: 3 }}
          />

          {/* Full Width Comments Section Below */}
          <EventCommentsSection
            eventId={event._id}
            comments={event.comments || []}
            onCommentsUpdated={(updatedComments) =>
              setEvent((prev) => ({ ...prev, comments: updatedComments }))
            }
            user={user}
          />
        </Box>
      )}

      {/* ── Dialogs ── */}
      <EditEventDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        event={event}
        onSaved={(updatedEvent) =>
          setEvent((prev) => ({ ...prev, ...updatedEvent }))
        }
      />

      <ManageMediaDialog
        open={manageMediaOpen}
        onClose={() => setManageMediaOpen(false)}
        eventId={event._id}
        additionalImages={event.additionalImages || []}
        onUpdated={(newImages) =>
          setEvent((prev) => ({ ...prev, additionalImages: newImages }))
        }
      />

      <ReorderMediaDialog
        open={reorderMediaOpen}
        onClose={() => setReorderMediaOpen(false)}
        eventId={event._id}
        additionalImages={event.additionalImages || []}
        onUpdated={(newImages) =>
          setEvent((prev) => ({ ...prev, additionalImages: newImages }))
        }
      />

      <ViewAllMediaDialog
        open={viewAllMediaOpen}
        onClose={() => setViewAllMediaOpen(false)}
        images={allImagesList}
        eventId={event._id}
        canManage={canManage}
        eventAdditionalImages={event.additionalImages || []}
        onUpdated={(newImages) =>
          setEvent((prev) => ({ ...prev, additionalImages: newImages }))
        }
        onZoom={(url) => setActiveImageUrl(url)}
      />

      <ImageLightbox
        open={Boolean(activeImageUrl)}
        onClose={() => setActiveImageUrl(null)}
        imageUrl={activeImageUrl || ""}
        canManage={canManage}
        currentImage={allImagesList.find((img) => img.url === activeImageUrl) || null}
        eventId={event._id}
        onDeleted={(newImages) => {
          setEvent((prev) => ({ ...prev, additionalImages: newImages }));
          setActiveImageUrl(null);
        }}
      />

      <DeleteConfirmDialog
        open={deleteEventOpen}
        onClose={() => setDeleteEventOpen(false)}
        onConfirm={handleConfirmDeleteEvent}
        title="Delete Event"
        message=""
        confirmText="Delete Event"
        loading={deletingEvent}
        itemName={event?.title}
      />
    </Container>
  );
}
