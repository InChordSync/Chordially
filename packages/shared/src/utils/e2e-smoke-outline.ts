export const smokeTests = {
  auth: [
    { step: "Load /login", expect: "Form renders" },
    { step: "Submit valid credentials", expect: "Redirect to dashboard" },
    { step: "Submit invalid credentials", expect: "Error message shown" },
    { step: "Click logout", expect: "Redirect to /login" },
  ],
  profile: [
    { step: "Navigate to /profile", expect: "Profile page renders" },
    { step: "Edit display name", expect: "Name saved and shown" },
    { step: "Upload avatar", expect: "New avatar displayed" },
  ],
  payment: [
    { step: "Open support page", expect: "Payment form visible" },
    { step: "Submit valid payment", expect: "Success screen shown" },
    { step: "Open payment history", expect: "Transaction listed with status" },
  ],
};

export function printOutline(): void {
  for (const [journey, steps] of Object.entries(smokeTests)) {
    console.log(`\n[${journey.toUpperCase()}]`);
    steps.forEach((s, i) => console.log(`  ${i + 1}. ${s.step} → ${s.expect}`));
  }
}
