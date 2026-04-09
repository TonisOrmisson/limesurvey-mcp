export function getRc2Status(result: unknown): string | null {
  if (
    result &&
    typeof result === 'object' &&
    'status' in result &&
    typeof (result as { status?: unknown }).status === 'string'
  ) {
    return (result as { status: string }).status;
  }

  return null;
}
