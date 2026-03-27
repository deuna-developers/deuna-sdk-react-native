import { SearchParams } from "../helpers/buildElementsLink";

export const addSearchParamWhen = (
  condition: boolean | undefined,
  paramName: keyof SearchParams,
  searchParams: SearchParams
) => {
  if (condition) {
    searchParams[paramName] = String(condition);
  }
};
