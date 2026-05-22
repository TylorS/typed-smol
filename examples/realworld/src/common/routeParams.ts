import * as Route from "@typed/router";

export const PageParam = Route.PositiveInt("page").optional();
export const LimitParam = Route.NonNegativeInt("limit").optional();
export const OffsetParam = Route.NonNegativeInt("offset").optional();

export const PageQuery = Route.QueryParams(PageParam);
export const PaginationQuery = Route.QueryParams(LimitParam, OffsetParam);
