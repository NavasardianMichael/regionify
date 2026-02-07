import { type Router as ExpressRouter, Router } from 'express';

import { requireAuth } from '../middleware/requireAuth.js';
import { projectService } from '../services/projectService.js';

const router: ExpressRouter = Router();

// All project routes require authentication
router.use(requireAuth);

// GET /api/projects - List user's projects
router.get('/', async (req, res, next) => {
  try {
    const userId = req.session.userId!;
    const projects = await projectService.getProjectsByUser(userId);

    res.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id - Get single project
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.session.userId!;
    const project = await projectService.getProjectById(userId, req.params.id);

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects - Create a project
router.post('/', async (req, res, next) => {
  try {
    const userId = req.session.userId!;
    const { name, selectedRegionId, dataset, mapStyles, legendStyles, legendData } = req.body;

    const project = await projectService.createProject(userId, {
      name,
      selectedRegionId: selectedRegionId ?? null,
      dataset: dataset ?? null,
      mapStyles: mapStyles ?? null,
      legendStyles: legendStyles ?? null,
      legendData: legendData ?? null,
    });

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/projects/:id - Update a project
router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.session.userId!;
    const { name, selectedRegionId, dataset, mapStyles, legendStyles, legendData } = req.body;

    const project = await projectService.updateProject(userId, req.params.id, {
      ...(name !== undefined && { name }),
      ...(selectedRegionId !== undefined && { selectedRegionId }),
      ...(dataset !== undefined && { dataset }),
      ...(mapStyles !== undefined && { mapStyles }),
      ...(legendStyles !== undefined && { legendStyles }),
      ...(legendData !== undefined && { legendData }),
    });

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:id - Delete a project
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.session.userId!;
    await projectService.deleteProject(userId, req.params.id);

    res.json({
      success: true,
      data: { message: 'Project deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
});

export const projectRoutes: ExpressRouter = router;
