import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Box,
  Stack,
  Drawer,
  Button,
  Checkbox,
  IconButton,
  TextField,
  Typography,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip
} from "@mui/material";
import {
  Add as AddIcon,
  Close as CloseIcon,
  DragIndicator as DragIndicatorIcon,
  Delete as DeleteIcon,
  Lock as LockIcon
} from "@mui/icons-material";

import { useCustomFieldMutations } from "./crmHooks";
import AddFieldForm from "./AddFieldForm";
import { getColumnDisplayName, isDefaultColumn, getDefaultColumnIndex } from "./leadHelpers";

export default function ColumnSelectorPanel({
  open,
  onClose,
  customFields,
  canManage,
  activeTabId,
  activeTabName,
  currentTabOrder,
  currentTabHidden,
  onSaveTabLayout
}) {
  const { create, remove, fetchUsage } = useCustomFieldMutations();

  const [fixedCols, setFixedCols] = useState([]);
  const [otherCols, setOtherCols] = useState([]);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [usage, setUsage] = useState(undefined);

  useEffect(() => {
    if (!open) return;
    const all = [...(customFields || [])].filter(
      (f) => (f.slug || "").toLowerCase() !== "status" && (f.name || "").toLowerCase() !== "status"
    );
    const orderMap = currentTabOrder && currentTabOrder.length > 0
      ? new Map(currentTabOrder.map((id, index) => [String(id), index]))
      : null;
    const hasCustomHidden = currentTabHidden !== null && currentTabHidden !== undefined;
    const hiddenSet = new Set(currentTabHidden || []);

    // 1. Fixed Default Columns (Always visible, non-draggable, permanently pinned)
    const fixed = all
      .filter(isDefaultColumn)
      .map((f) => ({
        ...f,
        isVisible: true
      }))
      .sort((a, b) => getDefaultColumnIndex(a) - getDefaultColumnIndex(b));

    // 2. Other Remaining Columns (Can be dragged, dropped, reordered, hidden)
    const others = all
      .filter((f) => !isDefaultColumn(f))
      .map((f) => ({
        ...f,
        isVisible: hasCustomHidden ? !hiddenSet.has(String(f._id)) : true
      }));

    if (orderMap) {
      others.sort((a, b) => {
        const idxA = orderMap.has(String(a._id)) ? orderMap.get(String(a._id)) : 9999 + (a.order ?? 0);
        const idxB = orderMap.has(String(b._id)) ? orderMap.get(String(b._id)) : 9999 + (b.order ?? 0);
        return idxA - idxB;
      });
    } else {
      others.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    setFixedCols(fixed);
    setOtherCols(others);
    setSearch("");
    setAdding(false);
  }, [open, customFields, currentTabOrder, currentTabHidden]);

  const handleClose = () => {
    if (onSaveTabLayout && activeTabId) {
      const orderIds = [
        ...fixedCols.map((f) => String(f._id)),
        ...otherCols.map((f) => String(f._id))
      ];
      const hiddenIds = otherCols.filter((f) => !f.isVisible).map((f) => String(f._id));
      onSaveTabLayout(activeTabId, orderIds, hiddenIds);
    }
    onClose();
  };

  const handleOtherDragEnd = (result) => {
    if (!result.destination) return;
    setOtherCols((prev) => {
      const next = Array.from(prev);
      const [moved] = next.splice(result.source.index, 1);
      next.splice(result.destination.index, 0, moved);
      return next;
    });
  };

  const toggleOther = (id) => {
    setOtherCols((prev) =>
      prev.map((f) => (String(f._id) === String(id) ? { ...f, isVisible: !f.isVisible } : f))
    );
  };

  const askDelete = async (field) => {
    setPendingDelete(field);
    setUsage(undefined);
    const useCount = await fetchUsage(field._id);
    setUsage(useCount);
  };

  const confirmDelete = async () => {
    try {
      await remove.mutateAsync(pendingDelete._id);
      setOtherCols((prev) =>
        prev.filter((f) => String(f._id) !== String(pendingDelete._id))
      );
    } finally {
      setPendingDelete(null);
    }
  };

  const handleCreate = async (data) => {
    const nextOrder = otherCols.reduce((max, f) => Math.max(max, f.order ?? 0), 100) + 1;
    const created = await create.mutateAsync({ ...data, order: nextOrder });
    if (created) {
      setOtherCols((prev) => [...prev, { ...created, isVisible: true }]);
    }
    setAdding(false);
  };

  const term = search.trim().toLowerCase();
  const shownFixed = term
    ? fixedCols.filter((f) => (getColumnDisplayName(f) || f.name || "").toLowerCase().includes(term))
    : fixedCols;
  const shownOthers = term
    ? otherCols.filter((f) => (getColumnDisplayName(f) || f.name || "").toLowerCase().includes(term))
    : otherCols;

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        PaperProps={{ sx: { width: { xs: "100%", sm: 420 } } }}
      >
        <Stack sx={{ height: "100%" }}>
          {/* Header */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ p: 2, borderBottom: "1px solid #EAECF0" }}
          >
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#101828" }}>
                Manage Columns
              </Typography>
              <Typography variant="caption" sx={{ color: "#667085" }}>
                {activeTabName ? `Tab: ${activeTabName}` : "Configure column layout"}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              {canManage && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setAdding((v) => !v)}
                  sx={{ textTransform: "none", borderRadius: "8px", color: "#0088ff", borderColor: "#0088ff" }}
                >
                  Add Custom Field
                </Button>
              )}
              <IconButton onClick={handleClose} size="small">
                <CloseIcon />
              </IconButton>
            </Stack>
          </Stack>

          {adding && (
            <AddFieldForm
              busy={create.isLoading}
              onCancel={() => setAdding(false)}
              onSubmit={handleCreate}
            />
          )}

          {/* Search Box */}
          <Box sx={{ p: 2, pb: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search columns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{ input: { sx: { borderRadius: "8px" } } }}
            />
          </Box>

          <Box sx={{ flex: 1, overflowY: "auto", px: 2, pb: 2 }}>
            {/* Section 1: Fixed Default Columns (NON-DRAGGABLE, NON-DROPPABLE) */}
            {shownFixed.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#475467", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Default Columns ({shownFixed.length})
                  </Typography>
                  <Chip
                    icon={<LockIcon sx={{ fontSize: "12px !important", color: "#667085 !important" }} />}
                    label="Fixed • Not Draggable"
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      backgroundColor: "#F2F4F7",
                      color: "#475467",
                      borderRadius: "4px"
                    }}
                  />
                </Box>
                <Stack spacing={0.5}>
                  {shownFixed.map((field) => (
                    <Stack
                      key={String(field._id)}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{
                        p: 1,
                        borderRadius: "8px",
                        backgroundColor: "#F9FAFB",
                        border: "1px solid #EAECF0"
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Tooltip title="Fixed default column (Always visible & non-draggable)" arrow>
                          <span>
                            <Checkbox
                              size="small"
                              checked={true}
                              disabled={true}
                              sx={{
                                p: 0.5,
                                color: "#0088ff",
                                "&.Mui-disabled": { color: "#0088ff", opacity: 0.85 }
                              }}
                            />
                          </span>
                        </Tooltip>

                        <Typography
                          variant="body2"
                          sx={{
                            color: "#101828",
                            fontWeight: 600,
                            lineHeight: 1,
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          {getColumnDisplayName(field)}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}

            <Divider sx={{ my: 1.5 }} />

            {/* Section 2: Other Remaining Columns (DRAGGABLE & DROPABLE TO REORDER) */}
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#475467", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Other Columns ({shownOthers.length})
                </Typography>
                <Typography variant="caption" sx={{ color: "#98A2B3", fontSize: "0.7rem" }}>
                  Drag ⁝⁝ to reorder
                </Typography>
              </Box>

              <DragDropContext onDragEnd={handleOtherDragEnd}>
                <Droppable droppableId="other-columns-droppable">
                  {(provided) => (
                    <Stack
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      spacing={0.5}
                    >
                      {shownOthers.map((field, index) => {
                        const isInternal = field.isInternal;

                        return (
                          <Draggable
                            key={String(field._id)}
                            draggableId={String(field._id)}
                            index={index}
                            isDragDisabled={Boolean(term)}
                          >
                            {(dragProvided, snapshot) => (
                              <Stack
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                direction="row"
                                alignItems="center"
                                justifyContent="space-between"
                                sx={{
                                  p: 1,
                                  borderRadius: "8px",
                                  border: snapshot.isDragging
                                    ? "1px solid #0088ff"
                                    : "1px solid transparent",
                                  backgroundColor: snapshot.isDragging
                                    ? "#F4F9FF"
                                    : "transparent",
                                  "&:hover": {
                                    backgroundColor: snapshot.isDragging
                                      ? "#F4F9FF"
                                      : "#F9FAFB",
                                  },
                                  ...dragProvided.draggableProps.style,
                                }}
                              >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  {!term ? (
                                    <Box
                                      {...dragProvided.dragHandleProps}
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        color: "#98A2B3",
                                        cursor: "grab",
                                        "&:hover": { color: "#475467" }
                                      }}
                                    >
                                      <DragIndicatorIcon fontSize="small" />
                                    </Box>
                                  ) : (
                                    <Box sx={{ width: 20 }} />
                                  )}

                                  <Checkbox
                                    size="small"
                                    checked={Boolean(field.isVisible)}
                                    onChange={() => toggleOther(field._id)}
                                    sx={{ p: 0.5, color: "#0088ff", "&.Mui-checked": { color: "#0088ff" } }}
                                  />

                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: "#344054",
                                      fontWeight: 500,
                                      lineHeight: 1,
                                      display: "inline-flex",
                                      alignItems: "center",
                                    }}
                                  >
                                    {getColumnDisplayName(field)}
                                  </Typography>
                                </Box>

                                {!isInternal && canManage && (
                                  <IconButton
                                    size="small"
                                    onClick={() => askDelete(field)}
                                    sx={{ color: "error.main" }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </Stack>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </Stack>
                  )}
                </Droppable>
              </DragDropContext>
            </Box>
          </Box>

          <Divider />
          <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button
              variant="contained"
              onClick={handleClose}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                bgcolor: "#0088ff",
                "&:hover": { bgcolor: "#0077ee" },
                fontWeight: 600,
                boxShadow: "none"
              }}
            >
              Save Configuration
            </Button>
          </Box>
        </Stack>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(pendingDelete)} onClose={() => setPendingDelete(null)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Custom Field?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Are you sure you want to permanently delete the custom field <strong>{pendingDelete?.name}</strong>?
            This will delete the column and remove any values saved under this field across all users.
          </DialogContentText>
          {usage !== undefined ? (
            <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>
              Warning: This field currently has values filled on {usage} record(s).
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Calculating active usages...
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPendingDelete(null)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={usage === undefined}
            sx={{ borderRadius: "8px" }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

ColumnSelectorPanel.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  customFields: PropTypes.array,
  canManage: PropTypes.bool,
  activeTabId: PropTypes.string,
  activeTabName: PropTypes.string,
  currentTabOrder: PropTypes.array,
  currentTabHidden: PropTypes.array,
  onSaveTabLayout: PropTypes.func,
};
