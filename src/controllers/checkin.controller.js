import { initiateCheckInSchema, payCheckInSchema, assignCabinSchema } from '../validators/checkin.validator.js';
import * as checkinService from '../services/checkin.service.js';

const formatZodError = (error, res) => {
  return res.status(400).json({
    success: false,
    error: { code: 'ERR_VALIDATION', message: error.errors[0].message }
  });
};

export const initiate = async (req, res, next) => {
  try {
    const validated = initiateCheckInSchema.parse({ body: req.body });
    const result = await checkinService.initiateCheckIn(validated.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    if (error.name === 'ZodError') return formatZodError(error, res);
    next(error); // Pasa el error al errorHandler global
  }
};

export const pay = async (req, res, next) => {
  try {
    const validated = payCheckInSchema.parse({ body: req.body });
    const result = await checkinService.processPayment(validated.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error.name === 'ZodError') return formatZodError(error, res);
    next(error);
  }
};

export const cabin = async (req, res, next) => {
  try {
    const validated = assignCabinSchema.parse({ body: req.body });
    const result = await checkinService.assignCabin(validated.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error.name === 'ZodError') return formatZodError(error, res);
    next(error);
  }
};