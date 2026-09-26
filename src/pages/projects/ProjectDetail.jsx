import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Avatar,
  Card,
  TextField,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Tooltip,
  Divider,
  Stack,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';
import {
  ArrowBackRounded as ArrowBackIcon,
  EditRounded as EditIcon,
  DeleteOutlineRounded as DeleteIcon,
  CalendarTodayRounded as CalendarIcon,
  VisibilityRounded as VisibilityIcon,
  FavoriteRounded as FavoriteIcon,
  FavoriteBorderRounded as FavoriteBorderIcon,
  GitHub as GitHubIcon,
  OpenInNewRounded as OpenInNewIcon,
  Language as LanguageIcon,
  ShareRounded as ShareIcon,
  SendRounded as SendIcon,
  ZoomInRounded as ZoomInIcon,
  Close as CloseIcon,
  ChevronLeftRounded as ChevronLeftIcon,
  ChevronRightRounded as ChevronRightIcon,
  PlayArrowRounded as PlayIcon,
  DownloadRounded as DownloadIcon,
  LocalOfferOutlined as TagIcon,
  RocketLaunchRounded as RocketIcon,
  SchoolRounded as SchoolIcon,
  VerifiedUserRounded as VerifiedIcon,
  ThumbUpRounded as ThumbUpIcon,
  ThumbUpOutlined as ThumbUpOutlinedIcon,
  ChatBubbleOutlineRounded as ChatIcon,
  ContentCopyRounded as CopyIcon,
  AttachFile as AttachFileIcon,
  CloudUpload as CloudUploadIcon,
  AddPhotoAlternateRounded as AddPhotoIcon,
  StarRounded as StarIcon,
  AddRounded as AddIcon,
  ImageRounded as ImageIcon,
  MailOutlineRounded as MailIcon,
  PhoneRounded as PhoneIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from 'notistack';
import API from '../../api';

const CATEGORY_TAG_SUGGESTIONS = {
  'IoT & Hardware': ['Arduino', 'Raspberry Pi', 'ESP32', 'Sensors', 'Embedded C', 'Microcontroller', 'Robotics'],
  'AI / ML': ['Python', 'TensorFlow', 'PyTorch', 'OpenCV', 'Scikit-learn', 'NLP', 'Computer Vision'],
  'Web Development': ['React', 'Node.js', 'Express', 'MongoDB', 'Next.js', 'Tailwind CSS', 'TypeScript'],
  'Mobile Apps': ['Flutter', 'React Native', 'Swift', 'Kotlin', 'Firebase', 'Android', 'iOS'],
  'Cloud & DevOps': ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Linux', 'GCP'],
  'Cybersecurity': ['Wireshark', 'Cryptography', 'Metasploit', 'Linux', 'Network Security', 'Ethical Hacking'],
  'Open Source': ['Git', 'Documentation', 'Open Source', 'Node.js', 'Python', 'Community'],
  'Other': ['Design', 'Automation', 'Embedded Systems', 'Research']
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Media active index & Lightbox Zoom
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Like state
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [liking, setLiking] = useState(false);

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Direct Media Upload & Thumbnail management refs & state
  const mediaFileInputRef = useRef(null);
  const thumbnailFileInputRef = useRef(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [settingThumbnail, setSettingThumbnail] = useState(false);

  // Delete Media Confirmation state
  const [mediaToDelete, setMediaToDelete] = useState(null);
  const [deletingMedia, setDeletingMedia] = useState(false);

  // Edit Project Dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Web Development');
  const [editProjectType, setEditProjectType] = useState('College Project');
  const [editScopeType, setEditScopeType] = useState('Solo Project');
  const [editTagsInput, setEditTagsInput] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLiveUrl, setEditLiveUrl] = useState('');
  const [editGithubUrl, setEditGithubUrl] = useState('');
  const [editThumbnail, setEditThumbnail] = useState('');
  const [editThumbnailFile, setEditThumbnailFile] = useState(null);
  const [editMediaList, setEditMediaList] = useState([]);
  const [editNewMediaFiles, setEditNewMediaFiles] = useState([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const editThumbnailInputRef = useRef(null);
  const editMediaInputRef = useRef(null);

  // Delete Project Confirmation Dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Role permissions
  const isAdmin = Boolean(user && ['ADMIN', 'ADMINISTRATOR', 'WARDEN'].includes(user.role));
  const isAuthor = Boolean(
    user && project?.author && (String(project.author._id || project.author) === String(user._id))
  );
  const canManage = isAdmin || isAuthor;

  // Fetch project details
  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await API.get(`/projects/${id}`);
      if (res.data?.success && res.data.data) {
        const p = res.data.data;
        setProject(p);
        setLikesCount(p.likes?.length || p.starsCount || 0);
        if (user) {
          const userLiked = (p.likes || []).some(
            (uid) => String(uid._id || uid) === String(user._id)
          );
          setIsLiked(userLiked);
        }
      }
    } catch (err) {
      console.error('Failed to load project:', err);
      setError('Could not load project details.');
      enqueueSnackbar('Could not load project details.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [id, user, enqueueSnackbar]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  // Combined list of all media (thumbnail + project.media)
  const mediaList = useMemo(() => {
    if (!project) return [];
    const list = [];

    // Thumbnail as primary image
    if (project.thumbnail) {
      list.push({
        url: project.thumbnail,
        type: 'image',
        name: 'Cover Thumbnail',
        isThumbnail: true
      });
    }

    // Additional media files
    if (Array.isArray(project.media)) {
      project.media.forEach((m, idx) => {
        if (m.url && m.url !== project.thumbnail) {
          list.push({
            url: m.url,
            type: m.type || (m.url.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image'),
            name: m.name || `Media ${idx + 1}`,
            mediaIndex: idx
          });
        } else if (m.url && m.url === project.thumbnail) {
          const thumbItem = list.find((item) => item.isThumbnail);
          if (thumbItem) {
            thumbItem.mediaIndex = idx;
          }
        }
      });
    }

    // Direct Video URL if provided
    if (project.videoUrl) {
      list.push({
        url: project.videoUrl,
        type: 'video',
        name: 'Project Video Demo',
        isVideoUrl: true
      });
    }

    // Fallback if empty
    if (list.length === 0) {
      list.push({
        url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
        type: 'image',
        name: 'Default Preview',
        isPlaceholder: true
      });
    }

    return list;
  }, [project]);

  // Handle Like
  const handleToggleLike = async () => {
    if (!user) {
      enqueueSnackbar('Please log in to like this project', { variant: 'info' });
      return;
    }
    try {
      setLiking(true);
      const res = await API.post(`/projects/${id}/like`);
      if (res.data?.success) {
        setIsLiked(res.data.isLiked);
        setLikesCount(res.data.starsCount);
        enqueueSnackbar(res.data.isLiked ? 'Project liked!' : 'Removed like', { variant: 'success' });
      }
    } catch (err) {
      console.error('Like error:', err);
      enqueueSnackbar('Failed to update like status', { variant: 'error' });
    } finally {
      setLiking(false);
    }
  };

  // Handle Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) {
      enqueueSnackbar('Please log in to leave a comment', { variant: 'info' });
      return;
    }
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      const res = await API.post(`/projects/${id}/comments`, { text: commentText.trim() });
      if (res.data?.success) {
        setProject((prev) => ({ ...prev, comments: res.data.data }));
        setCommentText('');
        enqueueSnackbar('Comment posted!', { variant: 'success' });
      }
    } catch (err) {
      console.error('Comment error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to post comment', { variant: 'error' });
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle Delete Comment
  const handleDeleteComment = async (commentId) => {
    try {
      const res = await API.delete(`/projects/${id}/comments/${commentId}`);
      if (res.data?.success) {
        setProject((prev) => ({ ...prev, comments: res.data.data }));
        enqueueSnackbar('Comment deleted', { variant: 'info' });
      }
    } catch (err) {
      console.error('Delete comment error:', err);
      enqueueSnackbar('Failed to delete comment', { variant: 'error' });
    }
  };

  // Handle Like Comment
  const handleToggleCommentLike = async (commentId) => {
    if (!user) {
      enqueueSnackbar('Please log in to like comments', { variant: 'info' });
      return;
    }
    try {
      const res = await API.post(`/projects/${id}/comments/${commentId}/like`);
      if (res.data?.success) {
        setProject((prev) => ({ ...prev, comments: res.data.data }));
      }
    } catch (err) {
      console.error('Like comment error:', err);
    }
  };

  // Handle Share Project Link
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    enqueueSnackbar('Project link copied to clipboard!', { variant: 'success' });
  };

  // Handle direct upload of additional media (images, videos, PDFs)
  const handleUploadNewMedia = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      setUploadingMedia(true);
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('media', file);
      });
      const res = await API.put(`/projects/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        setProject(res.data.data);
        enqueueSnackbar(`${files.length} media file${files.length > 1 ? 's' : ''} uploaded!`, { variant: 'success' });
      }
    } catch (err) {
      console.error('Failed to upload media:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to upload media', { variant: 'error' });
    } finally {
      setUploadingMedia(false);
      if (mediaFileInputRef.current) mediaFileInputRef.current.value = '';
    }
  };

  // Handle direct upload/replacement of cover thumbnail
  const handleUploadThumbnail = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingThumbnail(true);
      const formData = new FormData();
      formData.append('thumbnail', file);
      const res = await API.put(`/projects/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        setProject(res.data.data);
        setActiveMediaIndex(0);
        enqueueSnackbar('Cover thumbnail updated!', { variant: 'success' });
      }
    } catch (err) {
      console.error('Failed to update thumbnail:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to update thumbnail', { variant: 'error' });
    } finally {
      setUploadingThumbnail(false);
      if (thumbnailFileInputRef.current) thumbnailFileInputRef.current.value = '';
    }
  };

  // Handle setting an existing image as project cover thumbnail
  const handleSetAsThumbnail = async (imageUrl) => {
    if (!imageUrl) return;
    try {
      setSettingThumbnail(true);
      const res = await API.put(`/projects/${id}`, { thumbnail: imageUrl });
      if (res.data?.success) {
        setProject(res.data.data);
        enqueueSnackbar('Set as project cover thumbnail!', { variant: 'success' });
      }
    } catch (err) {
      console.error('Failed to set thumbnail:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to set thumbnail', { variant: 'error' });
    } finally {
      setSettingThumbnail(false);
    }
  };

  // Handle confirming deletion of a specific media file
  const handleConfirmDeleteMedia = async () => {
    if (!mediaToDelete) return;
    try {
      setDeletingMedia(true);
      let updatedMedia = Array.isArray(project.media) ? [...project.media] : [];
      let updatedThumbnail = project.thumbnail || '';
      let updatedVideoUrl = project.videoUrl || '';

      if (mediaToDelete.isThumbnail) {
        updatedThumbnail = '';
        const nextImg = updatedMedia.find((m) => m.type === 'image');
        if (nextImg) updatedThumbnail = nextImg.url;
      }

      if (mediaToDelete.isVideoUrl) {
        updatedVideoUrl = '';
      }

      if (mediaToDelete.mediaIndex !== undefined) {
        updatedMedia = updatedMedia.filter((_, idx) => idx !== mediaToDelete.mediaIndex);
        if (updatedThumbnail === mediaToDelete.url) {
          const nextImg = updatedMedia.find((m) => m.type === 'image');
          updatedThumbnail = nextImg ? nextImg.url : '';
        }
      }

      const payload = {
        media: updatedMedia,
        thumbnail: updatedThumbnail,
        videoUrl: updatedVideoUrl
      };

      const res = await API.put(`/projects/${id}`, payload);
      if (res.data?.success) {
        setProject(res.data.data);
        setActiveMediaIndex(0);
        enqueueSnackbar('Media deleted successfully', { variant: 'success' });
        setMediaToDelete(null);
      }
    } catch (err) {
      console.error('Failed to delete media:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete media', { variant: 'error' });
    } finally {
      setDeletingMedia(false);
    }
  };

  // Handle Open Edit
  const handleOpenEdit = () => {
    if (!project) return;
    setEditTitle(project.title || '');
    setEditCategory(project.category || project.industry || 'Web Development');
    setEditProjectType(project.projectType || 'College Project');
    setEditScopeType(
      project.scopeType && project.scopeType !== 'Team Project'
        ? project.scopeType
        : (project.projectType === 'Personal Project' ? 'Solo Project' : (project.scopeType || 'Team Project'))
    );
    setEditTagsInput(Array.isArray(project.tags) ? project.tags.join(', ') : '');
    setEditDescription(project.description || '');
    setEditLiveUrl(project.liveUrl || '');
    setEditGithubUrl(project.githubUrl || '');
    setEditThumbnail(project.thumbnail || '');
    setEditThumbnailFile(null);
    setEditMediaList(Array.isArray(project.media) ? [...project.media] : []);
    setEditNewMediaFiles([]);
    setEditOpen(true);
  };

  // Handle Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      enqueueSnackbar('Project title is required', { variant: 'warning' });
      return;
    }

    try {
      setSavingEdit(true);
      const parsedTags = editTagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const hasFiles = Boolean(editThumbnailFile || (editNewMediaFiles && editNewMediaFiles.length > 0));

      if (hasFiles) {
        const formData = new FormData();
        formData.append('title', editTitle.trim());
        formData.append('category', editCategory);
        formData.append('industry', editCategory);
        formData.append('projectType', editProjectType);
        formData.append('scopeType', editScopeType);
        formData.append('tags', JSON.stringify(parsedTags));
        formData.append('description', editDescription.trim());
        formData.append('liveUrl', editLiveUrl.trim());
        formData.append('githubUrl', editGithubUrl.trim());
        formData.append('media', JSON.stringify(editMediaList));
        if (editThumbnailFile) {
          formData.append('thumbnail', editThumbnailFile);
        } else {
          formData.append('thumbnail', editThumbnail);
        }
        editNewMediaFiles.forEach((f) => {
          formData.append('files', f);
        });

        const res = await API.put(`/projects/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data?.success) {
          setProject(res.data.data);
          enqueueSnackbar('Project updated successfully!', { variant: 'success' });
          setEditOpen(false);
        }
      } else {
        const payload = {
          title: editTitle.trim(),
          category: editCategory,
          industry: editCategory,
          projectType: editProjectType,
          scopeType: editScopeType,
          tags: parsedTags,
          description: editDescription.trim(),
          liveUrl: editLiveUrl.trim(),
          githubUrl: editGithubUrl.trim(),
          thumbnail: editThumbnail,
          media: editMediaList
        };

        const res = await API.put(`/projects/${id}`, payload);
        if (res.data?.success) {
          setProject(res.data.data);
          enqueueSnackbar('Project updated successfully!', { variant: 'success' });
          setEditOpen(false);
        }
      }
    } catch (err) {
      console.error('Update project error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to update project', { variant: 'error' });
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle Delete Project
  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      await API.delete(`/projects/${id}`);
      enqueueSnackbar('Project deleted successfully', { variant: 'success' });
      navigate('/projects');
    } catch (err) {
      console.error('Delete project error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete project', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={44} sx={{ color: '#0088FF' }} />
      </Box>
    );
  }

  if (error || !project) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', py: 8, px: 3, textAlign: 'center' }}>
        <RocketIcon sx={{ fontSize: 56, color: '#94A3B8', mb: 2 }} />
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 1 }}>
          {error || 'Project Not Found'}
        </Typography>
        <Typography sx={{ color: '#64748B', mb: 3 }}>
          The project you are looking for may have been removed or does not exist.
        </Typography>
        <Button
          component={RouterLink}
          to="/projects"
          variant="contained"
          startIcon={<ArrowBackIcon />}
          sx={{ bgcolor: '#0088FF', textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}
        >
          Back to Projects
        </Button>
      </Box>
    );
  }

  const activeMedia = mediaList[activeMediaIndex] || mediaList[0];
  const isPersonal = project.projectType === 'Personal Project';
  const createdDate = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    : 'Recent';

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', pb: 10, bgcolor: '#FAFBFD' }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, sm: 3.5, md: 5 }, pt: 3 }}>
        {/* ── Top Header Bar with Back Button, Category, and Action Buttons ── */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
            mb: 3
          }}
        >
          <Stack direction="row" spacing={1.5}  sx={{ flexWrap: 'wrap', gap: 1 ,alignItems:"center"}}>
            <Button
              component={RouterLink}
              to="/projects"
              variant="outlined"
              size="small"
              startIcon={<ArrowBackIcon />}
              sx={{
                borderRadius: '10px',
                borderColor: '#E2E8F0',
                color: '#475569',
                bgcolor: '#FFFFFF',
                fontWeight: 700,
                textTransform: 'none',
                py: 0.7,
                px: 1.8,
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                '&:hover': { bgcolor: '#F8FAFC', borderColor: '#CBD5E1' }
              }}
            >
              Back to Projects
            </Button>

            <Chip
              label={project.category || 'General'}
              size="small"
              sx={{
                bgcolor: '#EFF6FF',
                color: '#1D4ED8',
                fontWeight: 700,
                fontSize: '12px',
                borderRadius: '8px',
                border: '1px solid #BFDBFE'
              }}
            />

            <Chip
              label={project.projectType || 'College Project'}
              size="small"
              sx={{
                bgcolor: isPersonal ? '#ECFDF5' : '#EEF2FF',
                color: isPersonal ? '#047857' : '#4338CA',
                fontWeight: 700,
                fontSize: '12px',
                borderRadius: '8px',
                border: isPersonal ? '1px solid #A7F3D0' : '1px solid #C7D2FE'
              }}
            />
          </Stack>

          {/* Right Action Buttons */}
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Tooltip title="Share Project Link">
              <Button
                variant="outlined"
                size="small"
                startIcon={<ShareIcon sx={{ fontSize: 16 }} />}
                onClick={handleShare}
                sx={{
                  borderRadius: '10px',
                  borderColor: '#E2E8F0',
                  color: '#475569',
                  bgcolor: '#FFFFFF',
                  fontWeight: 600,
                  textTransform: 'none',
                  py: 0.7,
                  '&:hover': { bgcolor: '#F8FAFC' }
                }}
              >
                Share
              </Button>
            </Tooltip>

            {canManage && (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddPhotoIcon sx={{ fontSize: 16 }} />}
                  onClick={() => mediaFileInputRef.current?.click()}
                  disabled={uploadingMedia}
                  sx={{
                    borderRadius: '10px',
                    borderColor: '#CBD5E1',
                    color: '#0F172A',
                    bgcolor: '#FFFFFF',
                    fontWeight: 600,
                    textTransform: 'none',
                    py: 0.7,
                    '&:hover': { bgcolor: '#F8FAFC' }
                  }}
                >
                  {uploadingMedia ? 'Uploading...' : '+ Add Media'}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<CloudUploadIcon sx={{ fontSize: 16 }} />}
                  onClick={() => thumbnailFileInputRef.current?.click()}
                  disabled={uploadingThumbnail}
                  sx={{
                    borderRadius: '10px',
                    borderColor: '#CBD5E1',
                    color: '#0F172A',
                    bgcolor: '#FFFFFF',
                    fontWeight: 600,
                    textTransform: 'none',
                    py: 0.7,
                    '&:hover': { bgcolor: '#F8FAFC' }
                  }}
                >
                  {uploadingThumbnail ? 'Updating...' : 'Change Cover'}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                  onClick={handleOpenEdit}
                  sx={{
                    borderRadius: '10px',
                    borderColor: '#BFDBFE',
                    color: '#0088FF',
                    bgcolor: '#EFF8FF',
                    fontWeight: 700,
                    textTransform: 'none',
                    py: 0.7,
                    '&:hover': { bgcolor: '#DBEAFE' }
                  }}
                >
                  Edit Project
                </Button>
                <IconButton
                  size="small"
                  onClick={() => setDeleteOpen(true)}
                  sx={{
                    color: '#EF4444',
                    bgcolor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '10px',
                    p: 0.9,
                    '&:hover': { bgcolor: '#FEE2E2' }
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </>
            )}
          </Stack>
        </Box>

        {/* ── Main 2-Column Content Layout (like EventDetail) ── */}
        <Grid container spacing={3.5} alignItems="stretch">
          {/* ══════════════ LEFT COLUMN (Main Showcase & Discussion) ══════════════ */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Stack spacing={3}>
              {/* ── 1. Hero Media Showcase ── */}
              <Card
                sx={{
                  bgcolor: '#FFFFFF',
                  borderRadius: '20px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 20px -2px rgba(16, 24, 40, 0.05)',
                  overflow: 'hidden'
                }}
              >
                {/* Main Media Preview Box */}
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: { xs: 260, sm: 380, md: 460 },
                    bgcolor: '#0F172A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}
                >
                  {activeMedia.type === 'video' ? (
                    <video
                      src={activeMedia.url}
                      controls
                      autoPlay
                      muted
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : activeMedia.type === 'pdf' ? (
                    <Box sx={{ textAlign: 'center', p: 3, color: '#FFFFFF' }}>
                      <AttachFileIcon sx={{ fontSize: 64, color: '#0088FF', mb: 1.5 }} />
                      <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', mb: 1.5 }}>
                        {activeMedia.name || 'Document Attached'}
                      </Typography>
                      <Button
                        component="a"
                        href={activeMedia.url}
                        target="_blank"
                        rel="noreferrer"
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        sx={{ bgcolor: '#0088FF', textTransform: 'none', borderRadius: '8px' }}
                      >
                        Open / Download Document
                      </Button>
                    </Box>
                  ) : (
                    <Box
                      component="img"
                      src={activeMedia.url}
                      alt={project.title}
                      onClick={() => setLightboxOpen(true)}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        cursor: 'zoom-in',
                        transition: 'transform 0.25s ease',
                        '&:hover': { transform: 'scale(1.015)' }
                      }}
                    />
                  )}

                  {/* Floating Action Overlay on Top of Hero */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 14,
                      right: 14,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      zIndex: 3
                    }}
                  >
                    {/* Cover Thumbnail indicator */}
                    {activeMedia.url === project.thumbnail && !activeMedia.isPlaceholder && (
                      <Chip
                        icon={<StarIcon sx={{ fontSize: '14px !important', color: '#FBBF24 !important' }} />}
                        label="Cover Thumbnail"
                        size="small"
                        sx={{
                          bgcolor: 'rgba(15, 23, 42, 0.85)',
                          backdropFilter: 'blur(6px)',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: 700,
                          border: '1px solid rgba(251, 191, 36, 0.5)',
                          height: 28
                        }}
                      />
                    )}

                    {/* Make Cover Button */}
                    {canManage && activeMedia.type === 'image' && activeMedia.url !== project.thumbnail && !activeMedia.isPlaceholder && (
                      <Button
                        size="small"
                        startIcon={<StarIcon sx={{ fontSize: 14 }} />}
                        disabled={settingThumbnail}
                        onClick={() => handleSetAsThumbnail(activeMedia.url)}
                        sx={{
                          bgcolor: 'rgba(15, 23, 42, 0.8)',
                          backdropFilter: 'blur(6px)',
                          color: '#FFFFFF',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          textTransform: 'none',
                          border: '1px solid rgba(255,255,255,0.25)',
                          borderRadius: '8px',
                          px: 1.2,
                          py: 0.4,
                          '&:hover': { bgcolor: '#0088FF', borderColor: '#0088FF' }
                        }}
                      >
                        {settingThumbnail ? 'Setting...' : 'Set as Cover'}
                      </Button>
                    )}

                    {/* Delete Media Button */}
                    {canManage && !activeMedia.isPlaceholder && (
                      <Tooltip title="Delete this media file">
                        <IconButton
                          size="small"
                          onClick={() => setMediaToDelete(activeMedia)}
                          sx={{
                            bgcolor: 'rgba(239, 68, 68, 0.85)',
                            backdropFilter: 'blur(6px)',
                            color: '#FFFFFF',
                            border: '1px solid rgba(255,255,255,0.2)',
                            p: 0.6,
                            '&:hover': { bgcolor: '#DC2626' }
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                    )}

                    {activeMedia.type === 'image' && (
                      <IconButton
                        size="small"
                        onClick={() => setLightboxOpen(true)}
                        sx={{
                          bgcolor: 'rgba(15, 23, 42, 0.75)',
                          backdropFilter: 'blur(6px)',
                          color: '#FFFFFF',
                          border: '1px solid rgba(255,255,255,0.2)',
                          p: 0.6,
                          '&:hover': { bgcolor: '#0088FF' }
                        }}
                      >
                        <ZoomInIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    )}
                  </Box>

                  {/* Media Counter Badge on Bottom Right */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 14,
                      right: 14,
                      bgcolor: 'rgba(15, 23, 42, 0.75)',
                      backdropFilter: 'blur(6px)',
                      color: '#FFFFFF',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: '20px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    {activeMediaIndex + 1} / {mediaList.length} Media
                  </Box>
                </Box>

                {/* Thumbnails Carousel Bar below Hero */}
                {(mediaList.length > 1 || canManage) && (
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: '#F8FAFC',
                      borderTop: '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      overflowX: 'auto',
                      WebkitOverflowScrolling: 'touch'
                    }}
                  >
                    {canManage && (
                      <Box
                        onClick={() => mediaFileInputRef.current?.click()}
                        sx={{
                          width: 72,
                          height: 52,
                          borderRadius: '8px',
                          border: '1.5px dashed #0088FF',
                          bgcolor: '#EFF8FF',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          flexShrink: 0,
                          color: '#0088FF',
                          transition: 'all 0.15s ease',
                          '&:hover': { bgcolor: '#DBEAFE', borderColor: '#0070D2' }
                        }}
                        title="Upload new media"
                      >
                        {uploadingMedia ? (
                          <CircularProgress size={16} sx={{ color: '#0088FF' }} />
                        ) : (
                          <>
                            <AddIcon sx={{ fontSize: 18 }} />
                            <Typography sx={{ fontSize: '9.5px', fontWeight: 700 }}>+ Media</Typography>
                          </>
                        )}
                      </Box>
                    )}

                    {mediaList.map((m, idx) => {
                      const isSelected = idx === activeMediaIndex;
                      const isCover = m.url === project.thumbnail;
                      return (
                        <Box
                          key={idx}
                          onClick={() => setActiveMediaIndex(idx)}
                          sx={{
                            width: 72,
                            height: 52,
                            borderRadius: '8px',
                            overflow: 'hidden',
                            position: 'relative',
                            cursor: 'pointer',
                            flexShrink: 0,
                            border: isSelected ? '2.5px solid #0088FF' : '1px solid #CBD5E1',
                            opacity: isSelected ? 1 : 0.7,
                            transition: 'all 0.15s ease',
                            '&:hover': { opacity: 1, borderColor: '#0088FF' }
                          }}
                        >
                          {m.type === 'video' ? (
                            <Box
                              sx={{
                                width: '100%',
                                height: '100%',
                                bgcolor: '#0F172A',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#FFFFFF'
                              }}
                            >
                              <PlayIcon sx={{ fontSize: 22 }} />
                            </Box>
                          ) : (
                            <img
                              src={m.url}
                              alt={m.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          )}

                          {isCover && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 2,
                                left: 2,
                                bgcolor: 'rgba(15, 23, 42, 0.85)',
                                color: '#FBBF24',
                                borderRadius: '4px',
                                px: 0.3,
                                py: 0.1,
                                display: 'flex',
                                alignItems: 'center',
                                lineHeight: 1
                              }}
                              title="Cover Thumbnail"
                            >
                              <StarIcon sx={{ fontSize: 11 }} />
                            </Box>
                          )}

                          {canManage && !m.isPlaceholder && (
                            <Box
                              onClick={(e) => {
                                e.stopPropagation();
                                setMediaToDelete(m);
                              }}
                              sx={{
                                position: 'absolute',
                                top: 2,
                                right: 2,
                                bgcolor: 'rgba(239, 68, 68, 0.9)',
                                color: '#FFFFFF',
                                borderRadius: '4px',
                                width: 16,
                                height: 16,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0.85,
                                '&:hover': { opacity: 1, bgcolor: '#DC2626' }
                              }}
                              title="Delete media"
                            >
                              <CloseIcon sx={{ fontSize: 11 }} />
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Card>

              {/* ── 2. Project Details Overview Card ── */}
              <Card
                sx={{
                  bgcolor: '#FFFFFF',
                  borderRadius: '20px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 20px -2px rgba(16, 24, 40, 0.05)',
                  p: { xs: 2.5, sm: 3.5 }
                }}
              >
                {/* Title */}
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: '#0F172A',
                    fontSize: { xs: '1.4rem', sm: '1.75rem' },
                    lineHeight: 1.3,
                    letterSpacing: '-0.02em',
                    mb: 1.5
                  }}
                >
                  {project.title}
                </Typography>

                {/* Subtitle / Scope / Date info */}
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, color: '#64748B', fontSize: '13px' }}>
                    <CalendarIcon sx={{ fontSize: 16, color: '#0088FF' }} />
                    <span>Published on {createdDate}</span>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, color: '#64748B', fontSize: '13px' }}>
                    <VisibilityIcon sx={{ fontSize: 16, color: '#0088FF' }} />
                    <span>{project.viewsCount || 0} Views</span>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, color: '#64748B', fontSize: '13px' }}>
                    <RocketIcon sx={{ fontSize: 16, color: '#0088FF' }} />
                    <span>
                      {project.scopeType && project.scopeType !== 'Team Project'
                        ? project.scopeType
                        : (project.projectType === 'Personal Project' ? 'Solo Project' : (project.scopeType || 'Team Project'))}
                    </span>
                  </Box>
                </Stack>

                <Divider sx={{ my: 2.5, borderColor: '#F1F5F9' }} />

                {/* Description */}
                <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#1E293B', mb: 1 }}>
                  About the Project
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.92rem',
                    color: '#475569',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-line',
                    mb: 3
                  }}
                >
                  {project.description || 'No detailed description provided for this project.'}
                </Typography>

                {/* Tech Stack / Hardware & Technologies */}
                {Array.isArray(project.tags) && project.tags.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#1E293B', mb: 1.25 }}>
                      {project.category === 'IoT & Hardware' ? 'Hardware & Technologies Used' : 'Technologies & Stack'}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {project.tags.map((tag, idx) => (
                        <Chip
                          key={idx}
                          label={tag}
                          icon={<TagIcon sx={{ fontSize: 15 }} />}
                          sx={{
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '12.5px',
                            bgcolor: '#F0F9FF',
                            color: '#0284C7',
                            border: '1px solid #BAE6FD',
                            py: 0.5
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* External Action Links (Live Demo, GitHub Repo) */}
                {(project.liveUrl || project.githubUrl) && (
                  <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid #F1F5F9' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#1E293B', mb: 1.5 }}>
                      Project Links & Resources
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      {project.liveUrl && (
                        <Button
                          component="a"
                          href={project.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          variant="contained"
                          startIcon={<OpenInNewIcon />}
                          sx={{
                            bgcolor: '#0088FF',
                            color: '#FFFFFF',
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: '10px',
                            px: 3,
                            py: 1.1,
                            boxShadow: '0 4px 12px rgba(0, 136, 255, 0.25)',
                            '&:hover': { bgcolor: '#0070D2' }
                          }}
                        >
                          View Live Demo
                        </Button>
                      )}

                      {project.githubUrl && (
                        <Button
                          component="a"
                          href={project.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          variant="outlined"
                          startIcon={<GitHubIcon />}
                          sx={{
                            borderColor: '#CBD5E1',
                            color: '#0F172A',
                            bgcolor: '#FFFFFF',
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: '10px',
                            px: 3,
                            py: 1.1,
                            '&:hover': { borderColor: '#0088FF', color: '#0088FF', bgcolor: '#F8FAFC' }
                          }}
                        >
                          Source Code Repository
                        </Button>
                      )}
                    </Stack>
                  </Box>
                )}
              </Card>

              {/* ── 3. Community Feedback & Comments Section ── */}
              <Card
                sx={{
                  bgcolor: '#FFFFFF',
                  borderRadius: '20px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 20px -2px rgba(16, 24, 40, 0.05)',
                  p: { xs: 2.5, sm: 3.5 }
                }}
              >
                <Stack direction="row" spacing={1.5} sx={{ mb: 2.5, alignItems: "center" }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '10px',
                      bgcolor: '#EFF8FF',
                      color: '#0088FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ChatIcon sx={{ fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: '#0F172A' }}>
                      Community Discussion ({project.comments?.length || 0})
                    </Typography>

                  </Box>
                </Stack>

                {/* Add Comment Input Form */}
                <Box component="form" onSubmit={handleAddComment} sx={{ mb: 3.5 }}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Avatar
                      src={user?.profilePhoto?.url}
                      sx={{ width: 38, height: 38, bgcolor: '#0088FF', fontWeight: 700 }}
                    >
                      {user?.name?.[0] || 'U'}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        placeholder={
                          user
                            ? 'Leave a comment or question about this project...'
                            : 'Log in to join the discussion...'
                        }
                        disabled={!user}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            bgcolor: '#F8FAFC',
                            '& fieldset': { borderColor: '#E2E8F0' },
                            '&:hover fieldset': { borderColor: '#CBD5E1' },
                            '&.Mui-focused fieldset': { borderColor: '#0088FF' }
                          }
                        }}
                      />
                      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={!user || submittingComment || !commentText.trim()}
                          endIcon={submittingComment ? <CircularProgress size={14} color="inherit" /> : <SendIcon sx={{ fontSize: 16 }} />}
                          sx={{
                            borderRadius: '8px',
                            bgcolor: '#0088FF',
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '13px',
                            px: 2.5,
                            '&:hover': { bgcolor: '#0070D2' }
                          }}
                        >
                          Post Comment
                        </Button>
                      </Box>
                    </Box>
                  </Stack>
                </Box>

                {/* Comments List */}
                {Array.isArray(project.comments) && project.comments.length > 0 ? (
                  <Stack spacing={2}>
                    {project.comments.map((comment) => {
                      const isCommentAuthor = Boolean(user && String(comment.user) === String(user._id));
                      const canDeleteComment = isAdmin || isCommentAuthor;
                      const hasLikedComment = Boolean(
                        user && comment.likes?.some((id) => String(id) === String(user._id))
                      );

                      return (
                        <Box
                          key={comment._id}
                          sx={{
                            p: 2,
                            borderRadius: '12px',
                            bgcolor: '#F8FAFC',
                            border: '1px solid #F1F5F9'
                          }}
                        >
                          <Stack direction="row" spacing={1.5} alignItems="flex-start" justifyContent="space-between">
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Avatar
                                src={comment.userAvatar}
                                sx={{ width: 32, height: 32, bgcolor: '#CBD5E1', fontSize: '13px' }}
                              >
                                {comment.userName?.[0] || 'A'}
                              </Avatar>
                              <Box>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography sx={{ fontWeight: 700, fontSize: '13.5px', color: '#0F172A' }}>
                                    {comment.userName}
                                  </Typography>
                                  {comment.userRole && (
                                    <Chip
                                      label={comment.userRole}
                                      size="small"
                                      sx={{ height: 18, fontSize: '10px', fontWeight: 700, bgcolor: '#EFF6FF', color: '#1D4ED8' }}
                                    />
                                  )}
                                </Stack>
                                <Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>
                                  {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Recent'}
                                </Typography>
                              </Box>
                            </Stack>

                            {canDeleteComment && (
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteComment(comment._id)}
                                sx={{ color: '#94A3B8', '&:hover': { color: '#EF4444' } }}
                              >
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            )}
                          </Stack>

                          <Typography sx={{ fontSize: '13.5px', color: '#334155', mt: 1.5, pl: 0.5, lineHeight: 1.5 }}>
                            {comment.text}
                          </Typography>

                          {/* Comment Like Button */}
                          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Button
                              size="small"
                              startIcon={hasLikedComment ? <ThumbUpIcon sx={{ fontSize: 14 }} /> : <ThumbUpOutlinedIcon sx={{ fontSize: 14 }} />}
                              onClick={() => handleToggleCommentLike(comment._id)}
                              sx={{
                                color: hasLikedComment ? '#0088FF' : '#64748B',
                                fontSize: '11.5px',
                                textTransform: 'none',
                                fontWeight: 600,
                                p: 0.5
                              }}
                            >
                              {comment.likes?.length || 0}
                            </Button>
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                ) : (
                  <Box sx={{ py: 3, textAlign: 'center', color: '#94A3B8' }}>
                    <Typography sx={{ fontSize: '13px' }}>
                      No comments yet. Be the first to share your thoughts!
                    </Typography>
                  </Box>
                )}
              </Card>
            </Stack>
          </Grid>

          {/* ══════════════ RIGHT COLUMN (Sticky Sidebar Stats & Author Info) ══════════════ */}
          <Grid size={{ xs: 12, lg: 4 }} sx={{ alignSelf: 'flex-start' }}>
            <Box
              sx={{
                position: { lg: 'sticky' },
                top: { lg: 24 },
                display: 'flex',
                flexDirection: 'column',
                gap: 3
              }}
            >
              {/* Card 1: Quick Stats & Like Action */}
              <Card
                sx={{
                  bgcolor: '#FFFFFF',
                  borderRadius: '20px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 20px -2px rgba(16, 24, 40, 0.05)',
                  p: 3
                }}
              >
                <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A', mb: 2 }}>
                  Project Overview
                </Typography>

                <Button
                  fullWidth
                  variant={isLiked ? 'contained' : 'outlined'}
                  startIcon={isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                  disabled={liking}
                  onClick={handleToggleLike}
                  sx={{
                    borderRadius: '12px',
                    py: 1.2,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '14px',
                    bgcolor: isLiked ? '#EF4444' : '#FFFFFF',
                    color: isLiked ? '#FFFFFF' : '#EF4444',
                    borderColor: '#EF4444',
                    boxShadow: isLiked ? '0 4px 14px rgba(239, 68, 68, 0.3)' : 'none',
                    '&:hover': {
                      bgcolor: isLiked ? '#DC2626' : '#FEF2F2',
                      borderColor: '#DC2626'
                    },
                    mb: 2.5
                  }}
                >
                  {isLiked ? `Liked (${likesCount})` : `Like Project (${likesCount})`}
                </Button>

                <Stack spacing={1.75}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#64748B' }}>Category</span>
                    <strong style={{ color: '#0F172A' }}>{project.category || 'General'}</strong>
                  </Box>
                  <Divider sx={{ borderColor: '#F1F5F9' }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#64748B' }}>Project Type</span>
                    <strong style={{ color: '#0F172A' }}>{project.projectType || 'College Project'}</strong>
                  </Box>
                  <Divider sx={{ borderColor: '#F1F5F9' }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#64748B' }}>Scope</span>
                    <strong style={{ color: '#0F172A' }}>
                      {project.scopeType && project.scopeType !== 'Team Project'
                        ? project.scopeType
                        : (project.projectType === 'Personal Project' ? 'Solo Project' : (project.scopeType || 'Team Project'))}
                    </strong>
                  </Box>
                  <Divider sx={{ borderColor: '#F1F5F9' }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#64748B' }}>Total Views</span>
                    <strong style={{ color: '#0F172A' }}>{project.viewsCount || 0}</strong>
                  </Box>
                  <Divider sx={{ borderColor: '#F1F5F9' }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#64748B' }}>Media Attachments</span>
                    <strong style={{ color: '#0F172A' }}>{mediaList.length} files</strong>
                  </Box>
                </Stack>
              </Card>

              {/* Card 2: Author / Contributor Info */}
              <Card
                sx={{
                  bgcolor: '#FFFFFF',
                  borderRadius: '20px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 20px -2px rgba(16, 24, 40, 0.05)',
                  p: 3
                }}
              >
                <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A', mb: 2 }}>
                  Project Author
                </Typography>

                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={project.author?.profilePhoto?.url || project.authorAvatar}
                    sx={{ width: 48, height: 48, bgcolor: '#0088FF', fontWeight: 700, fontSize: '18px' }}
                  >
                    {project.author?.name?.[0] || project.authorName?.[0] || 'U'}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '14.5px', color: '#0F172A' }}>
                      {project.author?.name || project.authorName || 'Hostel Member'}
                    </Typography>
                    <Chip
                      label={project.author?.role || project.authorRole || 'STUDENT'}
                      size="small"
                      sx={{
                        mt: 0.5,
                        height: 20,
                        fontSize: '10.5px',
                        fontWeight: 700,
                        bgcolor: '#EFF6FF',
                        color: '#1D4ED8'
                      }}
                    />
                  </Box>
                </Stack>

                {(() => {
                  const authorEmail = project.author?.email || project.authorEmail || '';
                  const authorPhone = project.author?.phone || project.authorPhone || '';
                  if (!authorEmail && !authorPhone) return null;

                  return (
                    <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {authorEmail && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MailIcon sx={{ fontSize: 16, color: '#0088FF', flexShrink: 0 }} />
                          <Typography
                            component="a"
                            href={`mailto:${authorEmail}`}
                            sx={{
                              fontSize: '12px',
                              color: '#334155',
                              textDecoration: 'none',
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              '&:hover': { color: '#0088FF', textDecoration: 'underline' }
                            }}
                            title={authorEmail}
                          >
                            {authorEmail}
                          </Typography>
                        </Box>
                      )}

                      {authorPhone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon sx={{ fontSize: 16, color: '#10B981', flexShrink: 0 }} />
                          <Typography
                            component="a"
                            href={`tel:${authorPhone}`}
                            sx={{
                              fontSize: '12px',
                              color: '#334155',
                              textDecoration: 'none',
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              '&:hover': { color: '#10B981', textDecoration: 'underline' }
                            }}
                            title={authorPhone}
                          >
                            {authorPhone}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  );
                })()}
              </Card>

              {/* Card 3: Quick Action Buttons */}
              {canManage && (
                <Card
                  sx={{
                    bgcolor: '#F8FAFC',
                    borderRadius: '20px',
                    border: '1px dashed #CBD5E1',
                    p: 2.5
                  }}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#1E293B', mb: 1.5 }}>
                    Manage Project
                  </Typography>
                  <Stack spacing={1.2}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={handleOpenEdit}
                      sx={{
                        borderRadius: '8px',
                        bgcolor: '#FFFFFF',
                        borderColor: '#CBD5E1',
                        color: '#1E293B',
                        textTransform: 'none',
                        fontWeight: 700,
                        py: 0.9,
                        '&:hover': { borderColor: '#0088FF', color: '#0088FF' }
                      }}
                    >
                      Edit Project Details
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={() => setDeleteOpen(true)}
                      sx={{
                        borderRadius: '8px',
                        bgcolor: '#FFFFFF',
                        borderColor: '#FCA5A5',
                        color: '#EF4444',
                        textTransform: 'none',
                        fontWeight: 700,
                        py: 0.9,
                        '&:hover': { bgcolor: '#FEF2F2', borderColor: '#EF4444' }
                      }}
                    >
                      Delete Project
                    </Button>
                  </Stack>
                </Card>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* ── Fullscreen Lightbox for Media Zoom ── */}
      <Dialog
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(15, 23, 42, 0.95)',
            borderRadius: '16px',
            boxShadow: 'none',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ position: 'relative', width: '100%', height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconButton
            onClick={() => setLightboxOpen(false)}
            sx={{ position: 'absolute', top: 16, right: 16, color: '#FFFFFF', bgcolor: 'rgba(0,0,0,0.5)', zIndex: 10 }}
          >
            <CloseIcon />
          </IconButton>

          {activeMediaIndex > 0 && (
            <IconButton
              onClick={() => setActiveMediaIndex((prev) => prev - 1)}
              sx={{ position: 'absolute', left: 16, color: '#FFFFFF', bgcolor: 'rgba(0,0,0,0.5)', zIndex: 10 }}
            >
              <ChevronLeftIcon sx={{ fontSize: 32 }} />
            </IconButton>
          )}

          {activeMediaIndex < mediaList.length - 1 && (
            <IconButton
              onClick={() => setActiveMediaIndex((prev) => prev + 1)}
              sx={{ position: 'absolute', right: 16, color: '#FFFFFF', bgcolor: 'rgba(0,0,0,0.5)', zIndex: 10 }}
            >
              <ChevronRightIcon sx={{ fontSize: 32 }} />
            </IconButton>
          )}

          <img
            src={activeMedia.url}
            alt={activeMedia.name}
            style={{ maxWidth: '92%', maxHeight: '92%', objectFit: 'contain', borderRadius: '8px' }}
          />
        </Box>
      </Dialog>

      {/* ── Edit Project Dialog ── */}
      <Dialog
        open={editOpen}
        onClose={() => !savingEdit && setEditOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ px: 2.5, pt: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 800, fontSize: '18px', color: '#0F172A' }}>
            Edit Project
          </Typography>
          <IconButton size="small" onClick={() => setEditOpen(false)}>
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSaveEdit}>
          <DialogContent sx={{ px: 2.5, py: 1.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', mb: 0.75 }}>
                Project Title *
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', mb: 0.75 }}>
                Category *
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  sx={{ borderRadius: '10px' }}
                >
                  {Object.keys(CATEGORY_TAG_SUGGESTIONS).map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', mb: 0.75 }}>
                Project Type *
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Box
                  onClick={() => {
                    setEditProjectType('College Project');
                    setEditScopeType('Team Project');
                  }}
                  sx={{
                    flex: 1,
                    textAlign: 'center',
                    py: 1,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '13.5px',
                    fontWeight: editProjectType === 'College Project' ? 700 : 600,
                    bgcolor: editProjectType === 'College Project' ? '#EFF6FF' : '#FFFFFF',
                    color: editProjectType === 'College Project' ? '#2563EB' : '#64748B',
                    border: editProjectType === 'College Project' ? '1.5px solid #2563EB' : '1px solid #E2E8F0'
                  }}
                >
                  College Project
                </Box>
                <Box
                  onClick={() => {
                    setEditProjectType('Personal Project');
                    setEditScopeType('Solo Project');
                  }}
                  sx={{
                    flex: 1,
                    textAlign: 'center',
                    py: 1,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '13.5px',
                    fontWeight: editProjectType === 'Personal Project' ? 700 : 600,
                    bgcolor: editProjectType === 'Personal Project' ? '#EFF6FF' : '#FFFFFF',
                    color: editProjectType === 'Personal Project' ? '#2563EB' : '#64748B',
                    border: editProjectType === 'Personal Project' ? '1.5px solid #2563EB' : '1px solid #E2E8F0'
                  }}
                >
                  Personal Project
                </Box>
              </Box>
            </Box>

            {/* Project Scope (Solo vs Team) */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', mb: 0.75 }}>
                Project Scope *
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Box
                  onClick={() => setEditScopeType('Solo Project')}
                  sx={{
                    flex: 1,
                    textAlign: 'center',
                    py: 1,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '13.5px',
                    fontWeight: editScopeType === 'Solo Project' ? 700 : 600,
                    bgcolor: editScopeType === 'Solo Project' ? '#EFF6FF' : '#FFFFFF',
                    color: editScopeType === 'Solo Project' ? '#2563EB' : '#64748B',
                    border: editScopeType === 'Solo Project' ? '1.5px solid #2563EB' : '1px solid #E2E8F0'
                  }}
                >
                  Solo Project
                </Box>
                <Box
                  onClick={() => setEditScopeType('Team Project')}
                  sx={{
                    flex: 1,
                    textAlign: 'center',
                    py: 1,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '13.5px',
                    fontWeight: editScopeType === 'Team Project' ? 700 : 600,
                    bgcolor: editScopeType === 'Team Project' ? '#EFF6FF' : '#FFFFFF',
                    color: editScopeType === 'Team Project' ? '#2563EB' : '#64748B',
                    border: editScopeType === 'Team Project' ? '1.5px solid #2563EB' : '1px solid #E2E8F0'
                  }}
                >
                  Team Project
                </Box>
              </Box>
            </Box>

            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', mb: 0.75 }}>
                {editCategory === 'IoT & Hardware' ? 'Hardware & Technologies' : 'Tech Stack / Tags'} (Optional)
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={editTagsInput}
                onChange={(e) => setEditTagsInput(e.target.value)}
                placeholder="e.g. Arduino, ESP32, Python"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
            </Box>

            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', mb: 0.75 }}>
                Short Description *
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '12px', color: '#64748B', mb: 0.5 }}>Live Demo URL</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={editLiveUrl}
                  onChange={(e) => setEditLiveUrl(e.target.value)}
                  placeholder="https://..."
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '12px', color: '#64748B', mb: 0.5 }}>GitHub Repo URL</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={editGithubUrl}
                  onChange={(e) => setEditGithubUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />
              </Box>
            </Stack>

            {/* Cover Thumbnail Section in Edit Dialog */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', mb: 0.75 }}>
                Cover Thumbnail (Optional)
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1.5,
                  borderRadius: '12px',
                  bgcolor: '#F8FAFC',
                  border: '1px solid #E2E8F0'
                }}
              >
                <Box
                  sx={{
                    width: 72,
                    height: 52,
                    borderRadius: '8px',
                    bgcolor: '#0F172A',
                    overflow: 'hidden',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {editThumbnailFile ? (
                    <img
                      src={URL.createObjectURL(editThumbnailFile)}
                      alt="Thumbnail preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : editThumbnail ? (
                    <img
                      src={editThumbnail}
                      alt="Thumbnail"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <ImageIcon sx={{ color: '#94A3B8' }} />
                  )}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: '#1E293B', mb: 0.5 }}>
                    {editThumbnailFile ? editThumbnailFile.name : editThumbnail ? 'Current Cover Image' : 'No Cover Image'}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => editThumbnailInputRef.current?.click()}
                      sx={{
                        textTransform: 'none',
                        fontSize: '11.5px',
                        py: 0.3,
                        px: 1.2,
                        borderRadius: '6px',
                        borderColor: '#CBD5E1',
                        color: '#0F172A'
                      }}
                    >
                      {editThumbnail || editThumbnailFile ? 'Change Cover' : 'Upload Cover'}
                    </Button>
                    {(editThumbnail || editThumbnailFile) && (
                      <Button
                        size="small"
                        color="error"
                        onClick={() => {
                          setEditThumbnail('');
                          setEditThumbnailFile(null);
                        }}
                        sx={{
                          textTransform: 'none',
                          fontSize: '11.5px',
                          py: 0.3,
                          px: 1,
                          borderRadius: '6px'
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </Stack>
                  <input
                    type="file"
                    ref={editThumbnailInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setEditThumbnailFile(e.target.files[0]);
                    }}
                    style={{ display: 'none' }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Manage Attached Media in Edit Dialog */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                  Attached Media Files ({editMediaList.length + editNewMediaFiles.length})
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                  onClick={() => editMediaInputRef.current?.click()}
                  sx={{ textTransform: 'none', fontSize: '11.5px', fontWeight: 700, color: '#0088FF', p: 0.2 }}
                >
                  + Add Media
                </Button>
              </Box>
              <input
                type="file"
                ref={editMediaInputRef}
                multiple
                accept="image/*,video/*,application/pdf"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    setEditNewMediaFiles((prev) => [...prev, ...files]);
                  }
                }}
                style={{ display: 'none' }}
              />

              {(editMediaList.length > 0 || editNewMediaFiles.length > 0) ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 1.5, bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', maxHeight: 150, overflowY: 'auto' }}>
                  {editMediaList.map((m, idx) => (
                    <Box
                      key={`existing-${idx}`}
                      sx={{
                        width: 60,
                        height: 48,
                        borderRadius: '6px',
                        overflow: 'hidden',
                        position: 'relative',
                        border: '1px solid #CBD5E1',
                        bgcolor: '#0F172A'
                      }}
                      title={m.name || `Media ${idx + 1}`}
                    >
                      {m.type === 'video' ? (
                        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                          <PlayIcon sx={{ fontSize: 18 }} />
                        </Box>
                      ) : (
                        <img src={m.url} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                      <Box
                        onClick={() => setEditMediaList((prev) => prev.filter((_, i) => i !== idx))}
                        sx={{
                          position: 'absolute',
                          top: 1,
                          right: 1,
                          bgcolor: 'rgba(239, 68, 68, 0.9)',
                          color: '#FFF',
                          borderRadius: '3px',
                          width: 14,
                          height: 14,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: '#DC2626' }
                        }}
                        title="Remove"
                      >
                        <CloseIcon sx={{ fontSize: 10 }} />
                      </Box>
                    </Box>
                  ))}

                  {editNewMediaFiles.map((file, idx) => (
                    <Box
                      key={`new-${idx}`}
                      sx={{
                        width: 60,
                        height: 48,
                        borderRadius: '6px',
                        overflow: 'hidden',
                        position: 'relative',
                        border: '1.5px solid #0088FF',
                        bgcolor: '#EFF8FF'
                      }}
                      title={file.name}
                    >
                      {file.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(file)} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : file.type.startsWith('video/') ? (
                        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0088FF' }}>
                          <PlayIcon sx={{ fontSize: 18 }} />
                        </Box>
                      ) : (
                        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0088FF' }}>
                          <AttachFileIcon sx={{ fontSize: 16 }} />
                        </Box>
                      )}
                      <Box
                        onClick={() => setEditNewMediaFiles((prev) => prev.filter((_, i) => i !== idx))}
                        sx={{
                          position: 'absolute',
                          top: 1,
                          right: 1,
                          bgcolor: 'rgba(239, 68, 68, 0.9)',
                          color: '#FFF',
                          borderRadius: '3px',
                          width: 14,
                          height: 14,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: '#DC2626' }
                        }}
                        title="Remove"
                      >
                        <CloseIcon sx={{ fontSize: 10 }} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box
                  onClick={() => editMediaInputRef.current?.click()}
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    border: '1.5px dashed #CBD5E1',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    bgcolor: '#F8FAFC',
                    '&:hover': { borderColor: '#0088FF', bgcolor: '#F0F9FF' }
                  }}
                >
                  <CloudUploadIcon sx={{ fontSize: 24, color: '#94A3B8', mb: 0.5 }} />
                  <Typography sx={{ fontSize: '12px', color: '#64748B' }}>
                    Click to add images, videos, or documents
                  </Typography>
                </Box>
              )}
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 2.5, py: 2 }}>
            <Button onClick={() => setEditOpen(false)} disabled={savingEdit} sx={{ textTransform: 'none', color: '#64748B' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={savingEdit}
              sx={{ bgcolor: '#0088FF', textTransform: 'none', fontWeight: 700, borderRadius: '10px', px: 3, '&:hover': { bgcolor: '#0070D2' } }}
            >
              {savingEdit ? <CircularProgress size={18} color="inherit" /> : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── Custom Delete Confirmation Dialog (NO browser alerts!) ── */}
      <Dialog
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '18px', p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DeleteIcon />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#0F172A' }}>
            Delete Project?
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '13.5px', color: '#64748B', lineHeight: 1.5 }}>
            Are you sure you want to delete <strong>"{project.title}"</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting} sx={{ textTransform: 'none', color: '#64748B' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={deleting}
            onClick={handleConfirmDelete}
            sx={{ bgcolor: '#EF4444', color: '#FFFFFF', textTransform: 'none', fontWeight: 700, borderRadius: '8px', '&:hover': { bgcolor: '#DC2626' } }}
          >
            {deleting ? <CircularProgress size={18} color="inherit" /> : 'Delete Project'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Media Confirmation Dialog ── */}
      <Dialog
        open={Boolean(mediaToDelete)}
        onClose={() => !deletingMedia && setMediaToDelete(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '18px', p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DeleteIcon />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#0F172A' }}>
            Delete Media?
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '13.5px', color: '#64748B', lineHeight: 1.5 }}>
            Are you sure you want to delete this {mediaToDelete?.isThumbnail ? 'cover thumbnail' : mediaToDelete?.type || 'media'} file? This action cannot be undone.
          </Typography>
          {mediaToDelete?.url && mediaToDelete.type !== 'video' && (
            <Box sx={{ mt: 2, width: '100%', height: 140, borderRadius: '10px', overflow: 'hidden', bgcolor: '#F8FAFC' }}>
              <img
                src={mediaToDelete.url}
                alt="To delete"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button onClick={() => setMediaToDelete(null)} disabled={deletingMedia} sx={{ textTransform: 'none', color: '#64748B' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={deletingMedia}
            onClick={handleConfirmDeleteMedia}
            sx={{ bgcolor: '#EF4444', color: '#FFFFFF', textTransform: 'none', fontWeight: 700, borderRadius: '8px', '&:hover': { bgcolor: '#DC2626' } }}
          >
            {deletingMedia ? <CircularProgress size={18} color="inherit" /> : 'Delete Media'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hidden file inputs for direct media & thumbnail uploads */}
      <input
        type="file"
        ref={mediaFileInputRef}
        onChange={handleUploadNewMedia}
        multiple
        accept="image/*,video/*,application/pdf"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={thumbnailFileInputRef}
        onChange={handleUploadThumbnail}
        accept="image/*"
        style={{ display: 'none' }}
      />
    </Box>
  );
}
