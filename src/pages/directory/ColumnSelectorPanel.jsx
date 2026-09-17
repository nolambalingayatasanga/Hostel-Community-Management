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
} from "@mui/material";
import {
  Add as AddIcon,
  Close as CloseIcon,
  DragIndicator as DragIndicatorIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";

import { useCustomFieldMutations } from "./crmHooks";
import AddFieldForm from "./AddFieldForm";
import { getColumnDisplayName } from "./leadHelpers";

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
  const { saveLayout, create, remove, fetchUsage } = useCustomFieldMutations();

  const [draft, setDraft] = useState([]);
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
    const hiddenSet = new Set(currentTabHidden || []);

    const sorted = all.map(f => ({
      ...f,
      isVisible: ((f.slug || '').toLowerCase() === 'name' || (f.name || '').toLowerCase() === 'name') ? true : (hiddenSet.has(String(f._id)) ? false : (f.isVisible !== false))
    })).sort((a, b) => {
      const isNameA = (a.slug || '').toLowerCase() === 'name' || (a.name || '').toLowerCase() === 'name';
      const isNameB = (b.slug || '').toLowerCase() === 'name' || (b.name || '').toLowerCase() === 'name';
      if (isNameA) return -1;
      if (isNameB) return 1;
      if (orderMap) {
        const idxA = orderMap.has(String(a._id)) ? orderMap.get(String(a._id)) : 9999 + (a.order ?? 0);
        const idxB = orderMap.has(String(b._id)) ? orderMap.get(String(b._id)) : 9999 + (b.order ?? 0);
        return idxA - idxB;
      }
      return (a.order ?? 0) - (b.order ?? 0);
    });

    setDraft(sorted);
    setSearch("");
    setAdding(false);
  }, [open, customFields, currentTabOrder, currentTabHidden]);

  const handleClose = () => {
    if (onSaveTabLayout && activeTabId) {
      const orderIds = draft.map((f) => String(f._id));
      const hiddenIds = draft.filter((f) => !f.isVisible).map((f) => String(f._id));
      onSaveTabLayout(activeTabId, orderIds, hiddenIds);
    } else if (canManage) {
      saveLayout.mutate(draft.map((f, index) => ({ ...f, order: index })));
    }
    onClose();
  };

  const toggle = (id) =>
    setDraft((prev) =>
      prev.map((f) => {
        const isName = (f.slug || '').toLowerCase() === 'name' || (f.name || '').toLowerCase() === 'name';
        if (isName) return f;
        return String(f._id) === String(id) ? { ...f, isVisible: !f.isVisible } : f;
      }),
    );

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    setDraft((prev) => {
      const next = Array.from(prev);
      const [moved] = next.splice(result.source.index, 1);
      next.splice(result.destination.index, 0, moved);
      // Guarantee Name remains strictly at index 0
      const nameIdx = next.findIndex(f => (f.slug || '').toLowerCase() === 'name' || (f.name || '').toLowerCase() === 'name');
      if (nameIdx > 0) {
        const [nameItem] = next.splice(nameIdx, 1);
        next.unshift(nameItem);
      }
      return next;
    });
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
      setDraft((prev) =>
        prev.filter((f) => String(f._id) !== String(pendingDelete._id)),
      );
    } finally {
      setPendingDelete(null);
    }
  };

  const handleCreate = async (data) => {
    const nextOrder = draft.reduce((max, f) => Math.max(max, f.order ?? 0), 0) + 1;
    await create.mutateAsync({ ...data, order: nextOrder });
    setAdding(false);
  };

  const term = search.trim().toLowerCase();
  const shown = term
    ? draft.filter((f) => f.name?.toLowerCase().includes(term))
    : draft;

  const canReorder = canManage && !term;

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        PaperProps={{ sx: { width: { xs: "100%", sm: 420 } } }}
      >
        <Stack sx={{ height: "100%" }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ p: 2, borderBottom: "1px solid #EAECF0" }}
          >
         
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

          <Box sx={{ p: 2, pb: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search fields..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{ input: { sx: { borderRadius: "8px" } } }}
            />
          </Box>

          <Box sx={{ flex: 1, overflowY: "auto", px: 2 }}>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="fields" isDropDisabled={!canReorder}>
                {(provided) => (
                  <Stack
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    spacing={0.5}
                  >
                    {shown.map((field, index) => {
                      const isInternal = field.isInternal;
                      const isName = (field.slug || '').toLowerCase() === 'name' || (field.name || '').toLowerCase() === 'name';
                      return (
                        <Draggable
                          key={field._id}
                          draggableId={field._id}
                          index={index}
                          isDragDisabled={!canReorder || isName}
                        >
                          {(provided, snapshot) => (
                            <Stack
                              ref={provided.innerRef}
                              {...provided.draggableProps}
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
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                {canReorder && !isName ? (
                                  <Box
                                    {...provided.dragHandleProps}
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      color: "text.secondary",
                                      cursor: "grab",
                                    }}
                                  >
                                    <DragIndicatorIcon fontSize="small" />
                                  </Box>
                                ) : (
                                  <Box sx={{ width: 20 }} />
                                )}

                                <Tooltip title={isName ? "Name is a fixed required column" : ""} arrow>
                                  <span>
                                    <Checkbox
                                      size="small"
                                      disabled={isName}
                                      checked={Boolean(field.isVisible)}
                                      onChange={() => toggle(field._id)}
                                      sx={{ p: 0.5, color: "#0088ff", "&.Mui-checked": { color: "#0088ff" } }}
                                    />
                                  </span>
                                </Tooltip>

                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "#344054",
                                    fontWeight: isName ? 600 : 500,
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
};
