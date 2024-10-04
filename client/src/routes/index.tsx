import { Chat, Login } from "@/pages/LazyComponents";

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
];

export default routes;
