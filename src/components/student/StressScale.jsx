import React, { useState } from "react";
import { auth, db } from "../../lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, setDoc } from "firebase/firestore";
import AssessmentForm from "./AssessmentForm";

const questions = [
  "In the last month, how often have you been upset because of something unexpected?",
  "In the last month, how often have you felt unable to control important things in your life?",
  "In the last month, how often have you felt nervous and stressed?",
  "In the last month, how often have you felt confident about handling personal problems?",
  "In the last month, how often have you felt that things were going your way?",
  "In the last month, how often have you found that you could not cope with all the things you had to do?",
  "In the last month, how often have you been able to control irritations in your life?",
  "In the last month, how often have you felt you were on top of things?",
  "In the last month, how often have you been angered by things outside your control?",
  "In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?",
];

const options = [
  { label: "Never", value: 0 },
  { label: "Almost never", value: 1 },
  { label: "Sometimes", value: 2 },
  { label: "Fairly often", value: 3 },
  { label: "Very often", value: 4 },
];

export default function StressScale() {
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

    let sev = "Low Stress";
    if (total >= 14 && total <= 26) sev = "Moderate Stress";
    else if (total >= 27) sev = "High Stress";
    setSeverity(sev);

    let riskLevel = "normal";
    if (total >= 27) riskLevel = "high"; // Stress severe

    if (user) {
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const timestamp = now.getTime(); // Unique timestamp
      await setDoc(doc(db, "users", user.uid, "assessments", `stress-${today}-${timestamp}`), {
        score: total,
        severity: sev,
        riskLevel,                // ✅ added
        testName: "Stress Scale", // ✅ added
        date: today,
        created_at: now,          // Full timestamp for ordering
      });
    }

    setSubmitted(true);
  };

  return (
    <AssessmentForm
      title="Perceived Stress Scale (PSS)"
      questions={questions}
      options={options}
      answers={answers}
      handleChange={handleChange}
      submitted={submitted}
      calculateResult={calculateResult}
      score={score}
      severity={severity}
      assessmentType="stress"
    />
  );
}