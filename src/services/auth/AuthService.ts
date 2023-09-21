import ApiService from '@/services/ApiService'

const params = new URLSearchParams()
params.append('client_id', 'schulportal')
params.append('grant_type', 'password')

export function getToken(userName, password) {
  params.append('password', password)
  params.append('username', userName)
    return ApiService().post('realms/schulportal/protocol/openid-connect/token', params)
  }