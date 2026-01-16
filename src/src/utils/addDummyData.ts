// Utility to add dummy study sessions for testing/preview
import * as StorageService from "../services/storage";
import { StudySession } from "../types";

export const addDummyStudySessions = async () => {
  // Get existing subjects
  const subjects = await StorageService.getSubjects();

  // Select 5-6 subjects for varied data
  const selectedSubjects = [
    subjects.find(s => s.id === "math") || subjects[0],
    subjects.find(s => s.id === "science") || subjects[1],
    subjects.find(s => s.id === "history") || subjects[2],
    subjects.find(s => s.id === "programming") || subjects[3],
    subjects.find(s => s.id === "english") || subjects[4],
    subjects.find(s => s.id === "art") || subjects[5],
  ];

  // Generate dummy sessions for the last 7 days
  const dummySessions: StudySession[] = [];
  const now = new Date();

  // Define study time patterns (in minutes) for each subject
  const subjectTimePatterns = [
    [45, 60, 30, 90, 45, 60, 75],  // Math - consistent heavy study
    [30, 45, 30, 60, 45, 30, 40],  // Science - moderate
    [20, 15, 30, 25, 20, 15, 30],  // History - light but consistent
    [60, 90, 75, 120, 60, 90, 80], // Programming - heavy, most studied
    [30, 20, 25, 30, 15, 20, 25],  // English - light/moderate
    [15, 10, 20, 15, 10, 15, 20],  // Art - lightest
  ];

  // Create sessions for each day
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const sessionDate = new Date(now);
    sessionDate.setDate(now.getDate() - (6 - dayOffset)); // Start from 6 days ago
    sessionDate.setHours(10 + (dayOffset % 12), 0, 0, 0); // Vary time slightly

    selectedSubjects.forEach((subject, subjectIndex) => {
      const studyMinutes = subjectTimePatterns[subjectIndex][dayOffset];

      // Create 1-2 sessions per subject per day
      const numSessions = studyMinutes > 60 ? 2 : 1;
      const minutesPerSession = Math.floor(studyMinutes / numSessions);

      for (let sessionNum = 0; sessionNum < numSessions; sessionNum++) {
        const sessionTime = new Date(sessionDate);
        sessionTime.setHours(sessionTime.getHours() + sessionNum * 2);

        dummySessions.push({
          id: `dummy_${subject.id}_${dayOffset}_${sessionNum}`,
          subject: subject.name,
          subjectId: subject.id,
          duration: minutesPerSession * 60, // Convert to seconds
          date: sessionTime.toISOString(),
          notes: "Sample study session",
          pauseCount: Math.floor(Math.random() * 3),
        });
      }
    });
  }

  // Add all dummy sessions to storage
  for (const session of dummySessions) {
    await StorageService.addSession(session);
  }

  console.log(`Added ${dummySessions.length} dummy study sessions`);
  return dummySessions.length;
};

export const clearDummyStudySessions = async () => {
  const sessions = await StorageService.getSessions();
  const dummySessions = sessions.filter(s => s.id.startsWith("dummy_"));

  for (const session of dummySessions) {
    // Note: There's no delete session function, so we'll need to implement manual cleanup
    // For now, we'll just report what would be deleted
    console.log(`Would delete dummy session: ${session.id}`);
  }

  return dummySessions.length;
};
