import { NextResponse } from "next/server";

// Static poll data — update manually from IFOP, OpinionWay, Harris Interactive, BVA
// Sources: IFOP pour Le Figaro, OpinionWay pour Les Echos/Radio Classique, Harris Interactive, BVA Xsight
// Last updated: March 2025

export interface Poll {
  date: string;        // ISO date of poll publication
  pollster: string;
  sponsor: string;
  candidates: { name: string; party: string; score: number }[];
  round: 1 | 2;
  sampleSize?: number;
}

export interface ApprovalPoint {
  date: string;
  approval: number;
  disapproval: number;
  source: string;
}

export interface SondagesData {
  approvalMacron: ApprovalPoint[];
  polls2027: Poll[];
  lastUpdated: string;
}

// Presidential approval — Macron (monthly averages from aggregated polls)
const APPROVAL_MACRON: ApprovalPoint[] = [
  { date: "2024-01", approval: 29, disapproval: 70, source: "IFOP" },
  { date: "2024-02", approval: 28, disapproval: 71, source: "IFOP" },
  { date: "2024-03", approval: 27, disapproval: 72, source: "IFOP" },
  { date: "2024-04", approval: 26, disapproval: 73, source: "IFOP" },
  { date: "2024-05", approval: 25, disapproval: 74, source: "IFOP" },
  { date: "2024-06", approval: 26, disapproval: 73, source: "IFOP" },
  { date: "2024-07", approval: 25, disapproval: 74, source: "IFOP" },
  { date: "2024-08", approval: 26, disapproval: 73, source: "IFOP" },
  { date: "2024-09", approval: 25, disapproval: 74, source: "IFOP" },
  { date: "2024-10", approval: 24, disapproval: 75, source: "IFOP" },
  { date: "2024-11", approval: 23, disapproval: 76, source: "IFOP" },
  { date: "2024-12", approval: 24, disapproval: 75, source: "IFOP" },
  { date: "2025-01", approval: 22, disapproval: 77, source: "IFOP" },
  { date: "2025-02", approval: 23, disapproval: 76, source: "IFOP" },
  { date: "2025-03", approval: 22, disapproval: 77, source: "IFOP" },
];

// Hypothetical 2027 presidential election polls (1st round)
const POLLS_2027: Poll[] = [
  {
    date: "2025-03-10",
    pollster: "IFOP",
    sponsor: "Le Figaro",
    round: 1,
    sampleSize: 1011,
    candidates: [
      { name: "Marine Le Pen", party: "RN", score: 34 },
      { name: "Édouard Philippe", party: "Horizons", score: 22 },
      { name: "Gabriel Attal", party: "Renaissance", score: 11 },
      { name: "Jean-Luc Mélenchon", party: "LFI", score: 10 },
      { name: "François Hollande", party: "PS", score: 8 },
      { name: "Éric Ciotti", party: "LR", score: 6 },
    ],
  },
  {
    date: "2025-03-01",
    pollster: "OpinionWay",
    sponsor: "Les Echos",
    round: 1,
    sampleSize: 1027,
    candidates: [
      { name: "Marine Le Pen", party: "RN", score: 33 },
      { name: "Édouard Philippe", party: "Horizons", score: 21 },
      { name: "Gabriel Attal", party: "Renaissance", score: 12 },
      { name: "Jean-Luc Mélenchon", party: "LFI", score: 11 },
      { name: "François Ruffin", party: "LFI/Gauche", score: 7 },
      { name: "Éric Ciotti", party: "LR", score: 5 },
    ],
  },
  {
    date: "2025-02-18",
    pollster: "Harris Interactive",
    sponsor: "Challenges",
    round: 2,
    sampleSize: 986,
    candidates: [
      { name: "Marine Le Pen", party: "RN", score: 54 },
      { name: "Édouard Philippe", party: "Horizons", score: 46 },
    ],
  },
  {
    date: "2025-02-10",
    pollster: "BVA",
    sponsor: "RTL",
    round: 2,
    sampleSize: 1003,
    candidates: [
      { name: "Marine Le Pen", party: "RN", score: 55 },
      { name: "Édouard Philippe", party: "Horizons", score: 45 },
    ],
  },
];

export async function GET(): Promise<NextResponse> {
  const data: SondagesData = {
    approvalMacron: APPROVAL_MACRON,
    polls2027: POLLS_2027,
    lastUpdated: "2025-03-10",
  };
  return NextResponse.json(data);
}
