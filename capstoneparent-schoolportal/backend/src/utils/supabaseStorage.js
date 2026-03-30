const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/**
 * HOW TO SET UP THE BUCKET (one-time manual step):
 *
 *   1. Supabase Dashboard → Storage → New Bucket
 *   2. Name it to match SUPABASE_BUCKET in your .env (default: "parent-docs")
 *   3. Leave it PRIVATE (do NOT toggle "Public bucket")
 *   4. Click Create
 *
 * We never create the bucket programmatically — Supabase returns 405 Method
 * Not Allowed when you call createBucket() even with a service role key.
 * The bucket must exist before the server starts uploading.
 *
 * ALLOWED FILE TYPES: jpg, jpeg, png, pdf
 *
 * SIGNED URLS:
 *   Private buckets require a signed URL for every file read. We generate one
 *   immediately after upload and store it in File.file_path so reads need no
 *   extra Supabase call. Supabase caps signed URLs at 2 years max.
 */

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"];

// Supabase's maximum allowed expiry for signed URLs is 2 years
const TWO_YEARS_IN_SECONDS = 2 * 365 * 24 * 60 * 60; // 63,072,000

const _parsed = parseInt(process.env.SIGNED_URL_EXPIRES_IN, 10);
const expiresIn =
  Number.isInteger(_parsed) && _parsed > 0
    ? Math.min(_parsed, TWO_YEARS_IN_SECONDS)
    : TWO_YEARS_IN_SECONDS;

let _supabase = null;

const getClient = () => {
  if (_supabase) return _supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url)
    throw new Error(
      "Missing env var: SUPABASE_URL — add it to your .env file.",
    );
  if (!key)
    throw new Error(
      "Missing env var: SUPABASE_SERVICE_ROLE_KEY — add it to your .env file.",
    );

  _supabase = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return _supabase;
};

const parseSupabaseStorageUrl = (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== "string") return null;

  try {
    const parsed = new URL(fileUrl);
    const patterns = [
      /\/storage\/v1\/object\/sign\/([^/]+)\/(.+)$/,
      /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/,
      /\/storage\/v1\/object\/authenticated\/([^/]+)\/(.+)$/,
      /\/storage\/v1\/object\/([^/]+)\/(.+)$/,
    ];

    for (const pattern of patterns) {
      const match = parsed.pathname.match(pattern);
      if (!match) continue;
      const bucket = decodeURIComponent(match[1]);
      const key = decodeURIComponent(match[2]);
      return { bucket, key };
    }

    return null;
  } catch (_) {
    return null;
  }
};

/**
 * Upload a single multer file object to Supabase Storage and return a signed URL.
 *
 * Flow:
 *   1. Validate file type (jpg, jpeg, png, pdf only)
 *   2. Read the multer temp file from disk
 *   3. Upload to Supabase Storage
 *   4. Delete the multer temp file
 *   5. Generate a signed URL and return it — caller stores this in File.file_path
 *
 * @param {{ path: string, originalname: string, mimetype: string, size: number }} file
 * @returns {Promise<string>} signed URL
 */
const uploadFile = async (file) => {
  const supabase = getClient();
  const BUCKET = process.env.SUPABASE_BUCKET || "parent-docs";

  // Validate file type before touching Supabase
  const ext = path.extname(file.originalname).toLowerCase();
  if (
    !ALLOWED_EXTENSIONS.includes(ext) ||
    !ALLOWED_MIME_TYPES.includes(file.mimetype)
  ) {
    try {
      fs.unlinkSync(file.path);
    } catch (_) {}
    throw new Error(
      `Invalid file type: ${file.originalname}. Only JPG, JPEG, PNG, and PDF files are allowed.`,
    );
  }

  // Collision-proof storage key that preserves the original extension
  const storageKey = `${Date.now()}_${crypto.randomBytes(8).toString("hex")}${ext}`;

  const fileBuffer = fs.readFileSync(file.path);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storageKey, fileBuffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  // Always clean up the multer temp file regardless of upload result
  try {
    fs.unlinkSync(file.path);
  } catch (_) {}

  if (uploadError) {
    throw new Error(`Supabase upload failed: ${uploadError.message}`);
  }

  // Math.floor guarantees a whole integer is passed — Supabase rejects floats
  const { data: signedData, error: signedError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storageKey, Math.floor(expiresIn));

  if (signedError || !signedData?.signedUrl) {
    throw new Error(
      `Supabase signed URL generation failed: ${signedError?.message ?? "no URL returned"}`,
    );
  }

  return signedData.signedUrl;
};

/**
 * Upload multiple multer file objects to Supabase Storage in parallel.
 *
 * All files are uploaded concurrently via Promise.all. If any single file
 * fails (invalid type, upload error, signed URL error), the entire batch
 * rejects and all successfully written temp files are cleaned up.
 *
 * @param {{ path: string, originalname: string, mimetype: string, size: number }[]} files
 * @returns {Promise<string[]>} array of signed URLs in the same order as input files
 */
const uploadFiles = async (files) => {
  if (!files || files.length === 0) return [];
  return Promise.all(files.map((file) => uploadFile(file)));
};

const deleteFileByUrl = async (fileUrl) => {
  const supabase = getClient();
  const parsedStorageRef = parseSupabaseStorageUrl(fileUrl);

  if (!parsedStorageRef?.bucket || !parsedStorageRef?.key) {
    return false;
  }

  const { error } = await supabase.storage
    .from(parsedStorageRef.bucket)
    .remove([parsedStorageRef.key]);
  if (error) {
    throw new Error(`Supabase file delete failed: ${error.message}`);
  }

  return true;
};

module.exports = { uploadFile, uploadFiles, deleteFileByUrl };
