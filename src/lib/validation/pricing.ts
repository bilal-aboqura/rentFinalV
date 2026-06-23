import { z } from 'zod';

export const CreateRoutePriceSchema = z.object({
  pickupLocationId: z.string().uuid({ message: 'Invalid pickup location ID format' }),
  destinationLocationId: z.string().uuid({ message: 'Invalid destination location ID format' }),
  price: z.number({ invalid_type_error: 'Price must be a valid number' })
    .positive({ message: 'Price must be a positive number greater than zero' }),
}).refine(data => data.pickupLocationId !== data.destinationLocationId, {
  message: 'Pickup and destination locations must be different',
  path: ['destinationLocationId'],
});

export const UpdateRoutePriceSchema = z.object({
  id: z.string().uuid({ message: 'Invalid ID format' }),
  pickupLocationId: z.string().uuid({ message: 'Invalid pickup location ID format' }).optional(),
  destinationLocationId: z.string().uuid({ message: 'Invalid destination location ID format' }).optional(),
  price: z.number({ invalid_type_error: 'Price must be a valid number' })
    .positive({ message: 'Price must be a positive number greater than zero' })
    .optional(),
}).refine(data => {
  if (data.pickupLocationId && data.destinationLocationId) {
    return data.pickupLocationId !== data.destinationLocationId;
  }
  return true;
}, {
  message: 'Pickup and destination locations must be different',
  path: ['destinationLocationId'],
});
