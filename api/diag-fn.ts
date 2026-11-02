export default function handler(request: Request) {
  return Response.json({
    ok: true,
    shape: 'default-function',
    url: request.url,
  })
}
