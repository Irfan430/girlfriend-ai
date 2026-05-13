/**
 * Client-side storage helper — uploads files via tRPC presigned URL flow.
 * Uses the Forge API frontend key to get a presigned PUT URL, then uploads directly.
 */

const FORGE_API_URL = import.meta.env.VITE_FRONTEND_FORGE_API_URL as string;
const FORGE_API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY as string;

export async function storagePut(
  relKey: string,
  data: Uint8Array | ArrayBuffer,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  // Get presigned URL from Forge
  const presignRes = await fetch(`${FORGE_API_URL}/storage/presign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify({ key: relKey, contentType }),
  });

  if (!presignRes.ok) {
    throw new Error(`Storage presign failed: ${presignRes.status}`);
  }

  const { presignedUrl, key } = await presignRes.json();

  // Upload directly to S3
  const uploadRes = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: data instanceof Uint8Array ? (data as unknown as BodyInit) : (new Uint8Array(data) as unknown as BodyInit),
  });

  if (!uploadRes.ok) {
    throw new Error(`Storage upload failed: ${uploadRes.status}`);
  }

  return { key, url: `/manus-storage/${key}` };
}
