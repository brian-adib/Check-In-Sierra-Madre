import { z } from 'zod';

export const initiateCheckInSchema = z.object({
  body: z.object({
    groupCode: z.string().min(1),
    passengers: z.array(
      z.object({
        documentType: z.enum(['DNI', 'PASSPORT', 'ID']),
        documentNumber: z.string().min(5),
        firstName: z.string().min(2),
        lastName: z.string().min(2),
        birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format must be YYYY-MM-DD'),
        isVip: z.boolean().optional().default(false)
      })
    ).min(1, 'At least one passenger is required')
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