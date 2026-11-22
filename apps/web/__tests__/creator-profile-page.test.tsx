import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import CreatorProfilePage from '../app/creators/[slug]/page'

vi.mock('next/navigation', () => ({
  useParams: () => ({ slug: 'solar-vibes' }),
}))

vi.mock('../lib/creator-client', () => ({
  getCreatorBySlug: vi.fn().mockResolvedValue({
    id: 'cp-1',
    userId: 'u-1',
    displayName: 'Solar Vibes',
    slug: 'solar-vibes',
    bio: 'Indie producer from Lagos',
    avatarUrl: null,
    genre: 'Indie',
    location: 'Lagos',
    isVerified: true,
    followerCount: 0,
    trackCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }),
}))

vi.mock('../lib/auth-client', () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  AuthApiError: class AuthApiError extends Error {},
}))

vi.mock('../lib/api-client', () => ({
  ApiError: class ApiError extends Error {},
  apiFetch: vi.fn(),
  authHeaders: vi.fn(),
}))

describe('CreatorProfilePage', () => {
  it("renders the creator's display name", async () => {
    render(<CreatorProfilePage />)
    expect(await screen.findByText('Solar Vibes')).toBeInTheDocument()
  })

  it('renders bio, genre, and location', async () => {
    render(<CreatorProfilePage />)
    expect(
      await screen.findByText('Indie producer from Lagos')
    ).toBeInTheDocument()
    expect(screen.getByText('Indie')).toBeInTheDocument()
    expect(screen.getByText('Lagos')).toBeInTheDocument()
  })

  it('renders the verified badge when creator is verified', async () => {
    render(<CreatorProfilePage />)
    expect(await screen.findByLabelText('Verified')).toBeInTheDocument()
  })

  it('shows default avatar when avatarUrl is null', async () => {
    render(<CreatorProfilePage />)
    expect(await screen.findByLabelText('Default avatar')).toBeInTheDocument()
  })

  it('renders main landmarks for loading and error states (#1394)', async () => {
    const { getCreatorBySlug } = await import('../lib/creator-client')
    vi.mocked(getCreatorBySlug).mockRejectedValueOnce(new Error('nope'))
    render(<CreatorProfilePage />)
    expect(await screen.findByRole('main')).toBeInTheDocument()
    expect(screen.getByText('Not Found')).toBeInTheDocument()
  })
})
