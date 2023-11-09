/* All http requests that are defined here will be intercepted in specs.
   Response data can be outsourced to a separate file if needed  */
import { http, HttpResponse } from 'msw'

export default [
  http.patch('/api/person/:id/password', () => {
    return HttpResponse.text('qwertzuiop')
  })
]
