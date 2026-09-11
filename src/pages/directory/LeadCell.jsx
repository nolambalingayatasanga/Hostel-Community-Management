import React, { useState, useMemo, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Box, Select, MenuItem, TextField, Typography, Tooltip, CircularProgress } from "@mui/material";
import {
  KeyboardArrowDown as ChevronDownIcon,
  WhatsApp as WhatsAppIcon,
  Instagram as InstagramIcon,
  LinkedIn as LinkedInIcon,
} from "@mui/icons-material";
import debounce from "lodash/debounce";

// Clean message bubble icon matching the reference design
const ChatIcon = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <path d="M8 9h8" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 13h5" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

import { INTERNAL_SLUGS, leadFieldValue, formatLeadDate, formatLeadDateTime, isFieldNonEditable } from "./leadHelpers";
import { useAuth } from "../../context/AuthContext";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#FFFFFF",
    minHeight: 38,
    "& fieldset": { borderColor: "#EAECF0" },
    "&:hover fieldset": { borderColor: "#D0D5DD" },
  },
};

const selectSx = {
  borderRadius: "8px",
  backgroundColor: "#FFFFFF",
  minHeight: 38,
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#EAECF0" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#D0D5DD" },
};

const readSx = (editable, isLocked = false) => ({
  display: "flex",
  alignItems: "center",
  minHeight: 38,
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  borderRadius: "8px",
  px: 1.5,
  py: 0.5,
  border: isLocked ? "1px solid #D0D5DD" : "1px solid #EAECF0",
  backgroundColor: isLocked ? "#fbfbfbff" : "#FFFFFF",
  cursor: isLocked ? "not-allowed" : editable ? "pointer" : "default",
  transition: "all 0.15s ease",
  ...(editable && {
    "&:hover": {
      borderColor: "#98A2B3",
      backgroundColor: "#FDFDFD",
    },
  }),
  ...(isLocked && {
    userSelect: "none",
  }),
});

const getStatusBadge = (statusName) => {
  const s = (statusName || "").toLowerCase();
  if (s.includes("active") || s.includes("joined") || s.includes("paid")) {
    return { bg: "#ECFDF3", text: "#027A48", border: "1px solid #ABEFC6" };
  }
  if (s.includes("new") || s.includes("pending") || s.includes("lead") || s.includes("inquiry")) {
    return { bg: "#FFFAEB", text: "#B54708", border: "1px solid #FEDF89" };
  }
  if (s.includes("inactive") || s.includes("left") || s.includes("dropped") || s.includes("reject") || s.includes("expired")) {
    return { bg: "#FEF3F2", text: "#B42318", border: "1px solid #FECDCA" };
  }
  if (s.includes("student") || s.includes("member") || s.includes("alumni")) {
    return { bg: "#EFF8FF", text: "#175CD3", border: "1px solid #B2DDFF" };
  }
  return { bg: "#F8F9FA", text: "#344054", border: "1px solid #EAECF0" };
};

// Debounced Inline Text Editor component with live auto-save
function InlineTextEditor({
  initialValue,
  type,
  onSave,
  onStopEdit,
  inputSx,
}) {
  const [val, setVal] = useState(initialValue === "—" ? "" : (initialValue || ""));
  const [isSaving, setIsSaving] = useState(false);
  const lastSavedRef = useRef(initialValue === "—" ? "" : (initialValue || ""));

  // Debounced auto-save handler triggered after user pauses typing (700ms)
  const debouncedSave = useMemo(
    () =>
      debounce(async (newVal) => {
        if (newVal !== lastSavedRef.current) {
          setIsSaving(true);
          try {
            await onSave(newVal);
            lastSavedRef.current = newVal;
          } catch (err) {
            console.error("Failed to auto-save field:", err);
          } finally {
            setIsSaving(false);
          }
        }
      }, 700),
    [onSave]
  );

  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  const handleChange = (e) => {
    const nextVal = e.target.value;
    setVal(nextVal);
    debouncedSave(nextVal);
  };

  const handleBlur = async () => {
    debouncedSave.cancel();
    if (val !== lastSavedRef.current) {
      setIsSaving(true);
      try {
        await onSave(val);
        lastSavedRef.current = val;
      } catch (err) {
        console.error("Failed to save field on blur:", err);
      } finally {
        setIsSaving(false);
      }
    }
    onStopEdit();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.target.blur();
    }
    if (e.key === "Escape") {
      debouncedSave.cancel();
      onStopEdit();
    }
  };

  return (
    <TextField
      fullWidth
      size="small"
      autoFocus
      type={type}
      value={val}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      slotProps={{
        input: {
          endAdornment: isSaving ? (
            <CircularProgress size={14} sx={{ color: "#0088FF", mr: 0.5, flexShrink: 0 }} />
          ) : null,
        },
      }}
      sx={{
        ...inputSx,
        "& .MuiOutlinedInput-root": {
          ...inputSx["& .MuiOutlinedInput-root"],
          borderColor: isSaving ? "#0088FF" : undefined,
        },
      }}
    />
  );
}

export default function LeadCell({
  field,
  row,
  meta,
  disabled,
  isEditing,
  onStartEdit,
  onStopEdit,
  onChangeRef,
  onChangeField,
  onOpenProfile,
  sx = {},
  className = "",
}) {
  const width = field.width;
  const wrap = (children) => (
    <Box
      className={className}
      sx={{
        width,
        minWidth: width === "auto" ? 140 : width,
        flexShrink: 0,
        px: 1.5,
        ...sx,
      }}
    >
      {children}
    </Box>
  );

  const isInternal = field.isInternal;
  const isName = field.slug === INTERNAL_SLUGS.NAME || (field.slug || "").toLowerCase() === "name";
  const isEmail = field.slug === INTERNAL_SLUGS.EMAIL || (field.slug || "").toLowerCase() === "email";
  const isPhone = field.slug === INTERNAL_SLUGS.PHONE || (field.slug || "").toLowerCase() === "phone";
  const isRole = field.slug === INTERNAL_SLUGS.ROLE || (field.slug || "").toLowerCase() === "role";
  const isStatus = field.slug === INTERNAL_SLUGS.STATUS || (field.slug || "").toLowerCase() === "status";
  const isGender = field.slug === INTERNAL_SLUGS.GENDER || (field.slug || "").toLowerCase() === "gender";
  const isAge = field.slug === INTERNAL_SLUGS.AGE || (field.slug || "").toLowerCase() === "age";
  const isJoiningDate = (field.slug || "").toLowerCase().includes("joiningdate") || (field.slug || "").toLowerCase().includes("registereddate");
  const isChannels = field.slug === INTERNAL_SLUGS.CHANNELS || (field.slug || "").toLowerCase() === "channels";
  const isRelativeName = field.slug === INTERNAL_SLUGS.RELATIVE_NAME || (field.slug || "").toLowerCase() === "relativename" || (field.slug || "").toLowerCase() === "relation";

  const { user } = useAuth();
  const currentViewerRole = user?.role;
  const isViewerAdmin = currentViewerRole === "ADMIN";
  const isViewerWarden = currentViewerRole === "WARDEN";

  // Strict check: Joining Date, Registration Number, Receipt NO, and SL No are non-editable by ANY user (even admin)
  const isLocked = isFieldNonEditable(field);
  const editable = !disabled && !isLocked && (!isRole || isViewerAdmin || isViewerWarden);

  const hasPicker =
    (isRole && (isViewerAdmin || isViewerWarden)) ||
    isStatus ||
    isGender ||
    field.type === "select";

  const displayValue = (forEdit = false) => {
    if (isName) return row.name || "";
    if (isEmail) return row.email || "";
    if (isPhone) return row.phone || "";
    if (isRole) return row.role || "";
    if (isStatus) return meta.statusById.get(row.statusId)?.name || row.statusName || "";
    if (isGender) return row.gender || "";
    if (isAge) {
      if (row.age != null && row.age !== "") return String(row.age);
      const dobVal = row.dob || row.dateOfBirth || row.raw?.dob || row.raw?.dateOfBirth;
      if (dobVal) {
        const diff = Date.now() - new Date(dobVal).getTime();
        const a = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
        if (!isNaN(a) && a >= 0) return String(a);
      }
      return "";
    }
    if (isJoiningDate) return formatLeadDate(row.joiningDate) || "";
    if (isRelativeName) return row.relativeName || row.relativename || row.raw?.relation?.relatedPersonName || "";

    // Handle any other schema-mapped fields
    if (field.isInternal && field.slug) {
      let val = row[field.slug];
      if (val === undefined || val === null || val === "") {
        val = row[field.slug.toLowerCase()];
      }
      if (val === undefined || val === null || val === "") {
        val = row.raw?.[field.slug] ?? row.raw?.memberInfo?.[field.slug];
      }
      if (field.slug === "dateOfBirth" && val) {
        return formatLeadDate(val);
      }
      if ((field.slug === "email" || field.slug === "email") && (!val || val === "") && row.raw?.isEmailMasked) {
        return "••••@••••.•• (Masked)";
      }
      if ((field.slug === "adhaar" || field.slug === "aadhaar") && (!val || val === "") && row.raw?.isAdhaarMasked) {
        return "•••• •••• •••• (Masked)";
      }
      return val != null && val !== "" ? String(val) : "";
    }

    // Custom fields value retrieval
    return leadFieldValue(row.raw, field._id) || "";
  };

  // 1. Stacked Name + Joined Date View with same standard Cell UI
  if (isName && !isEditing) {
    return wrap(
      <Box
        onClick={editable ? onStartEdit : (onOpenProfile ? () => onOpenProfile(row) : undefined)}
        sx={{
          ...readSx(editable),
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          py: 0.5,
          cursor: editable ? "pointer" : onOpenProfile ? "pointer" : "default",
        }}
        title={editable ? `Click to edit: ${row.name || "—"}` : (row.name || "—")}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            fontSize: "0.875rem",
          
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            width: "100%",
            lineHeight: 1.3,
          }}
        >
          {row.name || "—"}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: "#667085",
            fontSize: "0.75rem",
            fontWeight: 400,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            width: "100%",
            lineHeight: 1.3,
            mt: 0.25,
          }}
        >
          {formatLeadDate(row.joiningDate) || "—"}
        </Typography>
      </Box>
    );
  }

  // 2. Phone View with same standard Cell UI
  if (isPhone && !isEditing) {
    const rawPhone = row.phone || "";
    const isPhoneMasked = Boolean(!rawPhone && row.raw?.isPhoneMasked);
    return wrap(
      <Box
        onClick={editable && !isPhoneMasked ? onStartEdit : undefined}
        sx={readSx(editable && !isPhoneMasked)}
        title={isPhoneMasked ? "Phone is masked by user privacy settings" : rawPhone}
      >
        <Typography
          variant="body2"
          sx={{
            color: rawPhone ? "#101828" : isPhoneMasked ? "#64748B" : "#98A2B3",
            fontSize: "0.875rem",
            fontWeight:  500,
            fontStyle: isPhoneMasked ? "italic" : "normal",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {rawPhone || (isPhoneMasked ? "•••••••••• (Masked)" : "-")}
        </Typography>
      </Box>
    );
  }

  // 3. Channels View (WhatsApp, Instagram, LinkedIn icons)
  if (isChannels && !isEditing) {
    const ch = row.channels || row.raw?.channels || {};
    const rawPhone = row.phone || row.raw?.phone || "";
    const whatsappNum = (ch.whatsapp || rawPhone || "").replace(/\D/g, "");
    const instagramUrl = ch.instagram
      ? (ch.instagram.startsWith("http") ? ch.instagram : `https://instagram.com/${ch.instagram.replace(/^@/, "")}`)
      : null;
    const linkedinUrl = ch.linkedin
      ? (ch.linkedin.startsWith("http") ? ch.linkedin : `https://linkedin.com/in/${ch.linkedin.replace(/^\/+/, "")}`)
      : null;
    const whatsappUrl = whatsappNum ? `https://wa.me/${whatsappNum}` : null;

    const hasAny = Boolean(whatsappUrl || instagramUrl || linkedinUrl);

    if (!hasAny) {
      return wrap(
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", minHeight: 38 }}>
          <Typography variant="body2" sx={{ color: "#98A2B3", px: 0.5 }}>
            -
          </Typography>
        </Box>
      );
    }

    return wrap(
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", gap: 1.5, minHeight: 38 }}>
        {whatsappUrl && (
          <Tooltip title="Chat on WhatsApp" arrow>
            <Box
              component="a"
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#25D366",
                transition: "transform 0.15s ease",
                "&:hover": { transform: "scale(1.2)" },
              }}
            >
              <WhatsAppIcon sx={{ fontSize: 22 }} />
            </Box>
          </Tooltip>
        )}
        {instagramUrl && (
          <Tooltip title="View Instagram Profile" arrow>
            <Box
              component="a"
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#E1306C",
                transition: "transform 0.15s ease",
                "&:hover": { transform: "scale(1.2)" },
              }}
            >
              <InstagramIcon sx={{ fontSize: 20 }} />
            </Box>
          </Tooltip>
        )}
        {linkedinUrl && (
          <Tooltip title="View LinkedIn Profile" arrow>
            <Box
              component="a"
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0A66C2",
                transition: "transform 0.15s ease",
                "&:hover": { transform: "scale(1.2)" },
              }}
            >
              <LinkedInIcon sx={{ fontSize: 20 }} />
            </Box>
          </Tooltip>
        )}
      </Box>
    );
  }

  // 3. Status Badge View
  if (isStatus && !isEditing) {
    const currentStatusName = meta.statusById.get(row.statusId)?.name || row.statusName || "";
    const badgeStyle = getStatusBadge(currentStatusName);
    return wrap(
      <Box
        onClick={editable ? onStartEdit : undefined}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 38,
          width: "100%",
          borderRadius: "8px",
          px: 1.5,
          border: "1px solid #EAECF0",
          backgroundColor: "#FFFFFF",
          cursor: editable ? "pointer" : "default",
          transition: "border-color 0.15s ease",
          ...(editable && { "&:hover": { borderColor: "#D0D5DD" } }),
        }}
        title={currentStatusName}
      >
        {currentStatusName ? (
          <Box
            sx={{
              backgroundColor: badgeStyle.bg,
              color: badgeStyle.text,
              border: badgeStyle.border,
              borderRadius: "16px",
              px: 1.5,
              py: 0.25,
              fontSize: "0.75rem",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            {currentStatusName}
          </Box>
        ) : (
          <Typography variant="body2" sx={{ color: "#98A2B3" }}>
            -
          </Typography>
        )}
        {editable && <ChevronDownIcon sx={{ width: 18, height: 18, color: "#98A2B3", ml: "auto" }} />}
      </Box>
    );
  }

  // 4. Default Read View for other columns
  if (!isEditing) {
    const shown = displayValue();
    return wrap(
      <Box
        onClick={editable ? onStartEdit : undefined}
        sx={readSx(editable, isLocked)}
        title={isLocked ? `${shown} (Read-only / Non-editable)` : shown}
      >
        <Typography
          variant="body2"
          sx={{
            flex: 1,
            minWidth: 0,
            color: shown === "" ? "#98A2B3" : isLocked ? "#475467" : "#101828",
            fontWeight: isLocked ? 500 : 400,
            fontSize: "0.875rem",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {shown === "" ? "-" : shown}
        </Typography>
        {hasPicker && editable && (
          <ChevronDownIcon sx={{ width: 18, height: 18, color: "#98A2B3", flexShrink: 0 }} />
        )}
      </Box>
    );
  }

  // Commit reference helper
  const commitRef = (key) => (e) => {
    onChangeRef(row.id, key, e.target.value || null);
    onStopEdit();
  };

  if (isRole) {
    if (!isViewerAdmin && !isViewerChairperson) {
      const shown = displayValue();
      return wrap(
        <Box sx={readSx(false)} title={shown}>
          <Typography variant="body2" sx={{ flex: 1, color: "#101828" }}>
            {shown}
          </Typography>
        </Box>
      );
    }

    const allowedRoles = isViewerAdmin
      ? ["ADMIN", "WARDEN", "MEMBER", "STAFF", "STUDENT", "ALUMNI"]
      : ["MEMBER", "STAFF", "STUDENT", "ALUMNI"];

    return wrap(
      <Select
        fullWidth
        size="small"
        autoFocus
        defaultOpen
        value={allowedRoles.includes(row.role) ? row.role : ""}
        onChange={commitRef("role")}
        onClose={onStopEdit}
        sx={selectSx}
      >
        {allowedRoles.map((role) => (
          <MenuItem key={role} value={role}>
            {role}
          </MenuItem>
        ))}
      </Select>
    );
  }

  if (isStatus) {
    return wrap(
      <Select
        fullWidth
        size="small"
        autoFocus
        defaultOpen
        value={row.statusId || ""}
        onChange={commitRef("status")}
        onClose={onStopEdit}
        sx={selectSx}
      >
        {meta.statuses.map((status) => (
          <MenuItem key={status._id} value={status._id}>
            {status.name}
          </MenuItem>
        ))}
      </Select>
    );
  }

  if (isGender) {
    return wrap(
      <Select
        fullWidth
        size="small"
        autoFocus
        defaultOpen
        value={row.gender || ""}
        onChange={commitRef("gender")}
        onClose={onStopEdit}
        sx={selectSx}
      >
        {["MALE", "FEMALE", "OTHER"].map((g) => (
          <MenuItem key={g} value={g}>
            {g}
          </MenuItem>
        ))}
      </Select>
    );
  }

  if (field.type === "select" && field.options?.length) {
    const rawVal = field.isInternal ? row[field.slug] : leadFieldValue(row.raw, field._id);
    const isEmployment = (field.slug || "").toLowerCase().includes("employment");
    const filteredOptions = isEmployment
      ? field.options.filter(opt => !["Self-Employed", "Other", "—", "-", ""].includes(opt))
      : field.options;

    return wrap(
      <Select
        fullWidth
        size="small"
        autoFocus
        defaultOpen
        value={rawVal || (isEmployment ? (filteredOptions[0] || "Employed") : "")}
        onChange={(e) => {
          if (field.isInternal) {
            onChangeRef(row.id, field.slug, e.target.value);
          } else {
            onChangeField(row.id, field._id, e.target.value);
          }
          onStopEdit();
        }}
        onClose={onStopEdit}
        sx={selectSx}
      >
        {!isEmployment && <MenuItem value="">—</MenuItem>}
        {filteredOptions.map((opt) => (
          <MenuItem key={opt} value={opt}>
            {opt}
          </MenuItem>
        ))}
      </Select>
    );
  }

  // Default editable text/number input with real-time debounce auto-save
  const stored = isInternal ? displayValue(true) : leadFieldValue(row.raw, field._id);

  return wrap(
    <InlineTextEditor
      initialValue={stored}
      type={field.type === "number" || isAge ? "number" : "text"}
      onSave={(newVal) => {
        if (isInternal) {
          return onChangeRef(row.id, field.slug, newVal);
        } else {
          return onChangeField(row.id, field._id, newVal);
        }
      }}
      onStopEdit={onStopEdit}
      inputSx={inputSx}
    />
  );
}

LeadCell.propTypes = {
  field: PropTypes.object.isRequired,
  row: PropTypes.object.isRequired,
  meta: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
  isEditing: PropTypes.bool,
  onStartEdit: PropTypes.func.isRequired,
  onStopEdit: PropTypes.func.isRequired,
  onChangeRef: PropTypes.func.isRequired,
  onChangeField: PropTypes.func.isRequired,
  onOpenProfile: PropTypes.func,
  sx: PropTypes.object,
  className: PropTypes.string,
};
