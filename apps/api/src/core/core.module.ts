import { Module } from "@nestjs/common";
import { OrgUnitsModule } from "./org-units/org-units.module";

@Module({
    imports: [OrgUnitsModule],
    exports: [OrgUnitsModule],
})

export class CoreModule { }