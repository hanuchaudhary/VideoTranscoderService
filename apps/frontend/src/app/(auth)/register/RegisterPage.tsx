"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { authClient } from "@/lib/authClient";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
      const { data, error } = await authClient.signUp.email(
        {
          email: values.email,
          password: values.password,
          name: values.name,
        },
        {
          onRequest: (ctx) => {
            toast.loading("Creating account...");
          },
          onSuccess: (ctx) => {
            toast.dismiss();
            toast.success("Account created successfully! Redirecting to dashboard...");
            router.push("/dashboard")
          },
          onError: (ctx) => {
            toast.dismiss();
            toast.error(
              ctx.error.code === "USER_ALREADY_EXISTS"
                ? "Email already registered. Please sign in."
                : ctx.error.message || "Failed to create account."
            );
          },
        }
      );
    } catch (error: any) {
      toast.error("Error creating account. Please try again.", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-[calc(100vh)] relative z-20 flex font-mono items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center space-y-4 mb-8">
          <Logo height={15} width={15} />
          <h2 className="md:text-2xl text-xl font-semibold">
            Register to Get Started
          </h2>
          <div className="text-muted-foreground text-xs">
            Already have an account?{" "}
            <Link href="/signin" className="underline text-primary">
              Sign in here
            </Link>
          </div>
        </div>
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Your name"
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Your email"
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••"
                          {...field}
                          disabled={loading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing Up..." : "Sign Up"}
              </Button>
            </form>
          </Form>
          <div className="mt-8 text-center text-xs text-muted-foreground">
            You acknowledge that you have read and agree to our{" "}
            <Link href="/terms" className="underline hover:text-primary">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-primary">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
