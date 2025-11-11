import { Eta } from "eta";
import { join } from "path";
import type { ComparisonReport } from "./types";

// Initialize Eta with the templates directory
const eta = new Eta({
  views: join(import.meta.dir, "../templates"),
  cache: false, // Disable cache for development, enable for production
});

/**
 * Generate an HTML report from the comparison results using Eta templates
 */
export async function generateHtmlReport(
  report: ComparisonReport,
  outputPath: string
): Promise<void> {
  const html = await eta.renderAsync("report.html", { report });
  await Bun.write(outputPath, html);
  console.log(`HTML report saved to: ${outputPath}`);
}
