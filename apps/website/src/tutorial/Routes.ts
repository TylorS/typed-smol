export const isQuickStartSection = (id: string): boolean =>
  id === "install" || id === "reactive-state";

export const counterLessonPath = (id: string): string => `/explore/counter/${id}`;
