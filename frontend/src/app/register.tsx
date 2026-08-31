import React from "react";
import { AuthScreen } from "@/features/auth/components/AuthScreen";

export default function RegisterRoute() {
  return <AuthScreen initialMethod="account" initialAccountMode="register" />;
}
