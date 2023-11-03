/* All http requests that are defined here will be intercepted in specs.
   Response data can be outsourced to a separate file if needed  */

import { http, HttpResponse } from 'msw'

export default [
  http.post('/api/login', ({ request, params, cookies }) => {
    return HttpResponse.json({"access_token": "qwertzuiop"})
  })
]