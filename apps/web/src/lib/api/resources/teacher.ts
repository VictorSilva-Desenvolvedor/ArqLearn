import { isResourceReal } from "../config";
import { apiFetch } from "../http";
import { mockDelay } from "../mocks/delay";
import {
  mockReviewQueue,
  mockTeacherClasses,
  mockTeacherClassSummary,
  mockWeeklyEngagement,
  type ReviewQueueRow,
  type TeacherClass,
} from "../mocks/fixtures/teacherAnalytics";
import type { TeacherClassSummary } from "@/types/api";

export async function listTeacherClasses(): Promise<TeacherClass[]> {
  return mockDelay(mockTeacherClasses);
}

export async function getClassSummary(classId: string): Promise<TeacherClassSummary> {
  if (isResourceReal("teacher")) {
    return apiFetch<TeacherClassSummary>(`/v1/teacher/classes/${classId}/summary`);
  }
  return mockDelay(
    mockTeacherClassSummary[classId] ?? { students_count: 0, avg_streak: 0, avg_accuracy: 0, weak_topics: [] },
  );
}

export async function getWeeklyEngagement(classId: string): Promise<{ day: string; value: number }[]> {
  return mockDelay(mockWeeklyEngagement[classId] ?? []);
}

export async function getReviewQueue(classId: string): Promise<ReviewQueueRow[]> {
  return mockDelay(mockReviewQueue[classId] ?? []);
}
