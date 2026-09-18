const isLoopback = (ip) => {
  return ip === "127.0.0.1" || ip === "::1" || ip === "0.0.0.0" || ip === "::";
};

const normalizeIp = (raw) => {
  if (!raw) return "";

  let ip = String(raw).trim();
  if (!ip) return "";

  // RFC 7239 Forwarded: for=1.2.3.4 or for="[::1]"
  const forwardedFor = ip.match(/for=\s*"?\[?([^\]";,\s]+)/i);
  if (forwardedFor) {
    ip = forwardedFor[1];
  }

  ip = ip
    .replace(/^for=/i, "")
    .replace(/^"|"$/g, "")
    .replace(/^\[|\]$/g, "");

  // IPv4 with port: 1.2.3.4:5678
  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(ip)) {
    ip = ip.split(":")[0];
  }

  // IPv4-mapped IPv6: ::ffff:192.168.1.5
  if (ip.toLowerCase().startsWith("::ffff:")) {
    ip = ip.slice(7);
  }

  if (ip === "::1") {
    ip = "127.0.0.1";
  }

  return ip;
};

const collectHeaderIps = (value) => {
  if (!value) return [];
  return String(value).split(",").map(normalizeIp).filter(Boolean);
};

const getClientIp = (req) => {
  const headerIp = (header) => collectHeaderIps(req.headers?.[header])[0] || "";

  const platformIp =
    headerIp("cf-connecting-ip") ||
    headerIp("true-client-ip") ||
    headerIp("x-vercel-forwarded-for");
  if (platformIp) return platformIp;

  const realIp = headerIp("x-real-ip") || headerIp("x-client-ip");
  const forwardedIps = collectHeaderIps(req.headers?.["x-forwarded-for"]);
  const forwardedIp =
    forwardedIps.find((ip) => !isLoopback(ip)) || forwardedIps[0] || "";
  const expressIp = normalizeIp(req.ip);
  const socketIp = normalizeIp(
    req.socket?.remoteAddress || req.connection?.remoteAddress,
  );

  const ranked = [realIp, forwardedIp, expressIp, socketIp].filter(Boolean);
  return ranked.find((ip) => !isLoopback(ip)) || ranked[0] || "";
};

module.exports = {
  getClientIp,
  normalizeIp,
};
