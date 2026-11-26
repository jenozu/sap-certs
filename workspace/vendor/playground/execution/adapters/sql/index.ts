import type { ExecutionEngine, ExecutionResult } from "../../../types/execution";

const spawnWorker = () => new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });

/** Main-thread side: talks to the sql.js worker. stop() kills and respawns it (dataset reapplied). */
export function createSqlEngine(makeWorker: () => Worker = spawnWorker): ExecutionEngine {
  let worker: Worker | undefined;
  let dataset: string | undefined;
  let seq = 0;
  const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

  const rejectAll = (msg: string) => {
    for (const p of pending.values()) p.reject(new Error(msg));
    pending.clear();
  };
  const kill = () => {
    worker?.terminate();
    worker = undefined;
    rejectAll("Execution stopped");
  };
  const spawn = () => {
    const w = makeWorker();
    w.addEventListener("message", ({ data }: MessageEvent) => {
      const p = pending.get(data.id);
      if (!p) return;
      pending.delete(data.id);
      if (data.error) p.reject(new Error(data.error));
      else p.resolve(data.result);
    });
    const onError = (e: Event) => {
      e.preventDefault?.();
      if (worker === w) rejectAll((e as ErrorEvent).message || "SQL engine failed to load");
    };
    w.addEventListener("error", onError);
    w.addEventListener("messageerror", onError);
    worker = w;
  };
  const call = <T>(msg: object): Promise<T> => {
    if (!worker) spawn();
    const w = worker!;
    return new Promise<T>((resolve, reject) => {
      const id = ++seq;
      pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
      w.postMessage({ id, ...msg });
    });
  };
  const restart = async () => {
    kill();
    await call({ type: "init", dataset });
  };

  return {
    initialize: restart,
    execute: async (code, options) => {
      const ds = (options as { dataset?: string } | undefined)?.dataset; // undefined = lesson has no dataset
      if (ds !== dataset) {
        dataset = ds;
        await call({ type: "init", dataset });
      }
      return call<ExecutionResult>({ type: "exec", code });
    },
    stop: restart,
    reset: () => (worker ? call({ type: "reset" }).then(() => undefined) : restart()),
    dispose: async () => kill(),
  };
}
