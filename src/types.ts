
export type Semester = {
  id: string
  userId: string
  name: string
  startDate: string
  endDate?: string
  completed: boolean
}

export type Subject = {
  id: string
  semesterId: string
  name: string
  requiredAttendance: number
}

export type AttendanceStatus =
  | "present"
  | "absent"

export type AttendanceRecord = {
  id: string
  semesterId: string
  subjectId: string
  date: string
  classNumber: number
  status: AttendanceStatus
}

