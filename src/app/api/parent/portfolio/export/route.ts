import { ZipArchive } from "archiver";
import { PassThrough } from "stream";
import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { apiError } from "@/lib/admin/api";
import { requirePortfolioAccess } from "@/lib/parent/access";
import {
  PortfolioActivity,
  PortfolioCurriculum,
  PortfolioWorkSample,
  User,
} from "@/models";
import { getPrivateFilePath } from "@/lib/services/upload";
import fs from "fs";

export async function POST(request: Request) {
  try {
    const sessionResult = await requireRole(["parent"]);
    if ("error" in sessionResult) return sessionResult.error;

    const { portfolioId, categories } = await request.json();
    if (!portfolioId) return apiError(new Error("portfolioId is required"), 400);

    const access = await requirePortfolioAccess(sessionResult.user, portfolioId);
    if ("error" in access) return access.error;

    const { portfolio } = access;
    await connectDB();
    const student = await User.findById(portfolio.studentId).select("name");

    const selected = categories ?? {
      workSamples: true,
      curriculum: true,
      activities: true,
    };

    const archive = new ZipArchive({ zlib: { level: 5 } });
    const passThrough = new PassThrough();
    archive.pipe(passThrough);

    const manifest: string[] = [
      `Explore More Academy — Homeschool Portfolio Export`,
      `Student: ${student?.name ?? "Student"}`,
      `School Year: ${portfolio.schoolYear}`,
      `Exported: ${new Date().toLocaleString()}`,
      "",
    ];

    if (selected.workSamples !== false) {
      const samples = await PortfolioWorkSample.find({ portfolioId });
      manifest.push(`Work Samples (${samples.length})`);
      for (const sample of samples) {
        manifest.push(`- ${sample.subject}: ${sample.assignmentName}`);
        for (const file of sample.files) {
          addFileToArchive(archive, file.path, `work-samples/${file.originalName}`);
        }
      }
      manifest.push("");
    }

    if (selected.curriculum !== false) {
      const items = await PortfolioCurriculum.find({ portfolioId });
      manifest.push(`Curriculum (${items.length})`);
      for (const item of items) {
        manifest.push(`- ${item.subject}: ${item.materialName}`);
        for (const file of item.files) {
          addFileToArchive(archive, file.path, `curriculum/${file.originalName}`);
        }
      }
      manifest.push("");
    }

    if (selected.activities !== false) {
      const activities = await PortfolioActivity.find({ portfolioId });
      manifest.push(`Activities (${activities.length})`);
      for (const activity of activities) {
        manifest.push(`- ${activity.category}: ${activity.activityName}`);
        for (const file of activity.files) {
          addFileToArchive(archive, file.path, `activities/${file.originalName}`);
        }
      }
    }

    archive.append(manifest.join("\n"), { name: "README.txt" });
    await archive.finalize();

    const chunks: Buffer[] = [];
    for await (const chunk of passThrough) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    const filename = `portfolio-${portfolio.schoolYear.replace(/[^\d-]/g, "")}.zip`;

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

function addFileToArchive(
  archive: ZipArchive,
  relativePath: string,
  archiveName: string
) {
  try {
    const filepath = getPrivateFilePath(relativePath);
    if (fs.existsSync(filepath)) {
      archive.file(filepath, { name: archiveName });
    }
  } catch {
    // skip missing files
  }
}
