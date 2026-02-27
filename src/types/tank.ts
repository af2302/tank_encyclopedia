export interface TankImages {
    small_icon: string;
}

export interface Tank {
    tank_id: number;
    name: string;
    short_name: string;
    tier: number;
    type: string;
    nation: string;
    is_premium: boolean;
    is_gift: boolean;
    images: TankImages;
}

export interface TanksApiError {
    code: string;
    message: string;
}

export interface TankApiResponse {
    status: 'ok' | 'error';
    data: Record<string, Tank>;
    error?: TanksApiError;
}