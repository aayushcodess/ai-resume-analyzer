import { useState } from "react";

type AnalysisResult = {
  score: number;
  summary: string;
  strengths: string[];
  missingSkills: string[];
  suggestions: string[];
};

function App() {
  const [resume, setResume] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!resume.trim() || !jobRole.trim()) {
      setError("Please enter your resume and target job role.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          resume: resume.trim(),
          jobRole: jobRole.trim(),
        }),
      });

      const responseText = await response.text();

      if (!responseText.trim()) {
        throw new Error(
          `The server returned an empty response (HTTP ${response.status}). Check the Vercel terminal.`
        );
      }

      let data: unknown;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `The server returned an invalid response (HTTP ${response.status}). Check the Vercel terminal.`
        );
      }

      if (!response.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : `Request failed (HTTP ${response.status}).`;

        throw new Error(message);
      }

      if (
        typeof data !== "object" ||
        data === null ||
        !("score" in data) ||
        !("summary" in data) ||
        !("strengths" in data) ||
        !("missingSkills" in data) ||
        !("suggestions" in data)
      ) {
        throw new Error("The server returned incomplete analysis data.");
      }

      const analysis = data as AnalysisResult;

      if (
        !Number.isInteger(analysis.score) ||
        analysis.score < 0 ||
        analysis.score > 100 ||
        typeof analysis.summary !== "string" ||
        !Array.isArray(analysis.strengths) ||
        !Array.isArray(analysis.missingSkills) ||
        !Array.isArray(analysis.suggestions) ||
        !analysis.strengths.every((item) => typeof item === "string") ||
        !analysis.missingSkills.every((item) => typeof item === "string") ||
        !analysis.suggestions.every((item) => typeof item === "string")
      ) {
        throw new Error("The server returned invalid analysis data.");
      }

      setResult(analysis);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to analyze your resume. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setResume("");
    setJobRole("");
    setError("");
  };

  if (result) {
    return (
      <main className="app">
        <header className="header">
          <div className="container">
            <a href="/" className="logo">
              AI Resume Analyzer
            </a>
          </div>
        </header>

        <section className="results-section">
          <div className="container">
            <div className="results-header">
              <p className="eyebrow">Analysis complete</p>
              <h1>Your Resume Analysis</h1>
              <p>
                Here is your AI-powered overview for the{" "}
                <strong>{jobRole}</strong> role.
              </p>
            </div>

            <div className="score-card">
              <div
                className="score"
                aria-label={`Resume score: ${result.score} out of 100`}
              >
                <span className="score-number">{result.score}</span>
                <span className="score-total">/100</span>
              </div>

              <div>
                <h2>Resume Score</h2>
                <p>{result.summary}</p>
              </div>
            </div>

            <div className="results-grid">
              <section
                className="result-card"
                aria-labelledby="strengths-title"
              >
                <h2 id="strengths-title">Strengths</h2>
                <ul>
                  {result.strengths.map((strength, index) => (
                    <li key={`${index}-${strength}`}>{strength}</li>
                  ))}
                </ul>
              </section>

              <section
                className="result-card"
                aria-labelledby="missing-title"
              >
                <h2 id="missing-title">Missing Skills</h2>
                <ul>
                  {result.missingSkills.map((skill, index) => (
                    <li key={`${index}-${skill}`}>{skill}</li>
                  ))}
                </ul>
              </section>
            </div>

            <section
              className="result-card suggestions-card"
              aria-labelledby="suggestions-title"
            >
              <h2 id="suggestions-title">
                Suggestions for Improvement
              </h2>
              <ol>
                {result.suggestions.map((suggestion, index) => (
                  <li key={`${index}-${suggestion}`}>{suggestion}</li>
                ))}
              </ol>
            </section>

            <button
              type="button"
              className="secondary-button"
              onClick={handleReset}
            >
              Analyze Another Resume
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <header className="header">
        <div className="container">
          <a href="/" className="logo" aria-label="AI Resume Analyzer home">
            AI Resume Analyzer
          </a>
        </div>
      </header>

      <section className="hero">
        <div className="container">
          <p className="eyebrow">AI-powered career tool</p>
          <h1>Improve your resume with AI</h1>
          <p className="hero-text">
            Paste your resume and tell us what job you're targeting. Our AI
            will analyze your resume and provide practical suggestions.
          </p>
        </div>
      </section>

      <section className="analyzer-section">
        <div className="container">
          <div className="analyzer-card">
            <div className="card-header">
              <h2>Analyze your resume</h2>
              <p>
                Provide your resume content and the role you're applying for.
              </p>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleAnalyze();
              }}
            >
              <div className="form-group">
                <label htmlFor="job-role">Target job role</label>
                <input
                  id="job-role"
                  type="text"
                  value={jobRole}
                  onChange={(event) => setJobRole(event.target.value)}
                  placeholder="e.g. Frontend Developer"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="resume">Resume</label>
                <textarea
                  id="resume"
                  value={resume}
                  onChange={(event) => setResume(event.target.value)}
                  placeholder="Paste your resume content here..."
                  rows={14}
                  required
                />
                <p className="helper-text">
                  Include your education, skills, projects, experience, and
                  other relevant information.
                </p>
              </div>

              {error && (
                <p className="error-message" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="analyze-button"
                disabled={loading || !resume.trim() || !jobRole.trim()}
              >
                {loading ? "Analyzing your resume..." : "Analyze Resume"}
              </button>

              {loading && (
                <p className="helper-text" role="status" aria-live="polite">
                  Claude is reviewing your resume. This may take a few
                  moments.
                </p>
              )}
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;


