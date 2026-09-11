import React from "react";
import PropTypes from "prop-types";
import { Dialog, DialogContent } from "@mui/material";
import Profile from "../profile/Profile";

export default function LeadDetailsDialog({ open, onClose, lead, isCreate = false, onUserUpdated }) {
  if (!open) return null;
  if (!isCreate && !lead) return null;
  const leadId = lead ? String(lead._id || lead.id) : null;

  return (
    <Dialog
      fullWidth
      maxWidth="lg"
      open={open}
      onClose={onClose}
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: "16px",
          backgroundColor: "#F8FAFC",
          maxHeight: "92vh",
          overflow: "hidden"
        }
      }}
    >
      <DialogContent sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        <Profile
          userId={leadId}
          isCreate={isCreate}
          isDialog={true}
          onClose={onClose}
          onUserUpdated={onUserUpdated}
        />
      </DialogContent>
    </Dialog>
  );
}

LeadDetailsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  lead: PropTypes.object,
  isCreate: PropTypes.bool,
  onUserUpdated: PropTypes.func,
};
