/**
 * Wraps an object that should only be created on first use, such as the
 * database client or Better Auth. Importing a module that exports one then
 * reads no env vars, so `next build` works without the runtime secrets.
 */
export function lazyObject<T extends object>(create: () => T): T {
  let instance: T | undefined;
  const real = () => (instance ??= create());
  return new Proxy({} as T, {
    get(_target, key) {
      const target = real();
      const value = Reflect.get(target, key);
      return typeof value === "function" ? value.bind(target) : value;
    },
    has: (_target, key) => key in real(),
  });
}
