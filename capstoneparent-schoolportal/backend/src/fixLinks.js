const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const prisma = new PrismaClient();
const TWO_YEARS_IN_SECONDS = 2 * 365 * 24 * 60 * 60;

const getClient = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(url, key, { auth: { persistSession: false } });
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

async function run() {
  const supabase = getClient();
  const files = await prisma.file.findMany();
  let updatedCount = 0;
  
  for (const file of files) {
    if (file.file_path.includes("supabase.co")) {
      const parsed = parseSupabaseStorageUrl(file.file_path);
      if (parsed) {
        // Create new signed url with 2 years expiry
        const { data, error } = await supabase.storage
          .from(parsed.bucket)
          .createSignedUrl(parsed.key, TWO_YEARS_IN_SECONDS);
          
        if (data && data.signedUrl) {
          await prisma.file.update({
            where: { file_id: file.file_id },
            data: { file_path: data.signedUrl }
          });
          updatedCount++;
        }
      }
    }
  }
  console.log(`Updated URLs for ${updatedCount} files.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
