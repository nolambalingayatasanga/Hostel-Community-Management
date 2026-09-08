import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  Container,
  Box,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import { useQuery } from "react-query";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

// hooks
import useSettings from "src/hooks/useSettings";

// components
import Page from "src/components/Page";
import Iconify from "src/components/Iconify";
import { PATH_DASHBOARD } from "src/routes/paths";
import { CustomDateRangePicker } from "src/components/customized/calenders";
import Row1Graphs from "./Row1Graphs";
import Row2Graphs from "./Row2Graphs";

// services
import { getPartnerDetailsFromDomain } from "src/services/register/getPartnerDetailsFromDomain";
import { getAccessToken } from "src/services/register/getAccessToken";

// utils
import axios from "src/utils/axios";
import crmEndpoints from "src/utils/crm/endpoints";



// ----------------------------------------------------------------------

export default function Overview() {
  useSettings();
  const navigate = useNavigate();

  // Date range state matching -30 days from current date
  const [selectedStartDate, setSelectedStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [selectedEndDate, setSelectedEndDate] = useState(new Date());

  const handleRedirect = async () => {
    try {
      const url = new URL(window.location.href);
      const hostname = url.hostname.replace(/^www\./, "");

      const partnerData = await getPartnerDetailsFromDomain(hostname);

      const crmDomain = partnerData?.metadata?.crm_domain;
      if (!crmDomain) {
        console.error("CRM Domain is missing in partner details metadata.");
        return;
      }

      const currentOrg = JSON.parse(localStorage.getItem("currentOrganization")) || {};
      const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
      const orgId = currentOrg._id;
      const userId = currentUser._id;

      if (!orgId || !userId) {
        console.error("User or Organization ID is missing in local storage.");
        return;
      }

      const accessToken = await getAccessToken(userId, orgId);

      window.open(
        `https://${crmDomain}/auth/jwt/sso/?auth=${accessToken}&organization=${orgId}`,
        "_blank"
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleDateRangeChange = (range) => {
    if (range?.startDate) {
      setSelectedStartDate(new Date(range.startDate));
    }
    if (range?.endDate) {
      setSelectedEndDate(new Date(range.endDate));
    }
  };

  // Fetch logged in user's name
  const user = JSON.parse(localStorage.getItem("currentUser")) || {};
  const userName = user.name || "Chethan Kumar";
  const greeting = `Good Morning, ${userName}`;

  const dateParams = {
    startDate: selectedStartDate.toISOString(),
    endDate: selectedEndDate.toISOString(),
  };

  // 1. Fetch Overview (Metrics cards data)
  const { data: apiOverview } = useQuery(
    ["crm-overview-metrics", dateParams.startDate, dateParams.endDate],
    async () => {
      const response = await axios.get(crmEndpoints.insights.overview, { params: dateParams });
      console.log("INSIGHTS: crm-overview-metrics ->", response.data);
      return response.data;
    },
    { retry: false, enabled: !!dateParams.startDate && !!dateParams.endDate }
  );

  // 2. Fetch Tag distribution
  const { data: apiByTags } = useQuery(
    ["crm-overview-tags", dateParams.startDate, dateParams.endDate],
    async () => {
      const response = await axios.get(crmEndpoints.insights.byTags, { params: dateParams });
      console.log("INSIGHTS: crm-overview-tags ->", response.data);
      return response.data;
    },
    { retry: false, enabled: !!dateParams.startDate && !!dateParams.endDate }
  );

  // 3. Fetch Source / Status Group distribution
  const { data: apiBySource } = useQuery(
    ["crm-overview-source", dateParams.startDate, dateParams.endDate],
    async () => {
      const response = await axios.get(crmEndpoints.insights.bySource, { params: dateParams });
      console.log("INSIGHTS: crm-overview-source ->", response.data);
      return response.data;
    },
    { retry: false, enabled: !!dateParams.startDate && !!dateParams.endDate }
  );
  const { data: apiByStatusGroup } = useQuery(
    ["crm-overview-statusgroup", dateParams.startDate, dateParams.endDate],
    async () => {
      const response = await axios.get(crmEndpoints.insights.byStatusGroup, { params: dateParams });
      console.log("INSIGHTS: crm-overview-statusgroup ->", response.data);
      return response.data;
    },
    { retry: false, enabled: !!dateParams.startDate && !!dateParams.endDate }
  );

  // 4. Fetch FRP (First Response Time data)
  const { data: apiFrp } = useQuery(
    ["crm-overview-frp", dateParams.startDate, dateParams.endDate],
    async () => {
      const response = await axios.get(crmEndpoints.insights.frp, { params: dateParams });
      console.log("INSIGHTS: crm-overview-frp ->", response.data);
      return response.data;
    },
    { retry: false, enabled: !!dateParams.startDate && !!dateParams.endDate }
  );

  // 5. Fetch Monthly status distribution
  const { data: apiByStatusAndDate } = useQuery(
    ["crm-overview-status-date", dateParams.startDate, dateParams.endDate],
    async () => {
      const response = await axios.get(crmEndpoints.insights.byStatusAndDate, { params: dateParams });
      console.log("INSIGHTS: crm-overview-status-date ->", response.data);
      return response.data;
    },
    { retry: false, enabled: !!dateParams.startDate && !!dateParams.endDate }
  );

  // Fallback metric card values
  const totalLeadsCount = apiOverview?.totalLeads ?? 235;
  const newLeadsCount = apiOverview?.newLeads ?? 235;
  const inProgressCount = apiOverview?.inProgress ?? 235;
  const convertedCount = apiOverview?.converted ?? 235;



  return (
    <Page title="CRM Overview">
      <Container maxWidth={false} sx={{ pb: 4 }}>

        {/* Header Section */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
          <Stack spacing={1.5}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#111827" }}>
              {greeting}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <CustomDateRangePicker
                onFilterRange={handleDateRangeChange}
                start={selectedStartDate}
                end={selectedEndDate}
                incApply
                compact
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    borderColor: "#EAECF0",
                    height: 40,
                    bgcolor: "white",
                  },
                }}
              />
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              startIcon={<OpenInNewIcon />}
              color="secondary"
              onClick={handleRedirect}
              sx={{
                borderRadius: "8px",
                textTransform: "none",
                boxShadow: "none",
                fontWeight: 600,
                bgcolor: "#0088ff",
                fontSize: "13px",
                px: 2.5,
                py: 1,
              }}
            >
              Legacy CRM
            </Button>
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => navigate(PATH_DASHBOARD.crm.account.settings.root)}
              sx={{
                bgcolor: "#0084FF",
                color: "white",
                borderRadius: "8px",
                textTransform: "none",
                boxShadow: "none",
                fontWeight: 600,
                fontSize: "13px",
                px: 2.5,
                py: 1,
                "&:hover": { bgcolor: "#0073de", boxShadow: "none" },
              }}
            >
              New Status Group
            </Button>
          </Stack>
        </Stack>

        <Row1Graphs
          totalLeads={totalLeadsCount}
          newLeads={newLeadsCount}
          inProgress={inProgressCount}
          converted={convertedCount}
        />

        <Row2Graphs apiFrp={apiFrp} apiByStatusAndDate={apiByStatusAndDate} />

      </Container>
    </Page>
  );
}
