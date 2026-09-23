import React from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Stack,
  Button,
  CircularProgress
} from '@mui/material';
import {
  Share as ShareIcon,
  Language as WebIcon,
  GitHub as GitHubIcon,
  LinkedIn as LinkedInIcon,
  Instagram as InstagramIcon,
  OpenInNew as OpenInNewIcon,
  ContentCopy as ContentCopyIcon,
  PictureAsPdf as PictureAsPdfIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  FileDownload as DownloadIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { BehanceIcon, normalizeChannelUrl } from './profileHelpers';

export default function ChannelsSection({
  channels,
  setChannels,
  canEdit,
  handleCopyLink,
  resumeUploading,
  resumeDeleting,
  handleResumeUpload,
  handleDeleteResume,
  resumeInputRef
}) {
  return (
    <Box>
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 700,
          color: '#1E293B',
          mb: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <ShareIcon sx={{ color: '#0A66C2', fontSize: 20 }} /> Channels & Portfolio
      </Typography>

      <Grid container spacing={2.5}>
        {/* Portfolio Website */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
            Portfolio Website
          </Typography>
          <TextField
            fullWidth
            size="small"
            disabled={!canEdit}
            placeholder="https://yourportfolio.com"
            value={channels.portfolio || ''}
            onChange={(e) => setChannels((prev) => ({ ...prev, portfolio: e.target.value }))}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <WebIcon sx={{ color: '#0284C7', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: channels.portfolio && (
                  <InputAdornment position="end" sx={{ pointerEvents: 'auto' }}>
                    <Tooltip title="Open Portfolio">
                      <IconButton
                        size="small"
                        edge="end"
                        component="a"
                        href={normalizeChannelUrl(channels.portfolio, 'portfolio')}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: '#0284C7' }}
                      >
                        <OpenInNewIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Copy link">
                      <IconButton
                        size="small"
                        edge="end"
                        onClick={() =>
                          handleCopyLink(
                            normalizeChannelUrl(channels.portfolio, 'portfolio'),
                            'Portfolio link'
                          )
                        }
                        sx={{ color: '#64748B', ml: 0.5 }}
                      >
                        <ContentCopyIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                )
              }
            }}
          />
        </Grid>

        {/* GitHub */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
            GitHub
          </Typography>
          <TextField
            fullWidth
            size="small"
            disabled={!canEdit}
            placeholder="https://github.com/username"
            value={channels.github || ''}
            onChange={(e) => setChannels((prev) => ({ ...prev, github: e.target.value }))}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <GitHubIcon sx={{ color: '#24292E', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: channels.github && (
                  <InputAdornment position="end" sx={{ pointerEvents: 'auto' }}>
                    <Tooltip title="Open GitHub">
                      <IconButton
                        size="small"
                        edge="end"
                        component="a"
                        href={normalizeChannelUrl(channels.github, 'github')}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: '#24292E' }}
                      >
                        <OpenInNewIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Copy link">
                      <IconButton
                        size="small"
                        edge="end"
                        onClick={() =>
                          handleCopyLink(
                            normalizeChannelUrl(channels.github, 'github'),
                            'GitHub link'
                          )
                        }
                        sx={{ color: '#64748B', ml: 0.5 }}
                      >
                        <ContentCopyIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                )
              }
            }}
          />
        </Grid>

        {/* Behance */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
            Behance
          </Typography>
          <TextField
            fullWidth
            size="small"
            disabled={!canEdit}
            placeholder="https://behance.net/username"
            value={channels.behance || ''}
            onChange={(e) => setChannels((prev) => ({ ...prev, behance: e.target.value }))}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <BehanceIcon sx={{ color: '#0057FF', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: channels.behance && (
                  <InputAdornment position="end" sx={{ pointerEvents: 'auto' }}>
                    <Tooltip title="Open Behance">
                      <IconButton
                        size="small"
                        edge="end"
                        component="a"
                        href={normalizeChannelUrl(channels.behance, 'behance')}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: '#0057FF' }}
                      >
                        <OpenInNewIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Copy link">
                      <IconButton
                        size="small"
                        edge="end"
                        onClick={() =>
                          handleCopyLink(
                            normalizeChannelUrl(channels.behance, 'behance'),
                            'Behance link'
                          )
                        }
                        sx={{ color: '#64748B', ml: 0.5 }}
                      >
                        <ContentCopyIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                )
              }
            }}
          />
        </Grid>

        {/* LinkedIn */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
            LinkedIn
          </Typography>
          <TextField
            fullWidth
            size="small"
            disabled={!canEdit}
            placeholder="https://linkedin.com/in/username"
            value={channels.linkedin || ''}
            onChange={(e) => setChannels((prev) => ({ ...prev, linkedin: e.target.value }))}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkedInIcon sx={{ color: '#0A66C2', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: channels.linkedin && (
                  <InputAdornment position="end" sx={{ pointerEvents: 'auto' }}>
                    <Tooltip title="Open LinkedIn">
                      <IconButton
                        size="small"
                        edge="end"
                        component="a"
                        href={normalizeChannelUrl(channels.linkedin, 'linkedin')}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: '#0A66C2' }}
                      >
                        <OpenInNewIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Copy link">
                      <IconButton
                        size="small"
                        edge="end"
                        onClick={() =>
                          handleCopyLink(
                            normalizeChannelUrl(channels.linkedin, 'linkedin'),
                            'LinkedIn link'
                          )
                        }
                        sx={{ color: '#64748B', ml: 0.5 }}
                      >
                        <ContentCopyIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                )
              }
            }}
          />
        </Grid>

        {/* Instagram */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.75 }}>
            Instagram
          </Typography>
          <TextField
            fullWidth
            size="small"
            disabled={!canEdit}
            placeholder="https://instagram.com/username"
            value={channels.instagram || ''}
            onChange={(e) => setChannels((prev) => ({ ...prev, instagram: e.target.value }))}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <InstagramIcon sx={{ color: '#E1306C', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: channels.instagram && (
                  <InputAdornment position="end" sx={{ pointerEvents: 'auto' }}>
                    <Tooltip title="Open Instagram">
                      <IconButton
                        size="small"
                        edge="end"
                        component="a"
                        href={normalizeChannelUrl(channels.instagram, 'instagram')}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: '#E1306C' }}
                      >
                        <OpenInNewIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Copy link">
                      <IconButton
                        size="small"
                        edge="end"
                        onClick={() =>
                          handleCopyLink(
                            normalizeChannelUrl(channels.instagram, 'instagram'),
                            'Instagram link'
                          )
                        }
                        sx={{ color: '#64748B', ml: 0.5 }}
                      >
                        <ContentCopyIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                )
              }
            }}
          />
        </Grid>

        {/* Resume Card */}
        <Grid size={{ xs: 12 }}>
          <Box
            sx={{
              mt: 1,
              p: 2.5,
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              bgcolor: '#F8FAFC',
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'flex-start', md: 'center' },
              justifyContent: 'space-between',
              gap: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  bgcolor: channels.resume?.url ? '#FEE2E2' : '#F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: channels.resume?.url ? '#DC2626' : '#94A3B8',
                  flexShrink: 0
                }}
              >
                <PictureAsPdfIcon sx={{ fontSize: 26 }} />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', fontSize: '0.95rem' }}>
                  Resume
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mt: 0.25, wordBreak: 'break-all' }}>
                  {channels.resume?.url
                    ? channels.resume?.filename || 'Resume document'
                    : 'No resume document uploaded yet'}
                </Typography>
                {channels.resume?.uploadedAt && (
                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 0.25 }}>
                    {dayjs(channels.resume.uploadedAt).format('DD MMM YYYY')}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Actions */}
            <Stack
              direction="row"
              spacing={1}
              sx={{
                flexWrap: 'wrap',
                gap: 1,
                width: { xs: '100%', md: 'auto' },
                justifyContent: { xs: 'flex-start', md: 'flex-end' },
                alignItems: 'center'
              }}
            >
              {channels.resume?.url ? (
                <>
                  <Button
                    component="a"
                    href={channels.resume.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    variant="contained"
                    startIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      bgcolor: '#2563EB',
                      boxShadow: 'none',
                      '&:hover': { bgcolor: '#1D4ED8', boxShadow: 'none' }
                    }}
                  >
                    Preview
                  </Button>

                  {canEdit && (
                    <>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => resumeInputRef.current?.click()}
                        disabled={resumeUploading}
                        startIcon={
                          resumeUploading ? (
                            <CircularProgress size={14} />
                          ) : (
                            <CloudUploadIcon sx={{ fontSize: 16 }} />
                          )
                        }
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.8125rem',
                          color: '#334155',
                          borderColor: '#CBD5E1',
                          bgcolor: '#FFFFFF',
                          '&:hover': { bgcolor: '#F8FAFC', borderColor: '#94A3B8' }
                        }}
                      >
                        {resumeUploading ? 'Replacing...' : 'Update Resume'}
                      </Button>
                      <Tooltip title="Remove Resume">
                        <IconButton
                          size="small"
                          onClick={handleDeleteResume}
                          disabled={resumeDeleting}
                          sx={{
                            borderRadius: '8px',
                            border: '1px solid #FECACA',
                            bgcolor: '#FEF2F2',
                            color: '#DC2626',
                            p: 0.8,
                            '&:hover': { bgcolor: '#FEE2E2', color: '#B91C1C' }
                          }}
                        >
                          {resumeDeleting ? (
                            <CircularProgress size={16} color="error" />
                          ) : (
                            <DeleteIcon sx={{ fontSize: 16 }} />
                          )}
                        </IconButton>
                      </Tooltip>
                    </>
                  )}

                  <Tooltip title="Download Resume">
                    <IconButton
                      component="a"
                      href={channels.resume.url}
                      download={channels.resume?.filename || 'Resume.pdf'}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                      sx={{
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        bgcolor: '#FFFFFF',
                        color: '#475569',
                        p: 0.8,
                        '&:hover': { bgcolor: '#F1F5F9', color: '#1E293B' }
                      }}
                    >
                      <DownloadIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </>
              ) : (
                canEdit && (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => resumeInputRef.current?.click()}
                    disabled={resumeUploading}
                    startIcon={
                      resumeUploading ? (
                        <CircularProgress size={14} sx={{ color: '#fff' }} />
                      ) : (
                        <CloudUploadIcon sx={{ fontSize: 16 }} />
                      )
                    }
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      bgcolor: '#2563EB',
                      boxShadow: 'none',
                      '&:hover': { bgcolor: '#1D4ED8', boxShadow: 'none' }
                    }}
                  >
                    {resumeUploading ? 'Uploading...' : 'Upload Resume'}
                  </Button>
                )
              )}
            </Stack>
          </Box>

          <input
            type="file"
            ref={resumeInputRef}
            style={{ display: 'none' }}
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            onChange={handleResumeUpload}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
