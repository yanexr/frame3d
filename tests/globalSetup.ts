// Run once before all tests
import path from 'path';
import dotenv from 'dotenv';
import { startTestServer } from "./helpers";

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

export default async function globalSetup(): Promise<void> {
  console.log("🚀 Starting test server for all tests...");
  await startTestServer();
}
