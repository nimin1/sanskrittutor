"use client";

export type TutorChatMessage = {
  id: string;
  role: "user" | "assistant";
  type: "text" | "image" | "quiz" | "system";
  content: string;
  createdAt: string;
};

export type QuizAttempt = {
  id: string;
  question: string;
  userAnswer: string;
  aiFeedback: string;
  isCorrect?: boolean;
  createdAt: string;
};

export type StudySession = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title?: string;
  imageThumbnail?: string;
  extractedText?: string;
  messages: TutorChatMessage[];
  quizAttempts?: QuizAttempt[];
};

const DB_NAME = "sanskrit-tutor-db";
const STORE = "sessions";
const VERSION = 1;

export async function saveSession(session: StudySession): Promise<void> {
  const db = await openDb();
  await requestToPromise(db.transaction(STORE, "readwrite").objectStore(STORE).put(session));
  db.close();
}

export async function getSessions(): Promise<StudySession[]> {
  const db = await openDb();
  const sessions = await requestToPromise<StudySession[]>(
    db.transaction(STORE, "readonly").objectStore(STORE).getAll(),
  );
  db.close();
  return sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getSession(id: string): Promise<StudySession | undefined> {
  const db = await openDb();
  const session = await requestToPromise<StudySession | undefined>(
    db.transaction(STORE, "readonly").objectStore(STORE).get(id),
  );
  db.close();
  return session;
}

export async function deleteSession(id: string): Promise<void> {
  const db = await openDb();
  await requestToPromise(db.transaction(STORE, "readwrite").objectStore(STORE).delete(id));
  db.close();
}

export async function deleteAllSessions(): Promise<void> {
  const db = await openDb();
  await requestToPromise(db.transaction(STORE, "readwrite").objectStore(STORE).clear());
  db.close();
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
