import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Grid,
  Button,
  IconButton,
  Avatar,
  TextField,
  InputAdornment,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Menu,
  ListItemIcon,
  ListItemText,
  Paper,
  List,
  ListItem
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  OpenInNew as OpenInNewIcon,
  GitHub as GitHubIcon,
  PlayCircleOutlineRounded as PlayIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Language as LanguageIcon,
  Code as CodeIcon,
  RocketLaunch as RocketIcon,
  School as SchoolIcon,
  VerifiedUser as VerifiedIcon,
  SmartToy as AiIcon,
  Smartphone as MobileIcon,
  GridView as GridViewIcon,
  Image as ImageIcon,
  Description as DocIcon,
  Visibility as VisibilityIcon,
  CalendarToday as CalendarIcon,
  Label as TagIcon,
  ChevronRight as ChevronRightIcon,
  DeleteForever as DeleteForeverIcon,
  CloudQueue as CloudIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import API from '../../api';

const PROJECT_DRAFT_KEY = 'hostel_project_form_draft';

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

const getCategoryPlaceholder = (cat) => {
  switch (cat) {
    case 'IoT & Hardware':
      return 'e.g. Arduino, Raspberry Pi, ESP32, Sensors, Embedded C';
    case 'AI / ML':
      return 'e.g. Python, PyTorch, TensorFlow, OpenCV';
    case 'Mobile Apps':
      return 'e.g. Flutter, React Native, Swift, Kotlin';
    case 'Cloud & DevOps':
      return 'e.g. AWS, Docker, Kubernetes, CI/CD';
    case 'Cybersecurity':
      return 'e.g. Wireshark, Cryptography, Metasploit, Linux';
    case 'Open Source':
      return 'e.g. Git, Python, Node.js, Markdown';
    default:
      return 'e.g. React, Node.js, MongoDB, etc.';
  }
};

const DEFAULT_CATEGORIES = [
  { _id: '1', name: 'Web Development', icon: 'LanguageIcon' },
  { _id: '2', name: 'Mobile Apps', icon: 'MobileIcon' },
  { _id: '3', name: 'AI / ML', icon: 'AiIcon' },
  { _id: '4', name: 'Cloud & DevOps', icon: 'CloudIcon' },
  { _id: '5', name: 'IoT & Hardware', icon: 'HardwareIcon' },
  { _id: '6', name: 'Cybersecurity', icon: 'SecurityIcon' },
  { _id: '7', name: 'Open Source', icon: 'CodeIcon' },
  { _id: '8', name: 'Other', icon: 'TagIcon' }
];

const CORE_TABS = [
  { id: 'ALL', label: 'All Projects', icon: <GridViewIcon sx={{ fontSize: 16 }} /> },
  { id: 'College Project', label: 'College Projects', icon: <SchoolIcon sx={{ fontSize: 16 }} />, isType: true },
  { id: 'Personal Project', label: 'Personal Projects', icon: <VerifiedIcon sx={{ fontSize: 16 }} />, isType: true }
];

export default function Projects() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef(null);

  const isAdmin = Boolean(user && ['ADMIN', 'ADMINISTRATOR', 'WARDEN'].includes(user.role));
  const canAddProject = Boolean(
    user && ['STUDENT', 'ALUMNI', 'ADMIN', 'ADMINISTRATOR', 'WARDEN', 'STAFF', 'MEMBER'].includes(user.role)
  );

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState('ALL');

  // Category management states
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [categoryDeleteDialogOpen, setCategoryDeleteDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(false);

  // Add / Edit Modal states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [saving, setSaving] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  // Form states matching Mockup Image 2
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Web Development');
  const [projectType, setProjectType] = useState('College Project');
  const [scopeType, setScopeType] = useState('Solo Project');
  const [tagsInput, setTagsInput] = useState('');
  const [description, setDescription] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingMedia, setExistingMedia] = useState([]);
  const [previewThumbnail, setPreviewThumbnail] = useState('');

  // 3-dots Menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [activeProject, setActiveProject] = useState(null);

  // Delete Confirmation Modal state (NO browser alerts!)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Clear draft storage helper
  const clearDraft = () => {
    try {
      localStorage.removeItem(PROJECT_DRAFT_KEY);
      setDraftRestored(false);
    } catch {}
  };

  // Fetch projects from backend
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await API.get('/projects');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setProjects(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
      enqueueSnackbar('Failed to load projects', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories from backend
  const fetchCategories = async () => {
    try {
      const res = await API.get('/projects/categories');
      if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load project categories:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchCategories();

    // ── Restore saved draft if user refreshed while modal was open ──
    try {
      const saved = localStorage.getItem(PROJECT_DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft && draft.isOpen) {
          setTitle(draft.title || '');
          setCategory(draft.category || 'Web Development');
          setProjectType(draft.projectType || 'College Project');
          setScopeType(draft.scopeType || (draft.projectType === 'Personal Project' ? 'Solo Project' : 'Team Project'));
          setTagsInput(draft.tagsInput || '');
          setDescription(draft.description || '');
          setLiveUrl(draft.liveUrl || '');
          setGithubUrl(draft.githubUrl || '');
          setPreviewThumbnail(draft.previewThumbnail || '');
          if (draft.editingProjectId) {
            setEditingProject({ _id: draft.editingProjectId });
          }
          setDialogOpen(true);
          setDraftRestored(true);
          enqueueSnackbar('Project modal restored from your previous session', {
            variant: 'info',
            autoHideDuration: 3500
          });
        }
      }
    } catch (err) {
      console.warn('Failed to parse project draft:', err);
    }
  }, []);

  // ── Auto-save draft to localStorage whenever modal is open and fields change ──
  useEffect(() => {
    if (dialogOpen) {
      try {
        localStorage.setItem(
          PROJECT_DRAFT_KEY,
          JSON.stringify({
            isOpen: true,
            title,
            category,
            projectType,
            scopeType,
            tagsInput,
            description,
            liveUrl,
            githubUrl,
            previewThumbnail,
            editingProjectId: editingProject?._id || null,
            savedAt: Date.now()
          })
        );
      } catch (err) {
        console.warn('Failed to save project draft:', err);
      }
    }
  }, [
    dialogOpen,
    title,
    category,
    projectType,
    tagsInput,
    description,
    liveUrl,
    githubUrl,
    previewThumbnail,
    editingProject
  ]);

  // Category management functions (Admin only)
  const handleAddCategory = async (e) => {
    if (e) e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      setAddingCategory(true);
      const res = await API.post('/projects/categories', {
        name: newCategoryName.trim()
      });
      if (res.data?.success) {
        enqueueSnackbar(`Category "${res.data.data.name}" added!`, { variant: 'success' });
        setNewCategoryName('');
        await fetchCategories();
      }
    } catch (err) {
      console.error('Add category error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to add category', { variant: 'error' });
    } finally {
      setAddingCategory(false);
    }
  };

  const handleUpdateCategory = async (catId) => {
    if (!editingCategoryName.trim()) return;

    try {
      const res = await API.put(`/projects/categories/${catId}`, {
        name: editingCategoryName.trim()
      });
      if (res.data?.success) {
        enqueueSnackbar('Category renamed successfully', { variant: 'success' });
        setEditingCategoryId(null);
        setEditingCategoryName('');
        await fetchCategories();
        fetchProjects();
      }
    } catch (err) {
      console.error('Update category error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to update category', { variant: 'error' });
    }
  };

  const handleRequestDeleteCategory = (cat) => {
    setCategoryToDelete(cat);
    setCategoryDeleteDialogOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      setDeletingCategory(true);
      const res = await API.delete(`/projects/categories/${categoryToDelete._id}`);
      if (res.data?.success) {
        enqueueSnackbar('Category deleted successfully', { variant: 'success' });
        if (selectedTab === categoryToDelete.name) {
          setSelectedTab('ALL');
        }
        setCategoryDeleteDialogOpen(false);
        setCategoryToDelete(null);
        await fetchCategories();
        fetchProjects();
      }
    } catch (err) {
      console.error('Delete category error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete category', { variant: 'error' });
    } finally {
      setDeletingCategory(false);
    }
  };

  // Helper icon for categories
  const renderCategoryIcon = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('web')) return <LanguageIcon sx={{ fontSize: 16 }} />;
    if (n.includes('mobile') || n.includes('app')) return <MobileIcon sx={{ fontSize: 16 }} />;
    if (n.includes('ai') || n.includes('machine') || n.includes('ml')) return <AiIcon sx={{ fontSize: 16 }} />;
    if (n.includes('cloud') || n.includes('devops')) return <CloudIcon sx={{ fontSize: 16 }} />;
    if (n.includes('code') || n.includes('open source')) return <CodeIcon sx={{ fontSize: 16 }} />;
    return <TagIcon sx={{ fontSize: 16 }} />;
  };

  // Filter projects based on selectedTab and search
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Tab filter
      if (selectedTab !== 'ALL') {
        if (selectedTab === 'College Project' || selectedTab === 'Personal Project') {
          if (p.projectType !== selectedTab) return false;
        } else {
          const cat = (p.category || p.industry || '').toLowerCase().trim();
          const target = selectedTab.toLowerCase().trim();
          if (cat !== target && !cat.includes(target) && !target.includes(cat)) return false;
        }
      }

      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const titleMatch = (p.title || '').toLowerCase().includes(query);
        const descMatch = (p.description || '').toLowerCase().includes(query);
        const catMatch = (p.category || p.industry || '').toLowerCase().includes(query);
        const tagsMatch = Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(query));
        if (!titleMatch && !descMatch && !catMatch && !tagsMatch) return false;
      }

      return true;
    });
  }, [projects, selectedTab, search]);

  const handleCloseDialog = () => {
    clearDraft();
    setDialogOpen(false);
  };

  const handleOpenCreate = () => {
    clearDraft();
    setEditingProject(null);
    setTitle('');
    setCategory('Web Development');
    setProjectType('Personal Project');
    setScopeType('Solo Project');
    setTagsInput('');
    setDescription('');
    setLiveUrl('');
    setGithubUrl('');
    setSelectedFiles([]);
    setExistingMedia([]);
    setPreviewThumbnail('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (project) => {
    clearDraft();
    setEditingProject(project);
    setTitle(project.title || '');
    setCategory(project.category || project.industry || 'Web Development');
    setProjectType(project.projectType || 'College Project');
    setScopeType(
      project.scopeType && project.scopeType !== 'Team Project'
        ? project.scopeType
        : (project.projectType === 'Personal Project' ? 'Solo Project' : (project.scopeType || 'Team Project'))
    );
    setTagsInput(Array.isArray(project.tags) ? project.tags.join(', ') : '');
    setDescription(project.description || '');
    setLiveUrl(project.liveUrl || '');
    setGithubUrl(project.githubUrl || '');
    setSelectedFiles([]);
    setExistingMedia(project.media || []);
    setPreviewThumbnail(project.thumbnail || '');
    setDialogOpen(true);
    handleCloseMenu();
  };

  const handleMenuClick = (e, project) => {
    setMenuAnchorEl(e.currentTarget);
    setActiveProject(project);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setActiveProject(null);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
      // Use first image file as thumbnail preview if none set
      const firstImg = files.find((f) => f.type.startsWith('image/'));
      if (firstImg && !previewThumbnail) {
        setPreviewThumbnail(URL.createObjectURL(firstImg));
      }
    }
  };

  const handleRemoveSelectedFile = (idx) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddSuggestedTag = (tag) => {
    const current = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    if (!current.includes(tag)) {
      setTagsInput([...current, tag].join(', '));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      enqueueSnackbar('Project title is required', { variant: 'warning' });
      return;
    }
    if (!description.trim()) {
      enqueueSnackbar('Short description is required', { variant: 'warning' });
      return;
    }

    try {
      setSaving(true);
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('industry', category);
      formData.append('projectType', projectType);
      formData.append('scopeType', scopeType);
      formData.append('description', description.trim());
      formData.append('liveUrl', liveUrl.trim());
      formData.append('githubUrl', githubUrl.trim());
      formData.append('tags', JSON.stringify(parsedTags));

      if (previewThumbnail) {
        formData.append('thumbnail', previewThumbnail);
      }

      // Append upload files
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      if (editingProject) {
        await API.put(`/projects/${editingProject._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        enqueueSnackbar('Project updated successfully!', { variant: 'success' });
      } else {
        await API.post('/projects', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        enqueueSnackbar('Project published successfully!', { variant: 'success' });
      }

      clearDraft();
      setDialogOpen(false);
      fetchProjects();
    } catch (err) {
      console.error('Error saving project:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to save project', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Trigger custom confirmation popup for deletion
  const handleRequestDelete = (project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
    handleCloseMenu();
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      setDeleting(true);
      await API.delete(`/projects/${projectToDelete._id}`);
      enqueueSnackbar('Project removed successfully', { variant: 'success' });
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      fetchProjects();
    } catch (err) {
      console.error('Delete project error:', err);
      enqueueSnackbar(err.response?.data?.message || 'Failed to delete project', { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', pb: 8 }}>
      {/* ── Top Header Banner (Matches Mockup Image 1) ── */}
      <Box
        sx={{
          bgcolor: '#FFFFFF',
          borderRadius: { xs: '16px', md: '20px' },
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
          p: { xs: 2.5, sm: 2, md: 2 },
          mb: 3,
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 52%, #EFF6FF 100%)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          gap: 2.5
        }}
      >
        {/* Left Side: Rocket Icon, Title, Subtitle */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              width: { xs: 48, sm: 56 },
              height: { xs: 48, sm: 56 },
              borderRadius: '16px',
              bgcolor: '#DBEAFE',
              color: '#1D4ED8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(29, 78, 216, 0.12)'
            }}
          >
            <RocketIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: '#0F172A',
                fontSize: { xs: '1.45rem', sm: '1.85rem', md: '2.1rem' },
                letterSpacing: '-0.025em',
                lineHeight: 1.2
              }}
            >
              Build • Share • Grow
            </Typography>

  
          </Box>
        </Box>

        {/* Right Side: Laptop Graphic / Illustration matching Mockup Image 1 & Add Project Action */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1.5, sm: 2.5 },
            flexShrink: 0
          }}
        >
          {/* Laptop & Coding Workspace SVG Illustration matching Mockup Image 1 */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              position: 'relative',
              height: 100,
              width: { md: 240, lg: 270 },
              userSelect: 'none'
            }}
          >
            <svg width="100%" height="100" viewBox="0 0 270 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Soft background glow */}
              <ellipse cx="120" cy="50" rx="90" ry="40" fill="#F0F9FF" opacity="0.8" />

              {/* Floating soft blue photo icon */}
              <rect x="18" y="10" width="30" height="26" rx="7" fill="#E0F2FE" />
              <path d="M25 24L30 18L35 24H25Z" fill="#38BDF8" opacity="0.85" />
              <circle cx="37" cy="16" r="2" fill="#38BDF8" />

              {/* Floating green video play badge */}
              <rect x="15" y="44" width="32" height="28" rx="8" fill="#10B981" />
              <polygon points="28,51 38,58 28,65" fill="#FFFFFF" />

              {/* Laptop Display */}
              <rect x="62" y="18" width="102" height="66" rx="7" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />
              <rect x="66" y="22" width="94" height="58" rx="4" fill="#0F172A" />
              <text x="113" y="56" fill="#38BDF8" fontSize="16" fontWeight="bold" fontFamily="monospace" textAnchor="middle">&lt;/&gt;</text>
              
              {/* Laptop Base */}
              <path d="M48 84C48 83 49 82.5 51 82.5H175C177 82.5 178 83 178 84L184 88.5C184 89.5 183 90 181 90H45C43 90 42 89.5 42 88.5L48 84Z" fill="#94A3B8" />
              <rect x="103" y="83.5" width="20" height="2" rx="1" fill="#64748B" />

              {/* Floating top right blue photo badge */}
              <rect x="174" y="8" width="30" height="26" rx="7" fill="#3B82F6" />
              <path d="M181 23L187 16L192 23H181Z" fill="#FFFFFF" opacity="0.85" />
              <circle cx="195" cy="14" r="2" fill="#FFFFFF" />

              {/* Floating blue video/file pills */}
              <rect x="174" y="40" width="25" height="22" rx="6" fill="#60A5FA" opacity="0.85" />
              <polygon points="182,45 191,51 182,57" fill="#FFFFFF" />

              <rect x="174" y="68" width="22" height="19" rx="5" fill="#93C5FD" opacity="0.9" />
              <text x="185" y="81" fill="#1E40AF" fontSize="10" fontWeight="bold" textAnchor="middle">P</text>

              {/* Potted Plant */}
              <ellipse cx="232" cy="88" rx="15" ry="3.5" fill="#E2E8F0" />
              <path d="M223 64L226 88H238L241 64H223Z" fill="#94A3B8" />
              <path d="M221 62H243C244 62 244 64 243 64H221C220 64 220 62 221 62Z" fill="#64748B" />
              <path d="M232 62C232 48 223 42 221 40C223 46 226 56 230 62H232Z" fill="#10B981" />
              <path d="M232 62C232 44 232 34 233 32C236 40 236 52 234 62H232Z" fill="#059669" />
              <path d="M232 62C232 50 240 44 243 42C241 48 238 58 234 62H232Z" fill="#34D399" />
            </svg>
          </Box>

          {/* Add Project Button */}
          {canAddProject && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              sx={{
                bgcolor: '#0088FF',
                color: '#FFFFFF',
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: '10px',
                px: 2.75,
                py: 1.15,
                fontSize: '14px',
                boxShadow: '0 4px 14px rgba(0, 136, 255, 0.35)',
                whiteSpace: 'nowrap',
                '&:hover': {
                  bgcolor: '#0070D2',
                  boxShadow: '0 6px 18px rgba(0, 136, 255, 0.45)'
                }
              }}
            >
              Add Project
            </Button>
          )}
        </Box>
      </Box>

      {/* ── Category / Filter Tabs Strip & Search Input ── */}
      <Box
        sx={{
          bgcolor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          p: { xs: 1.25, sm: 1.5 },
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', lg: 'center' },
          gap: 1.5
        }}
      >
        {/* Horizontal Filter Pill Strip with Touch Scrolling */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            overflowX: 'auto',
            py: 0.5,
            px: 0.25,
            flex: 1,
            minWidth: 0,
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* Core Tabs: All Projects, College Projects, Personal Projects */}
          {CORE_TABS.map((tab) => {
            const isSelected = selectedTab === tab.id;
            return (
              <Box
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.8,
                  px: 2,
                  py: 0.8,
                  borderRadius: '24px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontSize: '13px',
                  fontWeight: isSelected ? 700 : 600,
                  transition: 'all 0.18s ease',
                  bgcolor: isSelected ? '#0088FF' : '#F8FAFC',
                  color: isSelected ? '#FFFFFF' : '#334155',
                  border: isSelected ? '1px solid #0088FF' : '1px solid #E2E8F0',
                  boxShadow: isSelected ? '0 2px 8px rgba(0, 136, 255, 0.28)' : 'none',
                  '&:hover': {
                    bgcolor: isSelected ? '#0088FF' : '#EFF6FF',
                    borderColor: isSelected ? '#0088FF' : '#BFDBFE',
                    color: isSelected ? '#FFFFFF' : '#0088FF'
                  }
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </Box>
            );
          })}

          {/* Dynamic Categories from DB */}
          {categories.map((cat) => {
            const catName = typeof cat === 'string' ? cat : cat.name;
            const isSelected = selectedTab === catName;
            return (
              <Box
                key={cat._id || catName}
                onClick={() => setSelectedTab(catName)}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.8,
                  px: 2,
                  py: 0.8,
                  borderRadius: '24px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontSize: '13px',
                  fontWeight: isSelected ? 700 : 600,
                  transition: 'all 0.18s ease',
                  bgcolor: isSelected ? '#0088FF' : '#F8FAFC',
                  color: isSelected ? '#FFFFFF' : '#334155',
                  border: isSelected ? '1px solid #0088FF' : '1px solid #E2E8F0',
                  boxShadow: isSelected ? '0 2px 8px rgba(0, 136, 255, 0.28)' : 'none',
                  '&:hover': {
                    bgcolor: isSelected ? '#0088FF' : '#EFF6FF',
                    borderColor: isSelected ? '#0088FF' : '#BFDBFE',
                    color: isSelected ? '#FFFFFF' : '#0088FF'
                  }
                }}
              >
                {renderCategoryIcon(catName)}
                <span>{catName}</span>
              </Box>
            );
          })}
        </Box>

        {/* Right side: Admin Edit Categories button + Search Input */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexShrink: 0 }}>
          {isAdmin && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<EditIcon sx={{ fontSize: 14 }} />}
              onClick={() => setCategoryModalOpen(true)}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '12.5px',
                borderRadius: '12px',
                borderColor: '#BFDBFE',
                color: '#0088FF',
                bgcolor: '#EFF6FF',
                px: 1.75,
                py: 0.75,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                '&:hover': {
                  bgcolor: '#DBEAFE',
                  borderColor: '#93C5FD'
                }
              }}
            >
              Edit Categories
            </Button>
          )}

          {/* Search Projects Input */}
          <TextField
            size="small"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <IconButton size="small" onClick={() => setSearch('')} sx={{ p: 0.5 }}>
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              ) : null
            }}
            sx={{
              width: { xs: '100%', sm: 260, md: 280 },
              flexShrink: 0,
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                bgcolor: '#FFFFFF',
                fontSize: 13,
                borderColor: '#E2E8F0'
              }
            }}
          />
        </Box>
      </Box>

      {/* ── Project Cards Grid (4 Columns on Desktop, Compact & Refined Cards) ── */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <CircularProgress size={38} sx={{ color: '#0088FF' }} />
        </Box>
      ) : filteredProjects.length === 0 ? (
        <Card sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', p: 6, textAlign: 'center', bgcolor: '#FFFFFF', boxShadow: 'none' }}>
          <RocketIcon sx={{ fontSize: 48, color: '#94A3B8', mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5 }}>
            No projects found {selectedTab !== 'ALL' ? `for "${selectedTab}"` : ''}
          </Typography>
     
          {canAddProject && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              sx={{ bgcolor: '#0088FF', textTransform: 'none', fontWeight: 700, borderRadius: '10px', '&:hover': { bgcolor: '#0070D2' } }}
            >
              Share Your First Project
            </Button>
          )}
        </Card>
      ) : (
        <Grid container spacing={2}>
          {filteredProjects.map((project) => {
            const isPersonal = project.projectType === 'Personal Project';
            const mediaCount = (project.media?.length || 0) + (project.videoUrl ? 1 : 0);
            const canManage = Boolean(
              isAdmin || (user && project.author?._id && String(project.author._id) === String(user._id))
            );

            // Date format e.g. Jan 2025
            const dateStr = project.createdAt
              ? new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              : 'Recent';

            const authorName = project.author?.name || project.authorName || 'Hostel Member';
            const authorRole = project.author?.role || project.authorRole || 'STUDENT';
            const authorAvatar =
              (typeof project.author?.profilePhoto === 'object'
                ? project.author.profilePhoto?.url
                : project.author?.profilePhoto) ||
              project.authorAvatar ||
              '';

            return (
              <Grid key={project._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Card
                  onClick={() => navigate(`/projects/${project._id}`)}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '14px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    bgcolor: '#FFFFFF',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease-in-out',
                    height: '100%',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: '0 10px 24px rgba(0,0,0,0.08)',
                      borderColor: '#BFDBFE',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  {/* Top Preview Image Area - Compact 148px height */}
                  <Box
                    sx={{
                      width: '100%',
                      height: 148,
                      overflow: 'hidden',
                      position: 'relative',
                      bgcolor: '#0F172A'
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={
                        project.thumbnail ||
                        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={project.title}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.35s ease',
                        '&:hover': { transform: 'scale(1.04)' }
                      }}
                    />

                    {/* Floating Project Type Pill on Top Left */}
                    <Box sx={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          bgcolor: isPersonal ? '#059669' : '#2563EB',
                          color: '#FFFFFF',
                          borderRadius: '10px',
                          px: 1.1,
                          py: 0.25,
                          fontSize: '10px',
                          fontWeight: 700,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                        }}
                      >
                        {project.projectType || 'College Project'}
                      </Box>
                    </Box>

                    {/* Floating Media Icons on Top Right */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        zIndex: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.4,
                        bgcolor: 'rgba(15, 23, 42, 0.75)',
                        backdropFilter: 'blur(5px)',
                        borderRadius: '10px',
                        px: 0.8,
                        py: 0.25,
                        color: '#FFFFFF',
                        border: '1px solid rgba(255,255,255,0.15)'
                      }}
                    >
                      <ImageIcon sx={{ fontSize: 11.5, opacity: 0.9 }} />
                      {project.videoUrl && <PlayIcon sx={{ fontSize: 11.5, opacity: 0.9 }} />}
                      <DocIcon sx={{ fontSize: 11.5, opacity: 0.9 }} />
                      {mediaCount > 1 && (
                        <Typography sx={{ fontSize: '9.5px', fontWeight: 700, ml: 0.15 }}>
                          +{mediaCount}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Card Body - Compact padding & text sizes */}
                  <CardContent sx={{ p: 1.5, pb: '12px !important', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      {/* Title */}
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 700,
                          color: '#0F172A',
                          fontSize: '14px',
                          lineHeight: 1.25,
                          mb: 0.4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={project.title}
                      >
                        {project.title}
                      </Typography>

                      {/* Description */}
                      <Typography
                        sx={{
                          fontSize: '11px',
                          color: '#64748B',
                          lineHeight: 1.4,
                          mb: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          height: '31px'
                        }}
                      >
                        {project.description || 'No description provided for this project.'}
                      </Typography>

                      {/* Tech Stack / Tags Row */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.2 }}>
                        {Array.isArray(project.tags) && project.tags.length > 0 ? (
                          project.tags.slice(0, 3).map((tag, idx) => (
                            <Box
                              key={idx}
                              sx={{
                                bgcolor: '#F0F7FF',
                                color: '#0284C7',
                                border: '1px solid #E0F2FE',
                                borderRadius: '6px',
                                px: 0.8,
                                py: 0.2,
                                fontSize: '10px',
                                fontWeight: 600,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {tag}
                            </Box>
                          ))
                        ) : (
                          <Box
                            sx={{
                              bgcolor: '#F8FAFC',
                              color: '#64748B',
                              borderRadius: '6px',
                              px: 0.8,
                              py: 0.2,
                              fontSize: '10px',
                              fontWeight: 500
                            }}
                          >
                            {project.category || 'General'}
                          </Box>
                        )}
                      </Box>

                      {/* Author / Uploader Details */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.8,
                          mb: 1,
                          mt: 0.2
                        }}
                      >
                        <Avatar
                          src={authorAvatar}
                          alt={authorName}
                          sx={{
                            width: 22,
                            height: 22,
                            fontSize: '10px',
                            fontWeight: 700,
                            bgcolor: '#0088FF',
                            color: '#FFFFFF'
                          }}
                        >
                          {authorName[0]?.toUpperCase() || 'U'}
                        </Avatar>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                          <Typography
                            sx={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#1E293B',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            title={authorName}
                          >
                            {authorName}
                          </Typography>
                          <Typography sx={{ fontSize: '10px', color: '#CBD5E1', flexShrink: 0 }}>•</Typography>
                          <Typography
                            sx={{
                              fontSize: '9.5px',
                              fontWeight: 600,
                              color: '#64748B',
                              bgcolor: '#F1F5F9',
                              px: 0.6,
                              py: 0.1,
                              borderRadius: '4px',
                              flexShrink: 0,
                              textTransform: 'uppercase'
                            }}
                          >
                            {authorRole}
                          </Typography>
                        </Box>
                      </Box>
                    </div>

                    {/* Bottom Metadata & Action Row */}
                    <div>
                      <Divider sx={{ borderColor: '#F1F5F9', mb: 0.9 }} />

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '10.5px' }}>
                        {/* Date */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                          <CalendarIcon sx={{ fontSize: 11.5, color: '#94A3B8' }} />
                          <span>{dateStr}</span>
                        </Box>

                        {/* Team / Solo Scope */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                          <CodeIcon sx={{ fontSize: 11.5, color: '#94A3B8' }} />
                          <span>
                            {project.scopeType && project.scopeType !== 'Team Project'
                              ? project.scopeType
                              : (project.projectType === 'Personal Project' ? 'Solo Project' : (project.scopeType || 'Team Project'))}
                          </span>
                        </Box>

                        {/* Views */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                          <VisibilityIcon sx={{ fontSize: 11.5, color: '#94A3B8' }} />
                          <span>{project.viewsCount || 0}</span>
                        </Box>

                        {/* 3-dots Menu Button */}
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMenuClick(e, project);
                          }}
                          sx={{ p: 0.2, color: '#64748B', '&:hover': { bgcolor: '#F1F5F9' } }}
                        >
                          <MoreVertIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </div>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* ── 3-dots Menu Popup ── */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            minWidth: 170,
            p: 0.5,
            boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
            border: '1px solid #E2E8F0'
          }
        }}
      >
        {/* View Details Action */}
        <MenuItem
          onClick={() => {
            if (activeProject?._id) {
              navigate(`/projects/${activeProject._id}`);
            }
            handleCloseMenu();
          }}
          sx={{ borderRadius: '8px', fontSize: '13px', py: 0.9, color: '#0088FF' }}
        >
          <ListItemIcon sx={{ minWidth: 28, color: '#0088FF' }}>
            <VisibilityIcon sx={{ fontSize: 16 }} />
          </ListItemIcon>
          <ListItemText primary="View Details" primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }} />
        </MenuItem>

        {activeProject?.liveUrl && (
          <MenuItem
            onClick={() => {
              window.open(activeProject.liveUrl, '_blank');
              handleCloseMenu();
            }}
            sx={{ borderRadius: '8px', fontSize: '13px', py: 0.9 }}
          >
            <ListItemIcon sx={{ minWidth: 28, color: '#0088FF' }}>
              <OpenInNewIcon sx={{ fontSize: 16 }} />
            </ListItemIcon>
            <ListItemText primary="Live Demo" primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }} />
          </MenuItem>
        )}

        {activeProject?.githubUrl && (
          <MenuItem
            onClick={() => {
              window.open(activeProject.githubUrl, '_blank');
              handleCloseMenu();
            }}
            sx={{ borderRadius: '8px', fontSize: '13px', py: 0.9 }}
          >
            <ListItemIcon sx={{ minWidth: 28, color: '#0F172A' }}>
              <GitHubIcon sx={{ fontSize: 16 }} />
            </ListItemIcon>
            <ListItemText primary="GitHub Repo" primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }} />
          </MenuItem>
        )}

        {/* Edit Action */}
        {(isAdmin || (user && activeProject?.author?._id && String(activeProject.author._id) === String(user._id))) && (
          <MenuItem
            onClick={() => handleOpenEdit(activeProject)}
            sx={{ borderRadius: '8px', fontSize: '13px', py: 0.9, color: '#0284C7' }}
          >
            <ListItemIcon sx={{ minWidth: 28, color: '#0284C7' }}>
              <EditIcon sx={{ fontSize: 16 }} />
            </ListItemIcon>
            <ListItemText primary="Edit Project" primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }} />
          </MenuItem>
        )}

        {/* Delete Action */}
        {(isAdmin || (user && activeProject?.author?._id && String(activeProject.author._id) === String(user._id))) && (
          <MenuItem
            onClick={() => handleRequestDelete(activeProject)}
            sx={{ borderRadius: '8px', fontSize: '13px', py: 0.9, color: '#EF4444' }}
          >
            <ListItemIcon sx={{ minWidth: 28, color: '#EF4444' }}>
              <DeleteIcon sx={{ fontSize: 16 }} />
            </ListItemIcon>
            <ListItemText primary="Delete Project" primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }} />
          </MenuItem>
        )}
      </Menu>

      {/* ── Add / Edit Project Modal (Exact Match to Mockup Image 2) ── */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            p: 1,
            maxHeight: '90vh'
          }
        }}
      >
        {/* Modal Header */}
        <DialogTitle sx={{ p: 2, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                bgcolor: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <RocketIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '18px', color: '#0F172A', lineHeight: 1.2 }}>
                {editingProject ? 'Edit Project' : 'Add New Project'}
              </Typography>
              <Typography sx={{ fontSize: '12.5px', color: '#64748B', mt: 0.25 }}>
                Share your work with the hostel community
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={handleCloseDialog} sx={{ color: '#64748B' }}>
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ px: 2.5, py: 1.5, display: 'flex', flexDirection: 'column', gap: 2.25 }}>
            {/* Draft Auto-Restore Banner */}
            {draftRestored && (
              <Box
                sx={{
                  px: 2,
                  py: 1.25,
                  bgcolor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1.5
                }}
              >
                <Typography sx={{ fontSize: '12.5px', color: '#1E40AF', fontWeight: 600 }}>
                  Draft restored from your previous session
                </Typography>
                <Button
                  size="small"
                  onClick={() => {
                    clearDraft();
                    setTitle('');
                    setTagsInput('');
                    setDescription('');
                    setLiveUrl('');
                    setGithubUrl('');
                    setSelectedFiles([]);
                    enqueueSnackbar('Draft cleared', { variant: 'info' });
                  }}
                  sx={{
                    fontSize: '11.5px',
                    textTransform: 'none',
                    color: '#DC2626',
                    fontWeight: 700,
                    p: 0,
                    minWidth: 0,
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  Discard Draft
                </Button>
              </Box>
            )}

            {/* Project Title */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', mb: 0.75 }}>
                Project Title *
              </Typography>
              <TextField
                placeholder="Enter project title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                fullWidth
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
            </Box>

            {/* Category */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                  Category *
                </Typography>
                {isAdmin && (
                  <Typography
                    onClick={() => setCategoryModalOpen(true)}
                    sx={{ fontSize: '11.5px', color: '#0088FF', cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                  >
                    + Manage Categories
                  </Typography>
                )}
              </Box>
              <FormControl fullWidth size="small">
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  sx={{ borderRadius: '10px' }}
                >
                  {categories.map((cat) => {
                    const catName = typeof cat === 'string' ? cat : cat.name;
                    return (
                      <MenuItem key={cat._id || catName} value={catName}>
                        {catName}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Box>

            {/* Project Type Toggle Buttons */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', mb: 0.75 }}>
                Project Type *
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Box
                  onClick={() => {
                    setProjectType('College Project');
                    setScopeType('Team Project');
                  }}
                  sx={{
                    flex: 1,
                    textAlign: 'center',
                    py: 1,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '13.5px',
                    fontWeight: projectType === 'College Project' ? 700 : 600,
                    bgcolor: projectType === 'College Project' ? '#EFF6FF' : '#FFFFFF',
                    color: projectType === 'College Project' ? '#2563EB' : '#64748B',
                    border: projectType === 'College Project' ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                    transition: 'all 0.15s ease'
                  }}
                >
                  College Project
                </Box>
                <Box
                  onClick={() => {
                    setProjectType('Personal Project');
                    setScopeType('Solo Project');
                  }}
                  sx={{
                    flex: 1,
                    textAlign: 'center',
                    py: 1,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '13.5px',
                    fontWeight: projectType === 'Personal Project' ? 700 : 600,
                    bgcolor: projectType === 'Personal Project' ? '#EFF6FF' : '#FFFFFF',
                    color: projectType === 'Personal Project' ? '#2563EB' : '#64748B',
                    border: projectType === 'Personal Project' ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                    transition: 'all 0.15s ease'
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
                  onClick={() => setScopeType('Solo Project')}
                  sx={{
                    flex: 1,
                    textAlign: 'center',
                    py: 1,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '13.5px',
                    fontWeight: scopeType === 'Solo Project' ? 700 : 600,
                    bgcolor: scopeType === 'Solo Project' ? '#EFF6FF' : '#FFFFFF',
                    color: scopeType === 'Solo Project' ? '#2563EB' : '#64748B',
                    border: scopeType === 'Solo Project' ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Solo Project
                </Box>
                <Box
                  onClick={() => setScopeType('Team Project')}
                  sx={{
                    flex: 1,
                    textAlign: 'center',
                    py: 1,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '13.5px',
                    fontWeight: scopeType === 'Team Project' ? 700 : 600,
                    bgcolor: scopeType === 'Team Project' ? '#EFF6FF' : '#FFFFFF',
                    color: scopeType === 'Team Project' ? '#2563EB' : '#64748B',
                    border: scopeType === 'Team Project' ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Team Project
                </Box>
              </Box>
            </Box>

            {/* Tech Stack / Tags - Dynamic for Category */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                  {category === 'IoT & Hardware' ? 'Hardware & Technologies' : 'Tech Stack / Tags'}{' '}
                  <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 500 }}>(Optional)</span>
                </Typography>
                {tagsInput && (
                  <Typography
                    onClick={() => setTagsInput('')}
                    sx={{ fontSize: '11px', color: '#EF4444', cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                  >
                    Clear tags
                  </Typography>
                )}
              </Box>
              <TextField
                placeholder={getCategoryPlaceholder(category)}
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TagIcon sx={{ fontSize: 16, color: '#94A3B8' }} />
                    </InputAdornment>
                  )
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />

              {/* Clickable Tag Suggestions for current Category */}
              {CATEGORY_TAG_SUGGESTIONS[category] && (
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                    Suggestions:
                  </Typography>
                  {CATEGORY_TAG_SUGGESTIONS[category].map((tag) => {
                    const isSelected = tagsInput
                      .split(',')
                      .map((t) => t.trim().toLowerCase())
                      .includes(tag.toLowerCase());
                    return (
                      <Chip
                        key={tag}
                        size="small"
                        label={`+ ${tag}`}
                        onClick={() => handleAddSuggestedTag(tag)}
                        disabled={isSelected}
                        sx={{
                          fontSize: '11px',
                          height: 22,
                          borderRadius: '6px',
                          cursor: isSelected ? 'default' : 'pointer',
                          bgcolor: isSelected ? '#F1F5F9' : '#EFF6FF',
                          color: isSelected ? '#94A3B8' : '#2563EB',
                          border: isSelected ? '1px solid #E2E8F0' : '1px solid #BFDBFE',
                          '&:hover': {
                            bgcolor: isSelected ? '#F1F5F9' : '#DBEAFE'
                          }
                        }}
                      />
                    );
                  })}
                </Box>
              )}
            </Box>

            {/* Short Description */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', mb: 0.75 }}>
                Short Description *
              </Typography>
              <TextField
                placeholder="Brief description about your project (max 300 chars)"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 300))}
                required
                multiline
                rows={3}
                fullWidth
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
              <Typography sx={{ fontSize: '11px', color: '#94A3B8', textAlign: 'right', mt: 0.5 }}>
                {description.length}/300
              </Typography>
            </Box>

            {/* Add Media (Optional) */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', mb: 0.75 }}>
                Add Media (Optional)
              </Typography>
              <Box
                sx={{
                  border: '1.5px dashed #CBD5E1',
                  borderRadius: '12px',
                  p: 2.5,
                  textAlign: 'center',
                  bgcolor: '#F8FAFC',
                  overflow: 'hidden'
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 36, color: '#0088FF', mb: 0.5 }} />
                <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                  Upload images, videos or documents
                </Typography>
                <Typography sx={{ fontSize: '11.5px', color: '#64748B', mb: 1.5 }}>
                  PNG, JPG, MP4, PDF
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    borderColor: '#2563EB',
                    color: '#2563EB',
                    textTransform: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    px: 2.5
                  }}
                >
                  Browse Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />

                {/* Selected Files Preview Chips - Wrapped cleanly with ellipsis, no overflow */}
                {selectedFiles.length > 0 && (
                  <Box
                    sx={{
                      mt: 2,
                      p: 1.5,
                      bgcolor: '#FFFFFF',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      maxHeight: 140,
                      overflowY: 'auto',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1,
                      justifyContent: 'center'
                    }}
                  >
                    {selectedFiles.map((f, i) => (
                      <Chip
                        key={i}
                        size="small"
                        label={f.name}
                        onDelete={() => handleRemoveSelectedFile(i)}
                        sx={{
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          maxWidth: { xs: 180, sm: 220 },
                          bgcolor: '#EFF6FF',
                          color: '#1D4ED8',
                          border: '1px solid #BFDBFE',
                          '& .MuiChip-label': {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }
                        }}
                      />
                    ))}
                  </Box>
                )}

                {/* Existing media when editing */}
                {existingMedia.length > 0 && (
                  <Box sx={{ mt: 1.5, textAlign: 'left' }}>
                    <Typography sx={{ fontSize: '11.5px', fontWeight: 600, color: '#64748B', mb: 0.5 }}>
                      Existing Project Media:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {existingMedia.map((m, idx) => (
                        <Chip
                          key={idx}
                          size="small"
                          label={m.name || `Media ${idx + 1}`}
                          onDelete={() => setExistingMedia((prev) => prev.filter((_, i) => i !== idx))}
                          sx={{
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            maxWidth: 200,
                            bgcolor: '#F1F5F9',
                            color: '#334155',
                            '& .MuiChip-label': {
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Project Links (Optional) */}
            <Box>
              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', mb: 0.75 }}>
                Project Links (Optional)
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '11.5px', color: '#64748B', mb: 0.4 }}>
                    Live Demo URL
                  </Typography>
                  <TextField
                    placeholder="https://your-project.com"
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                    fullWidth
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '11.5px', color: '#64748B', mb: 0.4 }}>
                    GitHub Repo URL
                  </Typography>
                  <TextField
                    placeholder="https://github.com/username/repo"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    fullWidth
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />
                </Box>
              </Stack>
            </Box>
          </DialogContent>

          {/* Modal Actions */}
          <DialogActions sx={{ px: 2.5, py: 2, gap: 1 }}>
            <Button
              onClick={handleCloseDialog}
              disabled={saving}
              sx={{ textTransform: 'none', color: '#64748B', fontWeight: 600, fontSize: '13.5px' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{
                bgcolor: '#0088FF',
                color: '#FFFFFF',
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: '10px',
                px: 3,
                py: 1,
                fontSize: '14px',
                boxShadow: '0 4px 14px rgba(0, 136, 255, 0.35)',
                '&:hover': { bgcolor: '#0070D2' }
              }}
            >
              {saving ? <CircularProgress size={20} color="inherit" /> : editingProject ? 'Save Changes' : 'Publish Project'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── Custom Popup View for Project Deletion (NO browser alerts!) ── */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '18px',
            p: 1,
            boxShadow: '0 20px 40px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 18, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EF4444',
              flexShrink: 0
            }}
          >
            <DeleteForeverIcon sx={{ fontSize: 22 }} />
          </Box>
          Delete Project?
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.6 }}>
            Are you sure you want to remove <strong>"{projectToDelete?.title}"</strong> from projects?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
            sx={{ textTransform: 'none', borderRadius: '10px', fontWeight: 600, color: '#64748B', borderColor: '#E2E8F0' }}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteProject}
            variant="contained"
            color="error"
            disabled={deleting}
            sx={{
              textTransform: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              bgcolor: '#EF4444',
              '&:hover': { bgcolor: '#DC2626' }
            }}
          >
            {deleting ? <CircularProgress size={18} color="inherit" /> : 'Delete Project'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Manage Categories Modal (Admin Only) ── */}
      <Dialog
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '18px',
            p: 1,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 18, color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                bgcolor: '#EFF6FF',
                color: '#0088FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <TagIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: 16.5, color: '#0F172A', lineHeight: 1.2 }}>
                Manage Project Categories
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#64748B' }}>
                Add, rename or delete project categories
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setCategoryModalOpen(false)} sx={{ color: '#94A3B8' }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1.5 }}>
          {/* Add Category Input */}
          <Box component="form" onSubmit={handleAddCategory} sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="New category name (e.g. DevOps)"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: 13 } }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={addingCategory || !newCategoryName.trim()}
              sx={{
                bgcolor: '#0088FF',
                color: '#FFFFFF',
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: 13,
                px: 2,
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: '#0070D2' }
              }}
            >
              {addingCategory ? <CircularProgress size={16} color="inherit" /> : 'Add'}
            </Button>
          </Box>

          {/* List of Categories */}
          <Paper variant="outlined" sx={{ borderRadius: '12px', borderColor: '#E2E8F0', maxHeight: 320, overflowY: 'auto' }}>
            <List disablePadding>
              {categories.map((cat, idx) => {
                const catName = typeof cat === 'string' ? cat : cat.name;
                const isEditing = editingCategoryId === cat._id;
                return (
                  <ListItem
                    key={cat._id || idx}
                    divider={idx < categories.length - 1}
                    sx={{
                      py: 1,
                      px: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    {isEditing ? (
                      <Stack direction="row" spacing={1} sx={{ width: '100%' }} alignItems="center">
                        <TextField
                          size="small"
                          fullWidth
                          value={editingCategoryName}
                          onChange={(e) => setEditingCategoryName(e.target.value)}
                          autoFocus
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 13 } }}
                        />
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleUpdateCategory(cat._id)}
                          disabled={!editingCategoryName.trim()}
                        >
                          <SaveIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingCategoryId(null);
                            setEditingCategoryName('');
                          }}
                        >
                          <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Stack>
                    ) : (
                      <>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <Box sx={{ color: '#0088FF', display: 'flex', alignItems: 'center' }}>
                            {renderCategoryIcon(catName)}
                          </Box>
                          <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#1E293B' }}>
                            {catName}
                          </Typography>
                        </Stack>

                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Rename Category">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingCategoryId(cat._id);
                                setEditingCategoryName(catName);
                              }}
                              sx={{ color: '#0284C7' }}
                            >
                              <EditIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Category">
                            <IconButton
                              size="small"
                              onClick={() => handleRequestDeleteCategory(cat)}
                              sx={{ color: '#EF4444' }}
                            >
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </>
                    )}
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            onClick={() => setCategoryModalOpen(false)}
            variant="contained"
            sx={{
              bgcolor: '#0088FF',
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '10px',
              px: 3,
              '&:hover': { bgcolor: '#0070D2' }
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Custom Popup View for Category Deletion (NO browser alerts!) ── */}
      <Dialog
        open={categoryDeleteDialogOpen}
        onClose={() => !deletingCategory && setCategoryDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '18px',
            p: 1,
            boxShadow: '0 20px 40px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: 18, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EF4444',
              flexShrink: 0
            }}
          >
            <DeleteForeverIcon sx={{ fontSize: 22 }} />
          </Box>
          Delete Category?
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: '#64748B', lineHeight: 1.6 }}>
            Are you sure you want to delete the <strong>"{categoryToDelete?.name}"</strong> category? Existing projects in this category will be reassigned to "Other".
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setCategoryDeleteDialogOpen(false)}
            disabled={deletingCategory}
            sx={{ textTransform: 'none', borderRadius: '10px', fontWeight: 600, color: '#64748B', borderColor: '#E2E8F0' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDeleteCategory}
            disabled={deletingCategory}
            sx={{
              textTransform: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              bgcolor: '#EF4444',
              '&:hover': { bgcolor: '#DC2626' }
            }}
          >
            {deletingCategory ? <CircularProgress size={18} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
