import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.56.20/api"
});

export default api;
