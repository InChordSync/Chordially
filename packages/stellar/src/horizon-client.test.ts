import { Account, Keypair, NetworkError } from '@stellar/stellar-sdk'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HorizonStellarClient } from './horizon-client.js'

const config = {
  network: 'testnet' as const,
  horizonUrl: 'https://horizon-testnet.stellar.org',
  friendbotUrl: 'https://friendbot.stellar.org',
}

describe('HorizonStellarClient', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('generates a valid Stellar keypair without hitting the network', () => {
    const client = new HorizonStellarClient(config)
    const keypair = client.generateKeypair()

    expect(keypair.publicKey).toMatch(/^G[A-Z0-9]{55}$/)
    expect(keypair.secretKey).toMatch(/^S[A-Z0-9]{55}$/)
    expect(() => Keypair.fromSecret(keypair.secretKey)).not.toThrow()
  })

  it('reads the native XLM balance from the loaded account', async () => {
    const client = new HorizonStellarClient(config)
    const publicKey = Keypair.random().publicKey()

    vi.spyOn(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (client as any).server,
      'loadAccount'
    ).mockResolvedValue({
      accountId: () => publicKey,
      sequence: '1',
      balances: [
        { asset_type: 'native', balance: '10000.0000000' },
        { asset_type: 'credit_alphanum4', asset_code: 'USDC', balance: '5.0000000' },
      ],
    })

    const balance = await client.getNativeBalance({ publicKey })
    expect(balance).toBe('10000.0000000')
  })

  it('rejects funding a non-testnet client', async () => {
    const client = new HorizonStellarClient({ ...config, network: 'public' })
    await expect(client.fundTestnetAccount({ publicKey: 'GABC' })).rejects.toThrow(
      'testnet'
    )
  })

  it('calls friendbot with the account public key', async () => {
    const client = new HorizonStellarClient(config)
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    await client.fundTestnetAccount({ publicKey: 'GABC' })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://friendbot.stellar.org?addr=GABC'
    )
  })

  it('builds, signs, and submits a native payment', async () => {
    const client = new HorizonStellarClient(config)
    const source = Keypair.random()
    const destination = Keypair.random().publicKey()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn((client as any).server, 'loadAccount').mockResolvedValue(
      new Account(source.publicKey(), '1')
    )
    const submitSpy = vi
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .spyOn((client as any).server, 'submitTransaction')
      .mockResolvedValue({ hash: 'abc123', ledger: 42, successful: true })

    const result = await client.submitPayment({
      sourceSecretKey: source.secret(),
      destinationPublicKey: destination,
      amount: '25',
    })

    expect(result).toEqual({ hash: 'abc123', ledger: 42, successful: true })
    expect(submitSpy).toHaveBeenCalledTimes(1)
  })

  it('builds one operation per payee for a split payment', async () => {
    const client = new HorizonStellarClient(config)
    const source = Keypair.random()
    const payeeA = Keypair.random().publicKey()
    const payeeB = Keypair.random().publicKey()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn((client as any).server, 'loadAccount').mockResolvedValue(
      new Account(source.publicKey(), '1')
    )
    const submitSpy = vi
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .spyOn((client as any).server, 'submitTransaction')
      .mockImplementation((tx: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((tx as any).operations).toHaveLength(2)
        return Promise.resolve({ hash: 'split-hash', ledger: 99, successful: true })
      })

    const result = await client.submitSplitPayment({
      sourceSecretKey: source.secret(),
      payments: [
        { destinationPublicKey: payeeA, amount: '5' },
        { destinationPublicKey: payeeB, amount: '3' },
      ],
    })

    expect(result).toEqual({ hash: 'split-hash', ledger: 99, successful: true })
    expect(submitSpy).toHaveBeenCalledTimes(1)
  })

  describe('listSentPayments', () => {
    function mockPaymentsPage(records: unknown[]) {
      const builder = {
        forAccount: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        call: vi.fn().mockResolvedValue({ records }),
      }
      return builder
    }

    it('returns only outgoing payment operations for the given account', async () => {
      const client = new HorizonStellarClient(config)
      const publicKey = Keypair.random().publicKey()
      const otherPublicKey = Keypair.random().publicKey()

      const builder = mockPaymentsPage([
        {
          type: 'payment',
          from: publicKey,
          to: 'GDEST1',
          amount: '5.0000000',
          asset_type: 'native',
          transaction_hash: 'hash1',
          transaction_successful: true,
          created_at: '2026-01-01T00:00:00Z',
        },
        {
          // Incoming payment (this account is the receiver) should be excluded.
          type: 'payment',
          from: otherPublicKey,
          to: publicKey,
          amount: '9.0000000',
          asset_type: 'native',
          transaction_hash: 'hash2',
          transaction_successful: true,
          created_at: '2026-01-01T00:01:00Z',
        },
        {
          // Non-payment operation should be excluded.
          type: 'create_account',
          from: publicKey,
          created_at: '2026-01-01T00:02:00Z',
        },
      ])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn((client as any).server, 'payments').mockReturnValue(builder)

      const payments = await client.listSentPayments({ publicKey })

      expect(payments).toEqual([
        {
          hash: 'hash1',
          from: publicKey,
          to: 'GDEST1',
          amount: '5.0000000',
          assetType: 'native',
          successful: true,
          createdAt: '2026-01-01T00:00:00Z',
        },
      ])
      expect(builder.forAccount).toHaveBeenCalledWith(publicKey)
    })

    it('filters out payments before sinceISOTime', async () => {
      const client = new HorizonStellarClient(config)
      const publicKey = Keypair.random().publicKey()

      const builder = mockPaymentsPage([
        {
          type: 'payment',
          from: publicKey,
          to: 'GDEST1',
          amount: '1.0000000',
          asset_type: 'native',
          transaction_hash: 'old-hash',
          transaction_successful: true,
          created_at: '2020-01-01T00:00:00Z',
        },
        {
          type: 'payment',
          from: publicKey,
          to: 'GDEST2',
          amount: '2.0000000',
          asset_type: 'native',
          transaction_hash: 'new-hash',
          transaction_successful: true,
          created_at: '2030-01-01T00:00:00Z',
        },
      ])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn((client as any).server, 'payments').mockReturnValue(builder)

      const payments = await client.listSentPayments(
        { publicKey },
        { sinceISOTime: '2025-01-01T00:00:00Z' }
      )

      expect(payments.map((p) => p.hash)).toEqual(['new-hash'])
    })
  })

  it('rejects a split payment with no payees', async () => {
    const client = new HorizonStellarClient(config)
    const source = Keypair.random()

    await expect(
      client.submitSplitPayment({ sourceSecretKey: source.secret(), payments: [] })
    ).rejects.toThrow('at least one payment')
  })

  describe('sponsorAccountCreation', () => {
    it('sponsors the new account reserve and signs with both keys', async () => {
      const client = new HorizonStellarClient(config)
      const sponsor = Keypair.random()
      const newAccount = Keypair.random()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn((client as any).server, 'loadAccount').mockResolvedValue(
        new Account(sponsor.publicKey(), '1')
      )
      const submitSpy = vi
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .spyOn((client as any).server, 'submitTransaction')
        .mockImplementation((tx: unknown) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const operations = (tx as any).operations
          expect(operations).toHaveLength(3)
          expect(operations[0].type).toBe('beginSponsoringFutureReserves')
          expect(operations[1].type).toBe('createAccount')
          expect(operations[1].startingBalance).toBe('0.0000000')
          expect(operations[2].type).toBe('endSponsoringFutureReserves')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          expect((tx as any).signatures.length).toBe(2)
          return Promise.resolve({ hash: 'sponsor-hash', ledger: 7, successful: true })
        })

      const result = await client.sponsorAccountCreation({
        sponsorSecretKey: sponsor.secret(),
        newAccountPublicKey: newAccount.publicKey(),
        newAccountSecretKey: newAccount.secret(),
      })

      expect(result).toEqual({ hash: 'sponsor-hash', ledger: 7, successful: true })
      expect(submitSpy).toHaveBeenCalledTimes(1)
    })

    it('rejects a mismatched new-account keypair', async () => {
      const client = new HorizonStellarClient(config)
      const sponsor = Keypair.random()
      const newAccount = Keypair.random()
      const otherAccount = Keypair.random()

      await expect(
        client.sponsorAccountCreation({
          sponsorSecretKey: sponsor.secret(),
          newAccountPublicKey: otherAccount.publicKey(),
          newAccountSecretKey: newAccount.secret(),
        })
      ).rejects.toThrow('does not match')
    })
  })

  describe('getSponsorBalance', () => {
    it('reads the sponsor account native balance', async () => {
      const client = new HorizonStellarClient(config)
      const publicKey = Keypair.random().publicKey()

      vi.spyOn(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (client as any).server,
        'loadAccount'
      ).mockResolvedValue({
        accountId: () => publicKey,
        sequence: '1',
        balances: [{ asset_type: 'native', balance: '5000.0000000' }],
      })

      const balance = await client.getSponsorBalance(publicKey)
      expect(balance).toBe('5000.0000000')
    })
  })

  describe('isInsufficientSponsorBalanceError', () => {
    it('recognizes op_underfunded as an insufficient-balance failure', () => {
      const client = new HorizonStellarClient(config)
      const error = new NetworkError('failed', {
        data: {
          extras: {
            result_codes: { transaction: 'tx_failed', operations: ['op_underfunded'] },
          },
        },
      })
      expect(client.isInsufficientSponsorBalanceError(error)).toBe(true)
    })

    it('recognizes op_low_reserve as an insufficient-balance failure', () => {
      const client = new HorizonStellarClient(config)
      const error = new NetworkError('failed', {
        data: {
          extras: {
            result_codes: { transaction: 'tx_failed', operations: ['op_low_reserve'] },
          },
        },
      })
      expect(client.isInsufficientSponsorBalanceError(error)).toBe(true)
    })

    it('does not treat an unrelated operation failure as insufficient balance', () => {
      const client = new HorizonStellarClient(config)
      const error = new NetworkError('failed', {
        data: {
          extras: {
            result_codes: { transaction: 'tx_failed', operations: ['op_no_destination'] },
          },
        },
      })
      expect(client.isInsufficientSponsorBalanceError(error)).toBe(false)
    })

    it('returns false for a plain error', () => {
      const client = new HorizonStellarClient(config)
      expect(client.isInsufficientSponsorBalanceError(new Error('boom'))).toBe(false)
    })
  })

  describe('isTransientSubmissionError', () => {
    const client = new HorizonStellarClient(config)

    it('treats a stale sequence number as transient', () => {
      const error = new NetworkError('bad seq', {
        data: { extras: { result_codes: { transaction: 'tx_bad_seq' } } },
      })
      expect(client.isTransientSubmissionError(error)).toBe(true)
    })

    it('treats an insufficient balance failure as permanent', () => {
      const error = new NetworkError('failed', {
        data: { extras: { result_codes: { transaction: 'tx_failed' } } },
      })
      expect(client.isTransientSubmissionError(error)).toBe(false)
    })

    it('treats a network error with no result code as transient', () => {
      const error = new NetworkError('timeout', {})
      expect(client.isTransientSubmissionError(error)).toBe(true)
    })

    it('treats a plain error as permanent', () => {
      expect(client.isTransientSubmissionError(new Error('boom'))).toBe(false)
    })
  })
})
