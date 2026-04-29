import winston from 'winston';

// Try to load daily rotate file transport — gracefully fall back if not installed yet
let DailyRotateFile;
try {
  DailyRotateFile = (await import('winston-daily-rotate-file')).default;
} catch {
  // Package not installed — will use plain file transports
}

const { combine, timestamp, json, colorize, simple } = winston.format;

// Build transports array
const transports = [];

if (DailyRotateFile) {
  // Rotating error log — keeps 14 days, max 20MB per file
  transports.push(new DailyRotateFile({
    filename:     'logs/error-%DATE%.log',
    datePattern:  'YYYY-MM-DD',
    level:        'error',
    maxSize:      '20m',
    maxFiles:     '14d',
    zippedArchive: true,
  }));

  // Rotating combined log — keeps 7 days
  transports.push(new DailyRotateFile({
    filename:     'logs/combined-%DATE%.log',
    datePattern:  'YYYY-MM-DD',
    maxSize:      '20m',
    maxFiles:     '7d',
    zippedArchive: true,
  }));
} else {
  // Fallback: plain file transports
  transports.push(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));
  transports.push(new winston.transports.File({ filename: 'logs/combined.log' }));
}

const logger = winston.createLogger({
  level: 'info',
  format: combine(timestamp(), json()),
  defaultMeta: { service: 'votevault-backend' },
  transports,
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(colorize(), simple()),
  }));
}

export default logger;
