/** The server's ApiResponse message from an RTK Query error, if there is one. */
export const apiErrorMessage = (e: unknown, fallback = 'Something went wrong'): string => {
  const data = (e as { data?: { message?: string } })?.data;
  return data?.message ?? fallback;
};
