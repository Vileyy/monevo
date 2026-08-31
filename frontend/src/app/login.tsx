import React from "react";
import { AuthScreen } from "@/features/auth/components/AuthScreen";

export default function LoginRoute() {
  return <AuthScreen initialMethod="account" initialAccountMode="login" />;
}
