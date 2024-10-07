import { Chat, Login, TestChat } from "@/pages/LazyComponents";

const routes = [
  {
    title: "Login",
    path: "/login",
    exact: true,
    element: <Login />,
  },
  {
    title: "",
    path: "/",
    exact: true,
    element: <Chat />,
  },
  {
    title: "",
    path: "/test-chat",
    exact: true,
    element: <TestChat />,
  },
];

export default routes;
