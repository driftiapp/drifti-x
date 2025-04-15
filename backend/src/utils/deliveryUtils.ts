import { z } from 'zod';
import { AppError, ErrorCode } from './AppError';
import { logger, withPerformanceLogging } from './logger';

/**
 * Constants for delivery fee calculation
 */
export const DELIVERY_CONSTANTS = {
  BASE_FEE: 5.0,
  DISTANCE_RATE: 0.5, // $0.50 per kilometer
  MIN_FEE: 5.0,
  MAX_FEE: 50.0,
  EARTH_RADIUS: 6371, // Earth's radius in kilometers
  MAX_DELIVERY_DISTANCE: 50 // Maximum delivery distance in kilometers
} as const;

/**
 * Zod schema for coordinates validation
 */
const coordinatesSchema = z.tuple([
  z.number().min(-90).max(90), // latitude
  z.number().min(-180).max(180) // longitude
]);

/**
 * Interface for delivery fee calculation result
 */
export interface IDeliveryFeeResult {
  fee: number;
  distance: number;
  duration: number;
}

/**
 * Coordinates type for location points
 * @typedef {[number, number]} Coordinates
 * @property {number} 0 - Latitude (-90 to 90)
 * @property {number} 1 - Longitude (-180 to 180)
 */
export type Coordinates = [number, number];

export interface ICoordinates {
  type: 'Point';
  coordinates: [number, number];
}

/**
 * Calculates the delivery fee based on the distance between the shop and delivery address
 * @param shopCoordinates - The coordinates of the smoke shop
 * @param deliveryAddress - The delivery address
 * @returns The delivery fee result
 * @throws AppError if coordinates are invalid
 */
export async function calculateDeliveryFee(
  shopCoordinates: ICoordinates,
  deliveryAddress: string
): Promise<IDeliveryFeeResult> {
  try {
    // TODO: Implement actual distance calculation using a geocoding service
    // For now, return a fixed fee
    return {
      fee: 5.0,
      distance: 0,
      duration: 0
    };
  } catch (error) {
    logger.error('Failed to calculate delivery fee', {
      shopCoordinates,
      deliveryAddress,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw new AppError('Failed to calculate delivery fee', ErrorCode.INTERNAL_ERROR, {
      context: { shopCoordinates, deliveryAddress }
    });
  }
}

/**
 * Calculates the distance between two points using the Haversine formula
 * @param point1 - First set of coordinates [latitude, longitude]
 * @param point2 - Second set of coordinates [latitude, longitude]
 * @returns Distance in kilometers
 * @throws AppError if the calculation fails
 */
export const calculateHaversineDistance = (
  point1: [number, number],
  point2: [number, number]
): number => {
  try {
    const [lat1, lon1] = point1;
    const [lat2, lon2] = point2;

    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  } catch (error) {
    logger.error('Error calculating distance', {
      error,
      metadata: { point1, point2 }
    });
    throw new AppError('Failed to calculate distance', ErrorCode.INTERNAL_ERROR, {
      metadata: { point1, point2 }
    });
  }
};

/**
 * Converts degrees to radians
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 * @throws AppError if the conversion fails
 */
const toRad = (degrees: number): number => {
  try {
    return degrees * (Math.PI / 180);
  } catch (error) {
    logger.error('Error converting degrees to radians', {
      error,
      metadata: { degrees }
    });
    throw new AppError('Failed to convert degrees to radians', ErrorCode.INTERNAL_ERROR, {
      metadata: { degrees }
    });
  }
};

/**
 * Interface for delivery fee calculation options
 */
export interface IDeliveryFeeOptions {
  baseFee?: number;
  distanceRate?: number;
  currency?: string;
  minFee?: number;
  maxFee?: number;
}

/**
 * Delivery fee calculation parameters
 * @interface IDeliveryFeeParams
 */
export interface IDeliveryFeeParams {
  baseFee: number;
  distanceRate: number;
  minimumFee: number;
  maximumFee: number;
}

/**
 * Default delivery fee parameters
 */
export const DEFAULT_DELIVERY_FEE_PARAMS: IDeliveryFeeParams = {
  baseFee: 5.0,
  distanceRate: 0.5,
  minimumFee: 3.0,
  maximumFee: 20.0
};

/**
 * Delivery time calculation options
 * @interface IDeliveryTimeOptions
 */
export interface IDeliveryTimeOptions {
  /** The average speed in kilometers per hour */
  averageSpeed?: number;
  /** The traffic conditions */
  trafficConditions?: {
    /** The traffic level (0-1) */
    level: number;
    /** Whether it's peak hours */
    isPeakHours: boolean;
  };
  /** The weather conditions */
  weatherConditions?: {
    /** Whether it's raining */
    isRaining?: boolean;
    /** Whether it's snowing */
    isSnowing?: boolean;
    /** The temperature in Celsius */
    temperature?: number;
  };
}

/**
 * Validates delivery fee options
 * @param options - The options to validate
 * @throws {AppError} If the options are invalid
 */
function validateDeliveryFeeOptions(options: {
  baseFee?: number;
  distanceRate?: number;
  minFee?: number;
  maxFee?: number;
}): void {
  if (options.baseFee !== undefined && options.baseFee < 0) {
    throw new AppError('Base fee cannot be negative', ErrorCode.INVALID_INPUT, {
      context: { baseFee: options.baseFee }
    });
  }
  if (options.distanceRate !== undefined && options.distanceRate < 0) {
    throw new AppError('Distance rate cannot be negative', ErrorCode.INVALID_INPUT, {
      context: { distanceRate: options.distanceRate }
    });
  }
  if (options.minFee !== undefined && options.minFee < 0) {
    throw new AppError('Minimum fee cannot be negative', ErrorCode.INVALID_INPUT, {
      context: { minFee: options.minFee }
    });
  }
  if (options.maxFee !== undefined && options.maxFee < 0) {
    throw new AppError('Maximum fee cannot be negative', ErrorCode.INVALID_INPUT, {
      context: { maxFee: options.maxFee }
    });
  }
  if (options.minFee !== undefined && options.maxFee !== undefined && options.minFee > options.maxFee) {
    throw new AppError('Minimum fee cannot be greater than maximum fee', ErrorCode.INVALID_INPUT, {
      context: { minFee: options.minFee, maxFee: options.maxFee }
    });
  }
}

/**
 * Calculates the delivery fee based on shop and delivery coordinates
 * @param {Coordinates} shopCoordinates - The coordinates of the shop
 * @param {Coordinates} deliveryCoordinates - The coordinates of the delivery address
 * @param {IDeliveryFeeParams} [params=DEFAULT_DELIVERY_FEE_PARAMS] - Delivery fee calculation parameters
 * @returns {Promise<number>} The calculated delivery fee
 * @throws {AppError} If the calculation fails
 */
export async function calculateDeliveryFeeOld(
  shopCoordinates: Coordinates,
  deliveryCoordinates: Coordinates,
  params: IDeliveryFeeParams = DEFAULT_DELIVERY_FEE_PARAMS
): Promise<number> {
  return withPerformanceLogging('calculateDeliveryFee', async () => {
    try {
      const distance = calculateHaversineDistance(shopCoordinates, deliveryCoordinates);
      const distanceFee = distance * params.distanceRate;
      let totalFee = params.baseFee + distanceFee;

      // Apply minimum and maximum fee constraints
      totalFee = Math.max(params.minimumFee, Math.min(params.maximumFee, totalFee));

      logger.info('Delivery fee calculated', {
        shopCoordinates,
        deliveryCoordinates,
        distance,
        baseFee: params.baseFee,
        distanceFee,
        totalFee,
        params
      });

      return totalFee;
    } catch (error) {
      logger.error('Failed to calculate delivery fee', {
        shopCoordinates,
        deliveryCoordinates,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new AppError('Failed to calculate delivery fee', 500, {
        code: ErrorCode.DATABASE_ERROR,
        context: { shopCoordinates, deliveryCoordinates }
      });
    }
  });
}

/**
 * Validates coordinates
 * @param {Coordinates} coordinates - Coordinates to validate
 * @returns {boolean} Whether the coordinates are valid
 */
export function isValidCoordinates(coordinates: Coordinates): boolean {
  const [lat, lon] = coordinates;
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

/**
 * Formats coordinates as a string
 * @param {Coordinates} coordinates - Coordinates to format
 * @returns {string} Formatted coordinates string
 */
export function formatCoordinates(coordinates: Coordinates): string {
  const [lat, lon] = coordinates;
  return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}

/**
 * Calculates the estimated delivery time in minutes
 * @param distance - The distance in kilometers
 * @param options - Optional delivery time calculation options
 * @returns The estimated delivery time in minutes
 * @throws {AppError} If the distance is negative
 */
export function calculateDeliveryTime(
  distance: number,
  options: IDeliveryTimeOptions = {}
): number {
  if (distance < 0) {
    throw new AppError('Distance cannot be negative', ErrorCode.INVALID_INPUT, {
      context: { distance }
    });
  }

  const {
    averageSpeed = 30,
    trafficConditions,
    weatherConditions
  } = options;

  let speedMultiplier = 1.0;

  // Apply traffic conditions
  if (trafficConditions) {
    if (trafficConditions.isPeakHours) {
      speedMultiplier *= 0.7; // 30% slower during peak hours
    }
    speedMultiplier *= (1 - trafficConditions.level); // Adjust for traffic level
  }

  // Apply weather conditions
  if (weatherConditions) {
    if (weatherConditions.isRaining) {
      speedMultiplier *= 0.8; // 20% slower in rain
    }
    if (weatherConditions.isSnowing) {
      speedMultiplier *= 0.6; // 40% slower in snow
    }
    if (weatherConditions.temperature !== undefined) {
      if (weatherConditions.temperature < 0) {
        speedMultiplier *= 0.8; // 20% slower in freezing temperatures
      } else if (weatherConditions.temperature > 30) {
        speedMultiplier *= 0.9; // 10% slower in hot temperatures
      }
    }
  }

  const adjustedSpeed = averageSpeed * speedMultiplier;
  return Math.ceil((distance / adjustedSpeed) * 60);
}

export const getCoordinatesArray = (coordinates: Coordinates): [number, number] => {
  return [coordinates[0], coordinates[1]];
};

export const calculateDeliveryFeeNew = async (
  shopCoordinates: Coordinates,
  deliveryAddress: Coordinates,
  options: IDeliveryFeeOptions
): Promise<number> => {
  try {
    const distance = calculateHaversineDistance(
      getCoordinatesArray(shopCoordinates),
      getCoordinatesArray(deliveryAddress)
    );

    let fee = options.baseFee ?? DELIVERY_CONSTANTS.BASE_FEE + distance * (options.distanceRate ?? DELIVERY_CONSTANTS.DISTANCE_RATE);
    fee = Math.max(fee, options.minFee ?? DELIVERY_CONSTANTS.MIN_FEE);
    fee = Math.min(fee, options.maxFee ?? DELIVERY_CONSTANTS.MAX_FEE);

    return fee;
  } catch (error) {
    logger.error('Error calculating delivery fee', {
      error,
      metadata: { shopCoordinates, deliveryAddress, options }
    });
    throw new AppError('Failed to calculate delivery fee', ErrorCode.INTERNAL_ERROR, {
      metadata: { shopCoordinates, deliveryAddress, options }
    });
  }
}; 