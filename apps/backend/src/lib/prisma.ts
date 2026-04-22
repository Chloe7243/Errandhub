import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma";

// Single shared Prisma client. We use the pg driver adapter (rather than
// Prisma's default engine) so the generated client can run on serverless /
// edge-friendly hosts and reuse a single Postgres connection pool.
const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
