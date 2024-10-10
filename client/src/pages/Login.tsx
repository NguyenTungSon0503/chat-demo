import logo from "@/assets/logo/logo.png";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { api } from "@/config/api";
import { zodResolver } from "@hookform/resolvers/zod";
import Cookies from "js-cookie";
import { SubmitHandler, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

const loginFormSchema = z.object({
  email: z.string({ required_error: "email is required" }),
  password: z.string(),
});

export default function Login() {
  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      // Your default values here
    },
  });

  const navigate = useNavigate();

  const { errors } = form.formState;

  const onSubmit: SubmitHandler<z.infer<typeof loginFormSchema>> = async (data) => {
    try {
      const response = await api.post("auth/login", data);

      if (response.status === 200) {
        navigate("/");
        Cookies.set("accessToken", response.data.accessToken);
        Cookies.set("userId", response.data.id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // const handleLoginWithAzure = () => {
  //   window.location.href = "http://localhost:5000/saml/login";
  // };

  return (
    <div>
      <div className="flex justify-center items-center min-h-screen w-full">
        <div className="mx-auto max-w-sm space-y-4 p-8 bg-white border text-black rounded-3xl">
          <div className="flex items-center justify-center space-y-2 text-center">
            <img src={logo} alt="Logo" width={150} height={100} />
          </div>
          <div className="space-y-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>email</FormLabel>
                      <FormControl>
                        <Input id="email-sign-up" placeholder="m@example.com" {...field} />
                      </FormControl>
                      {errors.email && <FormMessage>{errors.email.message}</FormMessage>}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <PasswordInput placeholder="**********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button className="w-full" type="submit">
                  Sign In
                </Button>
              </form>
            </Form>
            {/* <Button
              variant="myButton"
              className="w-full"
              onClick={handleLoginWithAzure}
            >
              Sign in with Azure
            </Button> */}
          </div>
        </div>
      </div>
    </div>
  );
}
