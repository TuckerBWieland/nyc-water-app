/**
 * Tests for GeoJSON type guard functions
 */
import { describe, it, expect } from 'vitest';
import {
  isGeoJSONCoordinates,
  isGeoJSONGeometry,
  isGeoJSONFeature,
  isGeoJSONCollection,
  isSampleData,
} from '../../src/types/geojson';

describe('GeoJSON Type Guards', () => {
  describe('isGeoJSONCoordinates', () => {
    it('should return true for valid coordinates array', () => {
      expect(isGeoJSONCoordinates([-74.006, 40.7128])).toBe(true);
    });

    it('should return false for arrays with less than 2 elements', () => {
      expect(isGeoJSONCoordinates([-74.006])).toBe(false);
      expect(isGeoJSONCoordinates([])).toBe(false);
    });

    it('should return false for arrays with non-numeric values', () => {
      expect(isGeoJSONCoordinates([-74.006, '40.7128'])).toBe(false);
      expect(isGeoJSONCoordinates(['a', 'b'])).toBe(false);
    });

    it('should return false for arrays with NaN values', () => {
      expect(isGeoJSONCoordinates([-74.006, NaN])).toBe(false);
    });

    it('should return false for non-array values', () => {
      expect(isGeoJSONCoordinates(null)).toBe(false);
      expect(isGeoJSONCoordinates(undefined)).toBe(false);
      expect(isGeoJSONCoordinates('[-74.006, 40.7128]')).toBe(false);
      expect(isGeoJSONCoordinates({ lng: -74.006, lat: 40.7128 })).toBe(false);
    });
  });

  describe('isGeoJSONGeometry', () => {
    it('should return true for valid Point geometry', () => {
      expect(
        isGeoJSONGeometry({
          type: 'Point',
          coordinates: [-74.006, 40.7128],
        })
      ).toBe(true);
    });

    it('should return true for valid LineString geometry', () => {
      expect(
        isGeoJSONGeometry({
          type: 'LineString',
          coordinates: [
            [-74.006, 40.7128],
            [-73.9, 40.8],
          ],
        })
      ).toBe(true);
    });

    it('should return false for invalid geometry type', () => {
      expect(
        isGeoJSONGeometry({
          type: 'InvalidType',
          coordinates: [-74.006, 40.7128],
        })
      ).toBe(false);
    });

    it('should return false for geometry with missing coordinates', () => {
      expect(
        isGeoJSONGeometry({
          type: 'Point',
        })
      ).toBe(false);
    });

    it('should return false for geometry with invalid coordinates', () => {
      expect(
        isGeoJSONGeometry({
          type: 'Point',
          coordinates: 'invalid',
        })
      ).toBe(false);
    });

    it('should return false for non-object values', () => {
      expect(isGeoJSONGeometry(null)).toBe(false);
      expect(isGeoJSONGeometry(undefined)).toBe(false);
      expect(isGeoJSONGeometry('geometry')).toBe(false);
    });
  });

  describe('isGeoJSONFeature', () => {
    it('should return true for valid GeoJSON feature', () => {
      expect(
        isGeoJSONFeature({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [-74.006, 40.7128],
          },
          properties: {
            site: 'Test Site',
            mpn: 35,
          },
        })
      ).toBe(true);
    });

    it('should accept string MPNs', () => {
      expect(
        isGeoJSONFeature({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [-74.006, 40.7128],
          },
          properties: {
            site: 'Test Site',
            mpn: '35',
          },
        })
      ).toBe(true);
    });

    it('should return false for features with missing site', () => {
      expect(
        isGeoJSONFeature({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [-74.006, 40.7128],
          },
          properties: {
            mpn: 35,
          },
        })
      ).toBe(false);
    });

    it('should return false for features with empty site', () => {
      expect(
        isGeoJSONFeature({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [-74.006, 40.7128],
          },
          properties: {
            site: '',
            mpn: 35,
          },
        })
      ).toBe(false);
    });

    it('should return false for features with missing mpn', () => {
      expect(
        isGeoJSONFeature({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [-74.006, 40.7128],
          },
          properties: {
            site: 'Test Site',
          },
        })
      ).toBe(false);
    });

    it('should return false for features with wrong type', () => {
      expect(
        isGeoJSONFeature({
          type: 'NotFeature',
          geometry: {
            type: 'Point',
            coordinates: [-74.006, 40.7128],
          },
          properties: {
            site: 'Test Site',
            mpn: 35,
          },
        })
      ).toBe(false);
    });

    it('should return false for features with invalid geometry', () => {
      expect(
        isGeoJSONFeature({
          type: 'Feature',
          geometry: null,
          properties: {
            site: 'Test Site',
            mpn: 35,
          },
        })
      ).toBe(false);
    });

    it('should return false for non-object values', () => {
      expect(isGeoJSONFeature(null)).toBe(false);
      expect(isGeoJSONFeature(undefined)).toBe(false);
      expect(isGeoJSONFeature('feature')).toBe(false);
    });
  });

  describe('isGeoJSONCollection', () => {
    it('should return true for valid empty collection', () => {
      expect(
        isGeoJSONCollection({
          type: 'FeatureCollection',
          features: [],
        })
      ).toBe(true);
    });

    it('should return true for valid collection with features', () => {
      expect(
        isGeoJSONCollection({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [-74.006, 40.7128],
              },
              properties: {
                site: 'Test Site',
                mpn: 35,
              },
            },
          ],
        })
      ).toBe(true);
    });

    it('should return false for collections with wrong type', () => {
      expect(
        isGeoJSONCollection({
          type: 'NotFeatureCollection',
          features: [],
        })
      ).toBe(false);
    });

    it('should return false for collections with missing features', () => {
      expect(
        isGeoJSONCollection({
          type: 'FeatureCollection',
        })
      ).toBe(false);
    });

    it('should return false for collections with invalid features', () => {
      expect(
        isGeoJSONCollection({
          type: 'FeatureCollection',
          features: ['not a feature'],
        })
      ).toBe(false);
    });

    it('should return false for non-object values', () => {
      expect(isGeoJSONCollection(null)).toBe(false);
      expect(isGeoJSONCollection(undefined)).toBe(false);
      expect(isGeoJSONCollection('collection')).toBe(false);
    });
  });

  describe('isSampleData', () => {
    it('should return true for valid sample data with lat/lon', () => {
      expect(
        isSampleData({
          site: 'Test Site',
          mpn: 35,
          lat: 40.7128,
          lon: -74.006,
        })
      ).toBe(true);
    });

    it('should return true for valid sample data with latitude/longitude', () => {
      expect(
        isSampleData({
          site: 'Test Site',
          mpn: 35,
          latitude: 40.7128,
          longitude: -74.006,
        })
      ).toBe(true);
    });

    it('should return false for sample data with missing coordinates', () => {
      expect(
        isSampleData({
          site: 'Test Site',
          mpn: 35,
        })
      ).toBe(false);
    });

    it('should return false for sample data with invalid coordinates', () => {
      expect(
        isSampleData({
          site: 'Test Site',
          mpn: 35,
          lat: '40.7128',
          lon: -74.006,
        })
      ).toBe(false);
    });

    it('should return false for sample data with missing site', () => {
      expect(
        isSampleData({
          mpn: 35,
          lat: 40.7128,
          lon: -74.006,
        })
      ).toBe(false);
    });

    it('should return false for sample data with empty site', () => {
      expect(
        isSampleData({
          site: '',
          mpn: 35,
          lat: 40.7128,
          lon: -74.006,
        })
      ).toBe(false);
    });

    it('should return false for non-object values', () => {
      expect(isSampleData(null)).toBe(false);
      expect(isSampleData(undefined)).toBe(false);
      expect(isSampleData('sample data')).toBe(false);
    });
  });
});
