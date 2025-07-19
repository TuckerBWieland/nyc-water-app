"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDateProcessed = isDateProcessed;
exports.removeProcessedData = removeProcessedData;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Check if data for a specific date has already been processed
 * @param outputDir - The output directory containing processed data
 * @param date - The date string in YYYY-MM-DD format
 * @returns True if the data has been processed, false otherwise
 */
function isDateProcessed(outputDir, date) {
    const geojsonFile = path.join(outputDir, date, 'enriched.geojson');
    return fs.existsSync(geojsonFile);
}
/**
 * Remove previously processed data for a specific date
 * @param outputDir - The output directory containing processed data
 * @param date - The date string in YYYY-MM-DD format
 */
function removeProcessedData(outputDir, date) {
    const dir = path.join(outputDir, date);
    try {
        fs.rmSync(dir, { recursive: true, force: true });
    }
    catch (err) {
        console.warn(`⚠️  Failed to remove existing data for ${date}:`, err);
    }
}
