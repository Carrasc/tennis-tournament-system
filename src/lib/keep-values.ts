import { startTransition, type FormEvent } from "react";

/**
 * Submits a form to an action without React's automatic reset, so a validation error
 * (a typo in a score, a team without a partner) doesn't wipe what the person typed.
 */
export function keepValues(action: (data: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => action(data));
  };
}
