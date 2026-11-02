export default {
  fetch(request: Request) {
    return Response.json({
      ok: true,
      shape: 'default-object-fetch',
      url: request.url,
    })
  },
}
