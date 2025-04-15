import { DatabaseError } from './AppError';
import { logger } from './logger';

/**
 * Coordinates type for location points
 */
export type Coordinates = [number, number];

/**
 * Calculates the delivery fee based on shop and delivery coordinates
 * @param shopCoordinates - The coordinates of the shop
 * @param deliveryCoordinates - The coordinates of the delivery address
 * @returns The calculated delivery fee
 * @throws DatabaseError if the calculation fails
 */
export async function calculateDeliveryFee(
  shopCoordinates: Coordinates,
  deliveryCoordinates: Coordinates
): Promise<number> {
  try {
    // In a real implementation, this would use a geocoding service to get coordinates
    // and then calculate the distance using the Haversine formula
    const distance = calculateHaversineDistance(shopCoordinates, deliveryCoordinates);
    const baseFee = 5.0;
    const distanceFee = distance * 0.5; // $0.50 per kilometer
    const totalFee = baseFee + distanceFee;

    logger.info('Delivery fee calculated', {
      shopCoordinates,
      deliveryCoordinates,
      distance,
      baseFee,
      distanceFee,
      totalFee
    });

    return totalFee;
  } catch (error) {
    logger.error('Failed to calculate delivery fee', {
      shopCoordinates,
      deliveryCoordinates,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw new DatabaseError('Failed to calculate delivery fee', {
      context: { shopCoordinates, deliveryCoordinates }
    });
  }
}

/**
 * Calculates the distance between two points using the Haversine formula
 * @param point1 - First set of coordinates
 * @param point2 - Second set of coordinates
 * @returns Distance in kilometers
 */
function calculateHaversineDistance(point1: Coordinates, point2: Coordinates): number {
  const [lat1, lon1] = point1;
  const [lat2, lon2] = point2;

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Converts degrees to radians
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
} 