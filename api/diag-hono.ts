import { app } from './app.ts'

export default function handler(request: Request) {
  return app.fetch(request)
}

export const fetch = handler
