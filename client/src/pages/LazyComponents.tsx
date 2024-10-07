import { lazy } from "react";

export const Chat = lazy(() => import("./Chat"));
export const Login = lazy(() => import("./Login"));

export const TestChat = lazy(() => import("../components/v0dev/chat-app"));
