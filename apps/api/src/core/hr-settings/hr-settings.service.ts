import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { hrSettings } from '@hybrid-hris/db/schema';
import { eq } from 'drizzle-orm';
import { UpdateHrSettingsDto } from './dto/update-hr-settings.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class HrSettingsService {
    constructor(
        private readonly db: DatabaseService,
        private readonly auditService: AuditService,
    ) { }

    async getSettings() {
        const settings = await this.db.db.select().from(hrSettings).where(eq(hrSettings.singleton, true)).limit(1);
        if (settings.length === 0) {
            // Should be seeded, but handle just in case
            return null;
        }
        return settings[0];
    }

    async updateSettings(dto: UpdateHrSettingsDto, actorId: string) {
        const current = await this.getSettings();
        if (!current) {
            throw new NotFoundException('HR Settings not found. Please ensure the system is seeded.');
        }

        // Logic Check: Cannot disable password login if no OAuth is enabled and ready
        const googleReady = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
        const msReady = !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET);

        const willGoogleBeEnabled = dto.googleLoginEnabled ?? current.googleLoginEnabled;
        const willMsBeEnabled = dto.microsoftLoginEnabled ?? current.microsoftLoginEnabled;
        const willPasswordBeEnabled = dto.passwordLoginEnabled ?? current.passwordLoginEnabled;

        const googleActive = willGoogleBeEnabled && googleReady;
        const msActive = willMsBeEnabled && msReady;

        if (!willPasswordBeEnabled && !googleActive && !msActive) {
            throw new BadRequestException('Cannot disable password login unless at least one Workspace provider (Google or Microsoft) is fully configured and enabled.');
        }

        const [updated] = await this.db.db
            .update(hrSettings)
            .set({
                ...dto,
                updatedAt: new Date(),
            })
            .where(eq(hrSettings.singleton, true))
            .returning();

        await this.auditService.log({
            userId: actorId,
            action: 'UPDATE',
            entityType: 'HrSettings',
            entityId: 'GLOBAL_SETTINGS',
            oldValue: current,
            newValue: updated,
        });

        return updated;
    }
}
