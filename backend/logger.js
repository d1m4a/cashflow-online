const LEVELS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const LOG_LEVEL = normalizeLevel(process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"));
const LOG_FORMAT = process.env.LOG_FORMAT || (process.env.NODE_ENV === "production" ? "json" : "pretty");

function debug(message, fields) {
  write("debug", message, fields);
}

function info(message, fields) {
  write("info", message, fields);
}

function warn(message, fields) {
  write("warn", message, fields);
}

function error(message, fields) {
  write("error", message, fields);
}

function write(level, message, fields = {}) {
  if (LEVELS[level] < LEVELS[LOG_LEVEL]) {
    return;
  }

  const entry = {
    time: new Date().toISOString(),
    level,
    message,
    ...normalizeFields(fields)
  };

  const output = LOG_FORMAT === "json" ? JSON.stringify(entry) : pretty(entry);
  const stream = level === "error" || level === "warn" ? process.stderr : process.stdout;
  stream.write(`${output}\n`);
}

function normalizeFields(fields) {
  const normalized = {};
  for (const [key, value] of Object.entries(fields || {})) {
    if (value === undefined) {
      continue;
    }
    normalized[key] = value instanceof Error ? serializeError(value) : value;
  }
  return normalized;
}

function serializeError(err) {
  return {
    name: err.name,
    message: err.message,
    code: err.code,
    stack: err.stack
  };
}

function pretty(entry) {
  const { time, level, message, ...fields } = entry;
  const details = Object.keys(fields).length ? ` ${JSON.stringify(fields)}` : "";
  return `${time} ${level.toUpperCase()} ${message}${details}`;
}

function normalizeLevel(level) {
  return Object.prototype.hasOwnProperty.call(LEVELS, level) ? level : "info";
}

module.exports = {
  debug,
  info,
  warn,
  error,
  serializeError
};
