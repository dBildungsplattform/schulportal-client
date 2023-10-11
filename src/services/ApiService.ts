/* this is used as a base class for all API based services */
import axios from 'axios'

// KEEP COMMENTS FOR REFRESH LOGIC

// const token = localStorage.getItem('access_token')

// axios.interceptors.response.use((response) => response, async (error) => {
//   if (error.response.status === 401) {
//     const { status, data } = await axios.post('refresh', {}, {})

//     if (status === 200) {
//       axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`

//       return axios(error.config)
//     }
//   }
  
//   return error
// })

export default () => axios.create({
  baseURL: '/api',
  withCredentials: false,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    // Authorization: `Bearer ${token}`
  }
})