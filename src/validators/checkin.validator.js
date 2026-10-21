import { z } from 'zod';

export const initiateCheckInSchema = z.object({
  body: z.object({
    groupCode: z.string().min(1, 'Group code is required')
  })
});

export const payCheckInSchema = z.object({
  body: z.object({
    checkInId: z.string().uuid(),
    amount: z.number().positive(),
    documentNumber: z.string().min(5)
  })
});

export const assignCabinSchema = z.object({
  body: z.object({
    checkInId: z.string().uuid(),
    cabinId: z.string().uuid()
  })
});