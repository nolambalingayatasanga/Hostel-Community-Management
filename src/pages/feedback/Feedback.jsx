import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Paper } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import API from '../../api';

import {
  FeedbackHeader,
  FeedbackToolbar,
  FeedbackTable,
  FeedbackPagination,
  CreateFeedbackDialog,
  ViewFeedbackDialog,
  EditFeedbackDialog,
  ReplyFeedbackDialog,
  DeleteFeedbackDialog
} from '../../components/Feedback/index.js';

export default function Feedback() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const isAdminOrWarden =
    user?.role === 'ADMIN' ||
    user?.role === 'ADMINISTRATOR' ||
    user?.role === 'WARDEN' ||
    user?.role === 'CHAIRPERSON';

  // Feedbacks data state
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyingItem, setReplyingItem] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replySaving, setReplySaving] = useState(false);

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);

  // Filters, search & pagination state
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch feedbacks from API
  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get('/feedback');
      if (res.data?.success) {
        setFeedbacks(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to load feedbacks', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  // Submit new feedback
  const handleCreateFeedback = async (e) => {
    if (e) e.preventDefault();
    const trimmed = newContent.trim();
    if (!trimmed) {
      enqueueSnackbar('Please enter your feedback before submitting', { variant: 'warning' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await API.post('/feedback', { content: trimmed });
      if (res.data?.success) {
        enqueueSnackbar('Feedback submitted successfully! Thank you for sharing.', { variant: 'success' });
        setNewContent('');
        setCreateDialogOpen(false);
        setFeedbacks((prev) => [res.data.data, ...prev]);
        setPage(0);
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to submit feedback', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Open edit dialog
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditContent(item.content);
    setEditDialogOpen(true);
  };

  // Save edited feedback
  const handleSaveEdit = async () => {
    const trimmed = editContent.trim();
    if (!trimmed) {
      enqueueSnackbar('Feedback cannot be empty', { variant: 'warning' });
      return;
    }

    try {
      setEditSaving(true);
      const res = await API.put(`/feedback/${editingItem._id}`, { content: trimmed });
      if (res.data?.success) {
        enqueueSnackbar('Feedback updated successfully', { variant: 'success' });
        setFeedbacks((prev) => prev.map((f) => (f._id === editingItem._id ? res.data.data : f)));
        if (viewingItem && viewingItem._id === editingItem._id) {
          setViewingItem(res.data.data);
        }
        setEditDialogOpen(false);
        setEditingItem(null);
      }
    } catch (err) {
      console.error('Error updating feedback:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to update feedback', { variant: 'error' });
    } finally {
      setEditSaving(false);
    }
  };

  // Open delete dialog
  const handleOpenDelete = (item) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  // Confirm delete feedback
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      setDeleting(true);
      const res = await API.delete(`/feedback/${deletingItem._id}`);
      if (res.data?.success) {
        enqueueSnackbar('Feedback deleted successfully', { variant: 'success' });
        setFeedbacks((prev) => prev.filter((f) => f._id !== deletingItem._id));
        if (viewingItem && viewingItem._id === deletingItem._id) {
          setViewDialogOpen(false);
          setViewingItem(null);
        }
        setDeleteDialogOpen(false);
        setDeletingItem(null);
      }
    } catch (err) {
      console.error('Error deleting feedback:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete feedback', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  // Admin: Toggle accept status
  const handleToggleStatus = async (item) => {
    if (!isAdminOrWarden) return;
    const newStatus = item.status === 'accepted' ? 'pending' : 'accepted';
    try {
      const res = await API.patch(`/feedback/${item._id}/status`, { status: newStatus });
      if (res.data?.success) {
        enqueueSnackbar(`Marked feedback as ${newStatus}`, { variant: 'success' });
        setFeedbacks((prev) => prev.map((f) => (f._id === item._id ? res.data.data : f)));
        if (viewingItem && viewingItem._id === item._id) {
          setViewingItem(res.data.data);
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to update status', { variant: 'error' });
    }
  };

  // Admin: Toggle like
  const handleToggleLike = async (item) => {
    if (!isAdminOrWarden) return;
    try {
      const res = await API.post(`/feedback/${item._id}/like`);
      if (res.data?.success) {
        setFeedbacks((prev) => prev.map((f) => (f._id === item._id ? res.data.data : f)));
        if (viewingItem && viewingItem._id === item._id) {
          setViewingItem(res.data.data);
        }
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to like feedback', { variant: 'error' });
    }
  };

  // Admin: Open reply dialog
  const handleOpenReply = (item) => {
    setReplyingItem(item);
    setReplyText(item.adminReply || '');
    setReplyDialogOpen(true);
  };

  // Admin: Save reply
  const handleSaveReply = async () => {
    try {
      setReplySaving(true);
      const res = await API.post(`/feedback/${replyingItem._id}/reply`, { reply: replyText });
      if (res.data?.success) {
        enqueueSnackbar(replyText.trim() ? 'Reply saved successfully' : 'Reply removed', { variant: 'success' });
        setFeedbacks((prev) => prev.map((f) => (f._id === replyingItem._id ? res.data.data : f)));
        if (viewingItem && viewingItem._id === replyingItem._id) {
          setViewingItem(res.data.data);
        }
        setReplyDialogOpen(false);
        setReplyingItem(null);
      }
    } catch (err) {
      console.error('Error saving reply:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to save reply', { variant: 'error' });
    } finally {
      setReplySaving(false);
    }
  };

  // View details modal
  const handleOpenView = (item) => {
    setViewingItem(item);
    setViewDialogOpen(true);
  };

  // Filtered feedbacks
  const filteredFeedbacks = useMemo(() => {
    let list = feedbacks;

    if (statusFilter === 'pending') {
      list = list.filter((f) => f.status === 'pending');
    } else if (statusFilter === 'accepted') {
      list = list.filter((f) => f.status === 'accepted');
    } else if (statusFilter === 'replied') {
      list = list.filter((f) => Boolean(f.adminReply && f.adminReply.trim()));
    } else if (statusFilter === 'liked') {
      list = list.filter((f) => f.isLiked);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (f) =>
          (f.content || '').toLowerCase().includes(q) ||
          (f.user?.name || '').toLowerCase().includes(q) ||
          (f.adminReply || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [feedbacks, statusFilter, searchQuery]);

  // Paginated list
  const paginatedFeedbacks = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredFeedbacks.slice(start, start + rowsPerPage);
  }, [filteredFeedbacks, page, rowsPerPage]);

  // Statistics
  const stats = useMemo(() => {
    const total = feedbacks.length;
    const pending = feedbacks.filter((f) => f.status === 'pending').length;
    const accepted = feedbacks.filter((f) => f.status === 'accepted').length;
    const replied = feedbacks.filter((f) => Boolean(f.adminReply && f.adminReply.trim())).length;
    const liked = feedbacks.filter((f) => f.isLiked).length;
    return { total, pending, accepted, replied, liked };
  }, [feedbacks]);

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        height: {
          xs: 'calc(100vh - 80px)',
          sm: 'calc(100vh - 100px)',
          md: 'calc(100vh - 116px)'
        },
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Top Header */}
      <FeedbackHeader
        onAddFeedback={() => {
          setNewContent('');
          setCreateDialogOpen(true);
        }}
      />

      {/* Main Table Paper Container */}
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          flex: 1,
          minHeight: 0,
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#FFFFFF'
        }}
      >
        {/* Table Top Toolbar */}
        <FeedbackToolbar
          stats={stats}
          statusFilter={statusFilter}
          onStatusChange={(status) => {
            setStatusFilter(status);
            setPage(0);
          }}
          searchQuery={searchQuery}
          onSearchChange={(query) => {
            setSearchQuery(query);
            setPage(0);
          }}
          onRefresh={fetchFeedbacks}
          loading={loading}
        />

        {/* Table Rows & Sticky Header */}
        <FeedbackTable
          loading={loading}
          paginatedFeedbacks={paginatedFeedbacks}
          page={page}
          rowsPerPage={rowsPerPage}
          currentUser={user}
          isAdminOrWarden={isAdminOrWarden}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          onOpenView={handleOpenView}
          onOpenEdit={handleOpenEdit}
          onOpenDelete={handleOpenDelete}
          onOpenReply={handleOpenReply}
          onToggleStatus={handleToggleStatus}
          onToggleLike={handleToggleLike}
        />

        {/* Pagination Footer */}
        <FeedbackPagination
          page={page}
          rowsPerPage={rowsPerPage}
          totalItems={filteredFeedbacks.length}
          onPageChange={setPage}
          onRowsPerPageChange={(newRows) => {
            setRowsPerPage(newRows);
            setPage(0);
          }}
        />
      </Paper>

      {/* Modals & Dialogs (Mounted on-demand) */}
      {createDialogOpen && (
        <CreateFeedbackDialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          content={newContent}
          onContentChange={setNewContent}
          onSubmit={handleCreateFeedback}
          submitting={submitting}
        />
      )}

      {viewDialogOpen && (
        <ViewFeedbackDialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          item={viewingItem}
          currentUser={user}
          isAdminOrWarden={isAdminOrWarden}
          onOpenEdit={handleOpenEdit}
          onOpenReply={handleOpenReply}
          onOpenDelete={handleOpenDelete}
        />
      )}

      {editDialogOpen && (
        <EditFeedbackDialog
          open={editDialogOpen}
          onClose={() => {
            setEditDialogOpen(false);
            setEditingItem(null);
          }}
          content={editContent}
          onContentChange={setEditContent}
          onSave={handleSaveEdit}
          saving={editSaving}
        />
      )}

      {replyDialogOpen && (
        <ReplyFeedbackDialog
          open={replyDialogOpen}
          onClose={() => {
            setReplyDialogOpen(false);
            setReplyingItem(null);
          }}
          item={replyingItem}
          replyText={replyText}
          onReplyTextChange={setReplyText}
          onSaveReply={handleSaveReply}
          saving={replySaving}
        />
      )}

      {deleteDialogOpen && (
        <DeleteFeedbackDialog
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setDeletingItem(null);
          }}
          item={deletingItem}
          onConfirmDelete={handleConfirmDelete}
          deleting={deleting}
        />
      )}
    </Box>
  );
}
