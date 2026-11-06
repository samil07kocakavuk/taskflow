const HttpError = require('../utils/HttpError');

function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Endpoint yok: ${req.method} ${req.originalUrl}`,
  });
}

function errorHandler(err, req, res, next) {
  let status = err instanceof HttpError ? err.status : err.status || 500;
  let message = err.message || 'Sunucu hatasi';

  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Gecersiz JSON';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Istek govdesi cok buyuk';
  } else if (status >= 500) {
    console.error(err);
    message = 'Sunucu hatasi';
  }

  res.status(status).json({ success: false, message });
}

module.exports = { notFound, errorHandler };
