export const sanitizeUser = <
  T extends {
    password?: string;
    refreshTokenHash?: string | null;
    refreshTokenExpiresAt?: Date | null;
    tokenVersion?: number;
  },
>(
  user: T,
) => {
  if (!user) return user;
  const { password, refreshTokenHash, refreshTokenExpiresAt, tokenVersion, ...safe } =
    user;
  void password;
  void refreshTokenHash;
  void refreshTokenExpiresAt;
  void tokenVersion;
  return safe;
};
