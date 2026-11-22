import appConfig from "../../app.json"
import packageJson from "../../package.json"

describe("mobile platform config (#1432)", () => {
  it("does not expose unsupported web target config", () => {
    expect((packageJson as any).scripts?.web).toBeUndefined()
    expect((appConfig as any).expo?.web).toBeUndefined()
  })

  it("keeps supported mobile scripts", () => {
    expect((packageJson as any).scripts?.android).toBeTruthy()
    expect((packageJson as any).scripts?.ios).toBeTruthy()
  })
})
