import { ApplicationServices } from "./application/Services.js";
import { RealWorldConfig } from "./infrastructure/Config.js";
import { PasswordHasher } from "./infrastructure/PasswordHasher.js";
import { SessionTokens } from "./infrastructure/SessionTokens.js";
import { SqliteLive } from "./infrastructure/Sql.js";
import { ArticleRepository } from "./infrastructure/repositories/ArticleRepository.js";
import { CommentRepository } from "./infrastructure/repositories/CommentRepository.js";
import { ProfileRepository } from "./infrastructure/repositories/ProfileRepository.js";
import { TagRepository } from "./infrastructure/repositories/TagRepository.js";
import { UserRepository } from "./infrastructure/repositories/UserRepository.js";
import { ServerPageData } from "./page-data/ServerPageData.js";

export const layers = [
  ServerPageData,
  ApplicationServices,
  UserRepository.Live,
  ProfileRepository.Live,
  ArticleRepository.Live,
  CommentRepository.Live,
  TagRepository.Live,
  SessionTokens.Live,
  PasswordHasher.Live,
  SqliteLive,
  RealWorldConfig.Live,
] as const;
