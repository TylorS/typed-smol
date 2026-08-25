import type * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import type * as Fx from "@typed/fx/Fx";
import * as Form from "../Form.js";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;

const phone = Form.mask(
  "(",
  Form.slot("area", Schema.FiniteFromString, { length: 3 }),
  ") ",
  Form.slot("line", Schema.FiniteFromString, { length: 4 }),
);

const Example = Form.make(
  Schema.Struct({
    email: Schema.String,
    quantity: Schema.Finite,
    birthday: Schema.DateFromString,
    accepted: Schema.Boolean,
    choice: Schema.String,
    tags: Schema.Array(Schema.String),
    phone,
  }),
);

declare const form: Effect.Success<ReturnType<typeof Example.state>>;

const email = Example.EmailInput({ name: "email" });
Example.TextInput({ name: "choice" });
Example.NumberInput({ name: "quantity" });
Example.DateInput({ name: "birthday" });
Example.MaskedInput({ name: "phone", mask: phone });
Example.Checkbox({ name: "accepted" });
Example.Select({ name: "choice", content: "Choice" });
Example.Error({ name: "quantity" });
Example.Reset({ content: "Reset" });
Example.Push({ name: "tags", value: "typed", content: "Add" });
Example.Remove({ name: "tags", index: 0, content: "Remove" });

const root = Example.Root({
  form,
  content: email,
  onValidSubmit: (values) => {
    type _Email = Assert<Equal<typeof values.email, string>>;
    type _Quantity = Assert<Equal<typeof values.quantity, number>>;
    return Effect.succeed([true] as const);
  },
});

type CurrentFormId = Context.Service.Identifier<typeof Form.CurrentForm>;
type _RootProvidesCurrentForm = Assert<
  Equal<Extract<Fx.Services<typeof root>, CurrentFormId>, never>
>;

// @ts-expect-error quantity is not a string field
Example.EmailInput({ name: "quantity" });

// @ts-expect-error email is not a numeric field
Example.NumberInput({ name: "email" });

// @ts-expect-error choice is not a boolean field
Example.Checkbox({ name: "choice" });

// @ts-expect-error email is not an array field
Example.Push({ name: "email", value: "typed", content: "Add" });

void root;

void Example;
