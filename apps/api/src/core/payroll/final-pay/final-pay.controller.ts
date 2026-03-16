import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { FinalPayService } from './final-pay.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('payroll/final-pay')
@UseGuards(JwtAuthGuard)
export class FinalPayController {
    constructor(private readonly finalPayService: FinalPayService) {}

    @Get(':id')
    async getFinalPayCalculation(@Param('id') employeeId: string) {
        return this.finalPayService.calculateFinalPay(employeeId);
    }
}
