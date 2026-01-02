// Runs once after all tests
import { stopTestServer } from "./helpers";

export default async function globalTeardown(): Promise<void> {
  console.log("🛑 Stopping test server after all tests...");
  await stopTestServer();
  setTimeout(() => process.exit(0), 1000);
}
