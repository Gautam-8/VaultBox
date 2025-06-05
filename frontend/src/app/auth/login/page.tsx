"use client";

import * as React from "react";
import { AuthCard } from "@/components/ui/auth-card";
import { LoginForm } from "@/components/auth/login-form";

const LoginPage: React.FC = () => {
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Enter your email and password to access your vault"
    >
      <LoginForm />
    </AuthCard>
  );
}

export default LoginPage; 