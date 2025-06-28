"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Crown, Calendar, Mail, User, Loader2 } from "lucide-react";
import { Signout } from "@/components/Dashboard/Signout";
import { authClient } from "@/lib/authClient";

export default function ProfilePage() {
  const { data } = authClient.useSession();

  const [plan] = useState({
    name: "Pro",
    status: "Active",
    billingCycle: "Monthly",
    nextBilling: "Dec 28, 2024",
    price: "$20/month",
  });

  if (!data?.user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
      </div>
    );
  }

  return (
    <div className="p-6 font-mono">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card>
          <CardContent className="relative space-y-6">
            <div className="absolute top-10 right-4">
              <Signout />
            </div>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={data.user.image || "/avatar.jpeg"}
                  alt={data.user.name}
                />
                <AvatarFallback className="text-lg font-medium">
                  {data.user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="text-lg font-medium">{data.user.name}</h3>
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Mail className="h-4 w-4" />
                  {data.user.email}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Plan Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Crown className="h-5 w-5" />
              Current Plan
            </CardTitle>
            <CardDescription>
              Manage your subscription and billing details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium">{plan.name}</h3>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800"
                  >
                    {plan.status}
                  </Badge>
                </div>
                <p className="text-sm text-neutral-600">{plan.price}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{plan.billingCycle}</p>
                <p className="text-xs text-neutral-500">Billing cycle</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Calendar className="h-4 w-4" />
              <span>Next billing date: {plan.nextBilling}</span>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm">
                Change Plan
              </Button>
              <Button variant="outline" size="sm">
                Billing History
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
