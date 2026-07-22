export type User = {
  id: number
  name: string
  email: string
}

export type AuthResponse = {
  token: string
  user: User
}
