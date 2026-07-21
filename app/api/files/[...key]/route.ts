/**
 * ROLE OF THIS FILE
 * Serves locally-stored uploads (.data/uploads) in the §0.2 no-Supabase
 * fallback — the local stand-in for the public Storage bucket. Public like
 * the bucket it mirrors; keys are unguessable uuid-prefixed names.
 */

import { promises as fs } from "fs";
import path from "path";
import { contentTypeFor } from "@/lib/admin/files";

const UPLOADS_DIR = path.join(process.cwd(), ".data", "uploads");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  // basename() strips any traversal; local keys are always a single segment.
  const name = path.basename(key.join("/"));
  try {
    const bytes = await fs.readFile(path.join(UPLOADS_DIR, name));
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": contentTypeFor(name),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
