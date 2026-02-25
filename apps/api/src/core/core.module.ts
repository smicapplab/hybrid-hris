import { Module } from "@nestjs/common";
import { OrgUnitsModule } from "./org-units/org-units.module";
import { PositionsModule } from './positions/positions.module';

@Module({
    imports: [OrgUnitsModule, PositionsModule],
    exports: [OrgUnitsModule],
})

export class CoreModule { }