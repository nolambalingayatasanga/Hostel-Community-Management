import { useState, useImperativeHandle, forwardRef, useEffect, useMemo } from "react";
// @mui
import {
  Box,
  Button,
  Typography,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Select,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/EditOutlined";
import { useSnackbar } from "notistack";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// utils
import axios from "src/utils/axios";
import crmEndpoints from "src/utils/crm/endpoints";
import getStatusGroups from "src/services/crm/getStatusGroups";

// context
import { useCrm } from "src/contexts/crm/CrmContext";

// hooks
import crmKeys from "src/hooks/crm/queryKeys";

// components
import Iconify from "src/components/Iconify";

// ----------------------------------------------------------------------

const StatusGroupTab = forwardRef((props, ref) => {
  const { enqueueSnackbar } = useSnackbar();
  const { orgId } = useCrm();
  const queryClient = useQueryClient();

  // Queries
  const { data: statusGroupsData, isLoading: isLoadingGroups } = useQuery(
    crmKeys.statusGroups(orgId),
    getStatusGroups,
    { enabled: Boolean(orgId), staleTime: 10 * 1000 }
  );

  // Map status groups and statuses
  const mappedColumns = useMemo(() => {
    if (!statusGroupsData) return [];

    const sortedGroups = [...statusGroupsData].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );

    return sortedGroups.map((group) => {
      const groupId = group._id || group.id;
      const groupStatuses = group.statuses || [];

      return {
        ...group,
        id: groupId,
        statuses: groupStatuses,
      };
    });
  }, [statusGroupsData]);

  // Local state for columns to support smooth/optimistic dragging
  const [orderedGroups, setOrderedGroups] = useState([]);

  useEffect(() => {
    if (mappedColumns.length > 0) {
      setOrderedGroups(mappedColumns);
    }
  }, [mappedColumns]);

  // Dialog & Form States
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState(null);
  const [modalGroupName, setModalGroupName] = useState("");

  const [isCreateStatusOpen, setIsCreateStatusOpen] = useState(false);
  const [isEditStatusOpen, setIsEditStatusOpen] = useState(false);
  const [statusToEdit, setStatusToEdit] = useState(null);
  const [selectedGroupIdForNewStatus, setSelectedGroupIdForNewStatus] = useState("");
  const [modalStatusName, setModalStatusName] = useState("");
  const [modalStatusDescription, setModalStatusDescription] = useState("");
  const [modalStatusGroupId, setModalStatusGroupId] = useState("");

  // Context Menu States
  const [groupMenuAnchor, setGroupMenuAnchor] = useState(null);
  const [activeGroupForMenu, setActiveGroupForMenu] = useState(null);

  const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
  const [activeStatusForMenu, setActiveStatusForMenu] = useState(null);
  const [activeStatusGroupForMenu, setActiveStatusGroupForMenu] = useState(null);

  // Expose group creation triggers to the parent sidebar
  useImperativeHandle(ref, () => ({
    openCreateModal: () => {
      setModalGroupName("");
      setIsCreateGroupOpen(true);
    },
  }));

  // Group mutations
  const createGroupMutation = useMutation(
    async (newGroup) => {
      const response = await axios.post(crmEndpoints.settings.statusGroups, newGroup);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(crmKeys.statusGroups(orgId));
        setIsCreateGroupOpen(false);
        enqueueSnackbar("Status group created successfully!", { variant: "success" });
      },
      onError: (err) => {
        enqueueSnackbar(err.message || "Failed to create status group", { variant: "error" });
      },
    }
  );

  const updateGroupMutation = useMutation(
    async ({ id, data }) => {
      const response = await axios.put(crmEndpoints.settings.statusGroupById(id), data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(crmKeys.statusGroups(orgId));
        setIsEditGroupOpen(false);
        enqueueSnackbar("Status group updated successfully!", { variant: "success" });
      },
      onError: (err) => {
        enqueueSnackbar(err.message || "Failed to update status group", { variant: "error" });
      },
    }
  );

  const deleteGroupMutation = useMutation(
    async (id) => {
      const response = await axios.delete(crmEndpoints.settings.statusGroupById(id));
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(crmKeys.statusGroups(orgId));
        enqueueSnackbar("Status group deleted successfully!", { variant: "success" });
      },
      onError: (err) => {
        enqueueSnackbar(err.message || "Failed to delete status group", { variant: "error" });
      },
    }
  );

  // Status mutations
  const createStatusMutation = useMutation(
    async (newStatus) => {
      const response = await axios.post(crmEndpoints.settings.statuses, newStatus);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(crmKeys.statusGroups(orgId));
        queryClient.invalidateQueries(crmKeys.statuses(orgId));
        setIsCreateStatusOpen(false);
        enqueueSnackbar("Status created successfully!", { variant: "success" });
      },
      onError: (err) => {
        enqueueSnackbar(err.message || "Failed to create status", { variant: "error" });
      },
    }
  );

  const updateStatusMutation = useMutation(
    async ({ id, data }) => {
      const response = await axios.put(crmEndpoints.settings.statusById(id), data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(crmKeys.statusGroups(orgId));
        queryClient.invalidateQueries(crmKeys.statuses(orgId));
        setIsEditStatusOpen(false);
        enqueueSnackbar("Status updated successfully!", { variant: "success" });
      },
      onError: (err) => {
        enqueueSnackbar(err.message || "Failed to update status", { variant: "error" });
      },
    }
  );

  const deleteStatusMutation = useMutation(
    async (id) => {
      const response = await axios.delete(crmEndpoints.settings.statusById(id));
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(crmKeys.statusGroups(orgId));
        queryClient.invalidateQueries(crmKeys.statuses(orgId));
        enqueueSnackbar("Status deleted successfully!", { variant: "success" });
      },
      onError: (err) => {
        enqueueSnackbar(err.message || "Failed to delete status", { variant: "error" });
      },
    }
  );

  // Reorder mutations
  const reorderGroupsMutation = useMutation(
    async (payload) => {
      const response = await axios.put(
        crmEndpoints.settings.statusGroupsReorder,
        payload
      );
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(crmKeys.statusGroups(orgId));
      },
      onError: (err) => {
        enqueueSnackbar(err.message || "Failed to save group order", { variant: "error" });
        queryClient.invalidateQueries(crmKeys.statusGroups(orgId));
      },
    }
  );

  const orderStatusesMutation = useMutation(
    async (payload) => {
      const response = await axios.put(
        crmEndpoints.settings.statusGroupsOrder,
        payload
      );
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(crmKeys.statusGroups(orgId));
        queryClient.invalidateQueries(crmKeys.statuses(orgId));
      },
      onError: (err) => {
        enqueueSnackbar(err.message || "Failed to save status order", { variant: "error" });
        queryClient.invalidateQueries(crmKeys.statusGroups(orgId));
        queryClient.invalidateQueries(crmKeys.statuses(orgId));
      },
    }
  );

  // Group handlers
  const handleCreateGroupSubmit = (e) => {
    e.preventDefault();
    if (!modalGroupName.trim()) {
      enqueueSnackbar("Group name is required", { variant: "error" });
      return;
    }
    createGroupMutation.mutate({
      name: modalGroupName,
    });
  };

  const handleEditGroupSubmit = (e) => {
    e.preventDefault();
    if (!modalGroupName.trim()) {
      enqueueSnackbar("Group name is required", { variant: "error" });
      return;
    }
    updateGroupMutation.mutate({
      id: groupToEdit._id || groupToEdit.id,
      data: {
        name: modalGroupName,
      },
    });
  };

  // Status handlers
  const handleCreateStatusSubmit = (e) => {
    e.preventDefault();
    if (!modalStatusName.trim()) {
      enqueueSnackbar("Status name is required", { variant: "error" });
      return;
    }
    createStatusMutation.mutate({
      name: modalStatusName,
      description: modalStatusDescription,
      statusGroup: selectedGroupIdForNewStatus,
    });
  };

  const handleEditStatusSubmit = (e) => {
    e.preventDefault();
    if (!modalStatusName.trim()) {
      enqueueSnackbar("Status name is required", { variant: "error" });
      return;
    }
    updateStatusMutation.mutate({
      id: statusToEdit._id || statusToEdit.id,
      data: {
        name: modalStatusName,
        description: modalStatusDescription || "No description",
        statusGroup: modalStatusGroupId,
      },
    });
  };

  // Drag and drop handler
  const handleDragEnd = (result) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Column Drag & Drop
    if (type === "column") {
      const newGroups = Array.from(orderedGroups);
      const [removed] = newGroups.splice(source.index, 1);
      newGroups.splice(destination.index, 0, removed);

      setOrderedGroups(newGroups);

      const reorderPayload = {
        statuses: newGroups.map((g, idx) => ({
          _id: g._id || g.id,
          order: idx,
        })),
      };
      reorderGroupsMutation.mutate(reorderPayload);
      return;
    }

    // Status Card Drag & Drop
    const sourceGroupId = source.droppableId;
    const destGroupId = destination.droppableId;
    const statusId = draggableId;

    const sourceGroup = orderedGroups.find((g) => (g._id || g.id) === sourceGroupId);
    const destGroup = orderedGroups.find((g) => (g._id || g.id) === destGroupId);

    if (!sourceGroup || !destGroup) return;

    const sourceStatuses = Array.from(sourceGroup.statuses || []);
    const [draggedStatus] = sourceStatuses.splice(source.index, 1);

    let newGroups = [...orderedGroups];

    if (sourceGroupId === destGroupId) {
      // Reordering inside the same group
      sourceStatuses.splice(destination.index, 0, draggedStatus);
      newGroups = orderedGroups.map((g) => {
        if ((g._id || g.id) === sourceGroupId) {
          return { ...g, statuses: sourceStatuses };
        }
        return g;
      });
    } else {
      // Moving status to a different group
      const destStatuses = Array.from(destGroup.statuses || []);
      destStatuses.splice(destination.index, 0, draggedStatus);
      newGroups = orderedGroups.map((g) => {
        if ((g._id || g.id) === sourceGroupId) {
          return { ...g, statuses: sourceStatuses };
        }
        if ((g._id || g.id) === destGroupId) {
          return { ...g, statuses: destStatuses };
        }
        return g;
      });
    }

    setOrderedGroups(newGroups);

    const sourceArray = sourceStatuses.map((s) => s._id || s.id);
    const destinationArray = sourceGroupId === destGroupId
      ? sourceArray
      : (newGroups.find((g) => (g._id || g.id) === destGroupId)?.statuses || []).map((s) => s._id || s.id);

    const orderPayload = {
      sourceGroup: sourceGroupId,
      sourceArray,
      destinationGroup: destGroupId,
      destinationArray,
      status: statusId,
    };

    orderStatusesMutation.mutate(orderPayload);
  };

  // Group Menu Handlers
  const handleOpenGroupMenu = (e, group) => {
    setGroupMenuAnchor(e.currentTarget);
    setActiveGroupForMenu(group);
  };

  const handleCloseGroupMenu = () => {
    setGroupMenuAnchor(null);
    setActiveGroupForMenu(null);
  };

  const handleEditGroupClick = () => {
    if (activeGroupForMenu) {
      setGroupToEdit(activeGroupForMenu);
      setModalGroupName(activeGroupForMenu.name || "");
      setIsEditGroupOpen(true);
    }
    handleCloseGroupMenu();
  };

  const handleDeleteGroupClick = () => {
    if (activeGroupForMenu) {
      if (
        window.confirm(
          `Are you sure you want to delete the status group "${activeGroupForMenu.name}"?`
        )
      ) {
        deleteGroupMutation.mutate(activeGroupForMenu._id || activeGroupForMenu.id);
      }
    }
    handleCloseGroupMenu();
  };

  // Status Menu Handlers
  const handleOpenStatusMenu = (e, status, groupId) => {
    setStatusMenuAnchor(e.currentTarget);
    setActiveStatusForMenu(status);
    setActiveStatusGroupForMenu(groupId);
  };

  const handleCloseStatusMenu = () => {
    setStatusMenuAnchor(null);
    setActiveStatusForMenu(null);
    setActiveStatusGroupForMenu(null);
  };

  const handleEditStatusClick = () => {
    if (activeStatusForMenu) {
      setStatusToEdit(activeStatusForMenu);
      setModalStatusName(activeStatusForMenu.name || "");
      setModalStatusDescription(activeStatusForMenu.description || "");
      setModalStatusGroupId(activeStatusGroupForMenu || "");
      setIsEditStatusOpen(true);
    }
    handleCloseStatusMenu();
  };

  const handleDeleteStatusClick = () => {
    if (activeStatusForMenu) {
      if (
        window.confirm(
          `Are you sure you want to delete the status "${activeStatusForMenu.name}"?`
        )
      ) {
        deleteStatusMutation.mutate(activeStatusForMenu._id || activeStatusForMenu.id);
      }
    }
    handleCloseStatusMenu();
  };

  const handleAddStatusClick = (groupId) => {
    setSelectedGroupIdForNewStatus(groupId);
    setModalStatusName("");
    setModalStatusDescription("");
    setIsCreateStatusOpen(true);
  };

  if (isLoadingGroups) {
    return (
      <Box sx={{ width: "100%", mt: 4 }}>
        <Typography variant="body2" sx={{ color: "#667085", mb: 2, textAlign: "center" }}>
          Loading Kanban configuration...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* Board Scroll Wrapper */}
      <Box
        sx={{
          display: "flex",
          gap: 3,
          pb: 3,
          overflowX: "auto",
          height: "75dvh",
          alignItems: "flex-start",
          "&::-webkit-scrollbar": { height: 8 },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: "#CBD5E1",
            borderRadius: 999,
          },
          "&::-webkit-scrollbar-track": {
            bgcolor: "transparent",
          },
        }}
      >
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="board" direction="horizontal" type="column">
            {(provided) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                sx={{
                  display: "flex",
                  gap: 3,
                  height: "100%",
                  alignItems: "stretch",
                }}
              >
                {orderedGroups.map((group, index) => (
                  <Draggable key={group.id} draggableId={group.id} index={index}>
                    {(provided, snapshot) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        sx={{
                          width: 320,
                          flexShrink: 0,
                          display: "flex",
                          flexDirection: "column",
                          backgroundColor: "#FFFFFF",
                          borderRadius: "12px",
                          border: "1px solid #EAECF0",
                          boxShadow: snapshot.isDragging
                            ? "0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)"
                            : "none",
                          maxHeight: "100%",
                          ...provided.draggableProps.style,
                        }}
                      >
                        {/* Column Header */}
                        <Box
                          sx={{
                            px: 2.5,
                            py: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderBottom: "1px solid #EAECF0",
                            backgroundColor: "#F9FAFB",
                            borderTopLeftRadius: "11px",
                            borderTopRightRadius: "11px",
                          }}
                        >
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                            {...provided.dragHandleProps}
                          >
                            <Iconify
                              icon="material-symbols:drag-indicator"
                              sx={{ color: "#98A2B3", cursor: "grab", fontSize: 20 }}
                            />
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#101828" }}>
                              {group.name}
                            </Typography>
                            <Typography
                              sx={{
                                minWidth: 20,
                                height: 20,
                                borderRadius: "50%",
                                backgroundColor: "#EAECF0",
                                color: "#475467",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                px: 0.5,
                              }}
                            >
                              {(group.statuses || []).length}
                            </Typography>
                          </Stack>
                          <IconButton size="small" onClick={(e) => handleOpenGroupMenu(e, group)}>
                            <Iconify icon="eva:more-vertical-fill" sx={{ width: 20, height: 20 }} />
                          </IconButton>
                        </Box>

                        {/* Status Droppable area */}
                        <Droppable droppableId={group.id} type="status">
                          {(provided, snapshot) => (
                            <Box
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              sx={{
                                flex: 1,
                                overflowY: "auto",
                                px: 2,
                                py: 2,
                                backgroundColor: snapshot.isDraggingOver ? "#F9FAFB" : "#FFFFFF",
                                minHeight: 120,
                                display: "flex",
                                flexDirection: "column",
                                gap: 1.5,
                                "&::-webkit-scrollbar": { width: 6 },
                                "&::-webkit-scrollbar-thumb": {
                                  bgcolor: "#E4E7EC",
                                  borderRadius: 999,
                                },
                              }}
                            >
                              {(group.statuses || []).map((status, idx) => (
                                <Draggable
                                  key={status._id || status.id}
                                  draggableId={status._id || status.id}
                                  index={idx}
                                >
                                  {(provided, snapshot) => (
                                    <Box
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      sx={{
                                        p: 2,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        backgroundColor: "#FFFFFF",
                                        borderRadius: "8px",
                                        border: "1px solid #EAECF0",
                                        boxShadow: snapshot.isDragging
                                          ? "0px 10px 15px -3px rgba(16, 24, 40, 0.1), 0px 4px 6px -2px rgba(16, 24, 40, 0.05)"
                                          : "none",
                                        ...provided.draggableProps.style,
                                      }}
                                    >
                                      <Stack
                                        direction="row"
                                        alignItems="center"
                                        spacing={1}
                                        {...provided.dragHandleProps}
                                      >
                                        <Iconify
                                          icon="material-symbols:drag-indicator"
                                          sx={{ color: "#98A2B3", cursor: "grab", fontSize: 18 }}
                                        />
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#344054" }}>
                                          {status.name}
                                        </Typography>
                                      </Stack>
                                      <IconButton
                                        size="small"
                                        onClick={(e) => handleOpenStatusMenu(e, status, group.id)}
                                      >
                                        <Iconify icon="eva:more-vertical-fill" sx={{ width: 18, height: 18 }} />
                                      </IconButton>
                                    </Box>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </Box>
                          )}
                        </Droppable>

                        {/* Centered Add Status Button */}
                        <Box
                          sx={{
                            p: 2,
                            borderTop: "1px solid #EAECF0",
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          <Button
                            variant="outlined"
                            startIcon={<Iconify icon="eva:plus-fill" />}
                            onClick={() => handleAddStatusClick(group.id)}
                            sx={{
                              borderRadius: "8px",
                              borderColor: "#EAECF0",
                              color: "#0088ff",
                              textTransform: "none",
                              fontWeight: 600,
                              px: 3,
                              "&:hover": {
                                backgroundColor: "#EFF6FF",
                                borderColor: "#0088ff",
                              },
                            }}
                          >
                            Add Status
                          </Button>
                        </Box>
                      </Box>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        </DragDropContext>
      </Box>

      {/* Group Context Menu */}
      <Menu
        anchorEl={groupMenuAnchor}
        open={Boolean(groupMenuAnchor)}
        onClose={handleCloseGroupMenu}
      >
        <MenuItem onClick={handleEditGroupClick}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Group Name</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteGroupClick} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <DeleteOutlineIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Group</ListItemText>
        </MenuItem>
      </Menu>

      {/* Status Context Menu */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={handleCloseStatusMenu}
      >
        <MenuItem onClick={handleEditStatusClick}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Status</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteStatusClick} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <DeleteOutlineIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Status</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create Group Dialog */}
      <Dialog
        open={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        PaperProps={{
          sx: { borderRadius: "16px", width: "100%", maxWidth: 480, p: 1.5 },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#101828" }}>
            New Status Group
          </Typography>
          <IconButton
            onClick={() => setIsCreateGroupOpen(false)}
            sx={{
              backgroundColor: "#F2F4F7",
              borderRadius: "8px",
              color: "#667085",
              "&:hover": { backgroundColor: "#E4E7EC" },
            }}
            size="small"
          >
            <Iconify icon="eva:close-fill" sx={{ width: 18, height: 18 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent component="form" onSubmit={handleCreateGroupSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#667085", mb: 1 }}>
              Status Group Name
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={modalGroupName}
              onChange={(e) => setModalGroupName(e.target.value)}
              placeholder="Chatty"
              InputProps={{ sx: { borderRadius: "8px" } }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1, justifyContent: "flex-end", gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={() => setIsCreateGroupOpen(false)}
            sx={{
              borderRadius: "8px",
              borderColor: "#D0D5DD",
              color: "#344054",
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              py: 1.25,
              "&:hover": { backgroundColor: "#F9FAFB", borderColor: "#D0D5DD" },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateGroupSubmit}
            sx={{
              borderRadius: "8px",
              backgroundColor: "#0088ff",
              textTransform: "none",
              fontWeight: 600,
              px: 4,
              py: 1.25,
              "&:hover": { backgroundColor: "#0077ee" },
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog
        open={isEditGroupOpen}
        onClose={() => setIsEditGroupOpen(false)}
        PaperProps={{
          sx: { borderRadius: "16px", width: "100%", maxWidth: 480, p: 1.5 },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#101828" }}>
            Rename Status Group
          </Typography>
          <IconButton
            onClick={() => setIsEditGroupOpen(false)}
            sx={{
              backgroundColor: "#F2F4F7",
              borderRadius: "8px",
              color: "#667085",
              "&:hover": { backgroundColor: "#E4E7EC" },
            }}
            size="small"
          >
            <Iconify icon="eva:close-fill" sx={{ width: 18, height: 18 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent component="form" onSubmit={handleEditGroupSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#667085", mb: 1 }}>
              Status Group Name
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={modalGroupName}
              onChange={(e) => setModalGroupName(e.target.value)}
              InputProps={{ sx: { borderRadius: "8px" } }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1, justifyContent: "flex-end", gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={() => setIsEditGroupOpen(false)}
            sx={{
              borderRadius: "8px",
              borderColor: "#D0D5DD",
              color: "#344054",
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              py: 1.25,
              "&:hover": { backgroundColor: "#F9FAFB", borderColor: "#D0D5DD" },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleEditGroupSubmit}
            sx={{
              borderRadius: "8px",
              backgroundColor: "#0088ff",
              textTransform: "none",
              fontWeight: 600,
              px: 4,
              py: 1.25,
              "&:hover": { backgroundColor: "#0077ee" },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Status Dialog */}
      <Dialog
        open={isCreateStatusOpen}
        onClose={() => setIsCreateStatusOpen(false)}
        PaperProps={{
          sx: { borderRadius: "16px", width: "100%", maxWidth: 480, p: 1.5 },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#101828" }}>
            New Status
          </Typography>
          <IconButton
            onClick={() => setIsCreateStatusOpen(false)}
            sx={{
              backgroundColor: "#F2F4F7",
              borderRadius: "8px",
              color: "#667085",
              "&:hover": { backgroundColor: "#E4E7EC" },
            }}
            size="small"
          >
            <Iconify icon="eva:close-fill" sx={{ width: 18, height: 18 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent component="form" onSubmit={handleCreateStatusSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#667085", mb: 1 }}>
              Status Name
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={modalStatusName}
              onChange={(e) => setModalStatusName(e.target.value)}
              placeholder="Chatty"
              InputProps={{ sx: { borderRadius: "8px" } }}
            />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#667085", mb: 1 }}>
              Description
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={modalStatusDescription}
              onChange={(e) => setModalStatusDescription(e.target.value)}
              placeholder="Chatty"
              InputProps={{ sx: { borderRadius: "8px" } }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1, justifyContent: "flex-end", gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={() => setIsCreateStatusOpen(false)}
            sx={{
              borderRadius: "8px",
              borderColor: "#D0D5DD",
              color: "#344054",
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              py: 1.25,
              "&:hover": { backgroundColor: "#F9FAFB", borderColor: "#D0D5DD" },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateStatusSubmit}
            sx={{
              borderRadius: "8px",
              backgroundColor: "#0088ff",
              textTransform: "none",
              fontWeight: 600,
              px: 4,
              py: 1.25,
              "&:hover": { backgroundColor: "#0077ee" },
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Status Dialog */}
      <Dialog
        open={isEditStatusOpen}
        onClose={() => setIsEditStatusOpen(false)}
        PaperProps={{
          sx: { borderRadius: "16px", width: "100%", maxWidth: 480, p: 1.5 },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#101828" }}>
            Edit Status Details
          </Typography>
          <IconButton
            onClick={() => setIsEditStatusOpen(false)}
            sx={{
              backgroundColor: "#F2F4F7",
              borderRadius: "8px",
              color: "#667085",
              "&:hover": { backgroundColor: "#E4E7EC" },
            }}
            size="small"
          >
            <Iconify icon="eva:close-fill" sx={{ width: 18, height: 18 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent component="form" onSubmit={handleEditStatusSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#667085", mb: 1 }}>
              Status Name
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={modalStatusName}
              onChange={(e) => setModalStatusName(e.target.value)}
              InputProps={{ sx: { borderRadius: "8px" } }}
            />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#667085", mb: 1 }}>
              Description
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={modalStatusDescription}
              onChange={(e) => setModalStatusDescription(e.target.value)}
              InputProps={{ sx: { borderRadius: "8px" } }}
            />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#667085", mb: 1 }}>
              Status Group
            </Typography>
            <Select
              fullWidth
              size="small"
              value={modalStatusGroupId}
              onChange={(e) => setModalStatusGroupId(e.target.value)}
              sx={{ borderRadius: "8px" }}
            >
              {orderedGroups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  {group.name}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1, justifyContent: "flex-end", gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={() => setIsEditStatusOpen(false)}
            sx={{
              borderRadius: "8px",
              borderColor: "#D0D5DD",
              color: "#344054",
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              py: 1.25,
              "&:hover": { backgroundColor: "#F9FAFB", borderColor: "#D0D5DD" },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleEditStatusSubmit}
            sx={{
              borderRadius: "8px",
              backgroundColor: "#0088ff",
              textTransform: "none",
              fontWeight: 600,
              px: 4,
              py: 1.25,
              "&:hover": { backgroundColor: "#0077ee" },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default StatusGroupTab;
