import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchTanks } from '../../api/tanksApi'
import type { Tank } from '../../types/tank'
import { normalizeText } from '../../utils/normalizeText'
import './TankTable.scss'

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50]

export interface TankTableProps {
  pageSizeOptions?: number[]
  initialPageSize?: number
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Не удалось загрузить список танков'
}

function normalizePageSizeOptions(pageSizeOptions: number[]): number[] {
  const uniq = Array.from(new Set(pageSizeOptions.filter((value) => value > 0)))
  return uniq.length > 0 ? uniq.sort((a, b) => a - b) : DEFAULT_PAGE_SIZE_OPTIONS
}

function toSecureImageUrl(imageUrl: string): string {
  return imageUrl.replace(/^http:\/\//, 'https://')
}

export default function TankTable({
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  initialPageSize,
}: TankTableProps) {
  const normalizedPageSizeOptions = useMemo(
    () => normalizePageSizeOptions(pageSizeOptions),
    [pageSizeOptions],
  )

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
    if (!normalizedPageSizeOptions.includes(pageSize)) {
      setPageSize(normalizedPageSizeOptions[0])
      setPage(1)
    }
  }, [normalizedPageSizeOptions, pageSize])

  const loadTanks = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const loaded = await fetchTanks(signal)
      setTanks(loaded)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void loadTanks(controller.signal)
    return () => controller.abort()
  }, [loadTanks])

  const filteredTanks = useMemo(() => {
    const q = normalizeText(searchValue)
    if (!q) return tanks

    return tanks.filter((tank) => {
      const name = normalizeText(tank.name)
      const shortName = normalizeText(tank.short_name)
      return name.includes(q) || shortName.includes(q)
    })
  }, [searchValue, tanks])

  const totalPages = Math.max(1, Math.ceil(filteredTanks.length / pageSize))

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const pagedTanks = useMemo(() => {
    const from = (page - 1) * pageSize
    return filteredTanks.slice(from, from + pageSize)
  }, [filteredTanks, page, pageSize])

  return (
    <section className="tank-table" aria-labelledby="tank-table-title">
      <header className="tank-table__header">
        <div>
          <h1 id="tank-table-title" className="tank-table__title">
            Энциклопедия танков
          </h1>
          <p className="tank-table__subtitle">Официальный список техники из Tanki API</p>
        </div>

        <div className="tank-table__stats">
          <span>Всего: {tanks.length}</span>
          <span>Найдено: {filteredTanks.length}</span>
        </div>
      </header>

      <div className="tank-table__controls">
        <label className="tank-table__control">
          <span className="tank-table__label">Поиск по названию</span>
          <input
            className="tank-table__input"
            aria-label="Фильтр по названию"
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.currentTarget.value)
              setPage(1)
            }}
            placeholder="Например, Lowe"
          />
        </label>

        <label className="tank-table__control tank-table__control--small">
          <span className="tank-table__label">Танков на странице</span>
          <select
            className="tank-table__select"
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

      {errorMessage && (
        <div className="tank-table__message tank-table__message--error" role="alert">
          <p>{errorMessage}</p>
          <button className="tank-table__retry" onClick={() => void loadTanks()}>
            Повторить загрузку
          </button>
        </div>
      )}

      {!errorMessage && isLoading && <div className="tank-table__message">Загрузка данных...</div>}

      {!errorMessage && !isLoading && filteredTanks.length === 0 && (
        <div className="tank-table__message">Танки с таким названием не найдены.</div>
      )}

      {!errorMessage && !isLoading && filteredTanks.length > 0 && (
        <>
          <div className="tank-table__table-wrapper">
            <table className="tank-table__table">
              <thead>
                <tr>
                  <th>Иконка</th>
                  <th>Название</th>
                  <th>Нация</th>
                  <th>Тип</th>
                  <th>Уровень</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {pagedTanks.map((tank) => (
                  <tr key={tank.tank_id}>
                    <td>
                      <img
                        className="tank-table__icon"
                        src={toSecureImageUrl(tank.images.small_icon)}
                        alt={tank.name}
                        loading="lazy"
                      />
                    </td>
                    <td>
                      <span className="tank-table__name">{tank.name}</span>
                      <span className="tank-table__short-name">{tank.short_name}</span>
                    </td>
                    <td>{tank.nation}</td>
                    <td>{tank.type}</td>
                    <td>{tank.tier}</td>
                    <td>
                      {tank.is_premium || tank.is_gift ? (
                        <span className="tank-table__badge">Премиум</span>
                      ) : (
                        <span className="tank-table__badge tank-table__badge--neutral">Обычный</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav className="tank-table__pagination" aria-label="Пагинация">
            <button
              className="tank-table__pagination-button"
              type="button"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              В начало
            </button>

            <button
              className="tank-table__pagination-button"
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              Предыдущая страница
            </button>

            <span className="tank-table__pagination-info">
              Страница {page} из {totalPages}
            </span>

            <button
              className="tank-table__pagination-button"
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
            >
              Следующая страница
            </button>

            <button
              className="tank-table__pagination-button"
              type="button"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            >
              В конец
            </button>
          </nav>
        </>
      )}
    </section>
  )
}