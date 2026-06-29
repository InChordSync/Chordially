import { createWalletLinkTestHarness } from './wallet-link-test-harness'

describe('WalletLinkTestHarness', () => {
  const harness = createWalletLinkTestHarness()

  it('should create a session', async () => {
    const session = await harness.createSession('user-1', 'GB...TEST', 'testnet')
    expect(session.status).toBe('pending')
    expect(session.userId).toBe('user-1')
  })

  it('should verify a session', async () => {
    const session = await harness.createSession('user-2', 'GB...TEST', 'testnet')
    const verified = await harness.verifyLink(session.linkId)
    expect(verified.status).toBe('active')
  })

  it('should unlink a session', async () => {
    const session = await harness.createSession('user-3', 'GB...TEST', 'testnet')
    await harness.verifyLink(session.linkId)
    const unlinked = await harness.unlink(session.linkId)
    expect(unlinked.status).toBe('unlinked')
    expect(unlinked.unlinkedAt).not.toBeNull()
  })

  it('should throw for unknown session on verify', async () => {
    await expect(harness.verifyLink('nonexistent')).rejects.toThrow('Session not found')
  })

  it('should create SEP-10 challenge', async () => {
    const challenge = await harness.createSep10Challenge()
    expect(challenge.transaction).toBeDefined()
    expect(challenge.networkPassphrase).toContain('Test SDF')
  })

  it('should verify SEP-10', async () => {
    const verified = await harness.verifySep10()
    expect(verified.token).toBeDefined()
    expect(verified.walletLinkId).toBeDefined()
  })
})
