import PropTypes from "prop-types";
import { useState } from "react";
import {
  Box,
  Tab,
  Tabs,
  Paper,
  Stack,
  Dialog,
  IconButton,
  Typography,
  DialogTitle,
  DialogContent,
  Grid,
  Divider,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

import LeadFieldsPanel from "./LeadFieldsPanel";
import { formatLeadDate } from "./leadHelpers";

const getMonthName = (m) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[m - 1] || '';
};

function DetailRow({ label, value }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ py: 0.5 }}>
      <Typography variant="body2" sx={{ width: 120, flexShrink: 0, color: "#667085", fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: "#D0D5DD" }}>
        |
      </Typography>
      <Typography variant="body2" sx={{ flex: 1, color: "#101828", fontWeight: 600 }}>
        {value || "—"}
      </Typography>
    </Stack>
  );
}

DetailRow.propTypes = { label: PropTypes.string, value: PropTypes.node };

export default function LeadDetailsDialog({ open, onClose, lead, customFields }) {
  const [tab, setTab] = useState(0);

  if (!lead) return null;

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={onClose} scroll="paper" PaperProps={{ sx: { borderRadius: "16px" } }}>
      <IconButton
        onClick={onClose}
        sx={{ position: "absolute", right: 12, top: 12, color: "#98A2B3" }}
      >
        <CloseIcon />
      </IconButton>

      <DialogTitle sx={{ fontWeight: 700, pb: 1, pt: 2.5 }}>Member Profile Details</DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Stack spacing={3.5}>
          {/* Header Card Summary */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: "12px", border: "1px solid #EAECF0", bgcolor: "#F8FAFC" }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <DetailRow label="Name" value={lead.name} />
                <DetailRow label="Role" value={lead.role} />
                <DetailRow label="Pipeline Status" value={lead.statusName || "—"} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailRow label="Email" value={lead.email} />
                <DetailRow label="Phone" value={lead.phone} />
                <DetailRow label="Joining Date" value={formatLeadDate(lead.joiningDate)} />
              </Grid>
            </Grid>
          </Paper>

          <Box sx={{ width: "100%" }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs
                value={tab}
                onChange={(e, next) => setTab(next)}
                sx={{
                  "& .MuiTabs-indicator": { bgcolor: "#0088ff" },
                  "& .MuiTab-root.Mui-selected": { color: "#0088ff" }
                }}
              >
                <Tab label="Detailed Info" sx={{ textTransform: "none", fontWeight: 600 }} />
                <Tab label="Custom Fields" sx={{ textTransform: "none", fontWeight: 600 }} />
              </Tabs>
            </Box>

            <Box sx={{ pt: 3 }}>
              {tab === 0 && (
                <Grid container spacing={3}>
                  {/* Personal info */}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ color: "#0088ff", mb: 1, fontWeight: 700 }}>
                      Personal Information
                    </Typography>
                    <DetailRow label="Gender" value={lead.gender} />
                    <DetailRow label="Adhaar" value={lead.raw?.adhaar} />
                    {lead.role !== 'STUDENT' && <DetailRow label="Reg Number" value={lead.raw?.registrationNumber || lead.raw?.memberInfo?.registrationNo} />}
                    {lead.raw?.receiptNo || lead.raw?.memberInfo?.receiptNo ? <DetailRow label="Receipt No" value={lead.raw?.receiptNo || lead.raw?.memberInfo?.receiptNo} /> : null}
                    {lead.raw?.memberInfo?.slNo ? <DetailRow label="SL NO" value={lead.raw?.memberInfo?.slNo} /> : null}
                    {lead.raw?.relation?.relatedPersonName ? (
                      <DetailRow label="Relation" value={`${lead.raw.relation.relationshipType || ''} ${lead.raw.relation.relatedPersonName}`} />
                    ) : null}
                    <DetailRow label="Local Details" value={lead.raw?.localLanguageDetails || lead.raw?.memberInfo?.rawNameAddressKannada} />
                  </Grid>

                  {/* Education info */}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ color: "#0088ff", mb: 1, fontWeight: 700 }}>
                      Education Details
                    </Typography>
                    <DetailRow label="College" value={lead.raw?.education?.college} />
                    <DetailRow label="Course" value={lead.raw?.education?.course} />
                    {lead.raw?.education && (
                      <DetailRow
                        label="Timeline"
                        value={`${getMonthName(lead.raw.education.startMonth)} ${lead.raw.education.startYear || "—"} to ${getMonthName(lead.raw.education.endMonth)} ${lead.raw.education.endYear || "—"}`}
                      />
                    )}
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>

                  {/* Employment details */}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ color: "#0088ff", mb: 1, fontWeight: 700 }}>
                      Employment Details
                    </Typography>
                    <DetailRow label="Occupation" value={lead.raw?.employment?.occupation} />
                    <DetailRow label="Organization" value={lead.raw?.employment?.organization} />
                    <DetailRow label="Industry" value={lead.raw?.employment?.industry} />
                  </Grid>

                  {/* Address info */}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ color: "#0088ff", mb: 1, fontWeight: 700 }}>
                      Address Details
                    </Typography>
                    <DetailRow
                      label="Address"
                      value={
                        lead.raw?.address
                          ? [
                              lead.raw.address.street,
                              lead.raw.address.area,
                              lead.raw.address.landmark,
                              lead.raw.address.location,
                              lead.raw.address.city,
                              lead.raw.address.district,
                              lead.raw.address.taluk,
                              lead.raw.address.pincode
                            ].filter(Boolean).join(", ")
                          : "—"
                      }
                    />
                  </Grid>
                </Grid>
              )}

              {tab === 1 && (
                <LeadFieldsPanel
                  lead={lead.raw}
                  customFields={customFields}
                  editable={true}
                />
              )}
            </Box>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

LeadDetailsDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  lead: PropTypes.object,
  customFields: PropTypes.array,
};

LeadDetailsDialog.defaultProps = { customFields: [] };
