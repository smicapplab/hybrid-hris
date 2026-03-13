export interface TrainingProgram {
  id: string;
  title: string;
  description: string | null;
  objectives: string | null;
  type: 'INTERNAL' | 'EXTERNAL';
  isMandatory: boolean;
  createdAt: string;
  updatedAt: string;
  skills?: TrainingProgramSkill[];
  prerequisites?: TrainingPrerequisite[];
}

export interface TrainingProgramSkill {
  id: string;
  skillId: string;
  skillName: string;
  grantedProficiencyLevel: string;
}

export interface TrainingPrerequisite {
  id: string;
  prerequisiteProgramId: string;
  title: string;
}

export interface TrainingSchedule {
  id: string;
  programId: string;
  status: string;
  trainerId: string | null;
  externalTrainer: string | null;
  location: string | null;
  capacity: number | null;
  startAt: string;
  endAt: string;
  createdAt: string;
  updatedAt: string;
  sessions?: TrainingScheduleSession[];
}

export interface TrainingScheduleSession {
  id: string;
  scheduleId: string;
  title: string | null;
  location: string | null;
  startAt: string;
  endAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MandatoryTraining {
  id: string;
  programId: string;
  title: string;
  positionId?: string;
  orgUnitId?: string;
  createdAt: string;
}

export interface TrainingFeedbackInfo {
  id: string;
  programTitle: string;
  scheduleId: string;
  employeeName: string;
  employeeNo: string;
  trainerName: string | null;
  rating: number;
  comments: string | null;
  submittedAt: string;
  sessionDate: string;
}

export interface PaginatedFeedbackResponse {
  data: TrainingFeedbackInfo[];
  total: number;
  averageRating: number;
  hasMore: boolean;
}
