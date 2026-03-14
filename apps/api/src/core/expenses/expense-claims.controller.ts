import { Controller, Post, Body, Get, UseGuards, Req, Param } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { ExpenseClaimsService } from './expense-claims.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { SystemRole } from '@hybrid-hris/domain';
import { SubmitExpenseClaimDto } from './dto/submit-expense-claim.dto';
import { ExpenseClaim } from '@hybrid-hris/db/types';

interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
        employeeId: string | null;
        roles: string[];
    }
}

@UseGuards(JwtAuthGuard)
@Controller('expense-claims')
export class ExpenseClaimsController {
    constructor(private readonly service: ExpenseClaimsService) { }

    @Post()
    async submit(@Req() req: AuthenticatedRequest, @Body() dto: SubmitExpenseClaimDto): Promise<ExpenseClaim> {
        return this.service.submitClaim({
            ...dto,
            employeeId: req.user.employeeId!,
        }, req.user.id);
    }

    @Get('me')
    async getMyClaims(@Req() req: AuthenticatedRequest): Promise<ExpenseClaim[]> {
        return this.service.getMyClaims(req.user.employeeId!);
    }

    @UseGuards(RolesGuard)
    @Roles(SystemRole.MANAGER, SystemRole.ADMIN, SystemRole.HR_ADMIN)
    @Get('pending')
    async getPending(@Req() req: AuthenticatedRequest) {
        return this.service.getPendingForApproval(req.user.id);
    }

    @UseGuards(RolesGuard)
    @Roles(SystemRole.MANAGER, SystemRole.ADMIN, SystemRole.HR_ADMIN)
    @Post(':id/approve')
    async approve(
        @Req() req: AuthenticatedRequest,
        @Param('id') id: string,
        @Body() data: { level: number; remarks?: string }
    ): Promise<{ success: boolean }> {
        return this.service.approveClaim(id, req.user.id, data.level, data.remarks);
    }
}
