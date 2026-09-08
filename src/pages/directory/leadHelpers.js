export const INTERNAL_SLUGS = {
  NAME: "name",
  EMAIL: "email",
  PHONE: "phone",
  ROLE: "role",
  STATUS: "status",
  GENDER: "gender",
  JOINING_DATE: "joiningdate",
  ADHAAR: "adhaar",
  REGISTRATION_NUMBER: "registrationNumber",
  LOCAL_LANGUAGE_DETAILS: "localLanguageDetails",
  STREET: "address.street",
  AREA: "address.area",
  LANDMARK: "address.landmark",
  LOCATION: "address.location",
  CITY: "address.city",
  DISTRICT: "address.district",
  TALUK: "address.taluk",
  PINCODE: "address.pincode",
  COLLEGE: "education.college",
  COURSE: "education.course",
  START_MONTH: "education.startMonth",
  START_YEAR: "education.startYear",
  END_MONTH: "education.endMonth",
  END_YEAR: "education.endYear",
  OCCUPATION: "employment.occupation",
  ORGANIZATION: "employment.organization",
  INDUSTRY: "employment.industry",
  WORK_LOCATION: "employment.workLocation",
  EMPLOYMENT_STATUS: "employment.employmentStatus",
  BUSINESS_NAME: "employment.businessName",
  BUSINESS_TYPE: "employment.businessType"
};

export const columnWidth = (field) => {
  if (field.slug === INTERNAL_SLUGS.NAME) return 220;
  if (field.slug === INTERNAL_SLUGS.EMAIL) return 260;
  if (field.slug === INTERNAL_SLUGS.PHONE) return 210;
  if (field.slug === INTERNAL_SLUGS.ROLE) return 170;
  if (field.slug === INTERNAL_SLUGS.STATUS) return 200;
  if (field.slug === INTERNAL_SLUGS.GENDER) return 130;
  if (field.slug === INTERNAL_SLUGS.JOINING_DATE) return 160;
  if (field.slug === INTERNAL_SLUGS.ADHAAR) return 190;
  if (field.slug === INTERNAL_SLUGS.REGISTRATION_NUMBER) return 190;
  if (field.slug === INTERNAL_SLUGS.LOCAL_LANGUAGE_DETAILS) return 260;
  if (field.slug?.endsWith("street")) return 180;
  if (field.slug?.endsWith("area")) return 150;
  if (field.slug?.endsWith("landmark")) return 150;
  if (field.slug?.endsWith("location")) return 180;
  if (field.slug?.endsWith("city")) return 130;
  if (field.slug?.endsWith("district")) return 130;
  if (field.slug?.endsWith("taluk")) return 130;
  if (field.slug?.endsWith("pincode")) return 100;
  if (field.slug?.includes("address")) return 300;
  if (field.slug?.includes("college") || field.slug?.includes("organization") || field.slug?.includes("institution")) return 220;
  return 150;
};

export const leadFieldValue = (lead, fieldId) => {
  const entry = (lead?.lead_data || []).find((d) => {
    const id = d?.customField?._id || d?.customField;
    return String(id) === String(fieldId);
  });
  return entry?.value ?? "";
};

export const refId = (value) => {
  if (!value) return "";
  if (typeof value === "object") return String(value._id ?? "");
  return String(value);
};

export const refName = (value, fallback = "") => {
  if (value && typeof value === "object") {
    return value.name || value.full_name || fallback;
  }
  return fallback;
};

const formatAddress = (addr) => {
  if (!addr) return "";
  const parts = [
    addr.street,
    addr.area,
    addr.landmark,
    addr.location,
    addr.city,
    addr.district,
    addr.taluk,
    addr.pincode
  ].filter(Boolean);
  return parts.join(", ");
};

export const toRow = (lead) => ({
  id: String(lead._id || lead.id),
  raw: lead,
  name: lead.name,
  email: lead.email,
  phone: lead.phone,
  role: lead.role,
  statusId: refId(lead.status),
  statusName: lead.status?.name || lead.status || "",
  gender: lead.gender,
  joiningDate: lead.joiningDate,
  profilePhoto: lead.profilePhoto,
  adhaar: lead.adhaar,
  registrationNumber: lead.registrationNumber,
  localLanguageDetails: lead.localLanguageDetails,
  "address.street": lead.address?.street || "",
  "address.area": lead.address?.area || "",
  "address.landmark": lead.address?.landmark || "",
  "address.location": lead.address?.location || "",
  "address.city": lead.address?.city || "",
  "address.district": lead.address?.district || "",
  "address.taluk": lead.address?.taluk || "",
  "address.pincode": lead.address?.pincode || "",
  "education.college": lead.education?.college,
  "education.course": lead.education?.course,
  "education.startMonth": lead.education?.startMonth,
  "education.startYear": lead.education?.startYear,
  "education.endMonth": lead.education?.endMonth,
  "education.endYear": lead.education?.endYear,
  "employment.occupation": lead.employment?.occupation,
  "employment.organization": lead.employment?.organization,
  "employment.industry": lead.employment?.industry,
  "employment.workLocation": lead.employment?.workLocation,
  "employment.employmentStatus": lead.employment?.employmentStatus,
  "employment.businessName": lead.employment?.businessName,
  "employment.businessType": lead.employment?.businessType
});

export const formatLeadDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
