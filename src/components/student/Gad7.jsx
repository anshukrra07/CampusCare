import React, { useState } from "react";
import { auth, db } from "../../lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, setDoc } from "firebase/firestore";
import AssessmentForm from "./AssessmentForm";

const questions = [
  "Feeling nervous, anxious, or on edge?",
  "Not being able to stop or control worrying?",
  "Worrying too much about different things?",
  "Trouble relaxing?",
  "Being so restless that it is hard to sit still?",
  "Becoming easily annoyed or irritable?",
  "Feeling afraid as if something awful might happen?",
];

const options = [
  { label: "Not at all", value: 0 },
  { label: "Several days", value: 1 },
  { label: "More than half the days", value: 2 },
  { label: "Nearly every day", value: 3 },
];

export default function Gad7() {
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
    else if (total >= 15) sev = "Severe";
    setSeverity(sev);

    let riskLevel = "normal";
    if (total >= 15) riskLevel = "high"; // GAD-7 severe

    if (user) {
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const timestamp = now.getTime(); // Unique timestamp
      await setDoc(doc(db, "users", user.uid, "assessments", `gad7-${today}-${timestamp}`), {
        score: total,
        severity: sev,
        riskLevel,          // ✅ added
        testName: "GAD-7",  // ✅ added
        date: today,
        created_at: now,    // Full timestamp for ordering
      });
    }

    setSubmitted(true);
  };

  return (
    <AssessmentForm
      title="GAD-7 Anxiety Assessment"
      questions={questions}
      options={options}
      answers={answers}
      handleChange={handleChange}
      submitted={submitted}
      calculateResult={calculateResult}
      score={score}
      severity={severity}
      assessmentType="gad7"
    />
  );
}