/** Violação de unicidade do Postgres via Prisma (duck-typing: mock-friendly). */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === 'P2002'
  );
}
