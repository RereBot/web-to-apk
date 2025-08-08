/**
 * Core type definitions for Web-to-APK converter
 */
export class WebToAPKError extends Error {
    constructor(type, message, details) {
        super(message);
        this.type = type;
        this.message = message;
        this.details = details;
        this.name = 'WebToAPKError';
    }
}
//# sourceMappingURL=index.js.map