export const sanitizeUser = <T extends { password?: string }>(user: T) => {
  if (!user) return user;
  const { password, ...safe } = user;
  void password;
  return safe;
};
