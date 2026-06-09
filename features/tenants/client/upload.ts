export async function uploadImageToBlob(
  tenantSlug: string,
  deviceToken: string,
  filename: string,
  dataUrl: string,
  opts?: { attempts?: number; retryDelayMs?: number; onProgress?: (pct: number) => void }
) {
  const matches = /^data:(.+);base64,(.+)$/.exec(dataUrl);
  if (!matches) {
    throw new Error("Invalid image data URL");
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: mimeType });
  const file = new File([blob], filename, { type: mimeType });

  const formData = new FormData();
  formData.append("file", file);

  const attempts = opts?.attempts ?? 3;
  const baseDelay = opts?.retryDelayMs ?? 1000;

  let lastError: any = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const result = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(
          "POST",
          `/api/tenants/${tenantSlug}/upload?filename=${encodeURIComponent(filename)}`
        );
        xhr.setRequestHeader("Authorization", `Bearer ${deviceToken}`);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && opts?.onProgress) {
            const pct = Math.round((e.loaded / e.total) * 100);
            try {
              opts.onProgress(pct);
            } catch (_) {}
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const json = JSON.parse(xhr.responseText || "null");
              resolve(json);
            } catch (err) {
              reject(err);
            }
          } else {
            try {
              const json = JSON.parse(xhr.responseText || "null");
              reject(new Error(json?.error || `Upload failed (${xhr.status})`));
            } catch (err) {
              reject(new Error(`Upload failed (${xhr.status})`));
            }
          }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.ontimeout = () => reject(new Error("Upload timed out"));

        xhr.send(formData);
      });

      // ensure progress reaches 100% on success
      try {
        opts?.onProgress?.(100);
      } catch (_) {}

      return result;
    } catch (err: any) {
      lastError = err;
      if (attempt < attempts) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        // small backoff before retrying
        await new Promise((res) => setTimeout(res, delay));
        // reset progress for retry
        try {
          opts?.onProgress?.(0);
        } catch (_) {}
      }
    }
  }

  throw lastError || new Error("Upload failed after retries");
}
