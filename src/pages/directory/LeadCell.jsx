import PropTypes from "prop-types";
import { Box, Select, MenuItem, TextField, Typography } from "@mui/material";
import { KeyboardArrowDown as ChevronDownIcon } from "@mui/icons-material";

import { INTERNAL_SLUGS, leadFieldValue, formatLeadDate } from "./leadHelpers";
import { useAuth } from "../../context/AuthContext";

const formatPhoneWithFlag = (phone) => {
  if (!phone) return "";
  const clean = phone.replace(/\D/g, "");
  
  if (clean.length === 10 && /^[6-9]/.test(clean)) {
    return `🇮🇳 +91 ${clean}`;
  }
  if (clean.length === 12 && clean.startsWith("91")) {
    return `🇮🇳 +91 ${clean.slice(2)}`;
  }
  if (clean.length === 11 && clean.startsWith("0") && /^[6-9]/.test(clean.slice(1))) {
    return `🇮🇳 +91 ${clean.slice(1)}`;
  }
  if (phone.includes("+91") || phone.startsWith("91")) {
    const num = phone.replace("+91", "").replace(/\s/g, "");
    return `🇮🇳 +91 ${num}`;
  }
  if (clean.length === 10) {
    return `🇮🇳 +91 ${clean}`;
  }
  return phone;
};

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    backgroundColor: "#FFFFFF",
    "& fieldset": { borderColor: "#EAECF0" },
    "&:hover fieldset": { borderColor: "#D0D5DD" },
  },
};

const selectSx = {
  borderRadius: "8px",
  backgroundColor: "#FFFFFF",
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#EAECF0" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#D0D5DD" },
};

const readSx = (editable) => ({
  display: "flex",
  alignItems: "center",
  minHeight: 36,
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  borderRadius: "6px",
  px: 1.5,
  py: 0.75,
  border: "1px solid #EAECF0",
  backgroundColor: "#FFFFFF",
  cursor: editable ? "pointer" : "default",
  transition: "border-color 0.15s ease",
  ...(editable && { "&:hover": { borderColor: "#D0D5DD" } }),
});

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
}) {
  const width = field.width;
  const wrap = (children) => (
    <Box sx={{ width, minWidth: width === "auto" ? 140 : width, flexShrink: 0, px: 2 }}>{children}</Box>
  );

  const isInternal = field.isInternal;
  const isName = field.slug === INTERNAL_SLUGS.NAME;
  const isEmail = field.slug === INTERNAL_SLUGS.EMAIL;
  const isPhone = field.slug === INTERNAL_SLUGS.PHONE;
  const isRole = field.slug === INTERNAL_SLUGS.ROLE;
  const isStatus = field.slug === INTERNAL_SLUGS.STATUS;
  const isGender = field.slug === INTERNAL_SLUGS.GENDER;
  const isAge = field.slug === INTERNAL_SLUGS.AGE;
  const isJoiningDate = field.slug === INTERNAL_SLUGS.JOINING_DATE;

  const { user } = useAuth();
  const currentViewerRole = user?.role;
  const isViewerAdmin = currentViewerRole === 'ADMIN';
  const isViewerChairperson = currentViewerRole === 'CHAIRPERSON';

  const editable = !disabled && (!isRole || isViewerAdmin || isViewerChairperson);

  const hasPicker =
    (isRole && (isViewerAdmin || isViewerChairperson)) ||
    isStatus ||
    isGender ||
    isJoiningDate ||
    field.type === "select";

  const displayValue = (forEdit = false) => {
    if (isName) return row.name || "";
    if (isEmail) return row.email || "";
    if (isPhone) {
      const rawPhone = row.phone || "";
      return forEdit ? rawPhone : formatPhoneWithFlag(rawPhone);
    }
    if (isRole) return row.role || "";
    if (isStatus) return meta.statusById.get(row.statusId)?.name || row.statusName || "";
    if (isGender) return row.gender || "";
    if (isAge) return row.age != null ? String(row.age) : "";
    if (isJoiningDate) return formatLeadDate(row.joiningDate) || "";

    // Handle any other schema-mapped fields
    if (field.isInternal && field.slug) {
      const val = row[field.slug];
      if (field.slug === "dateOfBirth" && val) {
        return formatLeadDate(val);
      }
      return val != null && val !== "" ? String(val) : "";
    }

    // Custom fields value retrieval
    return leadFieldValue(row.raw, field._id) || "";
  };

  if (!isEditing) {
    const shown = displayValue();
    return wrap(
      <Box
        onClick={editable ? onStartEdit : undefined}
        sx={readSx(editable)}
        title={shown}
      >
        <Typography
          variant="body2"
          sx={{
            flex: 1,
            minWidth: 0,
            color: shown === "" ? "#98A2B3" : "#101828",
            fontWeight: isStatus || isName ? 600 : 400,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
        >
          {shown}
        </Typography>
        {hasPicker && editable && (
          <ChevronDownIcon sx={{ width: 18, height: 18, color: "#98A2B3", flexShrink: 0 }} />
        )}
      </Box>,
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
      ? ['ADMIN', 'CHAIRPERSON', 'MEMBER', 'STAFF', 'STUDENT', 'ALUMNI']
      : ['MEMBER', 'STAFF', 'STUDENT', 'ALUMNI'];

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
      </Select>,
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
      </Select>,
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
        {['MALE', 'FEMALE', 'OTHER'].map((g) => (
          <MenuItem key={g} value={g}>
            {g}
          </MenuItem>
        ))}
      </Select>,
    );
  }

  if (field.type === "select" && field.options?.length) {
    const rawVal = field.isInternal ? row[field.slug] : leadFieldValue(row.raw, field._id);
    return wrap(
      <Select
        fullWidth
        size="small"
        autoFocus
        defaultOpen
        value={rawVal || ""}
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
        <MenuItem value="">—</MenuItem>
        {field.options.map((opt) => (
          <MenuItem key={opt} value={opt}>
            {opt}
          </MenuItem>
        ))}
      </Select>,
    );
  }

  // Default editable text/number input
  const stored = isInternal ? displayValue(true) : leadFieldValue(row.raw, field._id);

  return wrap(
    <TextField
      fullWidth
      size="small"
      autoFocus
      type={field.type === "number" || isAge ? "number" : "text"}
      defaultValue={stored === "—" ? "" : stored}
      onBlur={(e) => {
        const val = e.target.value;
        if (val !== (stored === "—" ? "" : stored)) {
          if (isInternal) {
            onChangeRef(row.id, field.slug, val);
          } else {
            onChangeField(row.id, field._id, val);
          }
        }
        onStopEdit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.target.blur();
        if (e.key === "Escape") onStopEdit();
      }}
      sx={inputSx}
    />,
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
};
