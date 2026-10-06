import express from 'express';
import {
  getGraph,
  addNode,
  deleteNode,
  addEdge,
  deleteEdge,
  completeHabit,
  getAnalytics
} from '../controllers/graphController.js';

const router = express.Router();

router.get('/', getGraph);
router.post('/node', addNode);
router.delete('/node/:id', deleteNode);
router.post('/edge', addEdge);
router.delete('/edge', deleteEdge);
router.post('/complete/:id', completeHabit);
router.get('/analytics', getAnalytics);

export default router;
