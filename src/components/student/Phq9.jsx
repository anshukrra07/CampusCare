import React, { useState } from "react";
import { auth, db } from "../../lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, setDoc } from "firebase/firestore";
import AssessmentForm from "./AssessmentForm";

const questions = [
  "Little interest or pleasure in doing things?",
  "Feeling down, depressed, or hopeless?",
  "Trouble falling or staying asleep, or sleeping too much?",
  "Feeling tired or having little energy?",
  "Poor appetite or overeating?",
  "Feeling bad about yourself — or that you are a failure?",
  "Trouble concentrating on things, such as reading or watching TV?",
  "Moving or speaking slowly, or being fidgety/restless?",
  "Thoughts that you would be better off dead, or of hurting yourself?",
];

const options = [
  { label: "Not at all", value: 0 },
  { label: "Several days", value: 1 },
  { label: "More than half the days", value: 2 },
  { label: "Nearly every day", value: 3 },
];

export default function Phq9() {
  const [user] = useAuthState(auth);
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [severity, setSeverity] = useState("");

  const handleChange = (qIndex, value) => {
    const newAnswers = [...answers];
    newAnswers[qIndex] = value;
    setAnswers(newAnswers);
  };

  const calculateResult = async () => {
    const total = answers.reduce((a, b) => a + (b || 0), 0);
    setScore(total);

    let sev = "Minimal";
    if (total >= 5 && total <= 9) sev = "Mild";
    else if (total >= 10 && total <= 14) sev = "Moderate";
    else if (total >= 15 && total <= 19) sev = "Moderately Severe";
    else if (total >= 20) sev = "Severe";
    setSeverity(sev);

    let riskLevel = "normal";
    if (total >= 20) riskLevel = "high"; // PHQ-9 severe

    if (user) {
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const timestamp = now.getTime(); // Unique timestamp
      await setDoc(doc(db, "users", user.uid, "assessments", `phq9-${today}-${timestamp}`), {
        score: total,
        severity: sev,
        riskLevel,          // ✅ added
        testName: "PHQ-9",  // ✅ added
        date: today,
        created_at: now,    // Full timestamp for ordering
      });
    }

    setSubmitted(true);
  };

  return (
    <AssessmentForm
      title="PHQ-9 Depression Assessment"
      questions={questions}
      options={options}
      answers={answers}
      handleChange={handleChange}
      submitted={submitted}
      calculateResult={calculateResult}
      score={score}
      severity={severity}
      assessmentType="phq9"
    />
  );
}