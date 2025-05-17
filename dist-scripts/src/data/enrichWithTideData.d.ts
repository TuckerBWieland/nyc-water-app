/**
 * GeoJSON Enrichment Module
 *
 * Adds tide data to water quality sample GeoJSON files.
 * This module is used by the Vite plugin and can also be used standalone.
 */
/**
 * Main function to enrich samples with tide data
 *
 * @param inputFilePath - Path to the GeoJSON or JSON file to enrich
 * @returns Promise that resolves when the enrichment is complete
 */
export declare function enrichSamplesWithTideData(inputFilePath: string): Promise<void>;
