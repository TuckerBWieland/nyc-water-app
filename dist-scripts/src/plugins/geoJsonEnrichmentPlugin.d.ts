/**
 * GeoJSON Enrichment Plugin for Vite
 *
 * This plugin automatically enriches GeoJSON files with tide data
 * during development and build processes, replacing the manual
 * enrichment script.
 */
import type { Plugin } from 'vite';
/**
 * Options for the GeoJSON Enrichment Plugin
 */
interface GeoJsonEnrichmentOptions {
    /** Data directory (relative to project root) */
    dataDir?: string;
    /** Whether to skip enrichment in dev mode */
    skipInDev?: boolean;
    /** Only enrich files matching this pattern */
    include?: RegExp;
    /** Skip files matching this pattern */
    exclude?: RegExp;
}
/**
 * Create a Vite plugin that enriches GeoJSON files with tide data
 * during the build process.
 *
 * @param options - Configuration options for the plugin
 * @returns Vite plugin
 */
export default function geoJsonEnrichmentPlugin(options?: GeoJsonEnrichmentOptions): Plugin;
export {};
