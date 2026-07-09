"use client";

import { Check } from "lucide-react";

type StepId = "upload" | "preview" | "processing" | "results";

interface StepConfig {
  id: StepId;
  label: string;
  number: number;
}

const STEPS: StepConfig[] = [
  { id: "upload", label: "Upload CSV", number: 1 },
  { id: "preview", label: "Preview", number: 2 },
  { id: "processing", label: "AI Processing", number: 3 },
  { id: "results", label: "Results", number: 4 },
];

const STEP_ORDER: StepId[] = ["upload", "preview", "processing", "results"];

interface StepIndicatorProps {
  currentStep: StepId;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <div className="step-indicator">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        const isPending = index > currentIndex;

        return (
          <div key={step.id} className="step-item">
            <div
              className={`step-circle ${isActive ? "step-active" : ""} ${
                isCompleted ? "step-completed" : ""
              } ${isPending ? "step-pending" : ""}`}
            >
              {isCompleted ? (
                <Check size={14} strokeWidth={3} />
              ) : (
                <span>{step.number}</span>
              )}
            </div>
            <span
              className={`step-label ${isActive ? "step-label-active" : ""} ${
                isPending ? "step-label-pending" : ""
              }`}
            >
              {step.label}
            </span>
            {index < STEPS.length - 1 && (
              <div className={`step-line ${isCompleted ? "step-line-done" : ""}`} />
            )}
          </div>
        );
      })}

      <style jsx>{`
        .step-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          padding: 8px 0;
          width: 100%;
        }

        .step-item {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .step-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 700;
          flex-shrink: 0;
          transition: all var(--transition-slow);
        }

        .step-active {
          background: var(--accent);
          color: white;
          box-shadow: 0 0 0 4px var(--accent-light);
        }

        .step-completed {
          background: var(--accent);
          color: white;
        }

        .step-pending {
          background: var(--bg-muted);
          color: var(--text-subtle);
          border: 2px solid var(--border);
        }

        .step-label {
          font-size: 0.82rem;
          font-weight: 500;
          color: var(--text-muted);
          white-space: nowrap;
          transition: color var(--transition);
        }

        .step-label-active {
          color: var(--text-primary);
          font-weight: 600;
        }

        .step-label-pending {
          color: var(--text-subtle);
        }

        .step-line {
          width: 48px;
          height: 2px;
          background: var(--border);
          flex-shrink: 0;
          margin: 0 4px;
          border-radius: 2px;
          transition: background var(--transition-slow);
        }

        .step-line-done {
          background: var(--accent);
        }

        @media (max-width: 640px) {
          .step-label { display: none; }
          .step-line { width: 24px; }
        }
      `}</style>
    </div>
  );
}
