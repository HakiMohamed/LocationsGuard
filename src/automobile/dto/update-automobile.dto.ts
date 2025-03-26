import { PartialType } from '@nestjs/mapped-types';
import { CreateAutomobileDto } from './create-automobile.dto';

export class UpdateAutomobileDto extends PartialType(CreateAutomobileDto) {}