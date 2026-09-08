import { useQuery, useMutation, useQueryClient } from "react-query";
import API from "../../api";

export const crmKeys = {
  metadata: ["crm-metadata"],
  leads: (params) => ["crm-leads", params],
  fieldUsage: (fieldId) => ["field-usage", fieldId],
};

// Hook to fetch CRM metadata (custom fields, groups, statuses, assignees)
export function useCrmMeta() {
  return useQuery(crmKeys.metadata, async () => {
    const response = await API.get("/crm/metadata");
    return response.data.data;
  }, {
    staleTime: 30000,
    keepPreviousData: true
  });
}

// Hook to fetch directory/leads list with search and filters
export function useLeads(params) {
  return useQuery(crmKeys.leads(params), async () => {
    const response = await API.get("/users", { params });
    return response.data;
  }, {
    keepPreviousData: true,
    staleTime: 5000
  });
}

// Hook to manage custom field mutations
export function useCustomFieldMutations() {
  const queryClient = useQueryClient();

  const create = useMutation(
    async (data) => {
      const response = await API.post("/crm/custom-fields", data);
      return response.data.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(crmKeys.metadata);
      },
    }
  );

  const remove = useMutation(
    async (id) => {
      const response = await API.delete(`/crm/custom-fields/${id}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(crmKeys.metadata);
      },
    }
  );

  const saveLayout = useMutation(
    async (fields) => {
      const response = await API.put("/crm/custom-fields/layout", fields);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(crmKeys.metadata);
      },
    }
  );

  const fetchUsage = async (fieldId) => {
    const response = await API.get(`/crm/custom-fields/${fieldId}/usage`);
    return response.data.usage;
  };

  return { create, remove, saveLayout, fetchUsage };
}

// Hook to manage status groups mutations
export function useStatusGroupMutations() {
  const queryClient = useQueryClient();

  const createGroup = useMutation(
    async (data) => {
      const response = await API.post("/crm/status-groups", data);
      return response.data.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(crmKeys.metadata);
      },
    }
  );

  const updateGroup = useMutation(
    async ({ id, data }) => {
      const response = await API.put(`/crm/status-groups/${id}`, data);
      return response.data.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(crmKeys.metadata);
      },
    }
  );

  const deleteGroup = useMutation(
    async (id) => {
      const response = await API.delete(`/crm/status-groups/${id}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(crmKeys.metadata);
      },
    }
  );

  const reorderGroups = useMutation(
    async (payload) => {
      const response = await API.put("/crm/status-groups/reorder", payload);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(crmKeys.metadata);
      },
    }
  );

  return { createGroup, updateGroup, deleteGroup, reorderGroups };
}

// Hook to manage individual status stages mutations
export function useStatusMutations() {
  const queryClient = useQueryClient();

  const createStatus = useMutation(
    async (data) => {
      const response = await API.post("/crm/statuses", data);
      return response.data.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(crmKeys.metadata);
      },
    }
  );

  const updateStatus = useMutation(
    async ({ id, data }) => {
      const response = await API.put(`/crm/statuses/${id}`, data);
      return response.data.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(crmKeys.metadata);
      },
    }
  );

  const deleteStatus = useMutation(
    async (id) => {
      const response = await API.delete(`/crm/statuses/${id}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(crmKeys.metadata);
      },
    }
  );

  const orderStatuses = useMutation(
    async (payload) => {
      const response = await API.put("/crm/statuses/reorder", payload);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(crmKeys.metadata);
      },
    }
  );

  return { createStatus, updateStatus, deleteStatus, orderStatuses };
}

// Hook to manage lead (user) updates and mutations
export function useLeadMutations() {
  const queryClient = useQueryClient();

  const update = useMutation(
    async ({ id, data }) => {
      const response = await API.patch(`/users/${id}`, data);
      return response.data.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["crm-leads"]);
      },
    }
  );

  const updateField = useMutation(
    async ({ id, field, value }) => {
      // Find the user, adjust lead_data for custom field
      const userRes = await API.get(`/users/${id}`);
      const user = userRes.data.data.user;
      
      const currentLeadData = [...(user.lead_data || [])];
      const entryIdx = currentLeadData.findIndex(
        (entry) => String(entry.customField?._id || entry.customField) === String(field)
      );

      if (entryIdx > -1) {
        currentLeadData[entryIdx].value = value;
      } else {
        currentLeadData.push({ customField: field, value });
      }

      const response = await API.patch(`/users/${id}`, { lead_data: currentLeadData });
      return response.data.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["crm-leads"]);
      },
    }
  );

  const createLead = useMutation(
    async (data) => {
      const response = await API.post("/users", data);
      return response.data.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["crm-leads"]);
      },
    }
  );

  const deleteLead = useMutation(
    async (id) => {
      const response = await API.delete(`/users/${id}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["crm-leads"]);
      },
    }
  );

  return { update, updateField, createLead, deleteLead };
}
