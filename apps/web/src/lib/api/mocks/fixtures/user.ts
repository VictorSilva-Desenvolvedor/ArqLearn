import type { User } from "@/types/api";

export const mockUser: User = {
  id: "3f6a2b8e-1c4d-4a2e-9b8f-7d5c6a1e0f3a",
  name: "Alex Silva",
  email: "alex.silva@arqlearn.com",
  role: "student",
  timezone: "America/Sao_Paulo",
  created_at: "2026-02-10T12:00:00Z",
};

export const mockTeacherUser: User = {
  id: "8a1c4e2b-9d3f-4b7a-a1e0-2f6c8b5d3a90",
  name: "Profa. Marina Costa",
  email: "marina.costa@arqlearn.com",
  role: "teacher",
  timezone: "America/Sao_Paulo",
  created_at: "2025-08-01T09:00:00Z",
};

export const mockAdminUser: User = {
  id: "c2d5e8f1-4a6b-4c9d-8e2f-1a3b5c7d9e0f",
  name: "Admin ArqLearn",
  email: "admin@arqlearn.com",
  role: "admin",
  timezone: "America/Sao_Paulo",
  created_at: "2025-01-01T09:00:00Z",
};
