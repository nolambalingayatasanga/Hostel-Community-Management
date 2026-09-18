import React, { useState, useMemo, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Box, Select, MenuItem, TextField, Typography, Tooltip, CircularProgress } from "@mui/material";
import {
  KeyboardArrowDown as ChevronDownIcon,
  WhatsApp as WhatsAppIcon,
  Instagram as InstagramIcon,
  LinkedIn as LinkedInIcon,
  CheckCircle as CheckCircleIcon,
  Shield as SecurityIcon,
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
  const [saveSuccess, setSaveSuccess] = useState(false);
  const lastSavedRef = useRef(initialValue === "—" ? "" : (initialValue || ""));
  const onSaveRef = useRef(onSave);
  const successTimerRef = useRef(null);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  // Debounced auto-save handler triggered after user pauses typing (650ms)
  const debouncedSave = useMemo(
    () =>
      debounce(async (newVal) => {
        if (newVal !== lastSavedRef.current) {
          setIsSaving(true);
          setSaveSuccess(false);
          try {
            await onSaveRef.current(newVal);
            lastSavedRef.current = newVal;
            setSaveSuccess(true);
            if (successTimerRef.current) clearTimeout(successTimerRef.current);
            successTimerRef.current = setTimeout(() => setSaveSuccess(false), 2000);
          } catch (err) {
            console.error("Failed to auto-save field:", err);
          } finally {
            setIsSaving(false);
          }
        }
      }, 650),
    []
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
        await onSaveRef.current(val);
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
            <CircularProgress size={16} sx={{ color: "#0088FF", mr: 0.5, flexShrink: 0 }} />
          ) : saveSuccess ? (
            <CheckCircleIcon sx={{ fontSize: 16, color: "#12B76A", mr: 0.5, flexShrink: 0 }} />
          ) : null,
        },
      }}
      sx={{
        ...inputSx,
        "& .MuiOutlinedInput-root": {
          ...inputSx["& .MuiOutlinedInput-root"],
          borderColor: isSaving ? "#0088FF" : saveSuccess ? "#12B76A" : undefined,
          transition: "border-color 0.2s ease",
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
  onOpenAuditModal,
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
  const isGender = field.slug === INTERNAL_SLUGS.GENDER || (field.slug || "").toLowerCase() === "gender";
  const isAge = field.slug === INTERNAL_SLUGS.AGE || (field.slug || "").toLowerCase() === "age";
  const isJoiningDate = (field.slug || "").toLowerCase().includes("joiningdate") || (field.slug || "").toLowerCase().includes("registereddate");
  const isChannels = field.slug === INTERNAL_SLUGS.CHANNELS || (field.slug || "").toLowerCase() === "channels";
  const isRelativeName = field.slug === INTERNAL_SLUGS.RELATIVE_NAME || (field.slug || "").toLowerCase() === "relativename" || (field.slug || "").toLowerCase() === "relation";
  const isLoginDetails = (field.slug || "").toLowerCase() === "logindetails";

  const { user } = useAuth();
  const currentViewerRole = user?.role;
  const isViewerAdmin = currentViewerRole === "ADMIN";
  const isViewerWarden = currentViewerRole === "WARDEN";
  const canEditRole = isViewerAdmin || isViewerWarden;

  // Strict check: Joining Date, Registration Number, Receipt NO, and SL No are non-editable by ANY user (even admin)
  const isLocked = isFieldNonEditable(field);
  const editable = !disabled && !isLocked && (!isRole || canEditRole);

  const hasPicker =
    (isRole && canEditRole) ||
    isGender ||
    field.type === "select";

  const isAdhaar = field.slug === INTERNAL_SLUGS.ADHAAR || (field.slug || "").toLowerCase() === "adhaar" || (field.slug || "").toLowerCase() === "aadhaar";

  const displayValue = (forEdit = false) => {
    if (isName) return row.name || "";
    if (isEmail) {
      const isEmailHidden = Boolean(row.raw?.isEmailMasked || row.raw?.privacySettings?.maskEmail);
      if (isEmailHidden && !forEdit) return "••••••••••••";
      return row.email || "";
    }
    if (isPhone) {
      const isPhoneHidden = Boolean(row.raw?.isPhoneMasked || row.raw?.privacySettings?.maskPhone);
      if (isPhoneHidden && !forEdit) return "••••••••••";
      return row.phone || "";
    }
    if (isAdhaar) {
      const isAdhaarHidden = Boolean(row.raw?.isAdhaarMasked || row.raw?.privacySettings?.maskAdhaar);
      if (isAdhaarHidden && !forEdit) return "•••• •••• ••••";
      return row.adhaar || row.raw?.adhaar || "";
    }
    if (isRole) return row.role || "";
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

    // Handle any schema-mapped fields by slug
    if (field.slug) {
      let val = row[field.slug];
      if (val === undefined || val === null || val === "") {
        val = row[field.slug.toLowerCase()];
      }
      if (val === undefined || val === null || val === "") {
        val = row.raw?.[field.slug] ?? row.raw?.[field.slug.toLowerCase()] ?? row.raw?.memberInfo?.[field.slug];
      }
      if ((val === undefined || val === null || val === "") && field.slug.includes(".")) {
        const parts = field.slug.split(".");
        let curr = row.raw;
        for (const p of parts) {
          if (!curr) break;
          curr = curr[p];
        }
        val = curr;
      }
      if ((field.slug === "dateOfBirth" || field.slug === "dob") && val) {
        return formatLeadDate(val);
      }
      if (val != null && val !== "") return String(val);
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
    const isPhoneHidden = Boolean(row.raw?.isPhoneMasked || row.raw?.privacySettings?.maskPhone);
    const rawPhone = isPhoneHidden ? "" : (row.phone || "");
    return wrap(
      <Box
        onClick={editable && !isPhoneHidden ? onStartEdit : undefined}
        sx={readSx(editable && !isPhoneHidden)}
        title={isPhoneHidden ? "Phone is hidden by user privacy settings" : rawPhone}
      >
        <Typography
          variant="body2"
          sx={{
            color: rawPhone ? "#101828" : isPhoneHidden ? "#64748B" : "#98A2B3",
            fontSize: "0.875rem",
            fontWeight:  500,
            fontStyle: isPhoneHidden ? "italic" : "normal",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {rawPhone || (isPhoneHidden ? "••••••••••" : "-")}
        </Typography>
      </Box>
    );
  }

  // 3. Email View with same standard Cell UI
  if (isEmail && !isEditing) {
    const isEmailHidden = Boolean(row.raw?.isEmailMasked || row.raw?.privacySettings?.maskEmail);
    const rawEmail = isEmailHidden ? "" : (row.email || "");
    return wrap(
      <Box
        onClick={editable && !isEmailHidden ? onStartEdit : undefined}
        sx={readSx(editable && !isEmailHidden)}
        title={isEmailHidden ? "Email is hidden by user privacy settings" : rawEmail}
      >
        <Typography
          variant="body2"
          sx={{
            color: rawEmail ? "#101828" : isEmailHidden ? "#64748B" : "#98A2B3",
            fontSize: "0.875rem",
            fontWeight: 500,
            fontStyle: isEmailHidden ? "italic" : "normal",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {rawEmail || (isEmailHidden ? "••••••••••••" : "-")}
        </Typography>
      </Box>
    );
  }

  // 4. Aadhaar View with same standard Cell UI
  if (isAdhaar && !isEditing) {
    const isAdhaarHidden = Boolean(row.raw?.isAdhaarMasked || row.raw?.privacySettings?.maskAdhaar);
    const rawAdhaar = isAdhaarHidden ? "" : (row.adhaar || row.raw?.adhaar || "");
    return wrap(
      <Box
        onClick={editable && !isAdhaarHidden ? onStartEdit : undefined}
        sx={readSx(editable && !isAdhaarHidden)}
        title={isAdhaarHidden ? "Aadhaar is hidden by user privacy settings" : rawAdhaar}
      >
        <Typography
          variant="body2"
          sx={{
            color: rawAdhaar ? "#101828" : isAdhaarHidden ? "#64748B" : "#98A2B3",
            fontSize: "0.875rem",
            fontWeight: 500,
            fontStyle: isAdhaarHidden ? "italic" : "normal",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {rawAdhaar || (isAdhaarHidden ? "•••• •••• ••••" : "-")}
        </Typography>
      </Box>
    );
  }

  // 3. Channels View (WhatsApp, Instagram, LinkedIn icons)
  if (isChannels && !isEditing) {
    const ch = row.channels || row.raw?.channels || {};
    const isPhoneHidden = Boolean(row.raw?.isPhoneMasked || row.raw?.privacySettings?.maskPhone);
    const rawPhone = isPhoneHidden ? "" : (row.phone || row.raw?.phone || "");
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

  // Login Details View (Admin Only Telemetry & Audit Logs)
  if (isLoginDetails) {
    const loginData = row.raw?.lastLoginDetails;
    const hasLogins = Boolean(loginData?.ip || row.raw?.lastLoginAt);

    return wrap(
      <Box
        onClick={() => onOpenAuditModal?.(row)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          cursor: "pointer",
          p: 0.6,
          px: 1,
          borderRadius: "8px",
          transition: "all 0.15s ease",
          bgcolor: hasLogins ? "#F0FDF4" : "#F8FAFC",
          border: `1px solid ${hasLogins ? "#BBF7D0" : "#E2E8F0"}`,
          "&:hover": {
            bgcolor: hasLogins ? "#DCFCE7" : "#EDF2F7",
            borderColor: hasLogins ? "#86EFAC" : "#CBD5E1",
            transform: "translateY(-1px)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.06)"
          }
        }}
        title="Click to view full login telemetry and security audit logs"
      >
        <SecurityIcon sx={{ fontSize: 16, color: hasLogins ? "#16A34A" : "#64748B", flexShrink: 0 }} />
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              fontSize: "11px",
              color: hasLogins ? "#15803D" : "#475467",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "block",
              lineHeight: 1.2
            }}
          >
            {hasLogins ? (loginData?.ip ? `${loginData.ip}` : "Logged In") : "View Details"}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontSize: "10px",
              color: "#94A3B8",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "block",
              lineHeight: 1.2
            }}
          >
            {hasLogins
              ? (loginData?.browser ? `${loginData.browser} • ${loginData.os || ''}` : "View telemetry")
              : "No logins recorded"}
          </Typography>
        </Box>
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
    if (!canEditRole) {
      const shown = displayValue();
      return wrap(
        <Box sx={readSx(false)} title={shown}>
          <Typography variant="body2" sx={{ flex: 1, color: "#101828" }}>
            {shown}
          </Typography>
        </Box>
      );
    }

    const allowedRoles = (isViewerAdmin || isViewerWarden)
      ? ["ADMIN", "WARDEN", "MEMBER", "STAFF", "STUDENT", "ALUMNI"]
      : ["MEMBER", "STAFF", "STUDENT", "ALUMNI"];

    const currentRoleUpper = (row.role || "").toUpperCase();

    return wrap(
      <Select
        fullWidth
        size="small"
        autoFocus
        defaultOpen
        value={allowedRoles.includes(currentRoleUpper) ? currentRoleUpper : ""}
        onChange={(e) => {
          onChangeRef(row.id, "role", e.target.value);
          onStopEdit();
        }}
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
    const isSlugField = Boolean(field.slug);
    const rawVal = isSlugField ? row[field.slug] : leadFieldValue(row.raw, field._id);
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
          if (isSlugField) {
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
  const hasSlug = Boolean(field.slug);
  const stored = hasSlug ? displayValue(true) : leadFieldValue(row.raw, field._id);

  return wrap(
    <InlineTextEditor
      initialValue={stored}
      type={field.type === "number" || isAge ? "number" : "text"}
      onSave={(newVal) => {
        if (hasSlug) {
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
