export interface PickedImage {
  url: string;
  name: string;
}

/**
 * Validates and reads image files as data URLs.
 * Real API: upload the File objects as multipart FormData and use the returned URLs instead.
 */
export async function readImageFiles(
  files: FileList | File[] | null,
  room: number,
  maxMb = 5,
): Promise<{ items: PickedImage[]; error: string }> {
  const list = Array.from(files ?? []);
  let error = '';
  const ok: File[] = [];
  for (const f of list) {
    if (!f.type.startsWith('image/')) {
      error = `${f.name} is not an image.`;
      continue;
    }
    if (f.size > maxMb * 1024 * 1024) {
      error = `${f.name} is larger than ${maxMb} MB.`;
      continue;
    }
    ok.push(f);
  }
  if (ok.length > room)
    error = `Only ${room} more photo${room === 1 ? '' : 's'} allowed. Extra files were skipped.`;
  const items = await Promise.all(
    ok.slice(0, Math.max(room, 0)).map(
      (f) =>
        new Promise<PickedImage>((res) => {
          const r = new FileReader();
          r.onload = () => res({ url: r.result as string, name: f.name });
          r.readAsDataURL(f);
        }),
    ),
  );
  return { items, error };
}
