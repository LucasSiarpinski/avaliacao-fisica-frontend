/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['http://192.168.1.9:3000'],
  serverExternalPackages: ['pdfkit', 'nodemailer'],
  outputFileTracingIncludes: {
    '/api/enviar-laudo': [
      './node_modules/pdfkit/js/standard-fonts/**/*',
      './node_modules/pdfkit/js/data/**/*',
    ],
    '/api/**/*': [
      './node_modules/pdfkit/js/standard-fonts/**/*',
      './node_modules/pdfkit/js/data/**/*',
    ],
  },
};

module.exports = nextConfig;
