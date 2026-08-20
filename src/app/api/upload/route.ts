import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getAuthFromRequest } from "@/lib/auth";

const ALLOWED_TYPES: Record<
  string,
  { maxSize: number; ext: string; magicBytes: number[][] }
> = {
  "image/jpeg": {
    maxSize: 5 * 1024 * 1024,
    ext: "jpg",
    magicBytes: [
      [0xff, 0xd8, 0xff],
    ],
  },
  "image/png": {
    maxSize: 5 * 1024 * 1024,
    ext: "png",
    magicBytes: [
      [0x89, 0x50, 0x4e, 0x47],
    ],
  },
  "image/webp": {
    maxSize: 5 * 1024 * 1024,
    ext: "webp",
    magicBytes: [
      [0x52, 0x49, 0x46, 0x46],
    ],
  },
  "image/gif": {
    maxSize: 5 * 1024 * 1024,
    ext: "gif",
    magicBytes: [
      [0x47, 0x49, 0x46, 0x38],
    ],
  },
  "application/pdf": {
    maxSize: 10 * 1024 * 1024,
    ext: "pdf",
    magicBytes: [
      [0x25, 0x50, 0x44, 0x46],
    ],
  },
  "video/mp4": {
    maxSize: 25 * 1024 * 1024,
    ext: "mp4",
    magicBytes: [
      [0x00, 0x00, 0x00],
    ],
  },
  "video/webm": {
    maxSize: 25 * 1024 * 1024,
    ext: "webm",
    magicBytes: [
      [0x1a, 0x45, 0xdf, 0xa3],
    ],
  },
  "video/quicktime": {
    maxSize: 25 * 1024 * 1024,
    ext: "mov",
    magicBytes: [
      [0x66, 0x74, 0x79, 0x70],
    ],
  },
};

function verifyMagicBytes(buffer: Buffer, magicBytes: number[][]): boolean {
  return magicBytes.some((magic) =>
    magic.every((byte, i) => buffer[i] === byte)
  );
}

function getExtension(filename: string, fallback: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (ext.length <= 8 && /^[a-z0-9]+$/i.test(ext)) {
    return ext;
  }
  return fallback;
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "noFile" }, { status: 400 });
    }

    const typeRule = ALLOWED_TYPES[file.type];
    if (!typeRule) {
      return NextResponse.json({ error: "invalidType" }, { status: 400 });
    }

    if (file.size > typeRule.maxSize) {
      return NextResponse.json({ error: "tooLarge" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!verifyMagicBytes(buffer, typeRule.magicBytes)) {
      return NextResponse.json(
        { error: "File content does not match declared type" },
        { status: 400 }
      );
    }

    const ext = getExtension(file.name, typeRule.ext);
    const filename = `${auth.userId}-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    return NextResponse.json({ url: `/uploads/${filename}`, type: file.type });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
