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

const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const { setUser, setToken } = useAuth();
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { mutate: register, isPending } = useMutation({
    mutationFn: (values: Omit<RegisterFormValues, "confirmPassword">) =>
      authService.register(values),
    onSuccess: (data) => {
      // Update auth state
      setUser(data.user);
      setToken(data.access_token);
      
      toast.success("Account created successfully!");
      router.push("/dashboard");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create account");
    },
  });

  function onSubmit(values: RegisterFormValues) {
    const { confirmPassword, ...registerData } = values;
    register(registerData);
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
                  placeholder="Create a password"
                  type="password"
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
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/70">Confirm Password</FormLabel>
              <FormControl>
                <Input
                  placeholder="Confirm your password"
                  type="password"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />
        <div className="space-y-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating account..." : "Create Account"}
          </Button>
          <div className="text-center text-sm">
            <span className="text-white/50">Already have an account? </span>
            <Link href="/auth/login" className="text-white hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </form>
    </Form>
  );
} 