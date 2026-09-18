let UAParser;
try {
  UAParser = require("ua-parser-js");
} catch (err) {
  console.warn("ua-parser-js not available; using basic device detection");
}

const deviceDetector = (req, res, next) => {
  try {
    if (UAParser) {
      const parser = new UAParser(req.headers["user-agent"]);
      const result = parser.getResult();
      req.deviceInfo = {
        type: result.device.type || "desktop",
        os: result.os.name
          ? `${result.os.name} ${result.os.version || ""}`.trim()
          : "unknown",
        browser: result.browser.name
          ? `${result.browser.name} ${result.browser.version || ""}`.trim()
          : "unknown",
      };
    } else {
      req.deviceInfo = {
        type: "desktop",
        os: "unknown",
        browser: "unknown",
      };
    }
  } catch (err) {
    req.deviceInfo = {
      type: "desktop",
      os: "unknown",
      browser: "unknown",
    };
  }

  next();
};

module.exports = deviceDetector;
