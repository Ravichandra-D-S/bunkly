export function calculateAttendance(
  attendedClasses: number,
  totalClasses: number
): number {
  if (totalClasses === 0) {
    return 0
  }

  return (attendedClasses / totalClasses) * 100
}