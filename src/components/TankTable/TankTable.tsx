import { useEffect, useMemo, useState } from 'react'
import { fetchTanks } from '../../api/tanksApi'
import type { Tank } from '../../types/tank'
import { normalizeText } from '../../utils/normalizeText'

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50]

export interface TankTableProps {
  pageSizeOptions?: number[]
  initialPageSize?: number
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return 'Не удалось загрузить список танков'
}

export default function TankTable({
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  initialPageSize,
}: TankTableProps) {
  const normalizedPageSizeOptions = useMemo(() => {
    const uniq = Array.from(new Set(pageSizeOptions.filter((n) => n > 0)))
    return uniq.length ? uniq.sort((a, b) => a - b) : DEFAULT_PAGE_SIZE_OPTIONS
  }, [pageSizeOptions])

  const [tanks, setTanks] = useState<Tank[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [searchValue, setSearchValue] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(
    initialPageSize && normalizedPageSizeOptions.includes(initialPageSize)
      ? initialPageSize
      : normalizedPageSizeOptions[0],
  )

  useEffect(() => {
    const abortController = new AbortController()

    const load = async () => {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const loaded = await fetchTanks(abortController.signal)
        setTanks(loaded)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setErrorMessage(getErrorMessage(error))
      } finally {
        setIsLoading(false)
      }
    }

    void load()

    return () => abortController.abort()
  }, [])

  const filteredTanks = useMemo(() => {
    const q = normalizeText(searchValue)
    if (!q) return tanks

    return tanks.filter((tank) => {
      const name = normalizeText(tank.name)
      const shortName = normalizeText(tank.short_name)
      return name.includes(q) || shortName.includes(q)
    })
  }, [searchValue, tanks])

  return (
    <section>
      <h1>Энциклопедия танков</h1>

      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <label>
          Поиск:
          <input
            aria-label="Фильтр по названию"
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.currentTarget.value)
              setPage(1)
            }}
            placeholder="Например, Lowe"
          />
        </label>

        <label>
          Танков на странице:
          <select
            aria-label="Танков на странице"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.currentTarget.value))
              setPage(1)
            }}
          >
            {normalizedPageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p>Всего: {tanks.length}</p>
      <p>Найдено: {filteredTanks.length}</p>
      <p>Текущая страница: {page}</p>

      {isLoading && <p>Загрузка данных...</p>}
      {errorMessage && <p role="alert">{errorMessage}</p>}
      {!isLoading && !errorMessage && filteredTanks.length === 0 && <p>Ничего не найдено</p>}
    </section>
  )
}