// Production-ready logging system
import fs from 'fs';
import path from 'path';

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  userId?: number;
  sessionId?: string;
  endpoint?: string;
  ip?: string;
  userAgent?: string;
  extra?: any;
}

class Logger {
  private logDir: string;
  private isProduction: boolean;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.isProduction = process.env.NODE_ENV === 'production';
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private writeLog(entry: LogEntry): void {
    const logString = JSON.stringify(entry) + '\n';
    
    if (this.isProduction) {
      // In production, write to files
      const logFile = path.join(this.logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
      fs.appendFileSync(logFile, logString);
    } else {
      // In development, use console (sanitized)
      console.log(`[${entry.level}] ${entry.timestamp}: ${entry.message}`);
    }
  }

  info(message: string, context?: Partial<LogEntry>): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: this.sanitizeMessage(message),
      ...context
    });
  }

  warn(message: string, context?: Partial<LogEntry>): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message: this.sanitizeMessage(message),
      ...context
    });
  }

  error(message: string, error?: Error, context?: Partial<LogEntry>): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: this.sanitizeMessage(message),
      extra: error ? { 
        name: error.name, 
        message: error.message,
        stack: this.isProduction ? undefined : error.stack
      } : undefined,
      ...context
    });
  }

  debug(message: string, context?: Partial<LogEntry>): void {
    if (!this.isProduction) {
      this.writeLog({
        timestamp: new Date().toISOString(),
        level: 'DEBUG',
        message: this.sanitizeMessage(message),
        ...context
      });
    }
  }

  private sanitizeMessage(message: string): string {
    // Remove sensitive information from logs
    return message
      .replace(/password[=:]\s*\S+/gi, 'password=[REDACTED]')
      .replace(/token[=:]\s*\S+/gi, 'token=[REDACTED]')
      .replace(/apikey[=:]\s*\S+/gi, 'apikey=[REDACTED]')
      .replace(/authorization:\s*\S+/gi, 'authorization: [REDACTED]')
      .replace(/jwt[=:]\s*\S+/gi, 'jwt=[REDACTED]')
      .replace(/secret[=:]\s*\S+/gi, 'secret=[REDACTED]');
  }

  // Security audit log for sensitive operations
  securityLog(event: string, context: {
    userId?: number;
    ip?: string;
    userAgent?: string;
    success: boolean;
    reason?: string;
  }): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: context.success ? 'INFO' : 'WARN',
      message: `SECURITY_EVENT: ${event}`,
      ...context
    });
  }
}

export const logger = new Logger();
export default logger;