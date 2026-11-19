export function Flash({ ok, erro }: { ok?: string; erro?: string }) {
  return (
    <>
      {ok && (
        <p role="status" className="rounded-md bg-bebe-soft p-3 text-sm font-semibold text-marinho">
          {ok}
        </p>
      )}
      {erro && (
        <p role="alert" className="rounded-md bg-rosa-soft p-3 text-sm font-semibold text-marinho">
          {erro}
        </p>
      )}
    </>
  );
}

export const firstParam = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] : v) ?? "";
export const Loading = () => <div className="h-64 animate-pulse rounded-md bg-lilas-soft" aria-busy="true" />;
