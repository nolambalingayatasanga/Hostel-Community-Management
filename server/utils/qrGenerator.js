const QRCode = require('qrcode');

const generateQRCode = async (trackingUrl) => {
  const qrCode = await QRCode.toString(trackingUrl, {
    type: 'svg',
    margin: 2,
    color: {
      dark: '#0F172A',
      light: '#FFFFFF'
    }
  });

  const qrPngBuffer = await QRCode.toBuffer(trackingUrl, {
    type: 'png',
    margin: 1,
    width: 512
  });

  return {
    qrCode,
    qrPngBuffer
  };
};

module.exports = generateQRCode;
