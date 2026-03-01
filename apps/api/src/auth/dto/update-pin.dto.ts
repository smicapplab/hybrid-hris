import { IsString, Matches } from 'class-validator'

export class UpdatePinDto {
    @IsString()
    @Matches(/^\d{6}$/, { message: 'PIN must be exactly 6 digits' })
    pin!: string
}
