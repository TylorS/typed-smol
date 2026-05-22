import { Layer } from "effect";
import { ApplicationServices } from "../application/Services.js";
import { PasswordHasher } from "../infrastructure/PasswordHasher.js";
import { SessionTokens } from "../infrastructure/SessionTokens.js";
import { ArticleRepository } from "../infrastructure/repositories/ArticleRepository.js";
import { CommentRepository } from "../infrastructure/repositories/CommentRepository.js";
import { ProfileRepository } from "../infrastructure/repositories/ProfileRepository.js";
import { TagRepository } from "../infrastructure/repositories/TagRepository.js";
import { UserRepository } from "../infrastructure/repositories/UserRepository.js";

export default ApplicationServices.pipe(
  Layer.provideMerge(UserRepository.Live),
  Layer.provideMerge(ProfileRepository.Live),
  Layer.provideMerge(ArticleRepository.Live),
  Layer.provideMerge(CommentRepository.Live),
  Layer.provideMerge(TagRepository.Live),
  Layer.provideMerge(SessionTokens.Live),
  Layer.provideMerge(PasswordHasher.Live),
);
