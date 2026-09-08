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
} from "@mui/icons-material";

import { useCrmMeta, useLeads, useLeadMutations, useCustomFieldMutations, useStatusGroupMutations } from "./crmHooks";
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
  const [addOpen, setAddOpen] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [detailLead, setDetailLead] = useState(null);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [dragOrder, setDragOrder] = useState(null);
  const [accumulatedLeads, setAccumulatedLeads] = useState([]);
  const scrollContainerRef = useRef(null);
  const [joinDateMin, setJoinDateMin] = useState(null);
  const [joinDateMax, setJoinDateMax] = useState(null);

  // Define rows first to avoid reference before initialization in columns calculation
  const filteredLeads = useMemo(() => {
    return (accumulatedLeads || []).filter((lead) => {
      if (user?.role === "STUDENT") {
        return !["ADMIN", "CHAIRPERSON"].includes(lead.role);
      }
      return true;
    });
  }, [accumulatedLeads, user?.role]);

  const rows = useMemo(() => (filteredLeads || []).map(toRow), [filteredLeads]);

  const columns = useMemo(() => {
    const allFields = (meta.data?.customFields || [])
      .filter((f) => f.isVisible)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const ordered = dragOrder
      ? dragOrder
        .map((id) => allFields.find((f) => String(f._id) === id))
        .filter(Boolean)
      : allFields;

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
      // Find the longest text value in this column across all rows
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
      // Keep all columns same default width, and extend if text length is more
      const defaultWidth = 180;
      const calculatedWidth = Math.max(defaultWidth, maxLength * 9 + 48);

      return { ...field, width: calculatedWidth };
    });
  }, [meta.data?.customFields, dragOrder, rows, activeTabId, meta.data?.statusGroups]);

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
      limit: 25,
      filters: JSON.stringify(filters),
      searchQuery: debouncedSearch || undefined,
    }),
    [page, filters, debouncedSearch],
  );

  const { data, isLoading, isFetching, isError, error } = useLeads(queryParams);

  useEffect(() => {
    setPage(1);
    setAccumulatedLeads([]);
    setEditingCell(null);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeTabId, debouncedSearch, joinDateMin, joinDateMax]);

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

  useEffect(() => {
    if (data?.leads) {
      if (page === 1) {
        setAccumulatedLeads(data.leads);
      } else {
        setAccumulatedLeads((prev) => {
          const existingIds = new Set(prev.map((item) => String(item._id || item.id)));
          const newLeads = data.leads.filter((item) => !existingIds.has(String(item._id || item.id)));
          return [...prev, ...newLeads];
        });
      }
    }
  }, [data?.leads, page]);
  const totalLeads = data?.totalLeads ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop - clientHeight < 50) {
      if (page < totalPages && !isFetching && !isLoading) {
        setPage((prev) => prev + 1);
      }
    }
  };

  const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  const handleColumnDragEnd = (result) => {
    if (!result.destination) return;

    const nextIds = reorder(
      columns.map((c) => String(c._id)),
      result.source.index,
      result.destination.index,
    );
    setDragOrder(nextIds);

    const visibleSet = new Set(nextIds);
    const byId = new Map((meta.data?.customFields || []).map((f) => [String(f._id), f]));
    const ordered = [
      ...nextIds.map((id) => byId.get(id)).filter(Boolean),
      ...(meta.data?.customFields || []).filter((f) => !visibleSet.has(String(f._id))),
    ];
    saveLayout.mutate(ordered.map((field, index) => ({ ...field, order: index })));
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
    update.mutate({ id: leadId, data: updateData });
  };

  const handleChangeField = (leadId, fieldId, value) => {
    updateField.mutate({ id: leadId, field: fieldId, value });
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
          onScroll={handleScroll}
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
                        <Draggable key={String(col._id)} draggableId={String(col._id)} index={index} isDragDisabled={activeTabId === ALL_TAB}>
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

        {/* Loading Progress - Bottom Skeleton Row for Pagination */}
        {isFetching && rows.length > 0 && (
          <Stack
            direction="row"
            sx={{
              minHeight: 64,
              py: 1,
              alignItems: "center",
      
              width: "max-content",
              minWidth: "100%",
              backgroundColor: "#FFFFFF"
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
        )}
      </Card>

      {/* Choose Columns drawer panel */}
      <ColumnSelectorPanel
        open={columnsOpen}
        onClose={() => setColumnsOpen(false)}
        customFields={meta.data?.customFields || []}
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
