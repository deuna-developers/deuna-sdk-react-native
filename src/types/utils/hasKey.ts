// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
export function hasKey<O>(obj: O, key: keyof any): key is keyof O {
  return key in obj;
}
