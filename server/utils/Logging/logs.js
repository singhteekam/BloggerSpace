const { createLogger, format, transports } = require("winston");
const { combine, label, printf } = format;
const path = require("path");

// let time= new Date(new Date().getTime() + 330 * 60000).toISOString();
const myFormat = printf(({ level, message, label }) => {
  return `[${new Date(new Date().getTime() + 330 * 60000).toISOString()}] [${label}] [${level.toUpperCase()}] - ${message}`;
});

const logFilePath = path.join("/tmp", "app.log");

// Create a Winston logger with transports
// for  logging to console and file
const logger = createLogger({
//   level: "info",
  format: combine(label({ label: "LOG" }), myFormat),
  transports: [
    new transports.File({
      filename: "./utils/Logging/logs.log", level:"debug"
    }),
    new transports.File({
      filename: "./utils/Logging/logs.log", level:"error"
    }),
    new transports.File({
      filename: "./utils/Logging/logs.log", level:"info"
    }),
  ],
});

 
// new Date(new Date().getTime() + 330 * 60000);
module.exports = logger ;
  