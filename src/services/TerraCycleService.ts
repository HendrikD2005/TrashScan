
export interface TerraCycleServiceConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  baseUrl: string
  locale: string
}

export interface TokenResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  refreshToken: string
  scope: string
}

export class TerraCycleService {

}
