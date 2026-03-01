import type { TankApiResponse, Tank } from '../types/tank';

const TANK_API_ENDPOINT = 'https://api.tanki.su/wot/encyclopedia/vehicles/'
const APPLICATION_ID = '22716c2a0bff5e7fbced747f4c19b614'
const API_FIELDS = [
    'tank_id',
    'name',
    'short_name',
    'tier',
    'type',
    'nation',
    'is_premium',
    'is_gift',
    'images.small_icon',
] as const

const nameCollator = new Intl.Collator('ru-RU', { sensitivity: 'base' })

function compareTanks(a: Tank, b: Tank): number {
    if (a.tier !== b.tier) {
        return a.tier - b.tier
    }
    return nameCollator.compare(a.name, b.name)
}

export async function fetchTanks(signal?: AbortSignal): Promise<Tank[]> {
    const searchParams = new URLSearchParams({
        application_id: APPLICATION_ID,
        fields: API_FIELDS.join(','),
    })

    const response = await fetch(`${TANK_API_ENDPOINT}?${searchParams.toString()}`, { signal })

    if (!response.ok) {
        throw new Error(`Ошибка сети (${response.status})`)
    }

    const payload = await response.json() as TankApiResponse

    if (payload.status !== 'ok') {
        throw new Error(payload.error?.message ?? 'API вернул ошибку')
    }

    return Object.values(payload.data).sort(compareTanks)
}