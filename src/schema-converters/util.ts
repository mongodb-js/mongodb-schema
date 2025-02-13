export async function allowAbort(signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) =>
    setTimeout(() => {
      if (signal?.aborted) return reject(signal?.reason || new Error('Operation aborted'));
      resolve();
    })
  );
}
