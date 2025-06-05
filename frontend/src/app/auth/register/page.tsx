"use client";

import { AuthCard } from "@/components/ui/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create an account"
      subtitle="Enter your details to create your secure vault"
    >
      <RegisterForm />
    </AuthCard>
  );
} 