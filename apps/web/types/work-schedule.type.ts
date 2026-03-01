export type WorkSchedule = {
    id: string
    startTime: string
    endTime: string
    breakMinutes: number
    isFlexible: boolean
    isMon: boolean
    isTue: boolean
    isWed: boolean
    isThu: boolean
    isFri: boolean
    isSat: boolean
    isSun: boolean
    effectiveFrom: string
    templateName: string
    templateCode: string
}
