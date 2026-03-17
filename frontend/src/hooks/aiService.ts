const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export async function getHint(params: {
  problemTitle: string;
  problemContent: string;
  userCode: string;
  language: string;
  hintNumber: number;
}): Promise<string> {
  const res = await fetch(`${API_BASE}ai/hint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      problem_title: params.problemTitle,
      problem_content: params.problemContent,
      user_code: params.userCode,
      language: params.language,
      hint_number: params.hintNumber,
    }),
  });
  if (!res.ok) throw new Error("Hint unavailable");
  const data = await res.json();
  return data.hint;
}

export async function reviewCode(params: {
  problemTitle: string;
  problemContent: string;
  userCode: string;
  language: string;
  won: boolean;
  timeTaken: number;
}): Promise<string> {
  const res = await fetch(`${API_BASE}ai/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      problem_title: params.problemTitle,
      problem_content: params.problemContent,
      user_code: params.userCode,
      language: params.language,
      won: params.won,
      time_taken: params.timeTaken,
    }),
  });
  if (!res.ok) throw new Error("Review unavailable");
  const data = await res.json();

  if (data.verdict) {
    return [
      `VERDICT: ${data.verdict}`,
      `COMPLEXITY: ${data.time_complexity} time · ${data.space_complexity} space`,
      `QUALITY: ${data.quality_score}/100`,
      data.strengths?.length ? `STRENGTHS: ${data.strengths.join(" · ")}` : "",
      data.weaknesses?.length
        ? `WEAKNESSES: ${data.weaknesses.join(" · ")}`
        : "",
      data.optimization ? `OPTIMIZE: ${data.optimization}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return data.review || JSON.stringify(data);
}
