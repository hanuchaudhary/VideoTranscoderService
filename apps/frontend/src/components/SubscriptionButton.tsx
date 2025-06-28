"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { BACKEND_URL } from "@/config";
import { toast } from "sonner";

export const subscriptionSchema = z.object({
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  street: z.string().min(1, "Street is required"),
  zipcode: z.string().min(1, "Zipcode is required"),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

export function SubscriptionDialog({
  index,
  planText,
}: {
  index: number;
  planText: string;
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      city: "",
      country: "",
      state: "",
      street: "",
      zipcode: "",
    },
  });

  const onSubmit = async (data: SubscriptionFormData) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/v1/payment/create-subscription`,
        data,
        {
          withCredentials: true,
        }
      );

      if (response.data.error) {
        console.error("Error creating subscription:", response.data.error);
        toast.error("Failed to create subscription. Please try again later.");
        setIsSubmitting(false);
        return;
      }

      const { subscriptionId, paymentLink } = response.data;
      window.location.href = paymentLink;
      console.log("Subscription created with ID:", subscriptionId);

      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {index === 1 ? (
        <DialogTrigger
          className={`mt-auto py-5 border-t w-full font-semibold gap-4 flex items-center cursor-pointer justify-center leading-none bg-blue-600 hover:bg-blue-500 text-white`}
        >
          {planText}
        </DialogTrigger>
      ) : (
        <button
          className={`mt-auto py-5 border-t w-full font-semibold gap-4 flex items-center cursor-pointer justify-center leading-none hover:bg-secondary/30`}
        >
          {planText}
        </button>
      )}
      <DialogContent className="sm:max-w-[555px] font-mono p-0 rounded-none">
        <DialogHeader className="px-6 pt-14 pb-5">
          <h2 className="text-2xl bg-gradient-to-b from-orange-500 to-orange-400 bg-clip-text text-transparent font-semibold mb-2">
            $4.99/month{" "}
            <span className="text-sm text-muted-foreground">
              (billed monthly)
            </span>
          </h2>

          <DialogTitle className="md:text-xl">Subscription Details</DialogTitle>
          <DialogDescription>
            Please enter your billing details.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="p-6 space-y-6">
              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main Street" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem className="">
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="NY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="United States" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="zipcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zip Code</FormLabel>
                      <FormControl>
                        <Input placeholder="10001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <DialogFooter className="w-full border-t grid grid-cols-2 gap-0">
              <button
                className={`py-5 w-full font-semibold leading-none hover:bg-secondary/30 border-r cursor-pointer`}
                type="button"
                onClick={() => {
                  setOpen(false);
                  form.reset();
                }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`w-full font-semibold leading-none bg-blue-600 hover:bg-blue-500 text-white cursor-pointer`}
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting ? "Subscribing..." : "Subscribe"}
              </button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
