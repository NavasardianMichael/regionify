import { contactSchema } from '@regionify/shared';
import { type Router as ExpressRouter, Router } from 'express';

import { validate } from '../middleware/validate.js';
import { contactService } from '../services/contactService.js';

const router: ExpressRouter = Router();

// POST /api/contact
router.post('/', validate(contactSchema), async (req, res, next) => {
  try {
    const result = await contactService.sendContactForm(req.body);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export const contactRoutes: ExpressRouter = router;
