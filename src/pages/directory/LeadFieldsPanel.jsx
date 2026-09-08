import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import {
  Paper,
  Grid,
  Stack,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";

import { useLeadMutations } from "./crmHooks";
import { leadFieldValue } from "./leadHelpers";

function EditableField({ leadId, field, value, editable }) {
  const { updateField } = useLeadMutations();
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  const save = async (next) =>
    updateField.mutateAsync({ id: leadId, field: field._id, value: next });

  const commit = async () => {
    if (draft === value) return;
    try {
      await save(draft);
    } catch {
      setDraft(value);
    }
  };

  const disabledSx = {
    "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "#101828" },
  };

  if (field.type === "select" && field.options?.length) {
    return (
      <FormControl size="small" fullWidth>
        <Select
          value={draft ?? ""}
          disabled={!editable}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          sx={disabledSx}
        >
          {field.options.map((option, index) => (
            <MenuItem key={index} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  return (
    <TextField
      size="small"
      fullWidth
      value={draft ?? ""}
      disabled={!editable}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.target.blur();
      }}
      sx={disabledSx}
    />
  );
}

EditableField.propTypes = {
  leadId: PropTypes.string,
  field: PropTypes.object.isRequired,
  value: PropTypes.string,
  editable: PropTypes.bool,
};

export default function LeadFieldsPanel({ lead, customFields, editable }) {
  const fields = (customFields || []).filter((field) => !field.isInternal);

  if (!fields.length) {
    return (
      <Paper variant="outlined" sx={{ p: 3, border: "1px solid #EAECF0" }}>
        <Typography variant="body2" color="text.secondary" align="center">
          No custom fields are currently configured. You can create them in the column selector settings.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ border: "1px solid #EAECF0" }}>
      <Grid container columnSpacing={5} rowSpacing={2.5} padding={2.5}>
        {fields.map((field) => (
          <Grid item xs={12} sm={6} key={field._id}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={2}
              sx={{ width: "100%" }}
            >
              <Typography sx={{ width: 140, flexShrink: 0, fontWeight: 600, color: "#475467" }} variant="body2">
                {field.name}
              </Typography>
              <EditableField
                leadId={lead?._id || lead?.id}
                field={field}
                value={leadFieldValue(lead, field._id)}
                editable={editable}
              />
            </Stack>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}

LeadFieldsPanel.propTypes = {
  lead: PropTypes.object,
  customFields: PropTypes.array,
  editable: PropTypes.bool,
};

LeadFieldsPanel.defaultProps = { editable: true };
