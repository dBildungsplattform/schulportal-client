import ApiService from '@/services/ApiService'

const params = new URLSearchParams()
params.append('password', 'test')
params.append('username', 'test')
params.append('client_id', 'schulportal')
params.append('grant_type', 'password')

export function getToken() {
    return ApiService().post('realms/schulportal/protocol/openid-connect/token', params)
  }