import { HoleInfo } from "../types";

// GolfCourseAPI.com types
interface GolfCourseApiCourse {
  id: string;
  course_name: string;
  club_name?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

interface GolfCourseApiTeeHole {
  hole_number: number;
  par: number;
  yardage: number;
  handicap?: number;
}

interface GolfCourseApiTee {
  id: string;
  tee_name: string;
  total_yards: number;
  par_total: number;
  holes: GolfCourseApiTeeHole[];
}

interface GolfCourseApiDetail {
  id: string;
  course_name: string;
  club_name?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  tees?: {
    male?: GolfCourseApiTee[];
    female?: GolfCourseApiTee[];
  };
}

// Normalized types used by our app
export interface GolfCourseSearchResult {
  id: string;
  name: string;
  clubName?: string;
  city?: string;
  country?: string;
}

export interface GolfCourseDetail {
  id: string;
  name: string;
  clubName?: string;
  city?: string;
  country?: string;
  teeBoxes: TeeBox[];
}

export interface TeeBox {
  name: string;
  totalYards: number;
  parTotal: number;
  holes: HoleInfo[];
}

const API_BASE = "https://api.golfcourseapi.com/v1";

function getApiKey(): string | null {
  return import.meta.env.VITE_GOLF_COURSE_API_KEY || null;
}

async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Golf Course API key not configured. Set VITE_GOLF_COURSE_API_KEY in your .env file.");
  }

  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 401) {
    throw new Error("Invalid Golf Course API key. Check VITE_GOLF_COURSE_API_KEY.");
  }

  if (!res.ok) {
    throw new Error(`Golf Course API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function searchGolfCourses(query: string): Promise<GolfCourseSearchResult[]> {
  if (!getApiKey() || query.trim().length < 2) return [];

  const data = await apiFetch<{ courses: GolfCourseApiCourse[] }>("/search", {
    search_query: query,
  });

  return (data.courses || []).map((c) => ({
    id: c.id,
    name: c.course_name,
    clubName: c.club_name,
    city: c.location?.city,
    country: c.location?.country,
  }));
}

export async function getGolfCourseDetail(courseId: string): Promise<GolfCourseDetail> {
  const data = await apiFetch<GolfCourseApiDetail>(`/courses/${courseId}`);

  const allTees = [...(data.tees?.male || []), ...(data.tees?.female || [])];

  return {
    id: data.id,
    name: data.course_name,
    clubName: data.club_name,
    city: data.location?.city,
    country: data.location?.country,
    teeBoxes: allTees.map((tee) => ({
      name: tee.tee_name,
      totalYards: tee.total_yards,
      parTotal: tee.par_total,
      holes: (tee.holes || []).map((h) => ({
        number: h.hole_number,
        par: h.par,
        yardage: h.yardage,
        handicap: h.handicap,
      })),
    })),
  };
}

export function isGolfCourseApiConfigured(): boolean {
  return !!getApiKey();
}
