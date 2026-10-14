
export type ColumnValidator<T> = (
    value: string,
    context: ColumnValidationContext,
) => ColumnValidationResult<T>;

export interface ColumnValidationContext {
    row: number;
}

export type ColumnValidationResult<T> =
    | {
            success: true;
            value: T;
      }
    | {
          success: false;
          message: string;
      };