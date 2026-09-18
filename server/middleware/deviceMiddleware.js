const UAParser = require('ua-parser-js');

const deviceDetector = (req, res, next) => {
  const parser = new UAParser(req.headers['user-agent']);
  const result = parser.getResult();

  req.deviceInfo = {
    type: result.device.type || 'desktop',
    os: result.os.name ? `${result.os.name} ${result.os.version || ''}`.trim() : 'unknown',
    browser: result.browser.name
      ? `${result.browser.name} ${result.browser.version || ''}`.trim()
      : 'unknown'
  };

  next();
};

module.exports = deviceDetector;
