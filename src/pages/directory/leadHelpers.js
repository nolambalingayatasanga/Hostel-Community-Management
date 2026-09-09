export const INTERNAL_SLUGS = {
  NAME: "name",
  EMAIL: "email",
  PHONE: "phone",
  ROLE: "role",
  STATUS: "status",
  GENDER: "gender",
  JOINING_DATE: "joiningdate",
  ADHAAR: "adhaar",
  SL_NO: "slNo",
  REGISTRATION_NUMBER: "registrationNumber",
  LOCAL_LANGUAGE_DETAILS: "localLanguageDetails",
  RECEIPT_NO: "receiptNo",
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
  const slug = (field.slug || "").toLowerCase();
  if (slug === "name") return 220;
  if (slug === "email") return 260;
  if (slug === "phone") return 210;
  if (slug === "role") return 170;
  if (slug === "status") return 200;
  if (slug === "gender") return 130;
  if (slug === "joiningdate") return 160;
  if (slug === "adhaar") return 190;
  if (slug === "slno") return 100;
  if (slug === "registrationnumber") return 190;
  if (slug === "receiptno") return 150;
  if (slug === "locallanguagedetails") return 320;
  if (slug.endsWith("street")) return 260;
  if (slug.endsWith("area")) return 150;
  if (slug.endsWith("landmark")) return 150;
  if (slug.endsWith("location")) return 180;
  if (slug.endsWith("city")) return 130;
  if (slug.endsWith("district")) return 140;
  if (slug.endsWith("taluk")) return 140;
  if (slug.endsWith("pincode")) return 100;
  if (slug.includes("address")) return 300;
  if (slug.includes("college") || slug.includes("organization") || slug.includes("institution")) return 220;
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

export const toRow = (lead) => {
  const regNo = lead.registrationNumber || lead.memberInfo?.registrationNo || "";
  const localDetails = lead.localLanguageDetails || lead.memberInfo?.rawNameAddressKannada || "";
  const receipt = lead.receiptNo || lead.memberInfo?.receiptNo || "";
  const slNoVal = lead.memberInfo?.slNo != null ? String(lead.memberInfo.slNo) : "";

  // Auto-compute age from DOB if missing
  let computedAge = lead.age;
  const dobVal = lead.dob || lead.dateOfBirth;
  if ((computedAge == null || computedAge === "") && dobVal) {
    const diff = Date.now() - new Date(dobVal).getTime();
    const a = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
    if (!isNaN(a) && a >= 0) computedAge = a;
  }

  return {
    id: String(lead._id || lead.id),
    raw: lead,
    name: lead.name || "",
    email: lead.email || "",
    phone: lead.phone || "",
    role: lead.role || "",
    statusId: refId(lead.status),
    statusName: lead.status?.name || lead.status || "",
    gender: lead.gender || "",
    age: computedAge != null && computedAge !== "" ? String(computedAge) : "",
    dob: dobVal || "",
    dateOfBirth: dobVal || "",
    joiningDate: lead.joiningDate || lead.memberInfo?.registeredDate || "",
    profilePhoto: lead.profilePhoto,
    adhaar: lead.adhaar || "",

    // Sl No (sequential)
    slNo: slNoVal,
    slno: slNoVal,

    // Registration Number
    registrationNumber: regNo,
    registrationnumber: regNo,

    // Receipt Number
    receiptNo: receipt,
    receiptno: receipt,

    // Local Language (Kannada)
    localLanguageDetails: localDetails,
    locallanguagedetails: localDetails,

    "address.street": lead.address?.street || "",
    "address.area": lead.address?.area || "",
    "address.landmark": lead.address?.landmark || "",
    "address.location": lead.address?.location || "",
    "address.city": lead.address?.city || "",
    "address.district": lead.address?.district || lead.memberInfo?.sourceSheet?.replace(/-\d+$/, '') || "",
    "address.taluk": lead.address?.taluk || "",
    "address.pincode": lead.address?.pincode || "",
    "education.college": lead.education?.college || "",
    "education.course": lead.education?.course || "",
    "education.startMonth": lead.education?.startMonth,
    "education.startmonth": lead.education?.startMonth,
    "education.startYear": lead.education?.startYear,
    "education.startyear": lead.education?.startYear,
    "education.endMonth": lead.education?.endMonth,
    "education.endmonth": lead.education?.endMonth,
    "education.endYear": lead.education?.endYear,
    "education.endyear": lead.education?.endYear,
    "employment.occupation": lead.employment?.occupation || "",
    "employment.organization": lead.employment?.organization || "",
    "employment.industry": lead.employment?.industry || "",
    "employment.workLocation": lead.employment?.workLocation || "",
    "employment.worklocation": lead.employment?.workLocation || "",
    "employment.employmentStatus": lead.employment?.employmentStatus || "",
    "employment.employmentstatus": lead.employment?.employmentStatus || "",
    "employment.businessName": lead.employment?.businessName || "",
    "employment.businessname": lead.employment?.businessName || "",
    "employment.businessType": lead.employment?.businessType || "",
    "employment.businesstype": lead.employment?.businessType || ""
  };
};

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

export const formatLeadDateTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  
  const day = String(d.getDate()).padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()] || "Jan";
  const year = d.getFullYear();
  
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const pad = (n) => String(n).padStart(2, "0");
  
  const ampm = hours >= 12 ? "pm" : "am";
  const h12 = hours % 12 || 12;
  const timeStr = `${pad(h12)}:${pad(minutes)} ${ampm}`;
  
  return `${day} ${month} ${year}, ${timeStr}`;
};

export const isFieldNonEditable = (field) => {
  if (!field) return false;
  const slug = (field.slug || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const name = (field.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  
  const nonEditableKeys = [
    "joiningdate",
    "registereddate",
    "joindate",
    "registrationnumber",
    "registrationno",
    "regno",
    "receiptno",
    "receiptnumber",
    "slno",
    "serialno",
  ];
  
  return nonEditableKeys.some(
    (key) => slug.includes(key) || name.includes(key) || slug === key || name === key
  );
};

