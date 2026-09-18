/** Supabase reports many failures in the response rather than by throwing. */
export function throwIfSupabaseError<T extends { error: unknown }>(result: T): T {
  if (result.error) throw result.error;
  return result;
}
