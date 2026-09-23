import React from 'react';
import { SvgIcon } from '@mui/material';

// Behance SVG Icon
export const BehanceIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path
      d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.171 3-3.445 0-5.555-2.5-5.555-6.111 0-3.694 2.15-6.222 5.555-6.222 3.42 0 5.093 2.444 5.093 5.417 0 .528-.051 1.056-.126 1.472H16.03c.075 1.5 1.056 2.583 2.54 2.583 1.132 0 1.96-.583 2.338-1.5h2.818v.361zM18.88 12.5c-.05-1.194-.855-2.083-2.263-2.083-1.332 0-2.187.889-2.313 2.083h4.576zM2 18h6.242c3.041 0 4.758-1.444 4.758-3.778 0-1.583-.98-2.611-2.288-3.028 1.03-.444 1.76-1.389 1.76-2.694 0-2.139-1.635-3.5-4.23-3.5H2v13zm3.116-7.806h2.79c1.03 0 1.634.528 1.634 1.444 0 .917-.603 1.472-1.634 1.472H5.116v-2.916zm0 5.028h3.042c1.131 0 1.834.583 1.834 1.611 0 1.028-.703 1.639-1.834 1.639H5.116v-3.25z"
      fill="currentColor"
    />
  </SvgIcon>
);

export const normalizeChannelUrl = (val, type) => {
  if (!val || typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (type === 'github') return `https://github.com/${trimmed.replace(/^@/, '')}`;
  if (type === 'behance') return `https://behance.net/${trimmed.replace(/^@/, '')}`;
  if (type === 'instagram') return `https://instagram.com/${trimmed.replace(/^@/, '')}`;
  if (type === 'linkedin') return `https://linkedin.com/in/${trimmed.replace(/^\/+/, '')}`;
  return `https://${trimmed}`;
};

export const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

export const kannadaToEnglishDigits = (str) => {
  if (!str) return '';
  const knDigits = ['೦', '೧', '೨', '೩', '೪', '೫', '೬', '೭', '೮', '೯'];
  return String(str).replace(/[೦-೯]/g, (char) => {
    const idx = knDigits.indexOf(char);
    return idx !== -1 ? String(idx) : char;
  });
};

export const parseTranslatedEnglish = (text) => {
  const result = {
    name: '',
    relation: { relationshipType: '', relatedPersonName: '' },
    address: {}
  };

  if (!text || !text.trim()) return result;

  // Extract 6-digit pincode anywhere in string
  const pinMatch = text.match(/\b\d{6}\b/);
  if (pinMatch) {
    result.address.pincode = pinMatch[0];
  }

  // Split by comma or newline, filter empty items and pincode token
  const rawParts = text
    .split(/,|\n/)
    .map((p) => p.trim())
    .filter((p) => p && p !== result.address?.pincode);

  if (rawParts.length === 0) return result;

  let nameAssigned = false;
  const remainingAddressParts = [];

  const relRegex = /^(?:(son|daughter|father|mother|spouse|wife|husband)\s+of\s+(.+)|(?:father|mother|son|daughter|spouse|wife|husband)\s*[:\-]\s*(.+)|(?:father|mother|son|daughter|spouse|wife|husband)\s+(.+))$/i;

  for (let i = 0; i < rawParts.length; i++) {
    const part = rawParts[i];
    const relMatch = part.match(relRegex);

    if (relMatch) {
      const rawType = (relMatch[1] || part.split(/[:\s]/)[0] || '').toLowerCase();
      let type = 'Other';
      if (rawType === 'father') type = 'Father';
      else if (rawType === 'mother') type = 'Mother';
      else if (rawType === 'son') type = 'Son';
      else if (rawType === 'daughter') type = 'Daughter';
      else if (['spouse', 'wife', 'husband'].includes(rawType)) type = 'Spouse';

      const personName = (relMatch[2] || relMatch[3] || relMatch[4] || '').trim();
      result.relation = {
        relationshipType: type,
        relatedPersonName: personName
      };
      continue;
    }

    if (!nameAssigned) {
      result.name = part;
      nameAssigned = true;
      continue;
    }

    remainingAddressParts.push(part);
  }

  // Map remaining parts into address fields
  if (remainingAddressParts.length === 1) {
    result.address.city = remainingAddressParts[0];
  } else if (remainingAddressParts.length === 2) {
    result.address.city = remainingAddressParts[0];
    result.address.district = remainingAddressParts[1];
  } else if (remainingAddressParts.length === 3) {
    result.address.street = remainingAddressParts[0];
    result.address.city = remainingAddressParts[1];
    result.address.district = remainingAddressParts[2];
  } else if (remainingAddressParts.length > 0) {
    const addressKeys = ['street', 'area', 'landmark', 'location', 'city', 'district', 'taluk'];
    for (let i = 0; i < remainingAddressParts.length && i < addressKeys.length; i++) {
      result.address[addressKeys[i]] = remainingAddressParts[i];
    }
  }

  return result;
};

// Helper to convert base64 data URL to a File object
export const dataURLtoFile = (dataurl, filename) => {
  let arr = dataurl.split(','),
    mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};
