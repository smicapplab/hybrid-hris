import { WorkSchedule } from "@/types/work-schedule.type";

export const DAYS: { key: keyof WorkSchedule; label: string; short: string }[] = [
    { key: 'isMon', label: 'Monday',    short: 'Mon' },
    { key: 'isTue', label: 'Tuesday',   short: 'Tue' },
    { key: 'isWed', label: 'Wednesday', short: 'Wed' },
    { key: 'isThu', label: 'Thursday',  short: 'Thu' },
    { key: 'isFri', label: 'Friday',    short: 'Fri' },
    { key: 'isSat', label: 'Saturday',  short: 'Sat' },
    { key: 'isSun', label: 'Sunday',    short: 'Sun' },
]