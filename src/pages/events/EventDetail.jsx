import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  Box,
  Container,
  Stack,
  Typography,
  Button,
  IconButton,
  Chip,
  Avatar,
  Divider,
  Card,
  CardContent,
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
  Tooltip,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Forum as ForumIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  Schedule as TimeIcon,
  Room as LocationIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Send as SendIcon,
  PhotoCamera as CameraIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  ZoomIn as ZoomInIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";

import { useAuth } from "../../context/AuthContext";
import API from "../../api";
import { LocalizationProvider, DatePicker, TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useSnackbar } from "notistack";

const CATEGORY_COLORS = {
  "Hostel Annual Day": "#8E33FF",
  "Alumni Meet": "#0088ff",
  "Community Meeting": "#00A76F",
  "Sports Event": "#FF5630",
  "Cultural Event": "#FFAB00",
  "Voting Meeting": "#3B82F6",
  "Festival": "#22C55E",
  "Student Gathering": "#00B8D9",
  "Other": "#64748B",
};

const getCategoryColor = (cat) => CATEGORY_COLORS[cat] || CATEGORY_COLORS["Other"];

const CATEGORIES = Object.keys(CATEGORY_COLORS);

// ─── Star Rating Component ────────────────────────────────────────────────────
function StarRating({ value, onChange, readOnly = false, size = 28 }) {
  const [hovered, setHovered] = useState(0);
  return (
    <Stack direction="row" spacing={0.25}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Box
          key={star}
          onClick={() => !readOnly && onChange && onChange(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          sx={{
            cursor: readOnly ? "default" : "pointer",
            color: star <= (hovered || value) ? "#FBBF24" : "#D1D5DB",
            transition: "color 0.1s, transform 0.1s",
            "&:hover": !readOnly ? { transform: "scale(1.15)" } : {},
          }}
        >
          {star <= (hovered || value) ? (
            <StarIcon sx={{ fontSize: size }} />
          ) : (
            <StarBorderIcon sx={{ fontSize: size }} />
          )}
        </Box>
      ))}
    </Stack>
  );
}

// ─── Average star display ─────────────────────────────────────────────────────
function AverageRating({ reviews }) {
  if (!reviews || reviews.length === 0) {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <StarRating value={0} readOnly size={20} />
        <Typography variant="body2" sx={{ color: "#9CA3AF" }}>No reviews yet</Typography>
      </Stack>
    );
  }
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <StarRating value={Math.round(avg)} readOnly size={20} />
      <Typography variant="subtitle2" sx={{ color: "#111827", fontWeight: 700 }}>
        {avg.toFixed(1)}
      </Typography>
      <Typography variant="body2" sx={{ color: "#6B7280" }}>
        ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
      </Typography>
    </Stack>
  );
}

// ─── Edit Dialog ──────────────────────────────────────────────────────────────
function EditEventDialog({ open, onClose, event, onSaved }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("Other");
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (open && event) {
      setTitle(event.title || "");
      setDescription(event.description || "");
      setEventDate(event.eventDate ? dayjs(event.eventDate).format("YYYY-MM-DD") : "");
      setStartTime(event.startTime || "");
      setEndTime(event.endTime || "");
      setLocation(event.location || "");
      setCategory(event.category || "Other");
      setCoverImageFile(null);
      setFormError("");
    }
  }, [open, event]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !eventDate || !startTime || !endTime || !location) {
      setFormError("Please fill in all required fields."); return;
    }
    setFormError(""); setSubmitting(true);

    const fd = new FormData();
    fd.append("title", title); fd.append("description", description);
    fd.append("eventDate", eventDate); fd.append("startTime", startTime);
    fd.append("endTime", endTime); fd.append("location", location); fd.append("category", category);
    if (coverImageFile) fd.append("coverImage", coverImageFile);

    try {
      const res = await API.patch(`/events/${event._id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      if (res.data?.success) { onSaved(res.data.data.event); onClose(); }
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save.");
    } finally {
      setSubmitting(false);
    }
  };

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
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #EAECF0", py: 2.5, px: 3.5, bgcolor: "#F8FAFC" }}>
        <Typography variant="h6" sx={{ fontWeight: 800, fontSize: 17, color: "#1E293B", letterSpacing: "-0.02em" }}>
          Edit Event Details
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: "#94A3B8", bgcolor: "#FFF", border: "1px solid #E2E8F0", "&:hover": { bgcolor: "#F1F5F9", color: "#1E293B" } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

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
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", backgroundColor: "#F8FAFC", "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#0088ff30" } } }} 
                />
                
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select value={category} label="Category" onChange={(e) => setCategory(e.target.value)} sx={{ borderRadius: "12px", backgroundColor: "#F8FAFC" }}>
                    {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>

                <TextField 
                  fullWidth 
                  size="small" 
                  label="Description *" 
                  multiline 
                  rows={3} 
                  required 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", backgroundColor: "#F8FAFC", "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#0088ff30" } } }} 
                />
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

            {/* Section 3: Location & Media */}
            <Box>
              <Typography variant="caption" sx={{ color: "#0088ff", fontWeight: 800, textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.05em", display: "block", mb: 1.5 }}>
                Location & Cover Media
              </Typography>
              <Stack spacing={2.5}>
                <TextField 
                  fullWidth 
                  size="small" 
                  label="Venue / Location *" 
                  required 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", backgroundColor: "#F8FAFC", "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#0088ff30" } } }} 
                />
                
                <Box 
                  sx={{ 
                    border: "2px dashed #D0D5DD", 
                    p: 3, 
                    borderRadius: "14px", 
                    textAlign: "center", 
                    bgcolor: "#F8FAFC",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    "&:hover": {
                      bgcolor: "rgba(0,136,255,0.02)",
                      borderColor: "#0088ff"
                    }
                  }}
                  component="label"
                >
                  <input accept="image/*" style={{ display: "none" }} id="edit-cover" type="file" onChange={(e) => setCoverImageFile(e.target.files[0])} />
                  <CloudUploadIcon sx={{ fontSize: 32, color: "#64748B", mb: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#334155", mb: 0.5 }}>
                    {coverImageFile ? "Change Cover Image" : "Upload New Cover Image"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94A3B8" }}>
                    {coverImageFile ? coverImageFile.name : "Select an image file from your device"}
                  </Typography>
                </Box>
              </Stack>
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
              bgcolor: "#0088ff", 
              borderRadius: "10px", 
              textTransform: "none", 
              fontWeight: 700, 
              boxShadow: "none", 
              px: 3,
              "&:hover": { bgcolor: "#0077EE", boxShadow: "none" } 
            }}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : "Save Changes"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// ─── Event Media Carousel Component ──────────────────────────────────────────
function EventMediaCarousel({ coverImage, additionalImages, onZoom }) {
  const images = [];
  if (coverImage?.url) images.push(coverImage.url);
  if (additionalImages && additionalImages.length > 0) {
    images.push(...additionalImages.map(img => img.url));
  }

  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) return null;

  const handleNext = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: { xs: 200, md: 320 },
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        mb: 3,
        bgcolor: "#000",
        "&:hover .zoom-overlay": { opacity: 1 },
        "&:hover .nav-arrow": { opacity: 0.8 }
      }}
    >
      {/* Active Image */}
      <Box
        component="img"
        src={images[activeIndex]}
        alt="Event Media"
        onClick={() => onZoom(images[activeIndex])}
        sx={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          cursor: "pointer",
          transition: "all 0.3s ease"
        }}
      />

      {/* Hover Zoom Overlay */}
      <Box
        className="zoom-overlay"
        onClick={() => onZoom(images[activeIndex])}
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          bgcolor: "rgba(0, 0, 0, 0.2)",
          opacity: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          transition: "opacity 0.2s ease"
        }}
      >
        <ZoomInIcon sx={{ color: "#fff", fontSize: 32 }} />
      </Box>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <IconButton
            className="nav-arrow"
            onClick={handlePrev}
            sx={{
              position: "absolute",
              top: "50%",
              left: 16,
              transform: "translateY(-50%)",
              bgcolor: "rgba(255, 255, 255, 0.7)",
              color: "#1E293B",
              opacity: { xs: 1, md: 0 },
              transition: "opacity 0.2s ease",
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.9)" },
              zIndex: 2,
              width: 36,
              height: 36
            }}
            size="small"
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <IconButton
            className="nav-arrow"
            onClick={handleNext}
            sx={{
              position: "absolute",
              top: "50%",
              right: 16,
              transform: "translateY(-50%)",
              bgcolor: "rgba(255, 255, 255, 0.7)",
              color: "#1E293B",
              opacity: { xs: 1, md: 0 },
              transition: "opacity 0.2s ease",
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.9)" },
              zIndex: 2,
              width: 36,
              height: 36
            }}
            size="small"
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>

          {/* Dots Indicator */}
          <Stack
            direction="row"
            spacing={0.75}
            sx={{
              position: "absolute",
              bottom: 12,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 2
            }}
          >
            {images.map((_, idx) => (
              <Box
                key={idx}
                onClick={(e) => { e.stopPropagation(); setActiveIndex(idx); }}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  bgcolor: activeIndex === idx ? "#0088ff" : "rgba(255, 255, 255, 0.5)",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
              />
            ))}
          </Stack>
        </>
      )}
    </Box>
  );
}

// ─── Image Lightbox Component ────────────────────────────────────────────────
function ImageLightbox({ open, onClose, imageUrl }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "rgba(0, 0, 0, 0.95)",
          boxShadow: "none",
          overflow: "hidden",
          position: "relative",
          borderRadius: "16px"
        }
      }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: "absolute",
          top: 12,
          right: 12,
          color: "#fff",
          bgcolor: "rgba(255, 255, 255, 0.15)",
          "&:hover": { bgcolor: "rgba(255, 255, 255, 0.25)" }
        }}
      >
        <CloseIcon />
      </IconButton>
      <Box
        component="img"
        src={imageUrl}
        alt="Fullscreen gallery item"
        sx={{
          width: "100%",
          maxHeight: "80vh",
          objectFit: "contain",
          p: 2
        }}
      />
    </Dialog>
  );
}

// ─── Upload Media Dialog Component ───────────────────────────────────────────
function UploadMediaDialog({ open, onClose, eventId, onUploaded }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith("image/"));
      if (files.length === 0) {
        setError("Please drop image files only.");
        return;
      }
      setSelectedFiles(prev => [...prev, ...files]);
      setError("");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files).filter(file => file.type.startsWith("image/"));
      setSelectedFiles(prev => [...prev, ...files]);
      setError("");
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setError("");

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append("galleryImages", file);
    });

    try {
      const res = await API.post(`/events/${eventId}/gallery`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data?.success) {
        onUploaded(res.data.data.additionalImages);
        setSelectedFiles([]);
        onClose();
      } else {
        setError(res.data?.message || "Failed to upload images.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleDialogClose = () => {
    if (!uploading) {
      setSelectedFiles([]);
      setError("");
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleDialogClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: "16px", overflow: "hidden" }
      }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F1F5F9", py: 2, px: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 16 }}>Upload Event Media</Typography>
        <IconButton onClick={handleDialogClose} disabled={uploading} size="small" sx={{ color: "#94A3B8" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ px: 3, pt: "20px !important", pb: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: "8px" }}>{error}</Alert>}
        
        {/* Drag and Drop Zone */}
        <Box
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById("gallery-file-input").click()}
          sx={{
            border: isDragging ? "2px dashed #0088ff" : "2px dashed #D0D5DD",
            bgcolor: isDragging ? "rgba(0, 136, 255, 0.04)" : "#F9FAFB",
            borderRadius: "12px",
            p: 4,
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              borderColor: "#0088ff",
              bgcolor: "rgba(0, 136, 255, 0.02)"
            }
          }}
        >
          <input
            id="gallery-file-input"
            type="file"
            multiple
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
            disabled={uploading}
          />
          <CloudUploadIcon sx={{ fontSize: 48, color: isDragging ? "#0088ff" : "#98A2B3", mb: 1.5 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#344054", mb: 0.5 }}>
            Drag & drop images here, or <span style={{ color: "#0088ff", textDecoration: "underline" }}>browse</span>
          </Typography>
          <Typography variant="caption" sx={{ color: "#667085" }}>
            Supports JPG, JPEG, PNG or GIF (Max 10 files at once)
          </Typography>
        </Box>

        {/* Selected files preview */}
        {selectedFiles.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#344054", mb: 1.5 }}>
              Selected Files ({selectedFiles.length})
            </Typography>
            <Stack spacing={1.5} sx={{ maxHeight: 200, overflowY: "auto", pr: 0.5 }}>
              {selectedFiles.map((file, idx) => {
                const previewUrl = URL.createObjectURL(file);
                return (
                  <Stack
                    key={idx}
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    sx={{
                      p: 1,
                      border: "1px solid #EAECF0",
                      borderRadius: "8px",
                      bgcolor: "#fff"
                    }}
                  >
                    <Box
                      component="img"
                      src={previewUrl}
                      alt={file.name}
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: "6px",
                        objectFit: "cover",
                        border: "1px solid #F2F4F7"
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: "#344054" }}>
                        {file.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#667085" }}>
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </Typography>
                    </Box>
                    <IconButton 
                      size="small" 
                      onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }}
                      disabled={uploading}
                      sx={{ color: "#98A2B3", "&:hover": { color: "#D92D20" } }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                );
              })}
            </Stack>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, borderTop: "1px solid #F1F5F9" }}>
        <Button 
          variant="outlined" 
          onClick={handleDialogClose} 
          disabled={uploading}
          sx={{ borderRadius: "8px", textTransform: "none", borderColor: "#E2E8F0", color: "#475569" }}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          disabled={selectedFiles.length === 0 || uploading} 
          onClick={handleUpload}
          sx={{ 
            bgcolor: "#0088ff", 
            borderRadius: "8px", 
            textTransform: "none", 
            fontWeight: 600, 
            boxShadow: "none", 
            "&:hover": { bgcolor: "#0077EE", boxShadow: "none" } 
          }}
        >
          {uploading ? <CircularProgress size={20} color="inherit" /> : `Upload ${selectedFiles.length} File${selectedFiles.length > 1 ? "s" : ""}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main EventDetail Page ────────────────────────────────────────────────────
export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const canManage = ["ADMIN", "CHAIRPERSON"].includes(user?.role);

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);

  // Upload dialog and Lightbox state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [activeImageUrl, setActiveImageUrl] = useState(null);

  // Review state
  const [myRating, setMyRating] = useState(0);
  const [myReviewText, setMyReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState("");



  const fetchEvent = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const res = await API.get(`/events/${id}`);
      if (res.data?.success) {
        const ev = res.data.data.event;
        setEvent(ev);
        // Pre-fill user's existing review if any
        const mine = ev.reviews?.find((r) => r.user?._id === user?._id || r.user === user?._id);
        if (mine) { setMyRating(mine.rating); setMyReviewText(mine.text || ""); }
      }
    } catch {
      setError("Could not load event details.");
    } finally {
      setLoading(false);
    }
  }, [id, user?._id]);

  useEffect(() => { fetchEvent(); }, [fetchEvent]);

  // ── Submit review ────────────────────────────────────────────────────────────
  const handleSubmitReview = async () => {
    if (!myRating) return;
    setReviewSubmitting(true); setReviewSuccess("");
    try {
      const res = await API.post(`/events/${id}/reviews`, { rating: myRating, text: myReviewText });
      if (res.data?.success) {
        setEvent((prev) => ({ ...prev, reviews: res.data.data.reviews }));
        setReviewSuccess("Your review has been saved!");
        setTimeout(() => setReviewSuccess(""), 3000);
      }
    } catch { /* ignore */ }
    finally { setReviewSubmitting(false); }
  };



  // ── Delete event ─────────────────────────────────────────────────────────────
  const handleDeleteEvent = async () => {
    if (!window.confirm("Permanently delete this event?")) return;
    try {
      await API.delete(`/events/${id}`);
      navigate("/events");
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ pb: 6 }}>
        <Skeleton variant="rectangular" height={320} sx={{ borderRadius: "16px", mb: 3 }} />
        <Skeleton variant="text" height={48} width="50%" sx={{ mb: 1 }} />
        <Skeleton variant="text" height={24} width="30%" />
      </Container>
    );
  }

  if (error || !event) {
    return (
      <Container maxWidth="lg" sx={{ pb: 6 }}>
        <Alert severity="error" sx={{ borderRadius: "12px", mb: 3 }}>{error || "Event not found."}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/events")} sx={{ textTransform: "none" }}>
          Back to Calendar
        </Button>
      </Container>
    );
  }

  const color = getCategoryColor(event.category);
  const isPast = event.eventDate && dayjs(event.eventDate).isBefore(dayjs(), "day");
  const myExistingReview = event.reviews?.find((r) => r.user?._id === user?._id || String(r.user) === String(user?._id));

  return (
    <Container maxWidth="lg" sx={{ pb: 6 }}>
<Grid container spacing={4}>
        {/* ── Left Column: Event details, Info grid, and Media Gallery (67-70% width) ── */}
        <Grid size={{ xs: 12, lg: 8 }}>
          {/* Cover Image Carousel */}
          <EventMediaCarousel
            coverImage={event.coverImage}
            additionalImages={event.additionalImages}
            onZoom={setActiveImageUrl}
          />

          <EventInformation
            event={event}
            color={color}
            isPast={isPast}
            canManage={canManage}
            user={user}
            onEdit={() => setEditOpen(true)}
            onDelete={handleDeleteEvent}
            onUploadMedia={() => setUploadOpen(true)}
          />
        </Grid>

        {/* ── Right Column: Reviews & Discussion Comments (30-33% width) ── */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3} sx={{ position: { lg: "sticky" }, top: 90 }}>
            <EventReviews
              reviews={event.reviews}
              myRating={myRating}
              myReviewText={myReviewText}
              onRatingChange={setMyRating}
              onReviewTextChange={setMyReviewText}
              onSubmitReview={handleSubmitReview}
              reviewSuccess={reviewSuccess}
              reviewSubmitting={reviewSubmitting}
              myExistingReview={myExistingReview}
              user={user}
            />
          </Stack>
        </Grid>
      </Grid>

      {/* Edit Dialog */}
      <EditEventDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        event={event}
        onSaved={(updatedEvent) => setEvent((prev) => ({ ...prev, ...updatedEvent }))}
      />

      {/* Media Uploader Dialog */}
      <UploadMediaDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        eventId={event._id}
        onUploaded={(newImages) => setEvent((prev) => ({ ...prev, additionalImages: newImages }))}
      />

      {/* Lightbox Dialog */}
      <ImageLightbox
        open={Boolean(activeImageUrl)}
        onClose={() => setActiveImageUrl(null)}
        imageUrl={activeImageUrl || ""}
      />
    </Container>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function EventInformation({ event, color, isPast, canManage, user, onEdit, onDelete, onUploadMedia }) {
  const formatTime = (t) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  return (
    <Card sx={{ borderRadius: "16px", border: "1px solid #EAECF0", boxShadow: "none", mb: 3 }}>
      <CardContent sx={{ p: 3 }}>
        {/* Badges & Admin Actions Row */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 0.5 }}>
            
            {isPast && (
              <Chip label="Past Event" size="small" variant="outlined" sx={{ fontSize: "12px", color: "#6B7280", borderColor: "#D1D5DB" }} />
            )}
          </Stack>
          
  
        </Stack>

        {/* Title */}
        <Typography variant="h4" sx={{ fontWeight: 800, color: "#1E293B", lineHeight: 1.25, mb: 1.5, letterSpacing: "-0.02em" }}>
          {event.title}
        </Typography>

        {/* Rating summary */}
        <Box sx={{ mb: 3 }}>
                  {/* Admin action buttons */}
          {canManage && (
            <Stack direction="row" spacing={1} sx={{ flexShrink: 0 ,justifyContent: "space-between"}}>
              <AverageRating reviews={event.reviews || []} />
              <Stack direction="row" spacing={1} sx={{ flexShrink: 0}}>
              <Tooltip title="Upload Media">
                <IconButton onClick={onUploadMedia} size="small" sx={{ border: "1px solid #E2E8F0", borderRadius: "8px", bgcolor: "#fff", color: "#0088ff" }}>
                  <CameraIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit Event">
                <IconButton onClick={onEdit} size="small" sx={{ border: "1px solid #E2E8F0", borderRadius: "8px", bgcolor: "#fff", color: "#344054" }}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {user?.role === "ADMIN" && (
                <Tooltip title="Delete Event">
                  <IconButton onClick={onDelete} size="small" sx={{ border: "1px solid #FECACA", borderRadius: "8px", bgcolor: "#fff", color: "#EF4444" }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              </Stack>
            </Stack>
          )}
        </Box>

        {/* Compact Event Info Grid (2x2) */}
        <Grid 
          container 
          spacing={2.5} 
          sx={{ 
            my: 3, 
            p: 2.5, 
            bgcolor: "#F8FAFC", 
            borderRadius: "16px", 
            border: "1px solid #EAECF0",
            width: "100%",
            mx: 0
          }}
        >
          {/* Date */}
          <Grid size={{ xs: 12, sm: 6 }} sx={{ pl: "0px !important", pt: "0px !important" }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1, bgcolor: `${color}10`, borderRadius: "10px", display: "flex", color }}>
                <EventIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 700, display: "block", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.05em" }}>Date</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#1E293B" }}>
                  {event.eventDate ? dayjs(event.eventDate).format("dddd, D MMMM YYYY") : "—"}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          {/* Time */}
          <Grid size={{ xs: 12, sm: 6 }} sx={{ pl: { xs: "0px", sm: "20px !important" }, pt: { xs: "16px", sm: "0px !important" } }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1, bgcolor: `${color}10`, borderRadius: "10px", display: "flex", color }}>
                <TimeIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 700, display: "block", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.05em" }}>Time</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#1E293B" }}>
                  {formatTime(event.startTime)} – {formatTime(event.endTime)}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          {/* Divider Line */}
          <Grid size={{ xs: 12 }} sx={{ display: { xs: "none", sm: "block" }, py: 1.5, pl: "0px !important" }}>
            <Divider />
          </Grid>

          {/* Venue */}
          <Grid size={{ xs: 12, sm: 6 }} sx={{ pl: "0px !important", pt: { xs: "16px", sm: "0px !important" } }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ p: 1, bgcolor: `${color}10`, borderRadius: "10px", display: "flex", color }}>
                <LocationIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 700, display: "block", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.05em" }}>Venue</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#1E293B", wordBreak: "break-word" }}>
                  {event.location || "—"}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          {/* Organizer */}
          <Grid size={{ xs: 12, sm: 6 }} sx={{ pl: { xs: "0px", sm: "20px !important" }, pt: { xs: "16px", sm: "0px !important" } }}>
            {event.createdBy && (
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ p: 1, bgcolor: `${color}10`, borderRadius: "10px", display: "flex", color }}>
                  <Avatar src={event.createdBy.profilePhoto?.url || ""} sx={{ width: 20, height: 20, fontSize: 10 }}>
                    {event.createdBy.name?.charAt(0)}
                  </Avatar>
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: "#64748B", fontWeight: 700, display: "block", textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.05em" }}>Organizer</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#1E293B", wordBreak: "break-word" }}>
                    {event.createdBy.name} ({event.createdBy.role})
                  </Typography>
                </Box>
              </Stack>
            )}
          </Grid>
        </Grid>

        <Divider sx={{ my: 2.5 }} />

        {/* Description */}
        <Typography variant="body1" sx={{ color: "#475569", lineHeight: 1.8, whiteSpace: "pre-wrap", fontSize: "15px" }}>
          {event.description}
        </Typography>
      </CardContent>
    </Card>
  );
}

function EventReviews({ reviews, myRating, myReviewText, onRatingChange, onReviewTextChange, onSubmitReview, reviewSuccess, reviewSubmitting, myExistingReview, user }) {
  return (
    <Card sx={{ borderRadius: "20px", border: "1px solid #E2E8F0", boxShadow: "0 8px 30px rgba(0,0,0,0.01)", overflow: "hidden" }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", p: 1, bgcolor: "#FFFBEB", borderRadius: "10px", color: "#F59E0B" }}>
            <StarIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#1E293B", letterSpacing: "-0.02em" }}>
              Visitor Reviews
            </Typography>
          
          </Box>
        </Stack>

        {/* Write a review */}
        <Box sx={{ background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)", borderRadius: "16px", p: 2.5, border: "1px solid #E2E8F0", mb: 3.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#334155", mb: 1.5 }}>
            {myExistingReview ? "Update your rating" : "Share your experience"}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <StarRating value={myRating} onChange={onRatingChange} size={23} />
            {myRating > 0 && (
              <Typography 
                variant="caption" 
                sx={{ 
                  bgcolor: "#FFFBEB", 
                  color: "#D97706", 
                  px: 1.5, 
                  py: 0.5, 
                  borderRadius: "20px", 
                  fontWeight: 800,
                  fontSize: "11px",
                  border: "1px solid #FEF3C7"
                }}
              >
                {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][myRating]}
              </Typography>
            )}
          </Stack>
          <TextField
            fullWidth
            multiline
            rows={1}
            size="small"
            placeholder="Write a review as a visitor..."
            value={myReviewText}
            onChange={(e) => onReviewTextChange(e.target.value)}
            sx={{ 
              mb: 2, 
              "& .MuiOutlinedInput-root": { 
                borderRadius: "12px", 
                bgcolor: "#fff",
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#CBD5E1" }
              } 
            }}
          />
          <Stack direction="row" alignItems="center" justifyContent="space-between">
          
            <Button
              variant="contained"
              size="small"
              disabled={!myRating || reviewSubmitting}
              onClick={onSubmitReview}
              sx={{
                ml: "auto",
                bgcolor: "#0088ff", 
                borderRadius: "10px", 
                textTransform: "none",
                fontWeight: 700, 
                boxShadow: "none",
                px: 2.5,
                py: 0.75,
                "&:hover": { bgcolor: "#0077EE", boxShadow: "none" },
              }}
            >
              {reviewSubmitting ? <CircularProgress size={16} color="inherit" /> : myExistingReview ? "Update Review" : "Submit Review"}
            </Button>
          </Stack>
        </Box>

        {/* All reviews */}
        <Stack spacing={2} sx={{ maxHeight: 350, overflowY: "auto", pr: 0.5 }}>
          {(reviews || []).length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4, px: 2 }}>
              <Box sx={{ display: "inline-flex", p: 1.5, bgcolor: "#F1F5F9", borderRadius: "50%", color: "#94A3B8", mb: 1.5 }}>
                <StarIcon sx={{ fontSize: 24 }} />
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#475569" }}>
                No reviews yet
              </Typography>
              <Typography variant="caption" sx={{ color: "#94A3B8", display: "block", mt: 0.5 }}>
                Be the first visitor to share your rating!
              </Typography>
            </Box>
          ) : (
            [...reviews].reverse().map((review) => (
              <Stack 
                key={review._id} 
                direction="row" 
                spacing={1.5} 
                alignItems="flex-start" 
                sx={{ 
                  p: 2,
                  bgcolor: "#F8FAFC",
                  borderRadius: "14px",
                  border: "1px solid #EAECF0",
                  transition: "transform 0.15s ease",
                  "&:hover": { transform: "translateY(-1px)", boxShadow: "0 4px 12px rgba(0,0,0,0.01)" }
                }}
              >
                <Avatar
                  src={review.user?.profilePhoto?.url || ""}
                  sx={{ width: 34, height: 34, fontSize: 13, border: "2px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
                >
                  {review.user?.name?.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" >
                    <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, color: "#1E293B", fontSize: "13px" }}>
                      {review.user?.name || "Visitor"}
                    </Typography>
                    <StarRating value={review.rating} readOnly size={13} />
                  </Stack>
                  <Typography variant="caption" sx={{ color: "#94A3B8", display: "block", mb: 1, fontSize: "10px", fontWeight: 500 }}>
                    {dayjs(review.createdAt).format("D MMM YYYY")}
                  </Typography>
                  {review.text && (
                    <Typography variant="body2" sx={{ color: "#475569", fontSize: 12.5, lineHeight: 1.5 }}>
                      {review.text}
                    </Typography>
                  )}
                </Box>
              </Stack>
            ))
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}


