import { Transform } from 'class-transformer';
import { ArrayUnique, IsArray, IsInt, Min } from 'class-validator';

export class UpdateUserPermissionsDto {
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map(Number)
      : value === undefined
        ? []
        : [Number(value)],
  )
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  permissionIds: number[];
}
