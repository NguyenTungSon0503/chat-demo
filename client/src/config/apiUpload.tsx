import axios from "axios";
import Cookies from "js-cookie";
import { Navigate } from "react-router-dom";
import { StatusCodes } from "http-status-codes";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const apiUpload = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: false,
});

apiUpload.interceptors.request.use((config) => {
  const token = Cookies.get("accessToken");
  config.headers.Authorization = "Bearer " + token;
  config.headers.ContentType = "multipart/form-data";
  return config;
});

apiUpload.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error?.response?.status === StatusCodes.UNAUTHORIZED) {
      Cookies.remove("accessToken");
      Cookies.remove("role_list");
      return <Navigate to="/login" />;
    }
    if (error?.response?.status === StatusCodes.NOT_FOUND) {
      // Router.push(APP_ROUTES.PAGE_404);
    }
    return Promise.reject(error?.response || error);
  }
);

export { apiUpload };
