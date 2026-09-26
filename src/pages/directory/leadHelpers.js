export const INTERNAL_SLUGS = {
  NAME: "name",
  EMAIL: "email",
  PHONE: "phone",
  ROLE: "role",
  STATUS: "status",
  GENDER: "gender",
  DOB: "dob",
  DATE_OF_BIRTH: "dateOfBirth",
  AGE: "age",
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
  BUSINESS_TYPE: "employment.businessType",
  RELATIVE_NAME: "relativeName",
  CHANNELS: "channels",
  HOSTEL_LOCATION: "hostelLocation"
};

export const DEFAULT_COLUMN_SLUGS = [
  "name",
  "email",
  "phone",
  "channels",
  "education.college",
  "education.course",
  "dob",
  "education.startYear",
  "education.endYear"
];

export const isDefaultColumn = (field) => {
  if (!field) return false;
  const s = (field.slug || "").toLowerCase();
  const n = (field.name || "").toLowerCase();
  return (
    s === "name" || n === "name" ||
    s === "email" || n === "email" ||
    s === "phone" || n === "phone" ||
    s === "channels" || n === "channels" ||
    s === "education.college" || s === "college" || n === "college" ||
    s === "education.course" || s === "course" || s === "branch" || n === "branch" || n === "course" ||
    s === "dob" || s === "dateofbirth" || s === "age" || n === "dob" || n === "date of birth" ||
    s === "education.startyear" || s === "startyear" || s === "start_year" || n.includes("college joining") || n.includes("coolege joining") || n === "edu start year" || n.includes("start year") ||
    s === "education.endyear" || s === "endyear" || s === "end_year" || n.includes("graduation year") || n === "edu end year" || n.includes("end year")
  );
};

export const getDefaultColumnIndex = (field) => {
  if (!field) return 999;
  const s = (field.slug || "").toLowerCase();
  const n = (field.name || "").toLowerCase();
  if (s === "name" || n === "name") return 0;
  if (s === "email" || n === "email") return 1;
  if (s === "phone" || n === "phone") return 2;
  if (s === "channels" || n === "channels") return 3;
  if (s === "education.college" || s === "college" || n === "college") return 4;
  if (s === "education.course" || s === "course" || s === "branch" || n === "branch" || n === "course") return 5;
  if (s === "dob" || s === "dateofbirth" || s === "age" || n === "dob" || n === "date of birth") return 6;
  if (s === "education.startyear" || s === "startyear" || s === "start_year" || n.includes("college joining") || n.includes("coolege joining") || n === "edu start year" || n.includes("start year")) return 7;
  if (s === "education.endyear" || s === "endyear" || s === "end_year" || n.includes("graduation year") || n === "edu end year" || n.includes("end year")) return 8;
  return 100 + (field.order ?? 0);
};

export const columnWidth = (field) => {
  if (!field) return 170;
  const slug = (field.slug || "").toLowerCase();
  const name = (field.name || "").toLowerCase();

  // Core Identity & Directory Profile
  if (slug === "name") return 220;
  if (slug === "email") return 260;
  if (slug === "phone") return 210;
  if (slug === "channels") return 140;
  if (slug.includes("college") || name.includes("college")) return 240;
  if (slug.includes("course") || name.includes("course") || slug.includes("branch") || name.includes("branch")) return 190;
  if (slug === "dob" || slug === "dateofbirth" || slug === "age" || name === "dob" || name === "age" || name === "date of birth") return 160;
  if (slug.includes("startyear") || name.includes("start year") || name.includes("college joining") || name.includes("coolege joining")) return 180;
  if (slug.includes("endyear") || name.includes("end year") || name.includes("graduation year")) return 180;
  if (slug === "role") return 170;
  if (slug === "gender") return 130;
  if (slug === "joiningdate") return 160;
  if (slug === "adhaar") return 190;
  if (slug === "slno" || slug === "sl_no") return 130;
  if (slug === "registrationnumber" || slug === "registration_number") return 160;
  if (slug === "receiptno") return 150;
  if (slug === "relativename" || slug === "relation") return 180;
  if (slug === "logindetails") return 190;
  if (slug === "locallanguagedetails" || slug === "local_language_details") return 300;

  // Education Columns (proper width preventing header wrapping)
  if (slug.includes("startmonth") || name.includes("start month")) return 195;
  if (slug.includes("endmonth") || name.includes("end month")) return 195;
  if (slug.includes("higherstudies") || name.includes("higher studies")) return 240;

  // Employment Columns
  if (slug.includes("businessname") || slug.includes("business_name")) return 240;
  if (slug.includes("businesstype") || slug.includes("business_type")) return 220;
  if (slug.includes("employmentstatus") || slug.includes("employment_status") || slug === "employment") return 180;
  if (slug.includes("occupation") || name.includes("occupation")) return 200;
  if (slug === "hostellocation" || name.includes("hostel location")) return 280;
  if (slug.includes("organization") || name.includes("organization") || slug.includes("institution")) return 220;
  if (slug.includes("industry") || name.includes("industry")) return 190;
  if (slug.includes("worklocation") || slug.includes("work_location") || name.includes("work location")) return 190;

  // Address Columns
  if (slug.endsWith("street")) return 260;
  if (slug.endsWith("area")) return 160;
  if (slug.endsWith("landmark")) return 160;
  if (slug.endsWith("location")) return 180;
  if (slug.endsWith("city")) return 140;
  if (slug.endsWith("district")) return 150;
  if (slug.endsWith("taluk")) return 150;
  if (slug.endsWith("pincode")) return 140;
  if (slug.includes("address")) return 300;

  return 170;
};

export const getColumnDisplayName = (field) => {
  if (!field) return "";
  const slug = (field.slug || "").toLowerCase();
  const name = (field.name || "").toLowerCase();
  if (slug === "name" || name === "name") return "Name";
  if (slug === "email" || name === "email") return "Email";
  if (slug === "phone" || name === "phone") return "Phone";
  if (slug === "channels" || name === "channels") return "Channels";
  if (slug === "education.college" || slug === "college" || name === "college") return "College";
  if (slug === "education.course" || slug === "course" || name === "course" || name === "branch" || slug === "branch") return "Branch";
  if (slug === "age" || name === "age" || slug === "dob" || slug === "dateofbirth" || name === "date of birth") return "DOB";
  if (slug === "education.startyear" || slug === "startyear" || slug === "start_year" || name === "edu start year" || name.includes("college joining") || name.includes("coolege joining") || name.includes("start year")) return "College Joining";
  if (slug === "education.endyear" || slug === "endyear" || slug === "end_year" || name === "edu end year" || name.includes("graduation year") || name.includes("end year")) return "Graduation Year";
  if (slug === "locallanguagedetails" || slug === "local_language_details") return "Kanada Overview";
  if (slug === "slno" || slug === "sl_no") return "Slot No.";
  if (slug === "registrationnumber" || slug === "registration_number") return "Reg No.";
  if (slug === "hostellocation" || name === "hostellocation") return "Hostel Location";
  if (slug === "employment.employmentstatus" || slug === "employmentstatus" || slug === "employment_status" || slug.includes("employmentstatus")) return "Employment";
  return field.name || "";
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

export const splitNameAndRelation = (rawName, existingRelation = {}) => {
  if (!rawName || typeof rawName !== "string") {
    return {
      cleanName: rawName || "",
      relativeName: existingRelation?.relatedPersonName || "",
      relationType: existingRelation?.relationshipType || ""
    };
  }

  // Matches S/o, D/o, W/o, H/o, C/o, F/o, Son of, Daughter of, Wife of, Husband of, Father of, Mother of
  const relRegex = /\b(s\/o|d\/o|w\/o|h\/o|c\/o|f\/o|son\s+of|daughter\s+of|wife\s+of|husband\s+of|care\s+of|father\s+of|mother\s+of)\b/i;
  const match = rawName.match(relRegex);

  if (!match) {
    return {
      cleanName: rawName.trim(),
      relativeName: existingRelation?.relatedPersonName || "",
      relationType: existingRelation?.relationshipType || ""
    };
  }

  const indicator = match[1].toLowerCase();
  let relType = existingRelation?.relationshipType || "";
  if (!relType) {
    if (indicator.includes("s/o") || indicator.includes("son")) relType = "Father";
    else if (indicator.includes("d/o") || indicator.includes("daughter")) relType = "Father";
    else if (indicator.includes("w/o") || indicator.includes("wife")) relType = "Spouse";
    else if (indicator.includes("h/o") || indicator.includes("husband")) relType = "Spouse";
    else if (indicator.includes("c/o") || indicator.includes("care")) relType = "Guardian";
    else if (indicator.includes("f/o") || indicator.includes("father")) relType = "Son";
    else if (indicator.includes("mother")) relType = "Son";
  }

  const cleanName = rawName.substring(0, match.index).replace(/[-,\s.]+$/, "").trim();
  const extractedRelative = rawName.substring(match.index + match[0].length).replace(/^[-,\s.:]+/, "").replace(/[-,\s.]+$/, "").trim();

  const finalRelativeName = existingRelation?.relatedPersonName || extractedRelative;

  return {
    cleanName: cleanName || rawName.trim(),
    relativeName: finalRelativeName,
    relationType: relType
  };
};

export const toRow = (lead) => {
  const regNo = lead.registrationNumber || lead.memberInfo?.registrationNo || "";
  const localDetails = lead.localLanguageDetails || lead.memberInfo?.rawNameAddressKannada || "";
  const receipt = lead.receiptNo || lead.memberInfo?.receiptNo || "";
  const slNoVal = lead.memberInfo?.slNo != null ? String(lead.memberInfo.slNo) : "";

  // Real Date of Birth (DOB) only - format cleanly for display and editing
  const rawDob = lead.dob || lead.dateOfBirth || lead.memberInfo?.dob || "";
  let isoDob = "";
  let formattedDob = "";
  if (rawDob) {
    const d = new Date(rawDob);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      isoDob = `${year}-${month}-${day}`;
      formattedDob = formatLeadDate(d);
    } else {
      isoDob = String(rawDob);
      formattedDob = String(rawDob);
    }
  }

  // Strictly separate name and relative name so they are NEVER combined in table
  const { cleanName, relativeName: parsedRelative, relationType: parsedRelType } = splitNameAndRelation(lead.name, lead.relation || {});

  return {
    id: String(lead._id || lead.id),
    raw: lead,
    name: cleanName,
    email: lead.email || "",
    phone: lead.phone || "",
    role: lead.role || "",
    gender: lead.gender || "",
    dob: formattedDob,
    dobRaw: isoDob,
    dateOfBirth: formattedDob,
    age: formattedDob, // Replace numeric age with real DOB display
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

    // Relation / Family Details (strictly separate column)
    relativeName: parsedRelative,
    relativename: parsedRelative,
    relationType: parsedRelType,
    relation: parsedRelative
      ? `${parsedRelType ? parsedRelType + ' of ' : ''}${parsedRelative}`
      : (parsedRelType || ""),
    "relation.relationshipType": parsedRelType || "",
    "relation.relatedPersonName": parsedRelative || "",

    // Social & Communication Channels
    channels: lead.channels || {},

    "address.street": lead.address?.street || "",
    "address.area": lead.address?.area || "",
    "address.landmark": lead.address?.landmark || "",
    "address.location": lead.address?.location || "",
    "address.city": lead.address?.city || "",
    "address.district": lead.address?.district || lead.memberInfo?.sourceSheet?.replace(/-\d+$/, '') || "",
    "address.taluk": lead.address?.taluk || "",
    "address.pincode": lead.address?.pincode || "",
    "education.college": lead.education?.college || "",
    college: lead.education?.college || "",
    "education.course": lead.education?.course || "",
    course: lead.education?.course || "",
    branch: lead.education?.course || "",
    "education.startMonth": lead.education?.startMonth,
    "education.startmonth": lead.education?.startMonth,
    "education.startYear": lead.education?.startYear,
    "education.startyear": lead.education?.startYear,
    startYear: lead.education?.startYear,
    startyear: lead.education?.startYear,
    collegeJoining: lead.education?.startYear,
    "education.endMonth": lead.education?.endMonth,
    "education.endmonth": lead.education?.endMonth,
    "education.endYear": lead.education?.endYear,
    "education.endyear": lead.education?.endYear,
    endYear: lead.education?.endYear,
    endyear: lead.education?.endYear,
    graduationYear: lead.education?.endYear,
    "employment.occupation": lead.employment?.occupation || "",
    "employment.organization": lead.employment?.organization || "",
    "employment.industry": lead.employment?.industry || "",
    "employment.workLocation": lead.employment?.workLocation || "",
    "employment.worklocation": lead.employment?.workLocation || "",
    "employment.employmentStatus": lead.employment?.employmentStatus || (lead.role === "STUDENT" ? "Student" : ""),
    "employment.employmentstatus": lead.employment?.employmentStatus || (lead.role === "STUDENT" ? "Student" : ""),
    "employment.businessName": lead.employment?.businessName || "",
    "employment.businessname": lead.employment?.businessName || "",
    "employment.businessType": lead.employment?.businessType || "",
    "employment.businesstype": lead.employment?.businessType || "",

    // Login Details (Admin only)
    loginDetails: lead.lastLoginDetails || null,
    logindetails: lead.lastLoginDetails || null,

    // Hostel Location / Organization
    hostelLocation: lead.hostelLocation || lead.organization || "",
    hostellocation: lead.hostelLocation || lead.organization || ""
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
    "profilephoto",
    "photo",
    "avatar",
    "picture",
    "image",
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

