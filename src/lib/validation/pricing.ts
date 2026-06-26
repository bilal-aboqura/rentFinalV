import { z } from 'zod';

export const RoutePriceIdSchema = z.object({
  id: z.string().uuid({ message: 'Invalid ID format' }),
});

export const RoutePriceLookupSchema = z.object({
  pickupId: z.string().uuid({ message: 'Invalid pickup location ID format' }),
  destinationId: z.string().uuid({ message: 'Invalid destination location ID format' }),
}).refine(data => data.pickupId !== data.destinationId, {
  message: 'Pickup and destination locations must be different',
  path: ['destinationId'],
});

export const CreateRoutePriceSchema = z.object({
  pickupLocationId: z.string().uuid({ message: 'Invalid pickup location ID format' }),
  destinationLocationId: z.string().uuid({ message: 'Invalid destination location ID format' }),
  price: z.number({ message: 'Price must be a valid number' })
    .positive({ message: 'Price must be a positive number greater than zero' }),
}).refine(data => data.pickupLocationId !== data.destinationLocationId, {
  message: 'Pickup and destination locations must be different',
  path: ['destinationLocationId'],
});

export const UpdateRoutePriceSchema = z.object({
  id: z.string().uuid({ message: 'Invalid ID format' }),
  pickupLocationId: z.string().uuid({ message: 'Invalid pickup location ID format' }).optional(),
  destinationLocationId: z.string().uuid({ message: 'Invalid destination location ID format' }).optional(),
  price: z.number({ message: 'Price must be a valid number' })
    .positive({ message: 'Price must be a positive number greater than zero' })
    .optional(),
}).refine(data => (
  data.pickupLocationId !== undefined ||
  data.destinationLocationId !== undefined ||
  data.price !== undefined
), {
  message: 'At least one pricing field must be provided',
  path: ['form'],
}).refine(data => {
  if (!data.pickupLocationId || !data.destinationLocationId) return true;
  return data.pickupLocationId !== data.destinationLocationId;
}, {
  message: 'Pickup and destination locations must be different',
  path: ['destinationLocationId'],
});
