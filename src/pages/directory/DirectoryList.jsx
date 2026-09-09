import React, { useEffect, useMemo, useState, useRef } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Container,
  Card,
  Stack,
  Box,
  Typography,
  Button,
  IconButton,
  Select,
  MenuItem,
  Alert,
  Tooltip,
  CircularProgress,
  TextField,
  Avatar,
  Skeleton,
} from "@mui/material";
import {
  Add as AddIcon,
  Settings as SettingsIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";

import {
  useCrmMeta,
  useLeads,
  useLeadMutations,
  useCustomFieldMutations,
  useStatusGroupMutations,
  useTabLayouts,
  useTabLayoutMutations
} from "./crmHooks";
import LeadCell from "./LeadCell";
import AddLeadDialog from "./AddLeadDialog";
import LeadDetailsDialog from "./LeadDetailsDialog";
import ColumnSelectorPanel from "./ColumnSelectorPanel";
import { columnWidth, toRow, formatLeadDate, leadFieldValue } from "./leadHelpers";
import API from "../../api";
import { useAuth } from "../../context/AuthContext";
import CustomDateRangePicker from "../../components/CustomDateRangePicker";
import debounce from "lodash/debounce";

const ALL_TAB = "all";

export default function DirectoryList() {
  const { user } = useAuth();
  const isAdminOrChairperson = ["ADMIN", "CHAIRPERSON"].includes(user?.role);

  const meta = useCrmMeta();
  const { update, updateField, createLead } = useLeadMutations();
  const { saveLayout } = useCustomFieldMutations();
  const { reorderGroups } = useStatusGroupMutations();
  const { saveTabLayout } = useTabLayoutMutations();
  const tabLayoutsQuery = useTabLayouts();

  const [activeTabId, setActiveTabId] = useState(ALL_TAB);
  const [searchTerm, setSearchTerm] = useState("");
  const [tabOrder, setTabOrder] = useState(null);

  useEffect(() => {
    if (user?._id) {
      try {
        const saved = localStorage.getItem(`tab_order_${user._id}`);
        if (saved) {
          setTabOrder(JSON.parse(saved));
        }
      } catch { /* ignore */ }
    }
  }, [user?._id]);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const debouncedSetSearch = useMemo(
    () => debounce((val) => setDebouncedSearch(val), 800),
    []
  );

  useEffect(() => {
    return () => {
      debouncedSetSearch.cancel();
    };
  }, [debouncedSetSearch]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    debouncedSetSearch(val);
  };

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [addOpen, setAddOpen] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [detailLead, setDetailLead] = useState(null);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const getStoredTabColumnOrder = (userId, tabId) => {
    try {
      const raw = localStorage.getItem(`tab_col_order_${userId || "default"}_${tabId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const getStoredTabHiddenCols = (userId, tabId) => {
    try {
      const raw = localStorage.getItem(`tab_col_hidden_${userId || "default"}_${tabId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const [tabColOrders, setTabColOrders] = useState({});
  const [tabHiddenCols, setTabHiddenCols] = useState({});
  const scrollContainerRef = useRef(null);
  const [joinDateMin, setJoinDateMin] = useState(null);
  const [joinDateMax, setJoinDateMax] = useState(null);

  // Initialize tab layouts directly from backend MongoDB database
  useEffect(() => {
    const backendLayouts = tabLayoutsQuery.data || meta.data?.tableLayouts || [];
    if (backendLayouts.length > 0) {
      const orderMap = {};
      const hiddenMap = {};
      backendLayouts.forEach(l => {
        if (l.tabId) {
          if (l.columnOrder && l.columnOrder.length > 0) {
            orderMap[l.tabId] = l.columnOrder;
          }
          if (l.hiddenColumns && l.hiddenColumns.length > 0) {
            hiddenMap[l.tabId] = l.hiddenColumns;
          }
        }
      });
      setTabColOrders(prev => ({ ...prev, ...orderMap }));
      setTabHiddenCols(prev => ({ ...prev, ...hiddenMap }));
    }
  }, [tabLayoutsQuery.data, meta.data?.tableLayouts]);

  useEffect(() => {
    const savedOrder = getStoredTabColumnOrder(user?._id, activeTabId);
    const savedHidden = getStoredTabHiddenCols(user?._id, activeTabId);
    if (savedOrder && !tabColOrders[activeTabId]) {
      setTabColOrders((prev) => ({ ...prev, [activeTabId]: savedOrder }));
    }
    if (savedHidden && !tabHiddenCols[activeTabId]) {
      setTabHiddenCols((prev) => ({ ...prev, [activeTabId]: savedHidden }));
    }
  }, [activeTabId, user?._id]);

  const filters = useMemo(() => {
    const next = {};
    if (activeTabId !== ALL_TAB) {
      next.statusGroup = activeTabId;
    } else {
      next.role = "MEMBER";
    }
    if (joinDateMin) next.joinDateMin = joinDateMin;
    if (joinDateMax) next.joinDateMax = joinDateMax;
    return next;
  }, [activeTabId, joinDateMin, joinDateMax]);

  const queryParams = useMemo(
    () => ({
      page,
      limit: pageSize,
      filters: JSON.stringify(filters),
      searchQuery: debouncedSearch || undefined,
    }),
    [page, pageSize, filters, debouncedSearch],
  );

  const { data, isLoading, isFetching, isError, error } = useLeads(queryParams);

  const leads = useMemo(() => data?.leads || data?.data || [], [data?.leads, data?.data]);

  const rows = useMemo(() => leads.map(toRow), [leads]);

  const columns = useMemo(() => {
    const allFields = meta.data?.customFields || [];
    const activeOrder = tabColOrders[activeTabId] || getStoredTabColumnOrder(user?._id, activeTabId);
    const activeHidden = tabHiddenCols[activeTabId] || getStoredTabHiddenCols(user?._id, activeTabId) || [];

    const visibleFields = allFields.filter((f) => {
      if (activeHidden.includes(String(f._id))) return false;
      return f.isVisible !== false;
    });

    let ordered;
    if (activeOrder && activeOrder.length > 0) {
      const orderMap = new Map(activeOrder.map((id, index) => [String(id), index]));
      ordered = [...visibleFields].sort((a, b) => {
        const idxA = orderMap.has(String(a._id)) ? orderMap.get(String(a._id)) : 9999 + (a.order ?? 0);
        const idxB = orderMap.has(String(b._id)) ? orderMap.get(String(b._id)) : 9999 + (b.order ?? 0);
        return idxA - idxB;
      });
    } else {
      ordered = [...visibleFields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    // Only show education fields in Students and Alumni status groups
    const activeGroup = (meta.data?.statusGroups || []).find(
      (g) => String(g._id) === activeTabId
    );
    const activeGroupName = activeGroup ? activeGroup.name.toLowerCase() : "";
    const showEducation = activeGroupName === "students" || activeGroupName === "alumni";

    const filtered = ordered.filter((field) => {
      if (field.slug && field.slug.startsWith("education.")) {
        return showEducation;
      }
      return true;
    });

    return filtered.map((field) => {
      let maxLength = field.name.length;
      rows.forEach(row => {
        let val = "";
        if (field.isInternal) {
          val = row[field.slug];
          if (field.slug === "dateOfBirth" && val) {
            val = formatLeadDate(val);
          }
        } else {
          val = leadFieldValue(row.raw, field._id);
        }
        const strVal = val ? String(val) : "";
        if (strVal.length > maxLength) {
          maxLength = strVal.length;
        }
      });
      const defaultWidth = 180;
      const calculatedWidth = Math.max(defaultWidth, maxLength * 9 + 48);

      return { ...field, width: calculatedWidth };
    });
  }, [meta.data?.customFields, tabColOrders, tabHiddenCols, rows, activeTabId, meta.data?.statusGroups, user?._id]);

  useEffect(() => {
    setPage(1);
    setEditingCell(null);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeTabId, debouncedSearch, joinDateMin, joinDateMax, pageSize]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [page]);

  useEffect(() => {
    const isPrivileged = ["ADMIN", "CHAIRPERSON"].includes(user?.role);
    if (!isPrivileged && activeTabId === ALL_TAB && meta.data?.statusGroups?.length) {
      const studentGroup = meta.data.statusGroups.find(
        (g) => g.name.toLowerCase() === "students"
      );
      if (studentGroup) {
        setActiveTabId(String(studentGroup._id));
      } else {
        const allowed = meta.data.statusGroups.find(g =>
          ["students", "alumni", "staff"].includes(g.name.toLowerCase())
        );
        if (allowed) setActiveTabId(String(allowed._id));
      }
    }
  }, [user?.role, activeTabId, meta.data?.statusGroups]);

  const allStatusGroups = useMemo(() => {
    const groups = meta.data?.statusGroups || [];
    const filtered = groups.filter((group) => {
      const nameLower = group.name.toLowerCase();
      const isAdmin = user?.role === "ADMIN";
      const isChairperson = user?.role === "CHAIRPERSON";
      if (nameLower === "chairperson") return isAdmin;
      if (nameLower === "inquiry") return isAdmin || isChairperson;
      return ["students", "alumni", "staff"].includes(nameLower);
    });

    const list = ["ADMIN", "CHAIRPERSON"].includes(user?.role)
      ? [{ _id: ALL_TAB, name: "Members" }, ...filtered]
      : filtered;

    if (tabOrder) {
      return tabOrder
        .map(id => list.find(g => String(g._id) === id))
        .filter(Boolean);
    }
    return list;
  }, [meta.data?.statusGroups, user?.role, tabOrder]);

  const totalLeads = data?.totalLeads ?? 0;
  const totalPages = data?.totalPages ?? Math.max(1, Math.ceil(totalLeads / pageSize));

  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  const handleColumnDragEnd = (result) => {
    if (!result.destination) return;

    const currentIds = columns.map((c) => String(c._id));
    const nextIds = reorder(
      currentIds,
      result.source.index,
      result.destination.index,
    );

    // Optimistic UI update
    setTabColOrders((prev) => ({ ...prev, [activeTabId]: nextIds }));

    // Persist to MongoDB backend database
    saveTabLayout.mutate({
      tabId: activeTabId,
      columnOrder: nextIds,
      hiddenColumns: tabHiddenCols[activeTabId] || []
    });

    // Save local cache fallback
    try {
      localStorage.setItem(
        `tab_col_order_${user?._id || "default"}_${activeTabId}`,
        JSON.stringify(nextIds),
      );
    } catch { /* ignore */ }
  };

  const handleTabDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(allStatusGroups);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const nextIds = items.map(item => String(item._id));
    setTabOrder(nextIds);
    try {
      localStorage.setItem(`tab_order_${user?._id}`, JSON.stringify(nextIds));
    } catch { /* ignore */ }

    // Update DB status groups order (filtering out ALL_TAB)
    const dbItems = items.filter(item => item._id !== ALL_TAB);
    const payload = dbItems.map((item, idx) => ({
      _id: String(item._id),
      order: idx,
    }));
    reorderGroups.mutate({ statuses: payload });
  };

  const handleChangeRef = (leadId, key, value) => {
    const rawUser = accumulatedLeads.find((item) => String(item._id || item.id) === String(leadId));
    let updateData = {};
    if (key.includes(".")) {
      const parts = key.split(".");
      if (parts.length === 3) {
        const p1 = parts[0];
        const p2 = parts[1];
        const p3 = parts[2];
        updateData = {
          [p1]: {
            ...(rawUser?.[p1] || {}),
            [p2]: {
              ...(rawUser?.[p1]?.[p2] || {}),
              [p3]: value
            }
          }
        };
      } else if (parts.length === 2) {
        const parentKey = parts[0];
        const childKey = parts[1];
        updateData = {
          [parentKey]: {
            ...(rawUser?.[parentKey] || {}),
            [childKey]: value
          }
        };
      }
    } else {
      updateData = { [key]: value };
    }
    return update.mutateAsync({ id: leadId, data: updateData });
  };

  const handleChangeField = (leadId, fieldId, value) => {
    return updateField.mutateAsync({ id: leadId, field: fieldId, value });
  };

  const handleExport = async () => {
    try {
      const response = await API.get("/users", {
        params: { ...queryParams, limit: 1000 }
      });
      const exportData = response.data.leads || [];
      const headers = ["Name", "Email", "Phone", "Role", "Status", "Gender", "Age"];

      const csvRows = [headers.join(",")];
      for (const row of exportData) {
        const values = [
          `"${row.name || ''}"`,
          `"${row.email || ''}"`,
          `"${row.phone || ''}"`,
          `"${row.role || ''}"`,
          `"${row.status?.name || row.status || ''}"`,
          `"${row.gender || ''}"`,
          `"${row.age || ''}"`
        ];
        csvRows.push(values.join(","));
      }

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `members_export.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  const cellMeta = useMemo(() => {
    const statuses = meta.data?.statuses || [];
    return {
      statuses,
      statusById: new Map(statuses.map((s) => [String(s._id), s])),
    };
  }, [meta.data?.statuses]);

  const busy = isLoading || meta.isLoading;

  return (
    <Container maxWidth={false} sx={{ pb: 0 }}>
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Could not load members data: {error?.message}
        </Alert>
      )}

      <Card
        sx={{
          border: "1px solid #EAECF0",
          borderRadius: "16px",
          boxShadow: "none",
          overflow: "hidden",
          backgroundColor: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          height: "calc(100dvh - 120px)",
        }}
      >
        {/* Drag-and-drop Status Group Filter Tabs */}
        <Stack
          direction="row"
          spacing={1}
          sx={{
            px: 3,
            py: 1.5,
            borderBottom: "1px solid #EAECF0",
            overflowX: "auto",
            whiteSpace: "nowrap",
            alignItems: "center",
            "&::-webkit-scrollbar": { display: "none" },
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {/* Draggable Tab List (Includes Members tab) */}
          <DragDropContext onDragEnd={handleTabDragEnd}>
            <Droppable droppableId="status-groups-droppable" direction="horizontal">
              {(provided) => (
                <Stack
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: "center" }}
                >
                  {allStatusGroups.map((group, index) => {
                    const isActive = activeTabId === String(group._id);
                    return (
                      <Draggable key={String(group._id)} draggableId={String(group._id)} index={index}>
                        {(dragProvided, snapshot) => (
                          <Box
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            onClick={() => setActiveTabId(String(group._id))}
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              py: 1.5,
                              px: 2.5,
                              cursor: "pointer",
                              borderRadius: "8px",
                              userSelect: "none",
                              position: "relative",
                              transition: "all 0.2s ease",
                              backgroundColor: snapshot.isDragging ? "#EFF6FF" : "transparent",
                              "&:hover": {
                                backgroundColor: isActive ? "transparent" : "#F8FAFC",
                              },
                              ...(isActive && {
                                "&::after": {
                                  content: '""',
                                  position: "absolute",
                                  bottom: -12,
                                  left: 0,
                                  right: 0,
                                  height: 2.5,
                                  backgroundColor: "#0088FF",
                                },
                              }),
                              ...dragProvided.draggableProps.style,
                            }}
                          >
                            {/* Drag handle dots symbol */}
                            <Box
                              {...dragProvided.dragHandleProps}
                              sx={{
                                display: "inline-flex",
                                alignItems: "center",
                                mr: 1,
                                color: "#98A2B3",
                                fontSize: "16px",
                                fontWeight: "bold",
                                cursor: "grab",
                                userSelect: "none",
                                "&:hover": { color: "#475467" }
                              }}
                            >
                              ⁝⁝
                            </Box>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: isActive ? 600 : 500,
                                color: isActive ? "#0088FF" : "#475467",
                              }}
                            >
                              {group.name}
                            </Typography>
                          </Box>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </Stack>
              )}
            </Droppable>
          </DragDropContext>
        </Stack>

        {/* Date, Search, Actions Filter Bar */}
        <Stack
          direction="row"
          spacing={2}
          sx={{ px: 3, py: 2, borderBottom: "1px solid #EAECF0", alignItems: "center" }}
        >
          {/* Static Date Range Input styling */}
          <CustomDateRangePicker
            incApply={true}
            start={joinDateMin}
            end={joinDateMax}
            onFilterRange={(range) => {
              if (range && range.startDate && range.endDate) {
                const formatToLocalYYYYMMDD = (d) => {
                  const year = d.getFullYear();
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const day = String(d.getDate()).padStart(2, '0');
                  return `${year}-${month}-${day}`;
                };
                setJoinDateMin(formatToLocalYYYYMMDD(range.startDate));
                setJoinDateMax(formatToLocalYYYYMMDD(range.endDate));
              } else {
                setJoinDateMin(null);
                setJoinDateMax(null);
              }
            }}
          />

          {/* Search Input */}
          <TextField
            size="small"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: "text.secondary", mr: 1, fontSize: 18 }} />
            }}
            sx={{ width: 300, "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
          />

          {/* Table Fields Settings Button */}
          <IconButton
            onClick={() => setColumnsOpen(true)}
            sx={{
              borderRadius: "8px",
              borderColor: "#D0D5DD",
              color: "#344054",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { borderColor: "#D0D5DD", backgroundColor: "#F9FAFB" }
            }}
          >
            <SettingsIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }} />

          {/* Counts */}
          <Typography variant="body2" sx={{ color: "#475467", fontWeight: 600, mr: 1 }}>
            {totalLeads} results
          </Typography>

          {/* Export Button (only for ADMIN & CHAIRPERSON) */}
          {isAdminOrChairperson && (
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              sx={{
                borderRadius: "8px",
                borderColor: "#D0D5DD",
                color: "#344054",
                textTransform: "none",
                fontWeight: 600,
                "&:hover": { borderColor: "#D0D5DD", backgroundColor: "#F9FAFB" }
              }}
            >
              Export
            </Button>
          )}

          {/* Add Member Button (only for ADMIN & CHAIRPERSON) */}
          {isAdminOrChairperson && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddOpen(true)}
              sx={{
                borderRadius: "8px",
                backgroundColor: "#0088ff",
                color: "#FFFFFF",
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "none",
                "&:hover": { backgroundColor: "#0077dd", boxShadow: "none" }
              }}
            >
              Add Member
            </Button>
          )}
        </Stack>

        {/* Spreadsheet Data Grid */}
        <Box
          ref={scrollContainerRef}
          sx={{
            width: "100%",
            overflowX: "auto",
            overflowY: "auto",
            flex: 1,
            minHeight: 0,
            backgroundColor: "#FFFFFF",
            position: "relative",
          }}
        >
          {/* Scrollable grid inner wrapper */}
          <Box sx={{ display: "flex", flexDirection: "column", width: "max-content", minWidth: "100%" }}>

            {/* Header Row */}
            <Stack
              direction="row"
              sx={{
                height: 44,
                alignItems: "center",
                backgroundColor: "#F9FAFB",
                borderBottom: "1px solid #EAECF0",
                position: "sticky",
                top: 0,
                zIndex: 2,
              }}
            >
              {/* Photo Header cell instead of bulk check */}
              <Box sx={{ width: 60, minWidth: 60, flexShrink: 0, px: 2, display: "flex", justifyContent: "center" }}/>

              <DragDropContext onDragEnd={handleColumnDragEnd}>
                <Droppable droppableId="columns-droppable" direction="horizontal">
                  {(provided) => (
                    <Stack
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      direction="row"
                      sx={{ alignItems: "center" }}
                    >
                      {columns.map((col, index) => (
                        <Draggable key={String(col._id)} draggableId={String(col._id)} index={index}>
                          {(dragProvided, snapshot) => (
                            <Box
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              sx={{
                                width: col.width,
                                minWidth: col.width === "auto" ? "140px" : col.width,
                                flexShrink: 0,
                                px: 2,
                                display: "flex",
                                alignItems: "flex-end",
                                backgroundColor: snapshot.isDragging ? "#EFF6FF" : "transparent",
                                cursor: "grab",
                                ...dragProvided.draggableProps.style,
                              }}
                            >
                              {/* Drag handle dots symbol */}
                              <Box
                                sx={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  mr: 1,
                                  color: "#98A2B3",
                                  fontSize: "16px",
                                  fontWeight: "bold",
                                  cursor: "grab",
                                  userSelect: "none",
                                  "&:hover": { color: "#475467" }
                                }}
                              >
                                ⁝⁝
                              </Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#475467" }}>
                                {col.name}
                              </Typography>
                            </Box>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Stack>
                  )}
                </Droppable>
              </DragDropContext>


            </Stack>

            {/* Grid Body */}
            <Box sx={{ position: "relative", p: 1 }}>
              {isLoading && rows.length === 0 ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <Stack
                    key={idx}
                    direction="row"
                    sx={{
                      minHeight: 64,
                      py: 1,
                      alignItems: "center",
                    
                      width: "max-content",
                      minWidth: "100%"
                    }}
                  >
                    <Box sx={{ width: 60, minWidth: 60, flexShrink: 0, px: 1, display: "flex", justifyContent: "center" }}>
                      <Skeleton variant="circular" width={40} height={40} />
                    </Box>
                    <Stack direction="row" sx={{ alignItems: "center" }}>
                      {columns.map((col) => (
                        <Box key={col._id} sx={{ width: col.width, minWidth: col.width === "auto" ? 140 : col.width, flexShrink: 0, px: 2 }}>
                          <Skeleton variant="rounded" height={32} sx={{ width: col.width === "auto" ? "120px" : "90%", borderRadius: "8px" }} />
                        </Box>
                      ))}
                    </Stack>
                  </Stack>
                ))
              ) : rows.length === 0 && !busy ? (
                <Box sx={{ p: 8, textAlign: "center" }}>
                  <Typography variant="subtitle1" sx={{ color: "#475467", fontWeight: 600, mb: 1 }}>
                    No members found
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#667085" }}>
                    There are no community members matching the current filters or query.
                  </Typography>
                </Box>
              ) : (
                rows.map((row) => (
                  <Stack
                    key={row.id}
                    direction="row"
                    sx={{
                      minHeight: 64,
                      py: 1,
                      alignItems: "center",
                      backgroundColor: "#FFFFFF",
                    
                      transition: "all 0.15s ease",
                      "&:hover": {
                        backgroundColor: "#F8FAFC",
                        boxShadow: "inset 0 0 0 1px rgba(0, 136, 255, 0.1), 0 4px 12px rgba(0, 136, 255, 0.05)",
                      },
                    }}
                  >
                    {/* Member Profile Avatar in leftmost column - Clickable to open profile details */}
                    <Box sx={{ width: 60, minWidth: 60, flexShrink: 0, px: 1, display: "flex", justifyContent: "center" }}>
                      <Tooltip title="View Profile Details" arrow>
                        <Avatar
                          src={row.profilePhoto?.url || ""}
                          onClick={() => setDetailLead(row)}
                          sx={{
                            width: 40,
                            height: 40,
                            fontSize: "14px",
                            bgcolor: row.profilePhoto?.url ? "" : "#0088ff",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              transform: "scale(1.1)",
                              boxShadow: "0 0 0 3px rgba(0, 136, 255, 0.25)"
                            }
                          }}
                        >
                          {row.name?.charAt(0)}
                        </Avatar>
                      </Tooltip>
                    </Box>

                    {/* Columns Cells */}
                    <Stack direction="row" sx={{ alignItems: "center" }}>
                      {columns.map((col) => {
                        const cellId = `${row.id}-${col._id}`;
                        const isEditing = editingCell === cellId;
                        const isOwnRow = String(row.id) === String(user?._id || user?.id);
                        const cellDisabled = (!isAdminOrChairperson && !isOwnRow) || update.isLoading || updateField.isLoading;
                        return (
                          <LeadCell
                            key={col._id}
                            field={col}
                            row={row}
                            meta={cellMeta}
                            disabled={cellDisabled}
                            isEditing={isEditing}
                            onStartEdit={() => setEditingCell(cellId)}
                            onStopEdit={() => setEditingCell(null)}
                            onChangeRef={handleChangeRef}
                            onChangeField={handleChangeField}
                            onOpenProfile={() => setDetailLead(row)}
                          />
                        );
                      })}
                    </Stack>


                  </Stack>
                ))
              )}
            </Box>
          </Box>
        </Box>

        {/* Table Pagination Controls Footer */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            px: 3,
            py: 1.5,
            borderTop: "1px solid #EAECF0",
            backgroundColor: "#FFFFFF",
            gap: 3,
            flexWrap: "wrap"
          }}
        >
          {/* Rows per page selector */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" sx={{ color: "#475467", fontSize: "0.875rem" }}>
              Rows per page:
            </Typography>
            <Select
              size="small"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              variant="standard"
              disableUnderline
              sx={{
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#344054",
                "& .MuiSelect-select": {
                  py: 0.5,
                  pr: "20px !important",
                  pl: 0.5
                },
                "& .MuiSvgIcon-root": {
                  fontSize: 18,
                  color: "#667085"
                }
              }}
            >
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </Box>

          {/* Range count text */}
          <Typography variant="body2" sx={{ color: "#344054", fontSize: "0.875rem", fontWeight: 500 }}>
            {totalLeads === 0
              ? "0-0 of 0"
              : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, totalLeads)} of ${totalLeads}`}
          </Typography>

          {/* Prev / Next buttons */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              size="small"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              sx={{
                width: 32,
                height: 32,
                borderRadius: "6px",
                border: "1px solid #D0D5DD",
                color: "#344054",
                "&:disabled": {
                  borderColor: "#EAECF0",
                  color: "#D0D5DD"
                },
                "&:hover:not(:disabled)": {
                  backgroundColor: "#F9FAFB",
                  borderColor: "#D0D5DD"
                }
              }}
            >
              <ChevronLeftIcon sx={{ fontSize: 18 }} />
            </IconButton>

            <IconButton
              size="small"
              disabled={page >= totalPages || isFetching}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              sx={{
                width: 32,
                height: 32,
                borderRadius: "6px",
                border: "1px solid #D0D5DD",
                color: "#344054",
                "&:disabled": {
                  borderColor: "#EAECF0",
                  color: "#D0D5DD"
                },
                "&:hover:not(:disabled)": {
                  backgroundColor: "#F9FAFB",
                  borderColor: "#D0D5DD"
                }
              }}
            >
              <ChevronRightIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>
      </Card>



      {/* Choose Columns drawer panel */}
      <ColumnSelectorPanel
        open={columnsOpen}
        onClose={() => setColumnsOpen(false)}
        customFields={meta.data?.customFields || []}
        activeTabId={activeTabId}
        activeTabName={allStatusGroups.find(g => String(g._id) === activeTabId)?.name || "Members"}
        currentTabOrder={tabColOrders[activeTabId] || getStoredTabColumnOrder(user?._id, activeTabId)}
        currentTabHidden={tabHiddenCols[activeTabId] || getStoredTabHiddenCols(user?._id, activeTabId)}
        onSaveTabLayout={(tabId, newOrder, hiddenList) => {
          // Optimistic UI update
          setTabColOrders(prev => ({ ...prev, [tabId]: newOrder }));
          setTabHiddenCols(prev => ({ ...prev, [tabId]: hiddenList }));

          // Persist to MongoDB backend database
          saveTabLayout.mutate({
            tabId,
            columnOrder: newOrder,
            hiddenColumns: hiddenList
          });

          // Save local cache fallback
          try {
            localStorage.setItem(`tab_col_order_${user?._id || "default"}_${tabId}`, JSON.stringify(newOrder));
            localStorage.setItem(`tab_col_hidden_${user?._id || "default"}_${tabId}`, JSON.stringify(hiddenList));
          } catch { /* ignore */ }
        }}
        canManage={true}
      />

      {/* Add New Member Dialog */}
      <AddLeadDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        fields={meta.data?.customFields || []}
        statuses={meta.data?.statuses || []}
      />

      {/* Profile Details Dialog */}
      <LeadDetailsDialog
        open={Boolean(detailLead)}
        onClose={() => setDetailLead(null)}
        lead={detailLead}
        customFields={meta.data?.customFields || []}
      />
    </Container>
  );
}
