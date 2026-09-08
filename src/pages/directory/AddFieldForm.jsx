import PropTypes from "prop-types";
import { useState } from "react";
import {
  Box,
  Stack,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Typography,
  Chip,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";

export default function AddFieldForm({ onCancel, onSubmit, busy }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("text");
  const [values, setValues] = useState([]);
  const [draftValue, setDraftValue] = useState("");

  const addValue = () => {
    const trimmed = draftValue.trim();
    if (!trimmed || values.includes(trimmed)) return;
    setValues([...values, trimmed]);
    setDraftValue("");
  };

  const canSubmit =
    name.trim() && (type !== "select" || values.length > 0) && !busy;

  return (
    <Box sx={{ p: 2, borderBottom: "1px solid #EAECF0", backgroundColor: "#F9FAFB" }}>
      <Stack spacing={2}>
        <TextField
          size="small"
          label="Field name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />

        <Stack direction="row" spacing={1}>
          <FormControl size="small" fullWidth>
            <InputLabel id="field-type-label">Type</InputLabel>
            <Select
              labelId="field-type-label"
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <MenuItem value="text">Text</MenuItem>
              <MenuItem value="number">Number</MenuItem>
              <MenuItem value="select">Dropdown (Select)</MenuItem>
              <MenuItem value="date">Date</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {type === "select" && (
          <Stack spacing={1}>
            <Stack direction="row" spacing={1}>
              <TextField
                size="small"
                fullWidth
                label="Add an option"
                value={draftValue}
                onChange={(e) => setDraftValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addValue();
                  }
                }}
              />
              <IconButton onClick={addValue} disabled={!draftValue.trim()}>
                <AddIcon />
              </IconButton>
            </Stack>
            {values.length > 0 ? (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {values.map((v) => (
                  <Chip
                    key={v}
                    size="small"
                    label={v}
                    onDelete={() =>
                      setValues(values.filter((x) => x !== v))
                    }
                  />
                ))}
              </Box>
            ) : (
              <Typography variant="caption" color="text.secondary">
                A select field needs at least one option.
              </Typography>
            )}
          </Stack>
        )}

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button size="small" color="inherit" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            disabled={!canSubmit}
            onClick={() =>
              onSubmit({ name: name.trim(), type, options: values })
            }
          >
            {busy ? "Adding…" : "Add field"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

AddFieldForm.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  busy: PropTypes.bool,
};
