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
exports.getQualityBucket = getQualityBucket;
exports.loadHistoricalCounts = loadHistoricalCounts;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Quality assessment constants
const MPN_THRESHOLD_LOW = 35;
const MPN_THRESHOLD_MEDIUM = 104;
/**
 * Determine quality bucket based on MPN value
 * @param mpn - Most Probable Number value
 * @returns Quality assessment bucket
 */
function getQualityBucket(mpn) {
    if (mpn < MPN_THRESHOLD_LOW)
        return 'good';
    if (mpn <= MPN_THRESHOLD_MEDIUM)
        return 'caution';
    return 'poor';
}
/**
 * Load historical quality counts for all sites from processed data
 * @param outputDir - Directory containing processed data folders
 * @returns Map of site names to their historical quality counts
 */
function loadHistoricalCounts(outputDir) {
    const counts = new Map();
    if (!fs.existsSync(outputDir))
        return counts;
    const dirs = fs
        .readdirSync(outputDir, { withFileTypes: true })
        .filter(d => d.isDirectory() && /\d{4}-\d{2}-\d{2}/.test(d.name))
        .map(d => d.name);
    for (const dir of dirs) {
        const file = path.join(outputDir, dir, 'enriched.geojson');
        if (!fs.existsSync(file))
            continue;
        try {
            const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
            if (!data.features)
                continue;
            for (const feature of data.features) {
                const props = feature.properties || {};
                const site = props.siteName;
                const mpn = props.mpn;
                if (!site || mpn === undefined || mpn === null)
                    continue;
                const bucket = getQualityBucket(Number(mpn));
                if (!counts.has(site)) {
                    counts.set(site, { good: 0, caution: 0, poor: 0 });
                }
                const siteCounts = counts.get(site);
                siteCounts[bucket]++;
            }
        }
        catch (err) {
            console.warn(`Failed to load history from ${file}:`, err);
        }
    }
    return counts;
}
