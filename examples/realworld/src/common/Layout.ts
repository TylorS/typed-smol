export const defaultAvatar = "/default-avatar.svg";

export const avatarSrc = (image: string | null | undefined): string => {
  const value = image?.trim() ?? "";
  if (value === "") return defaultAvatar;
  if (value.startsWith("/") && !value.startsWith("//")) return value;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? value : defaultAvatar;
  } catch {
    return defaultAvatar;
  }
};
