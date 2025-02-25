export const ALLOW_ABORT_INTERVAL_COUNT = 1000;

export async function allowAbort(signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) =>
    setTimeout(() => {
      if (signal?.aborted) return reject(signal?.reason || new Error('Operation aborted'));
      resolve();
    })
  );
}
