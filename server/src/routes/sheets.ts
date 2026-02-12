import { fetchSheetSchema } from '@regionify/shared';
import { type Router as ExpressRouter, Router } from 'express';

import { validate } from '../middleware/validate.js';
import { sheetsService } from '../services/sheetsService.js';

const router: ExpressRouter = Router();

// POST /api/sheets/fetch - Fetch a public Google Sheet as CSV
router.post('/fetch', validate(fetchSheetSchema), async (req, res, next) => {
  try {
    const { url } = req.body;
    const csv = await sheetsService.fetchPublicSheet(url);

    res.json({
      success: true,
      data: { csv },
    });
  } catch (error) {
    next(error);
  }
});

export const sheetsRoutes: ExpressRouter = router;
