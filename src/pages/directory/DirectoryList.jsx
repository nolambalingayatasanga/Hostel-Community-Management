import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useQueryClient } from "react-query";
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
  Checkbox,
  useTheme,
  useMediaQuery,
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
import LoginDetailsModal from "./LoginDetailsModal";
import { columnWidth, toRow, formatLeadDate, leadFieldValue, getColumnDisplayName } from "./leadHelpers";
import API from "../../api";
import { useAuth } from "../../context/AuthContext";
import CustomDateRangePicker from "../../components/CustomDateRangePicker";
import debounce from "lodash/debounce";

const ALL_TAB = "all";
const DROPPED_TAB = "dropped";

export default function DirectoryList() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdminOrWarden = ["ADMIN", "WARDEN"].includes(user?.role);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const meta = useCrmMeta();
  const { update, updateField, createLead } = useLeadMutations();
  const { saveLayout } = useCustomFieldMutations();
  const { reorderGroups } = useStatusGroupMutations();
  const { saveTabLayout } = useTabLayoutMutations();
  const tabLayoutsQuery = useTabLayouts();

  const [searchParams, setSearchParams] = useSearchParams();

  const resolveTabParamToId = useCallback((param, groups) => {
    if (!param) return null;
    const lower = param.toLowerCase().trim();
    if (lower === "all" || lower === "members") return ALL_TAB;
    if (lower === "dropped") return DROPPED_TAB;
    if (groups && groups.length > 0) {
      const found = groups.find(
        (g) =>
          (g.name || "").toLowerCase().replace(/\s+/g, "-") === lower ||
          (g.name || "").toLowerCase() === lower ||
          String(g._id) === param
      );
      if (found) return String(found._id);
    }
    if (/^[0-9a-fA-F]{24}$/.test(param)) {
      return param;
    }
    return null;
  }, []);

  const getTabSlug = useCallback((tabId, groups) => {
    if (!tabId || tabId === ALL_TAB) return "members";
    if (tabId === DROPPED_TAB) return "dropped";
    const g = (groups || []).find((group) => String(group._id) === String(tabId));
    return g ? (g.name || "").toLowerCase().replace(/\s+/g, "-") : tabId;
  }, []);

  const getInitialTabId = () => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      const lower = tabParam.toLowerCase().trim();
      if (lower === "all" || lower === "members") return ALL_TAB;
      if (lower === "dropped") return DROPPED_TAB;
      if (/^[0-9a-fA-F]{24}$/.test(tabParam)) return tabParam;
    }
    const groups = meta.data?.statusGroups || [];
    const studentGroup = groups.find(
      (g) => (g.name || "").toLowerCase() === "students"
    );
    return studentGroup ? String(studentGroup._id) : null;
  };

  const [activeTabId, setActiveTabId] = useState(getInitialTabId);
  const [isTabSwitching, setIsTabSwitching] = useState(false);
  const prevTabIdRef = useRef(activeTabId);
  const userSwitchedTabRef = useRef(Boolean(searchParams.get("tab")));
  const lastKnownTabParamRef = useRef(searchParams.get("tab"));
  const hasInitializedTabRef = useRef(false);

  const handleTabChange = (newTabId) => {
    userSwitchedTabRef.current = true;
    const idStr = String(newTabId);
    if (activeTabId !== idStr) {
      setPage(1);
      setEditingCell(null);
      setIsTabSwitching(true);
      setActiveTabId(idStr);

      const tabSlug = getTabSlug(idStr, allStatusGroups);
      lastKnownTabParamRef.current = tabSlug;
      const nextParams = new URLSearchParams(searchParams);
      if (tabSlug) nextParams.set("tab", tabSlug);
      nextParams.delete("page");
      setSearchParams(nextParams, { replace: true });
    }
  };

  const initialSearchParam = searchParams.get("search") || "";
  const [searchTerm, setSearchTerm] = useState(initialSearchParam);
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
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearchParam);

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

  const initialPageParam = parseInt(searchParams.get("page"), 10);
  const [page, setPage] = useState(initialPageParam > 0 ? initialPageParam : 1);
  const [pageSize, setPageSize] = useState(25);
  const [addOpen, setAddOpen] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [detailLead, setDetailLead] = useState(null);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [auditUserRow, setAuditUserRow] = useState(null);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [dropLoading, setDropLoading] = useState(false);

  // Clear selection whenever tab, page, search query, or role changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTabId, page, debouncedSearch, isAdminOrWarden]);

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
  const initialStartDateParam = searchParams.get("startDate") || searchParams.get("from") || null;
  const initialEndDateParam = searchParams.get("endDate") || searchParams.get("to") || null;
  const [joinDateMin, setJoinDateMin] = useState(initialStartDateParam);
  const [joinDateMax, setJoinDateMax] = useState(initialEndDateParam);

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
    if (!activeTabId) return;
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
    if (activeTabId === DROPPED_TAB) {
      next.statusGroup = "dropped";
      next.isDropped = true;
    } else if (activeTabId !== ALL_TAB) {
      next.statusGroup = activeTabId;
    } else {
      next.role = "MEMBER";
    }
    if (joinDateMin) {
      next.joinDateMin = joinDateMin;
      next.startDate = joinDateMin;
    }
    if (joinDateMax) {
      next.joinDateMax = joinDateMax;
      next.endDate = joinDateMax;
    }
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

  const isTabReady = Boolean(
    meta.data &&
    activeTabId && (
      userSwitchedTabRef.current ||
      activeTabId !== ALL_TAB ||
      (meta.data.statusGroups || []).length === 0
    )
  );

  const { data, isLoading, isFetching, isError, error } = useLeads(queryParams, {
    enabled: isTabReady,
  });

  useEffect(() => {
    if (prevTabIdRef.current !== activeTabId) {
      prevTabIdRef.current = activeTabId;
      setIsTabSwitching(true);
    }
  }, [activeTabId]);

  useEffect(() => {
    if (isTabSwitching && !isFetching) {
      setIsTabSwitching(false);
    }
  }, [isTabSwitching, isFetching]);

  const leads = useMemo(() => {
    const list = data?.leads || data?.data || [];
    const seen = new Set();
    return list.filter((item) => {
      const id = String(item._id || item.id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [data?.leads, data?.data]);

  const rows = useMemo(() => leads.map(toRow), [leads]);

  const columns = useMemo(() => {
    const allFields = (meta.data?.customFields || []).filter(
      (f) => (f.slug || "").toLowerCase() !== "status" && (f.name || "").toLowerCase() !== "status"
    );
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
        const isNameA = (a.slug || '').toLowerCase() === 'name' || (a.name || '').toLowerCase() === 'name';
        const isNameB = (b.slug || '').toLowerCase() === 'name' || (b.name || '').toLowerCase() === 'name';
        if (isNameA) return -1;
        if (isNameB) return 1;
        const idxA = orderMap.has(String(a._id)) ? orderMap.get(String(a._id)) : 9999 + (a.order ?? 0);
        const idxB = orderMap.has(String(b._id)) ? orderMap.get(String(b._id)) : 9999 + (b.order ?? 0);
        return idxA - idxB;
      });
    } else {
      ordered = [...visibleFields].sort((a, b) => {
        const isNameA = (a.slug || '').toLowerCase() === 'name' || (a.name || '').toLowerCase() === 'name';
        const isNameB = (b.slug || '').toLowerCase() === 'name' || (b.name || '').toLowerCase() === 'name';
        if (isNameA) return -1;
        if (isNameB) return 1;
        return (a.order ?? 0) - (b.order ?? 0);
      });
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

    const isUserAdmin = user?.role === "ADMIN";
    let finalFiltered = filtered;
    if (isUserAdmin) {
      const hasLoginDetails = finalFiltered.some((f) => (f.slug || "").toLowerCase() === "logindetails");
      if (!hasLoginDetails) {
        finalFiltered = [
          ...finalFiltered,
          {
            _id: "internal_logindetails",
            name: "Login Details",
            slug: "loginDetails",
            type: "text",
            isInternal: true,
            order: 9999,
            isVisible: true,
          },
        ];
      }
    } else {
      finalFiltered = finalFiltered.filter((f) => (f.slug || "").toLowerCase() !== "logindetails");
    }

    return finalFiltered.map((field) => {
      const colWidth = columnWidth(field);
      return { ...field, width: colWidth };
    });
  }, [meta.data?.customFields, tabColOrders, tabHiddenCols, activeTabId, meta.data?.statusGroups, user?._id, user?.role]);

  // Name column is strictly fixed to the first position on ALL tabs
  const nameCol = useMemo(() => {
    const found = columns.find(
      (c) =>
        (c.slug || "").toLowerCase() === "name" ||
        (c.name || "").toLowerCase() === "name"
    );
    return (
      found || {
        _id: "internal_name",
        slug: "name",
        name: "Name",
        width: 220,
        isInternal: true,
      }
    );
  }, [columns]);

  // Scrollable columns exclude the pinned Name column
  const scrollableColumns = useMemo(() => {
    return columns.filter(
      (c) =>
        String(c._id) !== String(nameCol._id) &&
        (c.slug || "").toLowerCase() !== "name"
    );
  }, [columns, nameCol]);

  useEffect(() => {
    setPage(1);
    setEditingCell(null);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [debouncedSearch, joinDateMin, joinDateMax, pageSize]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [page]);

  const [permittedTabs, setPermittedTabs] = useState(null);

  // Fetch allowed tabs for current user's role from Access Control API
  const fetchPermittedTabs = async () => {
    try {
      const res = await API.get('/access/user-tabs/my-access');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setPermittedTabs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch permitted user tabs:', err);
    }
  };

  useEffect(() => {
    fetchPermittedTabs();

    const onPermissionsUpdated = () => {
      fetchPermittedTabs();
    };
    window.addEventListener('access_permissions_updated', onPermissionsUpdated);
    return () => window.removeEventListener('access_permissions_updated', onPermissionsUpdated);
  }, [user?.role]);

  const allStatusGroups = useMemo(() => {
    if (!meta.data?.statusGroups) {
      return [];
    }
    const groups = meta.data.statusGroups || [];
    const fullList = [
      { _id: ALL_TAB, name: "Members" },
      ...groups,
      { _id: DROPPED_TAB, name: "Dropped" }
    ];

    let list;
    if (permittedTabs && Array.isArray(permittedTabs)) {
      list = fullList.filter(tab => permittedTabs.includes(String(tab._id)));
    } else {
      const isAdmin = ["ADMIN", "WARDEN"].includes(user?.role);
      list = isAdmin
        ? fullList
        : fullList.filter(tab => {
            const nameLower = tab.name.toLowerCase();
            return nameLower === "students" || nameLower === "alumni";
          });
    }

    if (tabOrder) {
      const ordered = tabOrder
        .map(id => list.find(g => String(g._id) === id))
        .filter(Boolean);
      // Ensure any newly added tabs like Dropped are not omitted
      list.forEach(item => {
        if (!ordered.some(o => String(o._id) === String(item._id))) {
          ordered.push(item);
        }
      });
      return ordered;
    }
    return list;
  }, [meta.data?.statusGroups, user?.role, tabOrder, permittedTabs]);

  // Resolve active tab on initial mount / refresh when status groups become available
  useEffect(() => {
    if (!meta.data?.statusGroups || allStatusGroups.length === 0 || hasInitializedTabRef.current) return;

    const tabParam = searchParams.get("tab");
    if (tabParam) {
      const resolvedId = resolveTabParamToId(tabParam, allStatusGroups);
      if (resolvedId) {
        hasInitializedTabRef.current = true;
        userSwitchedTabRef.current = true;
        setActiveTabId(resolvedId);
        lastKnownTabParamRef.current = tabParam;
        return;
      }
    }

    // Default to Students tab when status groups load, unless user explicitly switched tabs
    if (!userSwitchedTabRef.current || !activeTabId) {
      hasInitializedTabRef.current = true;
      const studentGroup = allStatusGroups.find(
        (g) => (g.name || "").toLowerCase() === "students"
      );
      const defaultGroup = studentGroup || allStatusGroups[0];
      if (defaultGroup) {
        const defaultId = String(defaultGroup._id);
        const defaultSlug = getTabSlug(defaultId, allStatusGroups);
        setActiveTabId(defaultId);
        lastKnownTabParamRef.current = defaultSlug;
        const nextParams = new URLSearchParams(searchParams);
        if (defaultSlug) nextParams.set("tab", defaultSlug);
        setSearchParams(nextParams, { replace: true });
      }
    }
  }, [meta.data?.statusGroups, allStatusGroups, resolveTabParamToId, getTabSlug, searchParams, setSearchParams, activeTabId]);

  // Ensure active tab is within permitted groups
  useEffect(() => {
    if (allStatusGroups.length > 0 && activeTabId && hasInitializedTabRef.current) {
      const isAllowed = allStatusGroups.some(g => String(g._id) === String(activeTabId));
      if (!isAllowed) {
        const studentGroup = allStatusGroups.find(
          (g) => (g.name || "").toLowerCase() === "students"
        );
        const fallbackId = studentGroup ? String(studentGroup._id) : String(allStatusGroups[0]._id);
        if (activeTabId !== fallbackId) {
          setActiveTabId(fallbackId);
        }
      }
    }
  }, [allStatusGroups, activeTabId]);

  // Sync URL changes (e.g. browser back/forward buttons) into local state
  useEffect(() => {
    const currentTabParam = searchParams.get("tab");
    if (lastKnownTabParamRef.current !== currentTabParam) {
      lastKnownTabParamRef.current = currentTabParam;
      if (currentTabParam && allStatusGroups.length > 0) {
        const resolvedId = resolveTabParamToId(currentTabParam, allStatusGroups);
        if (resolvedId && resolvedId !== activeTabId) {
          userSwitchedTabRef.current = true;
          setPage(1);
          setEditingCell(null);
          setIsTabSwitching(true);
          setActiveTabId(resolvedId);
        }
      }
    }

    const paramPage = parseInt(searchParams.get("page"), 10);
    const targetPage = paramPage > 0 ? paramPage : 1;
    if (targetPage !== page) {
      setPage(targetPage);
    }

    const paramSearch = searchParams.get("search") || "";
    if (paramSearch !== searchTerm) {
      setSearchTerm(paramSearch);
      setDebouncedSearch(paramSearch);
    }

    const paramStart = searchParams.get("startDate") || searchParams.get("from") || null;
    const paramEnd = searchParams.get("endDate") || searchParams.get("to") || null;
    if (paramStart !== joinDateMin) setJoinDateMin(paramStart);
    if (paramEnd !== joinDateMax) setJoinDateMax(paramEnd);
  }, [searchParams, allStatusGroups, activeTabId, page, searchTerm, joinDateMin, joinDateMax, resolveTabParamToId]);

  // Sync pagination to URL
  useEffect(() => {
    if (!hasInitializedTabRef.current) return;
    const nextParams = new URLSearchParams(searchParams);
    if (page > 1) nextParams.set("page", String(page));
    else nextParams.delete("page");
    if (searchParams.toString() !== nextParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [page]);

  // Sync debounced search to URL
  useEffect(() => {
    if (!hasInitializedTabRef.current) return;
    const nextParams = new URLSearchParams(searchParams);
    if (debouncedSearch) {
      nextParams.set("search", debouncedSearch);
      nextParams.delete("page");
    } else {
      nextParams.delete("search");
    }
    if (searchParams.toString() !== nextParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [debouncedSearch]);

  // Sync date range to URL
  useEffect(() => {
    if (!hasInitializedTabRef.current) return;
    const nextParams = new URLSearchParams(searchParams);
    if (joinDateMin) nextParams.set("startDate", joinDateMin);
    else nextParams.delete("startDate");
    if (joinDateMax) nextParams.set("endDate", joinDateMax);
    else nextParams.delete("endDate");
    if (searchParams.toString() !== nextParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [joinDateMin, joinDateMax]);

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

    const currentScrollableIds = scrollableColumns.map((c) => String(c._id));
    const nextScrollableIds = reorder(
      currentScrollableIds,
      result.source.index,
      result.destination.index,
    );

    // Name column is always pinned at the beginning (order 0)
    const nextIds = [String(nameCol._id), ...nextScrollableIds];

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

    // Update DB status groups order (filtering out ALL_TAB and DROPPED_TAB)
    const dbItems = items.filter(item => item._id !== ALL_TAB && item._id !== DROPPED_TAB);
    const payload = dbItems.map((item, idx) => ({
      _id: String(item._id),
      order: idx,
    }));
    reorderGroups.mutate({ statuses: payload });
  };

  // Row selection helpers
  const isAllSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));
  const isSomeSelected = rows.some((r) => selectedIds.has(r.id)) && !isAllSelected;

  const handleSelectAll = (e) => {
    if (!isAdminOrWarden) return;
    if (e.target.checked) {
      const all = new Set(rows.map((r) => r.id));
      setSelectedIds(all);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleRow = (rowId) => {
    if (!isAdminOrWarden) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  // Bulk drop / restore action
  const handleBulkDrop = async (drop = true) => {
    if (!isAdminOrWarden || selectedIds.size === 0) return;
    try {
      setDropLoading(true);
      await API.post("/users/bulk-drop", {
        userIds: Array.from(selectedIds),
        drop,
      });
      setSelectedIds(new Set());
      queryClient.invalidateQueries(["crm-leads"]);
      queryClient.invalidateQueries(["crm-metadata"]);
    } catch (err) {
      console.error("Bulk drop/restore error:", err);
    } finally {
      setDropLoading(false);
    }
  };

  const handleChangeRef = (leadId, key, value) => {
    const rawUser =
      leads.find((item) => String(item._id || item.id) === String(leadId)) ||
      rows.find((item) => String(item.id) === String(leadId))?.raw;
    let updateData = {};
    const lowerKey = (key || "").toLowerCase();

    if (lowerKey === "relativename" || lowerKey === "relation") {
      updateData = {
        relation: {
          ...(rawUser?.relation || {}),
          relatedPersonName: value,
        },
      };
    } else if (lowerKey === "role") {
      updateData = { role: String(value).toUpperCase() };
    } else if (lowerKey === "adhaar" || lowerKey === "aadhaar") {
      updateData = { adhaar: String(value).trim() };
    } else if (lowerKey === "email") {
      updateData = { email: String(value).toLowerCase().trim() };
    } else if (lowerKey === "phone") {
      updateData = { phone: String(value).trim() };
    } else if (lowerKey === "name") {
      updateData = { name: String(value).trim() };
    } else if (lowerKey === "dob" || lowerKey === "dateofbirth" || lowerKey === "age") {
      updateData = { dob: value || null, dateOfBirth: value || null };
    } else if (key.includes(".")) {
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
              [p3]: value,
            },
          },
        };
      } else if (parts.length === 2) {
        const parentKey = parts[0];
        const childKey = parts[1];
        updateData = {
          [parentKey]: {
            ...(rawUser?.[parentKey] || {}),
            [childKey]: value,
          },
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
      const headers = ["Name", "Email", "Phone", "Role", "Gender", "DOB"];

      const csvRows = [headers.join(",")];
      for (const row of exportData) {
        const values = [
          `"${row.name || ''}"`,
          `"${row.email || ''}"`,
          `"${row.phone || ''}"`,
          `"${row.role || ''}"`,
          `"${row.gender || ''}"`,
          `"${row.dob || row.dateOfBirth || ''}"`
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

  const showSkeleton = isTabSwitching || (isLoading && rows.length === 0) || (isFetching && isTabSwitching);
  const busy = isLoading || meta.isLoading || isTabSwitching;

  return (
    <Container maxWidth={false} sx={{ pb: 0, px: { xs: 0, sm: 2, md: 3 } }}>
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Could not load members data: {error?.message}
        </Alert>
      )}

      <Card
        sx={{
          border: "1px solid #EAECF0",
          borderRadius: { xs: 0, sm: "16px" },
          boxShadow: "none",
          overflow: "hidden",
          backgroundColor: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          height: { xs: "calc(100dvh - 90px)", md: "calc(100dvh - 120px)" },
        }}
      >
        {/* Drag-and-drop Status Group Filter Tabs */}
        <Stack
          direction="row"
          spacing={1}
          sx={{
            px: { xs: 1.5, sm: 3 },
            py: { xs: 1, sm: 1.5 },
            borderBottom: "1px solid #EAECF0",
            overflowX: "auto",
            whiteSpace: "nowrap",
            alignItems: "center",
            WebkitOverflowScrolling: "touch",
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
                            onClick={() => handleTabChange(String(group._id))}
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
          spacing={{ xs: 1, sm: 2 }}
          sx={{
            px: { xs: 1.5, sm: 3 },
            py: { xs: 1.25, sm: 2 },
            borderBottom: "1px solid #EAECF0",
            alignItems: "center",
            overflowX: "auto",
            flexWrap: "nowrap",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {/* Static Date Range Input styling */}
          <CustomDateRangePicker
            incApply={true}
            placeholder="Filter by Joining Date"
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
            slotProps={{
              input: {
                startAdornment: <SearchIcon sx={{ color: "text.secondary", mr: 1, fontSize: 18 }} />
              }
            }}
            sx={{ width: { xs: 180, sm: 240, md: 300 }, flexShrink: 0, "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
          />

          {/* Table Fields Settings Button */}
          <IconButton
            onClick={() => setColumnsOpen(true)}
            sx={{
              borderRadius: "8px",
              borderColor: "#D0D5DD",
              color: "#344054",
              flexShrink: 0,
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { borderColor: "#D0D5DD", backgroundColor: "#F9FAFB" }
            }}
          >
            <SettingsIcon />
          </IconButton>

          {/* Action button when items are selected (admin or warden only) */}
          {isAdminOrWarden && selectedIds.size > 0 && (
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexShrink: 0 }}>
              {activeTabId === DROPPED_TAB ? (
                <Button
                  variant="contained"
                  onClick={() => handleBulkDrop(false)}
                  disabled={dropLoading}
                  sx={{
                    height: "40px",
                    borderRadius: "8px",
                    backgroundColor: "#039855",
                    color: "#FFFFFF",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "14px",
                    boxShadow: "none",
                    px: 2.5,
                    whiteSpace: "nowrap",
                    display: "inline-flex",
                    alignItems: "center",
                    flexShrink: 0,
                    "&:hover": { backgroundColor: "#027A48", boxShadow: "none" }
                  }}
                >
                  {dropLoading ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Restore Contacts"}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => handleBulkDrop(true)}
                  disabled={dropLoading}
                  sx={{
                    height: "40px",
                    borderRadius: "8px",
                    backgroundColor: "#D92D20",
                    color: "#FFFFFF",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "14px",
                    boxShadow: "none",
                    px: 2.5,
                    whiteSpace: "nowrap",
                    display: "inline-flex",
                    alignItems: "center",
                    flexShrink: 0,
                    "&:hover": { backgroundColor: "#B42318", boxShadow: "none" }
                  }}
                >
                  {dropLoading ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : `Drop ${selectedIds.size}`}
                </Button>
              )}
            </Stack>
          )}

          <Box sx={{ flexGrow: 1 }} />

          {/* Counts */}
          {showSkeleton ? (
            <Skeleton variant="rounded" width={75} height={24} sx={{ borderRadius: "6px", mr: 1 }} />
          ) : (
            <Typography variant="body2" sx={{ color: "#475467", fontWeight: 600, mr: 1, whiteSpace: "nowrap", flexShrink: 0 }}>
              {totalLeads} results
            </Typography>
          )}

          {/* Export Button (only for ADMIN & WARDEN) */}
          {isAdminOrWarden && (
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              sx={{
                height: "40px",
                borderRadius: "8px",
                borderColor: "#D0D5DD",
                color: "#344054",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "14px",
                px: 2,
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                flexShrink: 0,
                "&:hover": { borderColor: "#D0D5DD", backgroundColor: "#F9FAFB" }
              }}
            >
              Export
            </Button>
          )}

          {/* Add Member Button (only for ADMIN & WARDEN) */}
          {isAdminOrWarden && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddOpen(true)}
              sx={{
                height: "40px",
                borderRadius: "8px",
                backgroundColor: "#0088ff",
                color: "#FFFFFF",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "14px",
                boxShadow: "none",
                px: 2.5,
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                flexShrink: 0,
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
                alignItems: "stretch",
                backgroundColor: "#F9FAFB",
                borderBottom: "1px solid #EAECF0",
                position: "sticky",
                top: 0,
                zIndex: 8,
              }}
            >
              {/* Sticky All-Select Checkbox in Header (admin or warden only) */}
              {isAdminOrWarden && (
                <Box
                  sx={{
                    position: "sticky",
                    left: 0,
                    width: 44,
                    minWidth: 44,
                    alignSelf: "stretch",
                    backgroundColor: "#FFFFFF",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 10,
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={isAllSelected}
                    indeterminate={isSomeSelected}
                    onChange={handleSelectAll}
                    disabled={rows.length === 0}
                    sx={{
                      color: "#D0D5DD",
                      "&.Mui-checked, &.MuiCheckbox-indeterminate": { color: "#0088FF" },
                      p: 0.5,
                    }}
                  />
                </Box>
              )}

              {/* Sticky Avatar Column Header */}
              <Box
                sx={{
                  position: isMobile ? "relative" : "sticky",
                  left: isMobile ? "auto" : (isAdminOrWarden ? 44 : 0),
                  width: 52,
                  minWidth: 52,
                  alignSelf: "stretch",
                  backgroundColor: "#FFFFFF",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 10,
                }}
              />

              {/* Sticky Name Column Header - Fixed and non-draggable */}
              <Box
                sx={{
                  position: isMobile ? "relative" : "sticky",
                  left: isMobile ? "auto" : (isAdminOrWarden ? 96 : 52),
                  width: nameCol.width || 220,
                  minWidth: nameCol.width || 220,
                  alignSelf: "stretch",
                  backgroundColor: "#FFFFFF",
                  px: 2,
                  display: "flex",
                  alignItems: "center",
                  zIndex: 10,
                  userSelect: "none",
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#475467" }}>
                  Name
                </Typography>
              </Box>

              {/* Remaining Draggable Columns */}
              <DragDropContext onDragEnd={handleColumnDragEnd}>
                <Droppable droppableId="columns-droppable" direction="horizontal">
                  {(provided) => (
                    <Stack
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      direction="row"
                      sx={{ alignItems: "center" }}
                    >
                      {scrollableColumns.map((col, index) => (
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
                                alignItems: "center",
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
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#475467", whiteSpace: "nowrap" }}>
                                {getColumnDisplayName(col)}
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
            <Box sx={{ position: "relative" }}>
              {showSkeleton ? (
                Array.from({ length: 8 }).map((_, idx) => (
                  <Stack
                    key={idx}
                    direction="row"
                    sx={{
                      minHeight: 64,
                      alignItems: "stretch",
                      width: "max-content",
                      minWidth: "100%",
                      backgroundColor: "#FFFFFF",
                      borderBottom: "1px solid #EAECF0",
                    }}
                  >
                    {isAdminOrWarden && (
                      <Box sx={{ position: "sticky", left: 0, width: 44, minWidth: 44, alignSelf: "stretch", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 4, backgroundColor: "#FFFFFF" }}>
                        <Skeleton variant="rounded" width={18} height={18} />
                      </Box>
                    )}
                    <Box sx={{ position: isMobile ? "relative" : "sticky", left: isMobile ? "auto" : (isAdminOrWarden ? 44 : 0), width: 52, minWidth: 52, alignSelf: "stretch", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 4, backgroundColor: "#FFFFFF" }}>
                      <Skeleton variant="circular" width={38} height={38} />
                    </Box>
                    <Box sx={{ position: isMobile ? "relative" : "sticky", left: isMobile ? "auto" : (isAdminOrWarden ? 96 : 52), width: nameCol.width || 220, minWidth: nameCol.width || 220, alignSelf: "stretch", px: 2, display: "flex", alignItems: "center", zIndex: 4, backgroundColor: "#FFFFFF" }}>
                      <Skeleton variant="rounded" height={32} sx={{ width: "85%", borderRadius: "8px" }} />
                    </Box>
                    <Stack direction="row" sx={{ alignItems: "center", py: 1 }}>
                      {scrollableColumns.map((col) => (
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
                rows.map((row) => {
                  const isSelected = selectedIds.has(row.id);
                  const rowBg = isSelected ? "#f8fafc" : "#FFFFFF";
                  const rowHoverBg = isSelected ? "#f8fafc" : "#f8fafc";
                  const nameCellId = `${row.id}-${nameCol._id}`;
                  const isNameEditing = editingCell === nameCellId;
                  const isOwnRow = String(row.id) === String(user?._id || user?.id);
                  const nameCellDisabled = !isAdminOrWarden && !isOwnRow;

                  return (
                    <Stack
                      key={row.id}
                      direction="row"
                      sx={{
                        minHeight: 64,
                        alignItems: "stretch",
                        backgroundColor: rowBg,
                        borderBottom: "1px solid #EAECF0",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          backgroundColor: rowHoverBg,
                          "& .sticky-col": {
                            backgroundColor: rowHoverBg,
                          }
                        },
                        "& .sticky-col": {
                          backgroundColor: rowBg,
                        }
                      }}
                    >
                      {/* Sticky Checkbox Cell - Full height solid white background (admin or warden only) */}
                      {isAdminOrWarden && (
                        <Box
                          className="sticky-col"
                          sx={{
                            position: "sticky",
                            left: 0,
                            width: 44,
                            minWidth: 44,
                            alignSelf: "stretch",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            zIndex: 4,
                            backgroundColor: rowBg,
                          }}
                        >
                          <Checkbox
                            size="small"
                            checked={isSelected}
                            onChange={() => handleToggleRow(row.id)}
                            sx={{
                              color: "#D0D5DD",
                              "&.Mui-checked": { color: "#0088FF" },
                              p: 0.5,
                            }}
                          />
                        </Box>
                      )}

                      {/* Sticky Avatar Cell - Full height solid white background */}
                      <Box
                        className="sticky-col"
                        sx={{
                          position: isMobile ? "relative" : "sticky",
                          left: isMobile ? "auto" : (isAdminOrWarden ? 44 : 0),
                          width: 52,
                          minWidth: 52,
                          alignSelf: "stretch",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          zIndex: 4,
                          backgroundColor: rowBg,
                        }}
                      >
                        <Tooltip
                          arrow
                          placement="right"
                          enterDelay={150}
                          leaveDelay={100}
                          slotProps={{
                            tooltip: {
                              sx: {
                                bgcolor: "transparent",
                                boxShadow: "none",
                                borderRadius: "16px",
                                p: 0.75,
                                border: "1px solid #EAECF0",
                                "& .MuiTooltip-arrow": {
                                  color: "#ffffff",
                                  "&::before": {
                                    border: "1px solid #EAECF0"
                                  }
                                }
                              }
                            }
                          }}
                          title={
                            <Avatar
                              src={row.profilePhoto?.url || ""}
                              sx={{
                                width: 180,
                                height: 180,
                                borderRadius: "50%",
                                border: "2px solid #0088FF",
                                fontSize: "2.4rem",
                                fontWeight: 700,
                                bgcolor: "#0088ff",
                                "& .MuiAvatar-img": {
                                  borderRadius: "50%",
                                  objectFit: "cover"
                                }
                              }}
                            >
                              {row.name?.charAt(0)}
                            </Avatar>
                          }
                        >
                          <Avatar
                            src={row.profilePhoto?.url || ""}
                            onClick={() => setDetailLead(row)}
                            sx={{
                              width: 38,
                              height: 38,
                              fontSize: "14px",
                              bgcolor: row.profilePhoto?.url ? "" : "#0088ff",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              "&:hover": {
                                transform: "scale(1.1)",
                                boxShadow: "0 0 0 3px rgba(0, 136, 255, 0.3)"
                              }
                            }}
                          >
                            {row.name?.charAt(0)}
                          </Avatar>
                        </Tooltip>
                      </Box>

                      {/* Sticky Name Cell - Full height solid white background, no shadow */}
                      <LeadCell
                        field={nameCol}
                        row={row}
                        meta={cellMeta}
                        disabled={nameCellDisabled}
                        isEditing={isNameEditing}
                        onStartEdit={() => setEditingCell(nameCellId)}
                        onStopEdit={() => setEditingCell(null)}
                        onChangeRef={handleChangeRef}
                        onChangeField={handleChangeField}
                        onOpenProfile={() => setDetailLead(row)}
                        className="sticky-col"
                        sx={{
                          position: isMobile ? "relative" : "sticky",
                          left: isMobile ? "auto" : (isAdminOrWarden ? 96 : 52),
                          zIndex: 4,
                          alignSelf: "stretch",
                          display: "flex",
                          alignItems: "center",
                          backgroundColor: rowBg,
                        }}
                      />

                      {/* Remaining Scrollable Columns Cells */}
                      <Stack direction="row" sx={{ alignItems: "center", py: 1 }}>
                        {scrollableColumns.map((col) => {
                          const cellId = `${row.id}-${col._id}`;
                          const isEditing = editingCell === cellId;
                          const cellDisabled = !isAdminOrWarden && !isOwnRow;
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
                              onOpenAuditModal={(r) => {
                                setAuditUserRow(r);
                                setAuditModalOpen(true);
                              }}
                            />
                          );
                        })}
                      </Stack>
                    </Stack>
                  );
                })
              )}
            </Box>
          </Box>
        </Box>

        {/* Table Pagination Controls Footer */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: { xs: "space-between", sm: "flex-end" },
            px: { xs: 1.5, sm: 3 },
            py: { xs: 1, sm: 1.5 },
            borderTop: "1px solid #EAECF0",
            backgroundColor: "#FFFFFF",
            gap: { xs: 1, sm: 3 },
            flexWrap: "nowrap",
            overflowX: "auto"
          }}
        >
          {/* Rows per page selector */}
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 }, flexShrink: 0 }}>
            <Typography variant="body2" sx={{ color: "#475467", fontSize: { xs: "0.75rem", sm: "0.875rem" }, whiteSpace: "nowrap" }}>
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
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                fontWeight: 600,
                color: "#344054",
                "& .MuiSelect-select": {
                  py: 0.25,
                  pr: "16px !important",
                  pl: 0.25
                },
                "& .MuiSvgIcon-root": {
                  fontSize: 16,
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
          {showSkeleton ? (
            <Skeleton variant="text" width={70} height={18} />
          ) : (
            <Typography variant="body2" sx={{ color: "#344054", fontSize: { xs: "0.75rem", sm: "0.875rem" }, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>
              {totalLeads === 0
                ? "0-0 of 0"
                : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, totalLeads)} of ${totalLeads}`}
            </Typography>
          )}

          {/* Prev / Next buttons */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
            <IconButton
              size="small"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              sx={{
                width: { xs: 26, sm: 32 },
                height: { xs: 26, sm: 32 },
                borderRadius: "6px",
                border: "1px solid #D0D5DD",
                color: "#344054",
                p: 0,
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
              <ChevronLeftIcon sx={{ fontSize: { xs: 15, sm: 18 } }} />
            </IconButton>

            <IconButton
              size="small"
              disabled={page >= totalPages || isFetching}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              sx={{
                width: { xs: 26, sm: 32 },
                height: { xs: 26, sm: 32 },
                borderRadius: "6px",
                border: "1px solid #D0D5DD",
                color: "#344054",
                p: 0,
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
              <ChevronRightIcon sx={{ fontSize: { xs: 15, sm: 18 } }} />
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

      {/* Add New Member Dialog - Uses the exact same Profile Dialog */}
      <LeadDetailsDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        isCreate={true}
        lead={null}
        onUserUpdated={() => {
          queryClient.invalidateQueries(["crm-leads"]);
        }}
      />

      {/* Profile Details Dialog */}
      <LeadDetailsDialog
        open={Boolean(detailLead)}
        onClose={() => setDetailLead(null)}
        lead={detailLead}
        onUserUpdated={() => {
          queryClient.invalidateQueries(["crm-leads"]);
        }}
      />

      {/* Admin Security Telemetry & Audit Logs Modal */}
      <LoginDetailsModal
        open={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        userRow={auditUserRow}
      />
    </Container>
  );
}
