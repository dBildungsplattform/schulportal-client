/* this is used as a base class for all API based services */
import axios from 'axios'

export default () => axios.create({
  baseURL: 'http://localhost:8181/',
  // withCredentials: false,
  headers: {
    Accept: 'application/x-www-form-urlencoded',
    'Content-Type': 'application/x-www-form-urlencoded'
  }
})