export type SigninResponse = {
  access_token: string
  user: {
    id: string
    name: string
    email: string
    role?: { id: string; name: string; permissions: string[] }
  }
}

export type SignupPayload = { name: string; email: string; password: string }
export type SigninPayload = { email: string; password: string }

