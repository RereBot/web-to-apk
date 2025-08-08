/**
 * 日志写入器实现
 */
import fs from 'fs/promises';
import path from 'path';
export class ConsoleLogWriter {
    constructor(formatter) {
        this.formatter = formatter;
    }
    async write(entry) {
        const formattedMessage = this.formatter.format(entry);
        switch (entry.level) {
            case 0: // DEBUG
            case 1: // INFO
                console.log(formattedMessage);
                break;
            case 2: // WARN
                console.warn(formattedMessage);
                break;
            case 3: // ERROR
                console.error(formattedMessage);
                break;
        }
    }
    async close() {
        // Console writer doesn't need cleanup
    }
}
export class FileLogWriter {
    constructor(formatter, logDirectory, maxFileSize = 10 * 1024 * 1024, // 10MB
    maxFiles = 5) {
        this.writeQueue = Promise.resolve();
        this.formatter = formatter;
        this.logDirectory = logDirectory;
        this.maxFileSize = maxFileSize;
        this.maxFiles = maxFiles;
        this.currentLogFile = this.generateLogFileName();
    }
    async write(entry) {
        this.writeQueue = this.writeQueue.then(async () => {
            await this.ensureLogDirectory();
            await this.rotateLogIfNeeded();
            const formattedMessage = this.formatter.format(entry);
            const logFilePath = path.join(this.logDirectory, this.currentLogFile);
            await fs.appendFile(logFilePath, formattedMessage + '\n', 'utf8');
        });
        return this.writeQueue;
    }
    async close() {
        await this.writeQueue;
    }
    async ensureLogDirectory() {
        try {
            await fs.access(this.logDirectory);
        }
        catch {
            await fs.mkdir(this.logDirectory, { recursive: true });
        }
    }
    async rotateLogIfNeeded() {
        const logFilePath = path.join(this.logDirectory, this.currentLogFile);
        try {
            const stats = await fs.stat(logFilePath);
            if (stats.size >= this.maxFileSize) {
                await this.rotateLogFiles();
                this.currentLogFile = this.generateLogFileName();
            }
        }
        catch {
            // File doesn't exist, no need to rotate
        }
    }
    async rotateLogFiles() {
        const files = await fs.readdir(this.logDirectory);
        const logFiles = files
            .filter(file => file.startsWith('web-to-apk-') && file.endsWith('.log'))
            .sort()
            .reverse();
        // Remove excess files
        if (logFiles.length >= this.maxFiles) {
            const filesToRemove = logFiles.slice(this.maxFiles - 1);
            for (const file of filesToRemove) {
                await fs.unlink(path.join(this.logDirectory, file));
            }
        }
    }
    generateLogFileName() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        return `web-to-apk-${timestamp}.log`;
    }
    async cleanup() {
        await this.rotateLogFiles();
    }
}
//# sourceMappingURL=LogWriter.js.map