# Intent

Simplify the current runtime compiler implementation now that the necessary shape is clearer.

The goal is not to restart the compiler design. The goal is to reduce rough, speculative, or duplicate code while preserving one path toward both:

- optimizing every `@typed/template` `html` template for server and DOM environments;
- keeping `@typed/compiler` focused on template/app compilation rather than replacing `vmc`;
- compiling Typed applications in dev with HMR that preserves eligible `RefSubject` state;
- separating universal template optimization from narrower stateful HMR boundaries;
- making the next implementation tranche easier to test and reason about.

The first simplification bits should be enabling work for HMR improvements, while still shaping the same compiler substrate that will optimize all templates across environments.
