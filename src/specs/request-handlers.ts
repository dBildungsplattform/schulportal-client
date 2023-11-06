/* All http requests that are defined here will be intercepted in specs.
   Response data can be outsourced to a separate file if needed  */
import { http, HttpResponse } from 'msw'



export default [
  http.post('/api/login', async ({ request, params, cookies }) => {
    type LoginRequestBody = {
      username: number
      password: string
    }

    const requestBody = await request.json() as LoginRequestBody

    if (!requestBody.password) {
      throw {"code": "USER_AUTHENTICATION_FAILED_ERROR"}
    }

    return HttpResponse.json({"access_token": "qwertzuiop"})
  }),

  http.patch('/api/person/:id/password', ({ request, params, cookies }) => {
    return HttpResponse.text("qwertzuiop")
  })
]