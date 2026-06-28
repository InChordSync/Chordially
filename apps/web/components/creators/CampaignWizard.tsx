"use client";
import React, { useState } from "react";

interface CampaignData {
  title: string;
  goal: number;
  deadline: string;
  description: string;
}

const steps = ["Details", "Goal & Deadline", "Review"];

export function CampaignWizard({ onSubmit }: { onSubmit: (data: CampaignData) => void }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<CampaignData>({ title: "", goal: 0, deadline: "", description: "" });

  const update = (patch: Partial<CampaignData>) => setData((d) => ({ ...d, ...patch }));

  return (
    <div>
      <p>Step {step + 1} of {steps.length}: {steps[step]}</p>
      {step === 0 && (
        <>
          <input placeholder="Campaign title" value={data.title} onChange={(e) => update({ title: e.target.value })} />
          <textarea placeholder="Description" value={data.description} onChange={(e) => update({ description: e.target.value })} />
        </>
      )}
      {step === 1 && (
        <>
          <input type="number" placeholder="Goal (XLM)" value={data.goal} onChange={(e) => update({ goal: +e.target.value })} />
          <input type="date" value={data.deadline} onChange={(e) => update({ deadline: e.target.value })} />
        </>
      )}
      {step === 2 && <pre>{JSON.stringify(data, null, 2)}</pre>}
      <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>Back</button>
      {step < steps.length - 1
        ? <button onClick={() => setStep((s) => s + 1)}>Next</button>
        : <button onClick={() => onSubmit(data)}>Submit</button>}
    </div>
  );
}
