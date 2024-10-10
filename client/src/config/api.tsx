import axios from "axios";
import Cookies from "js-cookie";
import { StatusCodes } from "http-status-codes";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const api = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("accessToken");
  config.headers.Authorization = "Bearer " + token;
  return config;
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async function (error) {
    const originalRequest = error.config;
    if (error?.response?.status === StatusCodes.UNAUTHORIZED || error?.response?.status === StatusCodes.FORBIDDEN) {
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const newToken = await renewAccessToken();
          originalRequest.headers.Authorization = "Bearer " + newToken;
          return api(originalRequest);
        } catch (error) {
          console.log(error);
        }
      }
    }
    return Promise.reject(error?.response || error);
  }
);

const renewAccessToken = async () => {
  const response = await loginApi.get("/auth/refresh-token");
  Cookies.remove("accessToken");
  // Cookies.remove("role_list");
  Cookies.set("accessToken", response.data.accessToken);
  // Cookies.set("role_list", JSON.stringify(response.data.roles));
  return response.data.accessToken;
};

const loginApi = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
});

loginApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error?.response || error);
  }
);

export { api, loginApi };
