"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthLocalStore } from "../_stores/auth-local.store";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";

export function AuthCard() {
  const { isLoginMode, toggleMode } = useAuthLocalStore();

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{isLoginMode ? "Welcome back" : "Create an account"}</CardTitle>
        <CardDescription>
          {isLoginMode
            ? "Enter your credentials to sign in to your account"
            : "Enter your details to create a new account"}
        </CardDescription>
      </CardHeader>
      <CardContent>{isLoginMode ? <LoginForm /> : <RegisterForm />}</CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          {isLoginMode ? "Don't have an account?" : "Already have an account?"}
          <Button variant="link" className="p-0 h-auto font-semibold" onClick={toggleMode}>
            {isLoginMode ? "Sign up" : "Sign in"}
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}
