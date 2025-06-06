"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { setUser, setToken } = useAuth();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutate: login, isPending } = useMutation({
    mutationFn: (values: LoginFormValues) => authService.login(values),
    onSuccess: (data) => {
      // Update auth state
      setUser(data.user);
      setToken(data.access_token);
      
      toast.success("Welcome back!");
      router.push("/dashboard");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to login");
    },
  });

  function onSubmit(values: LoginFormValues) {
    login(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your email"
                  type="email"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Password</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your password"
                  type="password"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isPending}
        >
          {isPending ? "Signing in..." : "Sign in"}
        </Button>
        <div className="text-center text-sm">
          <span className="text-white/50">Don't have an account? </span>
          <Link href="/auth/register" className="text-white hover:underline">
            Register
          </Link>
        </div>
      </form>
    </Form>
  );
} 