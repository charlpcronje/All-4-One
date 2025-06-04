import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle } from "lucide-react";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // This would be replaced with actual password reset logic
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1000);
  }

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md p-4 sm:p-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Invalid Link</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="border-destructive/50 bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <AlertDescription className="ml-2">
                  This password reset link is invalid or has expired.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter>
              <Link to="/auth/forgot-password" className="w-full">
                <Button className="w-full">Request New Link</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md p-4 sm:p-8">
        <div className="flex flex-col text-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">DCR Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Dynamic Configuration & Request Orchestrator
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {!isSubmitted ? "Create New Password" : "Password Reset"}
            </CardTitle>
            <CardDescription className="text-center">
              {!isSubmitted
                ? "Enter your new password below"
                : "Your password has been reset successfully"}
            </CardDescription>
          </CardHeader>
          {!isSubmitted ? (
            <form onSubmit={onSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert className="border-destructive/50 bg-destructive/10">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <AlertDescription className="ml-2">{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col">
                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="space-y-4">
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <AlertDescription className="ml-2">
                  Your password has been reset successfully.
                </AlertDescription>
              </Alert>
              <Link to="/auth/login" className="w-full">
                <Button className="w-full">Back to Login</Button>
              </Link>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
