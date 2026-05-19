// Vercel Serverless API entrypoint for Social Sense backend
import { VercelRequest, VercelResponse } from '@vercel/node';
import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import Anthropic from '@anthropic-ai/sdk';
import { validateDaysParameter, isValidUUID, isValidStateCode } from '../src/utils/query-validation.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../src/middleware/validation-middleware.js';
import {
  CreateEntitySchema,
  UpdateEntitySchema,
  EntityIdParamSchema,
  CreateChatSchema,
  CreateCompetitorGroupSchema,
  FetchNewsSchema,
} from '../src/schemas/validation.js';

// Load env vars
dotenv.config();

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING;
const connectionUsesSsl = databaseUrl && !databaseUrl.includes('localhost');

// Pool for serverless: create on demand
function getPool() {
  return databaseUrl
    ? new Pool({
        connectionString: databaseUrl,
        ssl: connectionUsesSsl ? { rejectUnauthorized: false } : false,
      })
    : new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'socialsense',
      });
}

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

import entitiesHandler from './entities';
import healthHandler from './health';
import competitorGroupsHandler from './competitor-groups';
import trendsHandler from './trends';
  if (url?.startsWith('/api/trends')) {
    return trendsHandler(req, res);
  }

// Simple router for Vercel Functions
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url, method } = req;
  if (url?.startsWith('/api/entities')) {
    return entitiesHandler(req, res);
  }
  if (url?.startsWith('/api/health')) {
    return healthHandler(req, res);
  }
  if (url?.startsWith('/api/competitor-groups')) {
    return competitorGroupsHandler(req, res);
  }
  // TODO: Add more routes as you migrate them
  res.status(404).json({ error: 'Not found' });
}

// TODO: Add all other routes here, using getPool() for each DB op

// Vercel handler
export default (req: VercelRequest, res: VercelResponse) => {
  app(req as any, res as any);
};
