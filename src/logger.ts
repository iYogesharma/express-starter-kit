import winston, {Logger, Logform, } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const logFormat : Logform.Format = winston.format.combine(
 winston.format.colorize(),
 winston.format.timestamp(),
 winston.format.align(),
 winston.format.printf(
  info => `${info.timestamp} ${info.level}: ${info.message}`,
),);


const transport  = new DailyRotateFile({
    filename : ".//logs//%DATE%.log",
    datePattern: "YYYY-MM-DD-HH",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
    level: "info",
});

const Log : Logger = winston.createLogger({
    format: logFormat,
    transports: [
        transport,
        new winston.transports.Console({ level: "info", } ),
    ]
});

export default Log;