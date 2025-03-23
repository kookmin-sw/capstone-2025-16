import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { CohortQueryController } from './controller/CohortQueryController';

// Create Express app
const app = express();
const port = process.env.PORT || 3001; // Use port 3001 for development

// Configure middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for large cohort expressions
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Initialize controller
const cohortQueryController = new CohortQueryController();

// Define routes
app.post('/api/cohort-query/sql', cohortQueryController.generateSql);
app.post('/api/cohort-query/validate', cohortQueryController.validateExpression);

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  res.status(200).json({ status: 'UP' });
});

// Add root endpoint for API documentation or redirection
app.get('/', (req: express.Request, res: express.Response) => {
  res.status(200).json({
    message: 'Cohort Query Service API',
    endpoints: {
      health: 'GET /health',
      generateSql: 'POST /api/cohort-query/sql',
      validateExpression: 'POST /api/cohort-query/validate'
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Cohort Query Service is running on port ${port}`);
});

export default app;