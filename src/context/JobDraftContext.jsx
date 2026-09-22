import React, { createContext, useContext, useState, useEffect } from 'react';

const JobDraftContext = createContext(null);

const STORAGE_KEYS = {
  JOB_MODAL_OPEN: 'job_modal_open_state',
  JOB_FORM_DRAFT: 'job_form_draft_data',
  JOB_EDITING_DATA: 'job_editing_job_data',

  ORG_MODAL_OPEN: 'org_modal_open_state',
  ORG_FORM_DRAFT: 'org_form_draft_data',

  APPLY_MODAL_OPEN: 'apply_modal_open_state',
  APPLY_FORM_DRAFT: 'apply_form_draft_data',
  APPLY_JOB_DATA: 'apply_job_data_item',
};

export const INITIAL_JOB_FORM = {
  jobRole: '',
  jobType: '',
  location: '',
  salaryRange: '',
  experienceYears: '',
  educationQualification: '',
  description: '',
  resumeRequired: true,
  documentsRequired: [],
  interviewMode: '',
  interviewStartDate: '',
  interviewEndDate: '',
  interviewStartTime: '',
  interviewEndTime: '',
  interviewTiming: '',
  meetingLink: '',
  googleMapLink: '',
  offlineAddress: {
    venueName: '',
    street: '',
    landmark: '',
    city: '',
    state: '',
    pincode: ''
  },
  interviewLocation: '',
  openingsCount: 1
};

export const INITIAL_ORG_FORM = {
  name: '',
  industry: '',
  headOfficeLocation: [],
  operatingLocations: [],
  establishedYear: '',
  numberOfEmployees: '',
  yearsOperating: '',
  description: '',
  website: '',
  contactEmail: '',
  contactPhone: ''
};

export const INITIAL_APPLY_FORM = {
  applicantName: '',
  applicantEmail: '',
  applicantPhone: '',
  experience: '',
  education: '',
  coverNote: ''
};

const safeGetJSON = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch (err) {
    console.warn(`Error reading localStorage key "${key}":`, err);
    return fallback;
  }
};

export function JobDraftProvider({ children }) {
  // Job Post / Edit State
  const [jobDialogOpen, setJobDialogOpen] = useState(() => {
    return safeGetJSON(STORAGE_KEYS.JOB_MODAL_OPEN, false);
  });

  const [jobForm, setJobForm] = useState(() => {
    const saved = safeGetJSON(STORAGE_KEYS.JOB_FORM_DRAFT, null);
    return saved ? { ...INITIAL_JOB_FORM, ...saved } : INITIAL_JOB_FORM;
  });

  const [editingJob, setEditingJob] = useState(() => {
    return safeGetJSON(STORAGE_KEYS.JOB_EDITING_DATA, null);
  });

  // Organization Profile State
  const [orgDialogOpen, setOrgDialogOpen] = useState(() => {
    return safeGetJSON(STORAGE_KEYS.ORG_MODAL_OPEN, false);
  });

  const [orgForm, setOrgForm] = useState(() => {
    const saved = safeGetJSON(STORAGE_KEYS.ORG_FORM_DRAFT, null);
    return saved ? { ...INITIAL_ORG_FORM, ...saved } : INITIAL_ORG_FORM;
  });

  // Apply Modal State
  const [applyDialogOpen, setApplyDialogOpen] = useState(() => {
    return safeGetJSON(STORAGE_KEYS.APPLY_MODAL_OPEN, false);
  });

  const [applyForm, setApplyForm] = useState(() => {
    const saved = safeGetJSON(STORAGE_KEYS.APPLY_FORM_DRAFT, null);
    return saved ? { ...INITIAL_APPLY_FORM, ...saved } : INITIAL_APPLY_FORM;
  });

  const [applyingJob, setApplyingJob] = useState(() => {
    return safeGetJSON(STORAGE_KEYS.APPLY_JOB_DATA, null);
  });

  // Synchronize Job Form Draft & Open status to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.JOB_MODAL_OPEN, JSON.stringify(jobDialogOpen));
      localStorage.setItem(STORAGE_KEYS.JOB_FORM_DRAFT, JSON.stringify(jobForm));
      localStorage.setItem(STORAGE_KEYS.JOB_EDITING_DATA, JSON.stringify(editingJob));
    } catch (e) {
      console.warn('Failed saving job draft to localStorage:', e);
    }
  }, [jobDialogOpen, jobForm, editingJob]);

  // Synchronize Org Form Draft & Open status to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORG_MODAL_OPEN, JSON.stringify(orgDialogOpen));
      localStorage.setItem(STORAGE_KEYS.ORG_FORM_DRAFT, JSON.stringify(orgForm));
    } catch (e) {
      console.warn('Failed saving org draft to localStorage:', e);
    }
  }, [orgDialogOpen, orgForm]);

  // Synchronize Apply Form Draft & Open status to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.APPLY_MODAL_OPEN, JSON.stringify(applyDialogOpen));
      localStorage.setItem(STORAGE_KEYS.APPLY_FORM_DRAFT, JSON.stringify(applyForm));
      localStorage.setItem(STORAGE_KEYS.APPLY_JOB_DATA, JSON.stringify(applyingJob));
    } catch (e) {
      console.warn('Failed saving apply draft to localStorage:', e);
    }
  }, [applyDialogOpen, applyForm, applyingJob]);

  // Resets
  const resetJobDraft = () => {
    setJobDialogOpen(false);
    setEditingJob(null);
    setJobForm(INITIAL_JOB_FORM);
    try {
      localStorage.removeItem(STORAGE_KEYS.JOB_MODAL_OPEN);
      localStorage.removeItem(STORAGE_KEYS.JOB_FORM_DRAFT);
      localStorage.removeItem(STORAGE_KEYS.JOB_EDITING_DATA);
    } catch (e) {
      console.warn(e);
    }
  };

  const resetOrgDraft = () => {
    setOrgDialogOpen(false);
    setOrgForm(INITIAL_ORG_FORM);
    try {
      localStorage.removeItem(STORAGE_KEYS.ORG_MODAL_OPEN);
      localStorage.removeItem(STORAGE_KEYS.ORG_FORM_DRAFT);
    } catch (e) {
      console.warn(e);
    }
  };

  const resetApplyDraft = () => {
    setApplyDialogOpen(false);
    setApplyingJob(null);
    setApplyForm(INITIAL_APPLY_FORM);
    try {
      localStorage.removeItem(STORAGE_KEYS.APPLY_MODAL_OPEN);
      localStorage.removeItem(STORAGE_KEYS.APPLY_FORM_DRAFT);
      localStorage.removeItem(STORAGE_KEYS.APPLY_JOB_DATA);
    } catch (e) {
      console.warn(e);
    }
  };

  const value = {
    // Job Post/Edit
    jobDialogOpen,
    setJobDialogOpen,
    jobForm,
    setJobForm,
    editingJob,
    setEditingJob,
    resetJobDraft,

    // Org Profile
    orgDialogOpen,
    setOrgDialogOpen,
    orgForm,
    setOrgForm,
    resetOrgDraft,

    // Apply
    applyDialogOpen,
    setApplyDialogOpen,
    applyForm,
    setApplyForm,
    applyingJob,
    setApplyingJob,
    resetApplyDraft,
  };

  return (
    <JobDraftContext.Provider value={value}>
      {children}
    </JobDraftContext.Provider>
  );
}

export function useJobDraft() {
  const context = useContext(JobDraftContext);
  if (!context) {
    throw new Error('useJobDraft must be used within a JobDraftProvider');
  }
  return context;
}
