import { ThemeProvider } from "@/components/Theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Spinner } from "@/components/ui/spinner-with-text";
import routes from "@/routes";
import ProtectedRoute from "@/routes/ProtectedRouter";
import { Suspense } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

function App() {
  // write code to fetch
  return (
    <ThemeProvider storageKey="vite-ui-theme">
      <Toaster position="top-center" />
      <Router>
        <Suspense
          fallback={
            <div className="h-screen flex items-center justify-center">
              <Spinner>
                <span>Loading...</span>
              </Spinner>
            </div>
          }
        >
          <Routes>
            {routes.map(({ element, path, title, ...rest }) => {
              if (path === "/login") return <Route element={element} key={path} path={path} {...rest} />;
              else
                return (
                  <Route
                    key={path}
                    element={
                      <div>
                        {/* <Header /> */}
                        <ProtectedRoute children={element} title={title} />
                      </div>
                    }
                    path={path}
                    {...rest}
                  />
                );
            })}
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
}

export default App;
