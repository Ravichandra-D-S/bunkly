
import { useEffect, useState } from "react"
import Auth from "./Auth"
import { supabase } from "./supabase"
import type {
  Semester,
  Subject,
  AttendanceRecord,
  AttendanceStatus,
} from "./types"
import "./App.css"

const SELECTED_SEMESTER_KEY = "bunkly_selected_semester"
const THEME_KEY = "bunkly_theme"

type ThemeMode = "light" | "dark" | "system"

function App() {
  // =========================================================
  // AUTHENTICATION
  // =========================================================

  const [user, setUser] = useState<any>(null)
  const [authChecking, setAuthChecking] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setUser(session?.user ?? null)
      setAuthLoading(false)
      setAuthChecking(false)
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setAuthLoading(false)
        setAuthChecking(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const isAuthenticated = !!user

  // =========================================================
  // DATE
  // =========================================================

  const now = new Date()

  const today = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`

  // =========================================================
  // PROFILE
  // =========================================================

  const [studentName, setStudentName] =
    useState("Student")

  const [collegeName, setCollegeName] =
    useState("")

  const [branchName, setBranchName] =
    useState("")

  const [studentYear, setStudentYear] =
    useState("")

  const [showProfile, setShowProfile] =
    useState(false)

  const [profileLoading, setProfileLoading] =
    useState(false)

  // =========================================================
  // THEME
  // =========================================================

  const [theme, setTheme] = useState<ThemeMode>(() => {
    const savedTheme =
      localStorage.getItem(THEME_KEY)

    if (
      savedTheme === "light" ||
      savedTheme === "dark" ||
      savedTheme === "system"
    ) {
      return savedTheme
    }

    return "system"
  })

  // =========================================================
  // SEMESTER STATE
  // =========================================================

  const [semesters, setSemesters] =
    useState<Semester[]>([])

  const [selectedSemesterId, setSelectedSemesterId] =
    useState(() => {
      return (
        localStorage.getItem(
          SELECTED_SEMESTER_KEY
        ) ?? ""
      )
    })

  const [showAddSemester, setShowAddSemester] =
    useState(false)

  const [showCompleteSemester, setShowCompleteSemester] =
    useState(false)

  const [semesterName, setSemesterName] =
    useState("")

  const [semesterStartDate, setSemesterStartDate] =
    useState(today)

  const [semesterEndDate, setSemesterEndDate] =
    useState(today)

  // =========================================================
  // SUBJECT STATE
  // =========================================================

  const [subjects, setSubjects] =
    useState<Subject[]>([])

  const [showAddSubject, setShowAddSubject] =
    useState(false)

  const [subjectName, setSubjectName] =
    useState("")

  const [editingSubjectId, setEditingSubjectId] =
    useState("")

  const [showEditSubject, setShowEditSubject] =
    useState(false)

  const [editSubjectName, setEditSubjectName] =
    useState("")

  // =========================================================
  // ATTENDANCE STATE
  // =========================================================

  const [attendanceRecords, setAttendanceRecords] =
    useState<AttendanceRecord[]>([])

  // =========================================================
  // CLASS COUNTS
  // =========================================================

  const [classesToday, setClassesToday] = useState<
    Record<string, Record<string, number>>
  >({})

  // =========================================================
  // DATE
  // =========================================================

  const [selectedDate, setSelectedDate] =
    useState(today)

  // =========================================================
  // BUNK CHECK
  // =========================================================

  const [showBunkCheck, setShowBunkCheck] =
    useState(false)

  const [bunkSubjectId, setBunkSubjectId] =
    useState("")

  // =========================================================
  // LOAD PROFILE
  // =========================================================

  useEffect(() => {
    if (!user) {
      return
    }

    const loadProfile = async () => {
      setProfileLoading(true)

      const { data, error } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle()

      if (error) {
        console.error(
          "Error loading profile:",
          error
        )
        setProfileLoading(false)
        return
      }

      if (data) {
        setStudentName(
          data.full_name ||
            user.user_metadata?.full_name ||
            "Student"
        )

        setCollegeName(
          data.college_name || ""
        )

        setBranchName(
          data.branch_name || ""
        )

        setStudentYear(
          data.student_year || ""
        )
      } else {
        const initialName =
          user.user_metadata?.full_name ||
          "Student"

        const { error: insertError } =
          await supabase
            .from("profiles")
            .insert({
              id: user.id,
              student_name: initialName,
              college_name: "",
              branch_name: "",
              student_year: "",
            })

        if (insertError) {
          console.error(
            "Error creating profile:",
            insertError
          )
        }

        setStudentName(initialName)
      }

      setProfileLoading(false)
    }

    loadProfile()
  }, [user])

  // =========================================================
  // SAVE PROFILE
  // =========================================================

  const saveProfile = async () => {
    if (!user) {
      return
    }

    setProfileLoading(true)

    const { error } =
      await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          student_name:
            studentName.trim() || "Student",
          college_name:
            collegeName.trim(),
          branch_name:
            branchName.trim(),
          student_year:
            studentYear,
        })

    if (error) {
      console.error(
        "Error saving profile:",
        error
      )

      window.alert(
        `Could not save profile.\n\n${error.message}`
      )

      setProfileLoading(false)
      return
    }

    setProfileLoading(false)
    setShowProfile(false)
  }

  // =========================================================
  // THEME
  // =========================================================

  useEffect(() => {
    localStorage.setItem(
      THEME_KEY,
      theme
    )

    const root =
      document.documentElement

    root.setAttribute(
      "data-theme",
      theme
    )

    if (theme === "system") {
      const prefersDark =
        window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches

      root.setAttribute(
        "data-theme-active",
        prefersDark
          ? "dark"
          : "light"
      )
    } else {
      root.setAttribute(
        "data-theme-active",
        theme
      )
    }
  }, [theme])

  // =========================================================
  // SYSTEM THEME LISTENER
  // =========================================================

  useEffect(() => {
    if (theme !== "system") {
      return
    }

    const mediaQuery =
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      )

    const updateSystemTheme = () => {
      document.documentElement.setAttribute(
        "data-theme-active",
        mediaQuery.matches
          ? "dark"
          : "light"
      )
    }

    updateSystemTheme()

    mediaQuery.addEventListener(
      "change",
      updateSystemTheme
    )

    return () => {
      mediaQuery.removeEventListener(
        "change",
        updateSystemTheme
      )
    }
  }, [theme])

  // =========================================================
  // LOAD ALL USER DATA
  // =========================================================

  useEffect(() => {
    if (!user) {
      setSemesters([])
      setSubjects([])
      setAttendanceRecords([])
      setClassesToday({})
      return
    }

    const loadData = async () => {
      // -------------------------
      // SEMESTERS
      // -------------------------

      const {
        data: semesterData,
        error: semesterError,
      } = await supabase
        .from("semesters")
        .select("*")
        .eq("user_id", user.id)
        .order("start_date", {
          ascending: true,
        })

      if (semesterError) {
        console.error(
          "Error loading semesters:",
          semesterError
        )
      } else {
        const formattedSemesters: Semester[] =
          (semesterData ?? []).map(
            (semester) => ({
              id: semester.id,
              userId: semester.user_id,
              name: semester.name,
              startDate:
                semester.start_date,
              endDate:
                semester.end_date ??
                undefined,
              completed:
                semester.completed,
            })
          )

        setSemesters(
          formattedSemesters
        )
      }

      // -------------------------
      // SUBJECTS
      // -------------------------

      const {
        data: subjectData,
        error: subjectError,
      } = await supabase
        .from("subjects")
        .select("*")
        .eq(
          "semester_id",
          semesterData?.length
            ? semesterData.map(
                (item) => item.id
              )
            : ""
        )

      if (subjectError) {
        console.error(
          "Error loading subjects:",
          subjectError
        )
      } else {
        setSubjects(
          (subjectData ?? []).map(
            (subject) => ({
              id: subject.id,
              semesterId:
                subject.semester_id,
              name: subject.name,
              requiredAttendance:
                subject.required_attendance,
            })
          )
        )
      }

      // -------------------------
      // ATTENDANCE
      // -------------------------

      const {
        data: attendanceData,
        error: attendanceError,
      } = await supabase
        .from("attendance_records")
        .select("*")

      if (attendanceError) {
        console.error(
          "Error loading attendance:",
          attendanceError
        )
      } else {
        setAttendanceRecords(
          (attendanceData ?? [])
            .filter(
              (record) =>
                semesterData?.some(
                  (semester) =>
                    semester.id ===
                    record.semester_id
                )
            )
            .map((record) => ({
              id: record.id,
              semesterId:
                record.semester_id,
              subjectId:
                record.subject_id,
              date: record.date,
              classNumber:
                record.class_number,
              status:
                record.status as AttendanceStatus,
            }))
        )
      }

      // -------------------------
      // CLASS COUNTS
      // -------------------------

      const {
        data: classCountData,
        error: classCountError,
      } = await supabase
        .from("class_counts")
        .select("*")

      if (classCountError) {
        console.error(
          "Error loading class counts:",
          classCountError
        )
      } else {
        const classMap: Record<
          string,
          Record<string, number>
        > = {}

        ;(
          classCountData ?? []
        ).forEach((item) => {
          if (
            !semesterData?.some(
              (semester) =>
                semester.id ===
                item.semester_id
            )
          ) {
            return
          }

          const key =
            `${item.semester_id}_${item.date}`

          if (!classMap[key]) {
            classMap[key] = {}
          }

          classMap[key][
            item.subject_id
          ] = item.total_classes
        })

        setClassesToday(classMap)
      }
    }

    loadData()
  }, [user])

  // =========================================================
  // SELECTED SEMESTER
  // =========================================================

  const selectedSemester =
    semesters.find(
      (semester) =>
        semester.id ===
        selectedSemesterId
    )

  // =========================================================
  // FIRST SEMESTER
  // =========================================================

  useEffect(() => {
    if (
      !selectedSemesterId &&
      semesters.length > 0
    ) {
      const activeSemester =
        semesters.find(
          (semester) =>
            !semester.completed
        )

      setSelectedSemesterId(
        activeSemester?.id ??
          semesters[0].id
      )
    }
  }, [
    semesters,
    selectedSemesterId,
  ])

  // =========================================================
  // SAVE SELECTED SEMESTER
  // =========================================================

  useEffect(() => {
    if (selectedSemesterId) {
      localStorage.setItem(
        SELECTED_SEMESTER_KEY,
        selectedSemesterId
      )
    } else {
      localStorage.removeItem(
        SELECTED_SEMESTER_KEY
      )
    }
  }, [selectedSemesterId])

  // =========================================================
  // SUBJECTS FOR SELECTED SEMESTER
  // =========================================================

  const semesterSubjects =
    subjects.filter(
      (subject) =>
        subject.semesterId ===
        selectedSemesterId
    )

  // =========================================================
  // ATTENDANCE FOR SELECTED SEMESTER
  // =========================================================

  const semesterAttendance =
    attendanceRecords.filter(
      (record) =>
        record.semesterId ===
        selectedSemesterId
    )

  // =========================================================
  // CREATE SEMESTER
  // =========================================================

  const createSemester = async () => {
    const trimmedName =
      semesterName.trim()

    if (!trimmedName || !user) {
      return
    }

    const alreadyExists =
      semesters.some(
        (semester) =>
          semester.name.toLowerCase() ===
          trimmedName.toLowerCase()
      )

    if (alreadyExists) {
      window.alert(
        "A semester with this name already exists."
      )
      return
    }

    const newSemesterId =
      crypto.randomUUID()

    const { error } =
      await supabase
        .from("semesters")
        .insert({
          id: newSemesterId,
          user_id: user.id,
          name: trimmedName,
          start_date:
            semesterStartDate,
          end_date: null,
          completed: false,
        })

    if (error) {
      console.error(
        "Error creating semester:",
        error
      )

      window.alert(
        `Could not create semester.\n\n${error.message}`
      )

      return
    }

    const newSemester: Semester = {
      id: newSemesterId,
      userId: user.id,
      name: trimmedName,
      startDate:
        semesterStartDate,
      completed: false,
    }

    setSemesters((current) => [
      ...current,
      newSemester,
    ])

    setSelectedSemesterId(
      newSemester.id
    )

    setSelectedDate(
      semesterStartDate <= today
        ? semesterStartDate
        : today
    )

    setSemesterName("")
    setSemesterStartDate(today)
    setShowAddSemester(false)
  }

  // =========================================================
  // COMPLETE SEMESTER
  // =========================================================

  const completeSemester = async () => {
    if (!selectedSemester) {
      return
    }

    if (
      semesterEndDate <
      selectedSemester.startDate
    ) {
      window.alert(
        "End date cannot be before the start date."
      )
      return
    }

    const { error } =
      await supabase
        .from("semesters")
        .update({
          end_date:
            semesterEndDate,
          completed: true,
        })
        .eq(
          "id",
          selectedSemester.id
        )
        .eq(
          "user_id",
          user?.id
        )

    if (error) {
      console.error(
        "Error completing semester:",
        error
      )

      window.alert(
        `Could not complete semester.\n\n${error.message}`
      )

      return
    }

    setSemesters((current) =>
      current.map(
        (semester) =>
          semester.id ===
          selectedSemester.id
            ? {
                ...semester,
                endDate:
                  semesterEndDate,
                completed: true,
              }
            : semester
      )
    )

    setShowCompleteSemester(false)
    setSemesterEndDate(today)
  }

  // =========================================================
  // DELETE SEMESTER
  // =========================================================

  const deleteSemester = async (
    semesterId: string
  ) => {
    const semester =
      semesters.find(
        (item) =>
          item.id === semesterId
      )

    if (!semester) {
      return
    }

    const confirmed =
      window.confirm(
        `Delete "${semester.name}"?\n\n` +
          `This will permanently delete:\n` +
          `• All subjects in this semester\n` +
          `• All attendance records\n` +
          `• All class data\n\n` +
          `This action cannot be undone.`
      )

    if (!confirmed) {
      return
    }

    // Delete attendance
    const {
      error: attendanceError,
    } = await supabase
      .from("attendance_records")
      .delete()
      .eq(
        "semester_id",
        semesterId
      )

    if (attendanceError) {
      window.alert(
        `Could not delete attendance data.\n\n${attendanceError.message}`
      )
      return
    }

    // Delete class counts
    const {
      error: classCountError,
    } = await supabase
      .from("class_counts")
      .delete()
      .eq(
        "semester_id",
        semesterId
      )

    if (classCountError) {
      window.alert(
        `Could not delete class data.\n\n${classCountError.message}`
      )
      return
    }

    // Delete subjects
    const {
      error: subjectError,
    } = await supabase
      .from("subjects")
      .delete()
      .eq(
        "semester_id",
        semesterId
      )

    if (subjectError) {
      window.alert(
        `Could not delete subjects.\n\n${subjectError.message}`
      )
      return
    }

    // Delete semester
    const {
      error: semesterError,
    } = await supabase
      .from("semesters")
      .delete()
      .eq(
        "id",
        semesterId
      )
      .eq(
        "user_id",
        user?.id
      )

    if (semesterError) {
      window.alert(
        `Could not delete semester.\n\n${semesterError.message}`
      )
      return
    }

    setSemesters((current) =>
      current.filter(
        (item) =>
          item.id !== semesterId
      )
    )

    setSubjects((current) =>
      current.filter(
        (subject) =>
          subject.semesterId !==
          semesterId
      )
    )

    setAttendanceRecords(
      (current) =>
        current.filter(
          (record) =>
            record.semesterId !==
            semesterId
        )
    )

    setClassesToday((current) => {
      const updated = {
        ...current,
      }

      Object.keys(updated).forEach(
        (key) => {
          if (
            key.startsWith(
              `${semesterId}_`
            )
          ) {
            delete updated[key]
          }
        }
      )

      return updated
    })

    if (
      selectedSemesterId ===
      semesterId
    ) {
      const remaining =
        semesters.filter(
          (item) =>
            item.id !==
            semesterId
        )

      const nextSemester =
        remaining.find(
          (item) =>
            !item.completed
        ) ??
        remaining[0]

      setSelectedSemesterId(
        nextSemester?.id ?? ""
      )

      setSelectedDate(
        nextSemester?.startDate ??
          today
      )
    }
  }

  // =========================================================
  // ADD SUBJECT
  // =========================================================

  const addSubject = async () => {
    if (
      !selectedSemester ||
      selectedSemester.completed
    ) {
      return
    }

    const trimmedName =
      subjectName.trim()

    if (!trimmedName) {
      return
    }

    const alreadyExists =
      semesterSubjects.some(
        (subject) =>
          subject.name.toLowerCase() ===
          trimmedName.toLowerCase()
      )

    if (alreadyExists) {
      window.alert(
        "A subject with this name already exists."
      )
      return
    }

    const newSubject: Subject = {
      id: crypto.randomUUID(),
      semesterId:
        selectedSemester.id,
      name: trimmedName,
      requiredAttendance: 75,
    }

    const {
  data: { user },
} = await supabase.auth.getUser()

if (!user) {
  window.alert("Please log in again.")
  return
}

const { error } =
  await supabase
    .from("subjects")
    .insert({
      id: newSubject.id,
      user_id: user.id,
      semester_id:
        newSubject.semesterId,
      name: newSubject.name,
      required_attendance:
        newSubject.requiredAttendance,
    })

    if (error) {
      console.error(
        "Error adding subject:",
        error
      )

      window.alert(
        `Could not add subject.\n\n${error.message}`
      )

      return
    }

    setSubjects((current) => [
      ...current,
      newSubject,
    ])

    setSubjectName("")
    setShowAddSubject(false)
  }

  // =========================================================
  // DELETE SUBJECT
  // =========================================================

  const deleteSubject = async (
    subjectId: string
  ) => {
    const subject =
      subjects.find(
        (item) =>
          item.id === subjectId
      )

    if (!subject) {
      return
    }

    const confirmed =
      window.confirm(
        `Delete "${subject.name}"?\n\n` +
          `This will permanently delete:\n` +
          `• The subject\n` +
          `• All attendance records\n` +
          `• All class data\n\n` +
          `This action cannot be undone.`
      )

    if (!confirmed) {
      return
    }

    const {
      error: attendanceError,
    } = await supabase
      .from("attendance_records")
      .delete()
      .eq(
        "subject_id",
        subjectId
      )

    if (attendanceError) {
      window.alert(
        `Could not delete attendance.\n\n${attendanceError.message}`
      )
      return
    }

    const {
      error: classError,
    } = await supabase
      .from("class_counts")
      .delete()
      .eq(
        "subject_id",
        subjectId
      )

    if (classError) {
      window.alert(
        `Could not delete class data.\n\n${classError.message}`
      )
      return
    }

    const {
      error: subjectError,
    } = await supabase
      .from("subjects")
      .delete()
      .eq(
        "id",
        subjectId
      )

    if (subjectError) {
      window.alert(
        `Could not delete subject.\n\n${subjectError.message}`
      )
      return
    }

    setSubjects((current) =>
      current.filter(
        (item) =>
          item.id !== subjectId
      )
    )

    setAttendanceRecords(
      (current) =>
        current.filter(
          (record) =>
            record.subjectId !==
            subjectId
        )
    )

    setClassesToday((current) => {
      const updated = {
        ...current,
      }

      Object.keys(updated).forEach(
        (key) => {
          if (
            updated[key]?.[
              subjectId
            ] !== undefined
          ) {
            const dateData = {
              ...updated[key],
            }

            delete dateData[
              subjectId
            ]

            if (
              Object.keys(dateData)
                .length === 0
            ) {
              delete updated[key]
            } else {
              updated[key] =
                dateData
            }
          }
        }
      )

      return updated
    })
  }

  // =========================================================
  // EDIT SUBJECT
  // =========================================================

  const editSubject = async () => {
    const trimmedName =
      editSubjectName.trim()

    if (
      !trimmedName ||
      !editingSubjectId
    ) {
      return
    }

    const alreadyExists =
      semesterSubjects.some(
        (subject) =>
          subject.id !==
            editingSubjectId &&
          subject.name.toLowerCase() ===
            trimmedName.toLowerCase()
      )

    if (alreadyExists) {
      window.alert(
        "A subject with this name already exists."
      )
      return
    }

    const { error } =
      await supabase
        .from("subjects")
        .update({
          name: trimmedName,
        })
        .eq(
          "id",
          editingSubjectId
        )

    if (error) {
      console.error(
        "Error editing subject:",
        error
      )

      window.alert(
        `Could not edit subject.\n\n${error.message}`
      )

      return
    }

    setSubjects((current) =>
      current.map(
        (subject) =>
          subject.id ===
          editingSubjectId
            ? {
                ...subject,
                name: trimmedName,
              }
            : subject
      )
    )

    setEditSubjectName("")
    setEditingSubjectId("")
    setShowEditSubject(false)
  }

  // =========================================================
  // UPDATE ATTENDANCE
  // =========================================================

  const updateClassAttendance = async (
    subjectId: string,
    classNumber: number,
    status: AttendanceStatus
  ) => {
    if (
  !selectedSemester ||
  selectedSemester.completed
) {
  return
}

    const existingRecord =
      attendanceRecords.find(
        (record) =>
          record.semesterId ===
            selectedSemester.id &&
          record.subjectId ===
            subjectId &&
          record.date ===
            selectedDate &&
          record.classNumber ===
            classNumber
      )

    if (existingRecord) {
      const { error } =
        await supabase
          .from("attendance_records")
          .update({
            status,
          })
          .eq(
            "id",
            existingRecord.id
          )

      if (error) {
        console.error(
          "Error updating attendance:",
          error
        )

        window.alert(
          `Could not update attendance.\n\n${error.message}`
        )

        return
      }

      setAttendanceRecords(
        (records) =>
          records.map(
            (record) =>
              record.id ===
              existingRecord.id
                ? {
                    ...record,
                    status,
                  }
                : record
          )
      )

      return
    }

    const newRecord: AttendanceRecord =
      {
        id: crypto.randomUUID(),
        semesterId:
          selectedSemester.id,
        subjectId,
        date: selectedDate,
        classNumber,
        status,
      }

   const {
  data: { user },
} = await supabase.auth.getUser()

if (!user) {
  window.alert("Please log in again.")
  return
}

const { error } =
  await supabase
    .from("attendance_records")
    .insert({
      id: newRecord.id,
      user_id: user.id,
      semester_id:
        newRecord.semesterId,
      subject_id:
        newRecord.subjectId,
      date: newRecord.date,
      class_number:
        newRecord.classNumber,
      status: newRecord.status,
    })

    if (error) {
      console.error(
        "Error creating attendance:",
        error
      )

      window.alert(
        `Could not save attendance.\n\n${error.message}`
      )

      return
    }

    setAttendanceRecords(
      (records) => [
        ...records,
        newRecord,
      ]
    )
  }
// =========================================================
// CHANGE NUMBER OF CLASSES
// =========================================================

const changeClassesForDate = async (
  subjectId: string,
  newTotal: number
) => {
  if (
    !selectedSemester ||
    selectedSemester.completed
  ) {
    return
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    window.alert("Please log in again.")
    return
  }

  const safeTotal =
    Math.max(1, newTotal)

  const semesterDateKey =
    `${selectedSemester.id}_${selectedDate}`

  const { data: existingCount } =
    await supabase
      .from("class_counts")
      .select("id")
      .eq(
        "user_id",
        user.id
      )
      .eq(
        "semester_id",
        selectedSemester.id
      )
      .eq(
        "subject_id",
        subjectId
      )
      .eq(
        "date",
        selectedDate
      )
      .maybeSingle()

  let error = null

  if (existingCount) {
    const result =
      await supabase
        .from("class_counts")
        .update({
          total_classes:
            safeTotal,
        })
        .eq(
          "id",
          existingCount.id
        )
        .eq(
          "user_id",
          user.id
        )

    error = result.error
  } else {
    const result =
      await supabase
        .from("class_counts")
        .insert({
          id: crypto.randomUUID(),
          user_id: user.id,
          semester_id:
            selectedSemester.id,
          subject_id:
            subjectId,
          date: selectedDate,
          total_classes:
            safeTotal,
        })

    error = result.error
  }

  if (error) {
    console.error(
      "Error saving class count:",
      error
    )

    window.alert(
      `Could not save class count.\n\n${error.message}`
    )

    return
  }

  setClassesToday((current) => ({
    ...current,
    [semesterDateKey]: {
      ...current[
        semesterDateKey
      ],
      [subjectId]:
        safeTotal,
    },
  }))

  const { error: deleteError } =
    await supabase
      .from("attendance_records")
      .delete()
      .eq(
        "user_id",
        user.id
      )
      .eq(
        "semester_id",
        selectedSemester.id
      )
      .eq(
        "subject_id",
        subjectId
      )
      .eq(
        "date",
        selectedDate
      )
      .gt(
        "class_number",
        safeTotal
      )

  if (deleteError) {
    console.error(
      "Error removing extra attendance:",
      deleteError
    )

    return
  }

  setAttendanceRecords(
    (records) =>
      records.filter(
        (record) =>
          !(
            record.semesterId ===
              selectedSemester.id &&
            record.subjectId ===
              subjectId &&
            record.date ===
              selectedDate &&
            record.classNumber >
              safeTotal
          )
      )
  )
}
  // =========================================================
  // CHANGE DATE
  // =========================================================

  const changeDate = (
    days: number
  ) => {
    if (!selectedSemester) {
      return
    }

    const [year, month, day] =
      selectedDate
        .split("-")
        .map(Number)

    const currentDate =
      new Date(
        year,
        month - 1,
        day
      )

    currentDate.setDate(
      currentDate.getDate() +
        days
    )

    const newYear =
      currentDate.getFullYear()

    const newMonth =
      String(
        currentDate.getMonth() + 1
      ).padStart(2, "0")

    const newDay =
      String(
        currentDate.getDate()
      ).padStart(2, "0")

    const newDate =
      `${newYear}-${newMonth}-${newDay}`

    if (
      newDate <
      selectedSemester.startDate
    ) {
      return
    }

    if (newDate > today) {
      return
    }

    if (
      selectedSemester.completed &&
      selectedSemester.endDate &&
      newDate >
        selectedSemester.endDate
    ) {
      return
    }

    setSelectedDate(newDate)
  }

  // =========================================================
  // FORMATTED DATE
  // =========================================================

  const formattedSelectedDate =
    new Date(
      `${selectedDate}T00:00:00`
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    )

  // =========================================================
  // TODAY ATTENDANCE
  // =========================================================

  const todaySemesterDateKey =
    selectedSemester
      ? `${selectedSemester.id}_${selectedDate}`
      : ""

  const todayTotalClasses =
    selectedSemester
      ? semesterSubjects.reduce(
          (total, subject) =>
            total +
            (classesToday[
              todaySemesterDateKey
            ]?.[
              subject.id
            ] ?? 1),
          0
        )
      : 0

  const todayAttendedClasses =
    semesterAttendance.filter(
      (record) =>
        record.date ===
          selectedDate &&
        record.status ===
          "present"
    ).length

  const todayAbsentClasses =
    Math.max(
      0,
      todayTotalClasses -
        todayAttendedClasses
    )

  const todayAttendance =
    todayTotalClasses === 0
      ? 0
      : (todayAttendedClasses /
          todayTotalClasses) *
        100

  // =========================================================
  // OVERALL ATTENDANCE
  // =========================================================

  const totalAttendanceClasses =
    semesterAttendance.length

  const totalAttendedClasses =
    semesterAttendance.filter(
      (record) =>
        record.status ===
        "present"
    ).length

  const overallAttendance =
    totalAttendanceClasses === 0
      ? 0
      : (totalAttendedClasses /
          totalAttendanceClasses) *
        100

  // =========================================================
  // SAFE BUNKS
  // =========================================================

  const safeBunks =
    totalAttendanceClasses === 0
      ? 0
      : Math.max(
          0,
          Math.floor(
            (totalAttendedClasses -
              0.75 *
                totalAttendanceClasses) /
              0.75
          )
        )

  // =========================================================
  // SHORTAGE
  // =========================================================

  const shortageClasses =
    overallAttendance >= 75
      ? 0
      : Math.ceil(
          (0.75 *
            totalAttendanceClasses -
            totalAttendedClasses) /
            0.25
        )

  // =========================================================
  // BUNK CALCULATION
  // =========================================================

  const bunkSubject =
    semesterSubjects.find(
      (subject) =>
        subject.id ===
        bunkSubjectId
    )

  const bunkSubjectRecords =
    bunkSubject
      ? semesterAttendance.filter(
          (record) =>
            record.subjectId ===
            bunkSubject.id
        )
      : []

  const bunkTotalClasses =
    bunkSubjectRecords.length

  const bunkAttendedClasses =
    bunkSubjectRecords.filter(
      (record) =>
        record.status ===
        "present"
    ).length

  const bunkAttendance =
    bunkTotalClasses === 0
      ? 0
      : (bunkAttendedClasses /
          bunkTotalClasses) *
        100

  const bunkRequired =
    bunkSubject?.requiredAttendance ??
    75

  const bunkRequiredDecimal =
    bunkRequired / 100

  const bunkSafeClasses =
    bunkTotalClasses === 0
      ? 0
      : Math.max(
          0,
          Math.floor(
            (bunkAttendedClasses -
              bunkRequiredDecimal *
                bunkTotalClasses) /
              bunkRequiredDecimal
          )
        )

  const bunkShortageClasses =
    bunkSubject &&
    bunkAttendance <
      bunkSubject.requiredAttendance
      ? Math.ceil(
          (
            (bunkSubject.requiredAttendance /
              100) *
              bunkTotalClasses -
            bunkAttendedClasses
          ) /
            (1 -
              bunkSubject.requiredAttendance /
                100)
        )
      : 0

  // =========================================================
  // PROFILE INITIAL
  // =========================================================

  const profileInitial =
    studentName
      .trim()
      .charAt(0)
      .toUpperCase() || "S"

  // =========================================================
  // AUTH CHECK
  // =========================================================

  if (
    authChecking ||
    authLoading
  ) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="auth-brand-icon">
              😎
            </span>

            <h1>Bunkly</h1>

            <p>
              Attendance made smarter.
            </p>
          </div>

          <div className="auth-heading">
            <p>
              Checking your account...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <Auth
        onLogin={() => {
          setAuthChecking(false)
        }}
      />
    )
  }

  // =========================================================
  // MAIN APP
  // =========================================================

  return (
    <div className="app">

      {/* HEADER */}

      <header className="topbar">

        <div className="brand">

          <span className="brand-icon">
            😎
          </span>

          <span>
            Bunkly
          </span>

        </div>

        <div className="header-right">

          <button
            type="button"
            className="theme-toggle"
            onClick={() => {
              if (theme === "light") {
                setTheme("dark")
              } else if (
                theme === "dark"
              ) {
                setTheme("system")
              } else {
                setTheme("light")
              }
            }}
            title={`Theme: ${theme}`}
          >
            {theme === "dark"
              ? "☀️"
              : theme === "light"
              ? "🌙"
              : "🖥️"}
          </button>

          <button
            type="button"
            className="profile"
            onClick={() =>
              setShowProfile(true)
            }
          >

            <div className="avatar">
              {profileInitial}
            </div>

            <span>
              {studentName ||
                "Student"}
            </span>

          </button>

        </div>

      </header>

      {/* MAIN */}

      <main className="dashboard">

        {/* SEMESTER */}

        <section className="semester-section">

          <div className="section-header">

            <div>

              <p className="eyebrow">
                CURRENT SEMESTER
              </p>

              <h2>
                {selectedSemester
                  ? selectedSemester.name
                  : "No Semester"}
              </h2>

            </div>

            {selectedSemester && (
              <div className="semester-actions">

                {!selectedSemester.completed && (
                  <button
                    className="secondary-button"
                    onClick={() =>
                      setShowCompleteSemester(
                        true
                      )
                    }
                  >
                    ✓ Complete Semester
                  </button>
                )}

                <button
                  className="delete-button"
                  onClick={() =>
                    deleteSemester(
                      selectedSemester.id
                    )
                  }
                >
                  Delete Semester
                </button>

              </div>
            )}

          </div>

          {selectedSemester && (
            <div className="semester-info">

              <span>
                📅 Started{" "}
                {new Date(
                  `${selectedSemester.startDate}T00:00:00`
                ).toLocaleDateString(
                  "en-IN",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }
                )}
              </span>

              {selectedSemester.completed &&
                selectedSemester.endDate && (
                  <span>
                    → Finished{" "}
                    {new Date(
                      `${selectedSemester.endDate}T00:00:00`
                    ).toLocaleDateString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </span>
                )}

            </div>
          )}

          {semesters.length > 0 && (
            <div className="semester-selector">

              <label>
                Select Semester

                <select
                  value={
                    selectedSemesterId
                  }
                  onChange={(event) => {
                    const id =
                      event.target.value

                    setSelectedSemesterId(
                      id
                    )

                    const semester =
                      semesters.find(
                        (item) =>
                          item.id === id
                      )

                    if (semester) {
                      setSelectedDate(
                        semester.startDate <=
                          today
                          ? semester.startDate
                          : today
                      )
                    }
                  }}
                >

                  {semesters.map(
                    (semester) => (
                      <option
                        key={
                          semester.id
                        }
                        value={
                          semester.id
                        }
                      >
                        {semester.name}
                        {semester.completed
                          ? " ✓"
                          : " • Current"}
                      </option>
                    )
                  )}

                </select>

              </label>

              <button
                className="secondary-button"
                onClick={() =>
                  setShowAddSemester(
                    true
                  )
                }
              >
                + Add Semester
              </button>

            </div>
          )}

          {semesters.length === 0 && (
            <div className="empty-state">

              <p>
                No semester created yet.
              </p>

              <span>
                Create your first semester
                to start tracking attendance.
              </span>

              <button
                className="add-button"
                onClick={() =>
                  setShowAddSemester(
                    true
                  )
                }
              >
                + Create Semester
              </button>

            </div>
          )}

        </section>

        {selectedSemester && (
          <>

            {/* WELCOME */}

            <section className="welcome">

              <p className="eyebrow">
                YOUR DASHBOARD
              </p>

              <h1>
                Attendance Dashboard
              </h1>

              <p className="subtitle">
                {studentName
                  ? `Welcome back, ${studentName}.`
                  : "Track your attendance and know when you can bunk."}
              </p>

              {(collegeName ||
                branchName ||
                studentYear) && (
                <div className="profile-summary">

                  {collegeName && (
                    <span>
                      🎓 {collegeName}
                    </span>
                  )}

                  {branchName && (
                    <span>
                      💻 {branchName}
                    </span>
                  )}

                  {studentYear && (
                    <span>
                      📚 {studentYear}
                    </span>
                  )}

                </div>
              )}

            </section>

            {/* OVERVIEW */}

            <section className="overview">

              <div className="attendance-card">

                <p>
                  Overall Attendance
                </p>

                <h2>
                  {overallAttendance.toFixed(
                    1
                  )}%
                </h2>

                <div className="progress">

                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(
                        overallAttendance,
                        100
                      )}%`,
                    }}
                  />

                </div>

                <span>
                  75% required
                </span>

              </div>

              <div className="bunk-card">

                <p>
                  😎 Safe Bunks
                </p>

                <h2>
                  {safeBunks}
                </h2>

                <span>
                  classes available
                </span>

              </div>

              <div className="shortage-card">

                <p>
                  ⚠️ Shortage
                </p>

                <h2>
                  {shortageClasses}
                </h2>

                <span>
                  {shortageClasses === 0
                    ? "No shortage"
                    : "classes needed"}
                </span>

              </div>

            </section>

            {/* CAN I BUNK */}

            <section className="bunk-section">

              <div>

                <p className="eyebrow">
                  SIGNATURE FEATURE
                </p>

                <h2>
                  Can I Bunk? 😎
                </h2>

                <p>
                  Check whether you can
                  safely miss your next
                  class.
                </p>

              </div>

              <button
                className="bunk-button"
                disabled={
                  selectedSemester.completed ||
                  semesterSubjects.length ===
                    0
                }
                onClick={() => {
                  setBunkSubjectId(
                    semesterSubjects[0]?.id ??
                      ""
                  )
                  setShowBunkCheck(true)
                }}
              >
                Check Now →
              </button>

            </section>

            {/* SUBJECTS */}

            <section className="section">

              <div className="section-header">

                <div>

                  <p className="eyebrow">
                    ATTENDANCE
                  </p>

                  <h2>
                    Your Subjects
                  </h2>

                </div>

                {!selectedSemester.completed && (
                  <button
                    className="secondary-button"
                    onClick={() =>
                      setShowAddSubject(
                        true
                      )
                    }
                  >
                    + Add Subject
                  </button>
                )}

              </div>

              <div className="subjects">

                {semesterSubjects.length ===
                0 ? (
                  <div className="empty-state">

                    <p>
                      No subjects added yet.
                    </p>

                    {!selectedSemester.completed && (
                      <span>
                        Add your first subject
                        to start tracking
                        attendance.
                      </span>
                    )}

                  </div>
                ) : (
                  semesterSubjects.map(
                    (subject) => {

                      const subjectRecords =
                        semesterAttendance.filter(
                          (record) =>
                            record.subjectId ===
                            subject.id
                        )

                      const subjectDates =
                        new Set<string>()

                      subjectRecords.forEach(
                        (record) => {
                          subjectDates.add(
                            record.date
                          )
                        }
                      )

                      Object.keys(
                        classesToday
                      ).forEach((key) => {
                        const prefix =
                          `${selectedSemester.id}_`

                        if (
                          key.startsWith(
                            prefix
                          )
                        ) {
                          const date =
                            key.slice(
                              prefix.length
                            )

                          if (
                            classesToday[key]?.[
                              subject.id
                            ] !== undefined
                          ) {
                            subjectDates.add(
                              date
                            )
                          }
                        }
                      })

                      const totalClasses =
                        Array.from(
                          subjectDates
                        ).reduce(
                          (
                            total,
                            date
                          ) =>
                            total +
                            (
                              classesToday[
                                `${selectedSemester.id}_${date}`
                              ]?.[
                                subject.id
                              ] ?? 1
                            ),
                          0
                        )

                      const attendedClasses =
                        subjectRecords.filter(
                          (record) =>
                            record.status ===
                            "present"
                        ).length

                      const attendance =
                        totalClasses === 0
                          ? 0
                          : (attendedClasses /
                              totalClasses) *
                            100

                      const subjectRequired =
                        subject.requiredAttendance

                      const subjectSafeBunks =
                        totalClasses === 0
                          ? 0
                          : Math.max(
                              0,
                              Math.floor(
                                (
                                  attendedClasses -
                                  (subjectRequired /
                                    100) *
                                    totalClasses
                                ) /
                                  (subjectRequired /
                                    100)
                              )
                            )

                      const subjectShortage =
                        attendance <
                          subjectRequired &&
                        totalClasses > 0
                          ? Math.ceil(
                              (
                                (subjectRequired /
                                  100) *
                                  totalClasses -
                                attendedClasses
                              ) /
                                (
                                  1 -
                                  subjectRequired /
                                    100
                                )
                            )
                          : 0

                      return (
                        <div
                          className="subject"
                          key={
                            subject.id
                          }
                        >

                          <div className="subject-header">

                            <div className="subject-info">

                              <div className="subject-icon">
                                📚
                              </div>

                              <div>

                                <strong>
                                  {
                                    subject.name
                                  }
                                </strong>

                                <span>
                                  {
                                    attendedClasses
                                  }{" "}
                                  /{" "}
                                  {
                                    totalClasses
                                  }{" "}
                                  classes
                                </span>

                              </div>

                            </div>

                            <div className="subject-percentage">

                              <strong>
                                {totalClasses ===
                                0
                                  ? "—"
                                  : `${attendance.toFixed(
                                      1
                                    )}%`}
                              </strong>

                              <span>
                                Required:{" "}
                                {
                                  subject.requiredAttendance
                                }%
                              </span>

                            </div>

                          </div>

                          <div className="subject-progress">

                            <div className="subject-progress-track">

                              <div
                                className="subject-progress-fill"
                                style={{
                                  width: `${Math.min(
                                    attendance,
                                    100
                                  )}%`,
                                }}
                              />

                            </div>

                          </div>

                          <div className="subject-status-row">

                            <span
                              className={
                                totalClasses ===
                                0
                                  ? "subject-status neutral"
                                  : attendance >=
                                    subjectRequired
                                  ? "subject-status safe"
                                  : attendance >=
                                    subjectRequired -
                                      5
                                  ? "subject-status warning"
                                  : "subject-status danger"
                              }
                            >
                              {totalClasses ===
                              0
                                ? "No classes yet"
                                : attendance >=
                                  subjectRequired
                                ? "🟢 Safe"
                                : attendance >=
                                  subjectRequired -
                                    5
                                ? "🟡 Warning"
                                : "🔴 Critical"}
                            </span>

                            {totalClasses >
                              0 && (
                              <span className="subject-bunk-info">

                                {attendance >=
                                subjectRequired
                                  ? `😎 ${subjectSafeBunks} safe bunks`
                                  : `⚠️ ${subjectShortage} classes needed`}

                              </span>
                            )}

                          </div>

                          {!selectedSemester.completed && (
                            <div className="subject-actions">

                              <button
                                type="button"
                                className="secondary-button"
                                onClick={() => {
                                  setEditingSubjectId(
                                    subject.id
                                  )

                                  setEditSubjectName(
                                    subject.name
                                  )

                                  setShowEditSubject(
                                    true
                                  )
                                }}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="delete-button"
                                onClick={() =>
                                  deleteSubject(
                                    subject.id
                                  )
                                }
                              >
                                Delete
                              </button>

                            </div>
                          )}

                        </div>
                      )
                    }
                  )
                )}

              </div>

            </section>

            {/* DAILY ATTENDANCE */}

            <section className="section">

              <div className="section-header">

                <div>

                  <p className="eyebrow">
                    ATTENDANCE HISTORY
                  </p>

                  <h2>
                    Daily Attendance
                  </h2>

                </div>

              </div>

              <div className="today-summary">

                <div>

                  <p className="eyebrow">
                    TODAY'S ATTENDANCE
                  </p>

                  <h3>
                    {todayAttendedClasses}{" "}
                    /{" "}
                    {todayTotalClasses}{" "}
                    classes attended
                  </h3>

                  <div className="today-status">

                    <span>
                      ✅ Present:{" "}
                      {todayAttendedClasses}
                    </span>

                    <span>
                      ❌ Absent:{" "}
                      {todayAbsentClasses}
                    </span>

                  </div>

                </div>

                <div className="today-summary-right">

                  <strong>
                    {todayTotalClasses ===
                    0
                      ? "—"
                      : `${todayAttendance.toFixed(
                          1
                        )}%`}
                  </strong>

                  <span>
                    {todayTotalClasses ===
                    0
                      ? "No classes recorded"
                      : "Attendance today"}
                  </span>

                </div>

              </div>

              <div className="date-navigation">

                <button
                  type="button"
                  className="date-button"
                  onClick={() =>
                    changeDate(-1)
                  }
                  disabled={
                    selectedDate ===
                    selectedSemester.startDate
                  }
                >
                  ← Previous Day
                </button>

                <div className="selected-date">

                  <span>
                    📅
                  </span>

                  <strong>
                    {
                      formattedSelectedDate
                    }
                  </strong>

                </div>

                <button
                  type="button"
                  className="date-button"
                  disabled={
                    selectedDate ===
                      today ||
                    selectedSemester.completed
                  }
                  onClick={() =>
                    changeDate(1)
                  }
                >
                  Next Day →
                </button>

              </div>

              <div className="today-list">

                {semesterSubjects.length ===
                0 ? (
                  <div className="empty-state">

                    <p>
                      Add subjects first.
                    </p>

                  </div>
                ) : (
                  semesterSubjects.map(
                    (subject) => {

                      const semesterDateKey =
                        `${selectedSemester.id}_${selectedDate}`

                      const numberOfClasses =
                        classesToday[
                          semesterDateKey
                        ]?.[
                          subject.id
                        ] ?? 1

                      const dateRecords =
                        semesterAttendance.filter(
                          (record) =>
                            record.subjectId ===
                              subject.id &&
                            record.date ===
                              selectedDate
                        )

                      const attendedClasses =
                        dateRecords.filter(
                          (record) =>
                            record.status ===
                            "present"
                        ).length

                      return (
                        <div
                          className="today-item"
                          key={
                            subject.id
                          }
                        >

                          <div className="today-subject-info">

                            <strong>
                              {
                                subject.name
                              }
                            </strong>

                            <span>
                              {
                                attendedClasses
                              }{" "}
                              /{" "}
                              {
                                numberOfClasses
                              }{" "}
                              attended
                            </span>

                          </div>

                          <div className="class-counter">

                            <button
                              type="button"
                              onClick={() =>
                                changeClassesForDate(
                                  subject.id,
                                  numberOfClasses -
                                    1
                                )
                              }
                              disabled={
                                numberOfClasses <=
                                  1 ||
                                selectedSemester.completed
                              }
                            >
                              −
                            </button>

                            <strong>
                              {
                                numberOfClasses
                              }
                            </strong>

                            <button
                              type="button"
                              onClick={() =>
                                changeClassesForDate(
                                  subject.id,
                                  numberOfClasses +
                                    1
                                )
                              }
                              disabled={
                                selectedSemester.completed
                              }
                            >
                              +
                            </button>

                          </div>

                          <div className="class-list">

                            {Array.from({
                              length:
                                numberOfClasses,
                            }).map(
                              (
                                _,
                                index
                              ) => {

                                const classNumber =
                                  index +
                                  1

                                const record =
                                  semesterAttendance.find(
                                    (
                                      item
                                    ) =>
                                      item.subjectId ===
                                        subject.id &&
                                      item.date ===
                                        selectedDate &&
                                      item.classNumber ===
                                        classNumber
                                  )

                                const isPresent =
                                  record?.status ===
                                  "present"

                                return (
                                  <label
                                    className="class-checkbox"
                                    key={
                                      classNumber
                                    }
                                  >

                                    <input
                                      type="checkbox"
                                      checked={
                                        isPresent
                                      }
                                      disabled={
                                        selectedSemester.completed
                                      }
                                      onChange={(
                                        event
                                      ) => {
                                        updateClassAttendance(
                                          subject.id,
                                          classNumber,
                                          event
                                            .target
                                            .checked
                                            ? "present"
                                            : "absent"
                                        )
                                      }}
                                    />

                                    <span>
                                      Class{" "}
                                      {
                                        classNumber
                                      }
                                    </span>

                                    <span className="class-status">
                                      {isPresent
                                        ? "Present"
                                        : "Absent"}
                                    </span>

                                  </label>
                                )
                              }
                            )}

                          </div>

                        </div>
                      )
                    }
                  )
                )}

              </div>

            </section>

          </>
        )}

        {/* SEMESTER HISTORY */}

        {semesters.length > 0 && (
          <section className="section semester-history">

            <div className="section-header">

              <div>

                <p className="eyebrow">
                  YOUR HISTORY
                </p>

                <h2>
                  Semester History
                </h2>

              </div>

            </div>

            <div className="semester-history-list">

              {semesters
                .filter(
                  (semester) =>
                    semester.completed
                )
                .map((semester) => {

                  const semesterRecords =
                    attendanceRecords.filter(
                      (record) =>
                        record.semesterId ===
                        semester.id
                    )

                  const totalClasses =
                    semesterRecords.length

                  const attendedClasses =
                    semesterRecords.filter(
                      (record) =>
                        record.status ===
                        "present"
                    ).length

                  const finalAttendance =
                    totalClasses === 0
                      ? 0
                      : (attendedClasses /
                          totalClasses) *
                        100

                  return (
                    <div
                      className="semester-history-card"
                      key={semester.id}
                    >

                      <div className="semester-history-header">

                        <div>

                          <div className="semester-history-title">

                            <span>
                              ✓
                            </span>

                            <strong>
                              {semester.name}
                            </strong>

                          </div>

                          <span className="semester-history-dates">

                            {new Date(
                              `${semester.startDate}T00:00:00`
                            ).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}

                            {" → "}

                            {semester.endDate
                              ? new Date(
                                  `${semester.endDate}T00:00:00`
                                ).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )
                              : "Completed"}

                          </span>

                        </div>

                        <div className="semester-history-attendance">

                          <strong>
                            {finalAttendance.toFixed(
                              1
                            )}%
                          </strong>

                          <span>
                            Final Attendance
                          </span>

                        </div>

                      </div>

                      <div className="semester-history-details">

                        <span>
                          📚{" "}
                          {
                            subjects.filter(
                              (subject) =>
                                subject.semesterId ===
                                semester.id
                            ).length
                          }{" "}
                          Subjects
                        </span>

                        <span>
                          📊{" "}
                          {attendedClasses} /{" "}
                          {totalClasses}{" "}
                          Classes Attended
                        </span>

                      </div>

                      <div className="semester-history-actions">

                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => {

                            setSelectedSemesterId(
                              semester.id
                            )

                            setSelectedDate(
                              semester.startDate
                            )

                            window.scrollTo({
                              top: 0,
                              behavior:
                                "smooth",
                            })

                          }}
                        >
                          View Semester
                        </button>

                        <button
                          type="button"
                          className="delete-button"
                          onClick={() =>
                            deleteSemester(
                              semester.id
                            )
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </div>
                  )

                })}

              {semesters.filter(
                (semester) =>
                  semester.completed
              ).length === 0 && (
                <div className="empty-state">

                  <p>
                    No completed semesters yet.
                  </p>

                  <span>
                    Your completed semesters
                    will appear here.
                  </span>

                </div>
              )}

            </div>

          </section>
        )}

        {/* ADD SEMESTER MODAL */}

        {showAddSemester && (
          <div className="modal-overlay">

            <div className="modal">

              <div className="modal-header">

                <div>

                  <p className="eyebrow">
                    NEW SEMESTER
                  </p>

                  <h2>
                    Create Semester
                  </h2>

                </div>

                <button
                  type="button"
                  className="close-button"
                  onClick={() => {
                    setShowAddSemester(false)
                    setSemesterName("")
                    setSemesterStartDate(
                      today
                    )
                  }}
                  aria-label="Close"
                >
                  ×
                </button>

              </div>

              <label>

                Semester Name

                <input
                  type="text"
                  placeholder="e.g. 1st Semester"
                  value={semesterName}
                  onChange={(event) =>
                    setSemesterName(
                      event.target.value
                    )
                  }
                />

              </label>

              <label>

                Start Date

                <input
                  type="date"
                  value={semesterStartDate}
                  max={today}
                  onChange={(event) =>
                    setSemesterStartDate(
                      event.target.value
                    )
                  }
                />

              </label>

              <p className="modal-help">
                You can add the final date
                later when you complete the
                semester.
              </p>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setShowAddSemester(false)
                    setSemesterName("")
                    setSemesterStartDate(
                      today
                    )
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="add-button"
                  disabled={
                    !semesterName.trim() ||
                    semesters.some(
                      (semester) =>
                        semester.name.toLowerCase() ===
                        semesterName
                          .trim()
                          .toLowerCase()
                    )
                  }
                  onClick={
                    createSemester
                  }
                >
                  Create Semester
                </button>

              </div>

            </div>

          </div>
        )}

        {/* COMPLETE SEMESTER */}

        {showCompleteSemester &&
          selectedSemester && (
            <div className="modal-overlay">

              <div className="modal">

                <div className="modal-header">

                  <div>

                    <p className="eyebrow">
                      COMPLETE SEMESTER
                    </p>

                    <h2>
                      {
                        selectedSemester.name
                      }
                    </h2>

                  </div>

                  <button
                    className="close-button"
                    onClick={() =>
                      setShowCompleteSemester(
                        false
                      )
                    }
                  >
                    ×
                  </button>

                </div>

                <p>
                  Enter the final date of
                  this semester.
                </p>

                <label>

                  Semester End Date

                  <input
                    type="date"
                    value={
                      semesterEndDate
                    }
                    min={
                      selectedSemester.startDate
                    }
                    max={today}
                    onChange={(event) =>
                      setSemesterEndDate(
                        event.target.value
                      )
                    }
                  />

                </label>

                <p className="modal-help">
                  After completing the
                  semester, its attendance
                  data will be preserved and
                  the semester will become
                  read-only.
                </p>

                <div className="modal-actions">

                  <button
                    className="cancel-button"
                    onClick={() =>
                      setShowCompleteSemester(
                        false
                      )
                    }
                  >
                    Cancel
                  </button>

                  <button
                    className="add-button"
                    onClick={
                      completeSemester
                    }
                  >
                    Complete Semester
                  </button>

                </div>

              </div>

            </div>
          )}

        {/* ADD SUBJECT */}

        {showAddSubject &&
          selectedSemester &&
          !selectedSemester.completed && (
            <div className="modal-overlay">

              <div className="modal">

                <div className="modal-header">

                  <div>

                    <p className="eyebrow">
                      NEW SUBJECT
                    </p>

                    <h2>
                      Add Subject
                    </h2>

                  </div>

                  <button
                    className="close-button"
                    onClick={() => {
                      setShowAddSubject(false)
                      setSubjectName("")
                    }}
                  >
                    ×
                  </button>

                </div>

                <label>

                  Subject Name

                  <input
                    type="text"
                    placeholder="e.g. DBMS"
                    value={
                      subjectName
                    }
                    onChange={(event) =>
                      setSubjectName(
                        event.target.value
                      )
                    }
                  />

                </label>

                <label>

                  Required Attendance

                  <input
                    type="number"
                    value={75}
                    readOnly
                  />

                </label>

                <div className="modal-actions">

                  <button
                    className="cancel-button"
                    onClick={() => {
                      setShowAddSubject(false)
                      setSubjectName("")
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    className="add-button"
                    disabled={
                      !subjectName.trim() ||
                      semesterSubjects.some(
                        (subject) =>
                          subject.name
                            .toLowerCase() ===
                          subjectName
                            .trim()
                            .toLowerCase()
                      )
                    }
                    onClick={
                      addSubject
                    }
                  >
                    Add Subject
                  </button>

                </div>

              </div>

            </div>
          )}

        {/* EDIT SUBJECT */}

        {showEditSubject &&
          selectedSemester &&
          !selectedSemester.completed && (
            <div className="modal-overlay">

              <div className="modal">

                <div className="modal-header">

                  <div>

                    <p className="eyebrow">
                      EDIT SUBJECT
                    </p>

                    <h2>
                      Edit Subject
                    </h2>

                  </div>

                  <button
                    className="close-button"
                    onClick={() => {
                      setShowEditSubject(false)
                      setEditingSubjectId("")
                      setEditSubjectName("")
                    }}
                  >
                    ×
                  </button>

                </div>

                <label>

                  Subject Name

                  <input
                    type="text"
                    value={
                      editSubjectName
                    }
                    onChange={(event) =>
                      setEditSubjectName(
                        event.target.value
                      )
                    }
                  />

                </label>

                <div className="modal-actions">

                  <button
                    className="cancel-button"
                    onClick={() => {
                      setShowEditSubject(false)
                      setEditingSubjectId("")
                      setEditSubjectName("")
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    className="add-button"
                    disabled={
                      !editSubjectName.trim() ||
                      semesterSubjects.some(
                        (subject) =>
                          subject.id !==
                            editingSubjectId &&
                          subject.name
                            .toLowerCase() ===
                          editSubjectName
                            .trim()
                            .toLowerCase()
                      )
                    }
                    onClick={
                      editSubject
                    }
                  >
                    Save Changes
                  </button>

                </div>

              </div>

            </div>
          )}

        {/* BUNK MODAL */}

        {showBunkCheck &&
          bunkSubject &&
          selectedSemester && (
            <div className="modal-overlay">

              <div className="modal">

                <div className="modal-header">

                  <div>

                    <p className="eyebrow">
                      CAN I BUNK?
                    </p>

                    <h2>
                      {bunkSubject.name}
                    </h2>

                  </div>

                  <button
                    className="close-button"
                    onClick={() => {
                      setShowBunkCheck(false)
                      setBunkSubjectId("")
                    }}
                  >
                    ×
                  </button>

                </div>

                <label>

                  Select Subject

                  <select
                    value={
                      bunkSubjectId
                    }
                    onChange={(event) =>
                      setBunkSubjectId(
                        event.target.value
                      )
                    }
                  >

                    {semesterSubjects.map(
                      (subject) => (
                        <option
                          key={
                            subject.id
                          }
                          value={
                            subject.id
                          }
                        >
                          {subject.name}
                        </option>
                      )
                    )}

                  </select>

                </label>

                <div className="bunk-result">

                  <p>
                    Current Attendance
                  </p>

                  <h2>
                    {bunkAttendance.toFixed(
                      1
                    )}%
                  </h2>

                  <span>
                    {bunkAttendedClasses}{" "}
                    /{" "}
                    {bunkTotalClasses}{" "}
                    classes
                  </span>

                </div>

                {bunkAttendance <
                bunkSubject.requiredAttendance ? (

                  <div className="bunk-warning">

                    <h2>
                      ⚠️ DON'T BUNK!
                    </h2>

                    <p>
                      You need to attend{" "}
                      <strong>
                        {
                          bunkShortageClasses
                        }
                      </strong>{" "}
                      more{" "}
                      {bunkShortageClasses ===
                      1
                        ? "class"
                        : "classes"}{" "}
                      to reach{" "}
                      {
                        bunkSubject.requiredAttendance
                      }%.
                    </p>

                  </div>

                ) : bunkSafeClasses >
                  0 ? (

                  <div className="bunk-success">

                    <h2>
                      😎 YES, YOU CAN BUNK!
                    </h2>

                    <p>
                      You can safely miss{" "}
                      <strong>
                        {bunkSafeClasses}
                      </strong>{" "}
                      {bunkSafeClasses ===
                      1
                        ? "class"
                        : "classes"}{" "}
                      and stay at or above{" "}
                      {
                        bunkSubject.requiredAttendance
                      }%.
                    </p>

                  </div>

                ) : (

                  <div className="bunk-warning">

                    <h2>
                      ⚠️ DON'T BUNK!
                    </h2>

                    <p>
                      You cannot safely miss
                      your next class. Attend
                      your next class to stay at
                      or above{" "}
                      {
                        bunkSubject.requiredAttendance
                      }%.
                    </p>

                  </div>

                )}

                <div className="modal-actions">

                  <button
                    className="cancel-button"
                    onClick={() => {
                      setShowBunkCheck(false)
                      setBunkSubjectId("")
                    }}
                  >
                    Close
                  </button>

                </div>

              </div>

            </div>
          )}

        {/* PROFILE */}

        {showProfile && (
          <div className="modal-overlay">

            <div className="modal profile-modal">

              <div className="modal-header">

                <div>

                  <p className="eyebrow">
                    YOUR PROFILE
                  </p>

                  <h2>
                    Student Profile
                  </h2>

                </div>

                <button
                  type="button"
                  className="close-button"
                  onClick={() =>
                    setShowProfile(false)
                  }
                >
                  ×
                </button>

              </div>

              <div className="profile-preview">

                <div className="profile-large-avatar">
                  {profileInitial}
                </div>

                <div>

                  <strong>
                    {studentName ||
                      "Student"}
                  </strong>

                  <span>
                    {branchName ||
                      "Student"}
                  </span>

                </div>

              </div>

              <label>

                Student Name

                <input
                  type="text"
                  placeholder="Your name"
                  value={
                    studentName
                  }
                  onChange={(event) =>
                    setStudentName(
                      event.target.value
                    )
                  }
                />

              </label>

              <label>

                College Name

                <input
                  type="text"
                  placeholder="Your college"
                  value={
                    collegeName
                  }
                  onChange={(event) =>
                    setCollegeName(
                      event.target.value
                    )
                  }
                />

              </label>

              <label>

                Branch

                <input
                  type="text"
                  placeholder="e.g. Information Science"
                  value={
                    branchName
                  }
                  onChange={(event) =>
                    setBranchName(
                      event.target.value
                    )
                  }
                />

              </label>

              <label>

                Year

                <select
                  value={
                    studentYear
                  }
                  onChange={(event) =>
                    setStudentYear(
                      event.target.value
                    )
                  }
                >

                  <option value="">
                    Select Year
                  </option>

                  <option value="1st Year">
                    1st Year
                  </option>

                  <option value="2nd Year">
                    2nd Year
                  </option>

                  <option value="3rd Year">
                    3rd Year
                  </option>

                  <option value="4th Year">
                    4th Year
                  </option>

                </select>

              </label>

              <label>

                Attendance Requirement

                <input
                  type="number"
                  value={75}
                  readOnly
                />

              </label>

              {/* THEME */}

              <div className="theme-section">

                <div className="theme-section-title">

                  <div>

                    <strong>
                      Appearance
                    </strong>

                    <span>
                      Choose how Bunkly looks
                    </span>

                  </div>

                  <span className="theme-current">
                    {theme === "light"
                      ? "☀️ Light"
                      : theme === "dark"
                      ? "🌙 Dark"
                      : "🖥️ System"}
                  </span>

                </div>

                <div className="theme-options">

                  <button
                    type="button"
                    className={
                      theme === "light"
                        ? "theme-option active"
                        : "theme-option"
                    }
                    onClick={() =>
                      setTheme("light")
                    }
                  >
                    <span>
                      ☀️
                    </span>

                    <strong>
                      Light
                    </strong>
                  </button>

                  <button
                    type="button"
                    className={
                      theme === "dark"
                        ? "theme-option active"
                        : "theme-option"
                    }
                    onClick={() =>
                      setTheme("dark")
                    }
                  >
                    <span>
                      🌙
                    </span>

                    <strong>
                      Dark
                    </strong>
                  </button>

                  <button
                    type="button"
                    className={
                      theme === "system"
                        ? "theme-option active"
                        : "theme-option"
                    }
                    onClick={() =>
                      setTheme("system")
                    }
                  >
                    <span>
                      🖥️
                    </span>

                    <strong>
                      System
                    </strong>
                  </button>

                </div>

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() =>
                    setShowProfile(false)
                  }
                >
                  Close
                </button>

                <button
                  type="button"
                  className="add-button"
                  disabled={
                    profileLoading
                  }
                  onClick={
                    saveProfile
                  }
                >
                  {profileLoading
                    ? "Saving..."
                    : "Save Profile"}
                </button>

              </div>

              {/* LOGOUT */}

              <button
                type="button"
                className="delete-button"
                style={{
                  width: "100%",
                  marginTop: "12px",
                }}
                onClick={async () => {

                  const confirmed =
                    window.confirm(
                      "Are you sure you want to log out?"
                    )

                  if (!confirmed) {
                    return
                  }

                  const {
                    error,
                  } =
                    await supabase.auth.signOut()

                  if (error) {
                    console.error(
                      "Logout error:",
                      error
                    )

                    window.alert(
                      `Could not log out.\n\n${error.message}`
                    )

                    return
                  }

                  setShowProfile(false)
                  setUser(null)
                  setSemesters([])
                  setSubjects([])
                  setAttendanceRecords([])
                  setClassesToday({})
                  setSelectedSemesterId("")
                }}
              >
                Log Out
              </button>

            </div>

          </div>
        )}

      </main>

    </div>
  )
}

export default App

