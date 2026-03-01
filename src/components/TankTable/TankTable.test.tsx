import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Tank } from '../../types/tank'
import TankTable from './TankTable'

const tanksFixture: Tank[] = [
  {
    tank_id: 1,
    name: 'Löwe',
    short_name: 'Lowe',
    tier: 8,
    type: 'heavyTank',
    nation: 'germany',
    is_premium: true,
    is_gift: false,
    images: { small_icon: 'https://example.com/lowe.png' },
  },
  {
    tank_id: 2,
    name: 'Т-34',
    short_name: 'Т-34',
    tier: 5,
    type: 'mediumTank',
    nation: 'ussr',
    is_premium: false,
    is_gift: false,
    images: { small_icon: 'https://example.com/t34.png' },
  },
  {
    tank_id: 3,
    name: 'Bourrasque',
    short_name: 'Bourrasque',
    tier: 8,
    type: 'mediumTank',
    nation: 'france',
    is_premium: true,
    is_gift: false,
    images: { small_icon: 'https://example.com/bourrasque.png' },
  },
]

function createApiPayload(tanks: Tank[]) {
  return {
    status: 'ok' as const,
    data: Object.fromEntries(tanks.map((tank) => [String(tank.tank_id), tank])),
  }
}

function mockFetchSuccess(tanks: Tank[]) {
  const response = {
    ok: true,
    json: async () => createApiPayload(tanks),
  } as Response
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('TankTable', () => {
  it('filters names without diacritic sensitivity', async () => {
    mockFetchSuccess(tanksFixture)
    const user = userEvent.setup()

    render(<TankTable initialPageSize={10} pageSizeOptions={[10, 25]} />)

    await screen.findByRole('img', { name: 'Löwe' })

    const filterInput = screen.getByLabelText('Фильтр по названию')
    await user.clear(filterInput)
    await user.type(filterInput, 'Lowe')

    expect(screen.getByRole('img', { name: 'Löwe' })).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: 'Т-34' })).not.toBeInTheDocument()
  })

  it('supports pagination and page size switch', async () => {
    mockFetchSuccess(tanksFixture)
    const user = userEvent.setup()

    render(<TankTable initialPageSize={1} pageSizeOptions={[1, 2]} />)

    await screen.findByRole('img', { name: 'Т-34' })
    expect(screen.getByText('Страница 1 из 3')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Следующая страница' }))
    await screen.findByRole('img', { name: 'Bourrasque' })
    expect(screen.getByText('Страница 2 из 3')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Танков на странице'), '2')

    await waitFor(() => {
      expect(screen.getByText('Страница 1 из 2')).toBeInTheDocument()
    })

    expect(screen.getByRole('img', { name: 'Т-34' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Bourrasque' })).toBeInTheDocument()
  })

  it('shows an error and retries loading', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500 } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => createApiPayload(tanksFixture),
      } as Response)

    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()

    render(<TankTable initialPageSize={10} pageSizeOptions={[10]} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Ошибка сети (500)')

    await user.click(screen.getByRole('button', { name: 'Повторить загрузку' }))
    await screen.findByRole('img', { name: 'Löwe' })

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})