import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { MessageCircle, Store, Package, User, Loader2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Show warning if supabase is not available
if (!supabase) {
  console.warn('Supabase client is not available. Request submission will be disabled.');
}

const formSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  whatsapp: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"),
  customerAddress: z.string().optional(),
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  storeLocation: z.string().min(5, "Location must be at least 5 characters"),
  productDetails: z.string().min(10, "Product details must be at least 10 characters"),
  assetType: z.enum(["goods", "vehicle", "property", "documents"], {
    required_error: "Please select what you want inspected",
  }),
  deliveryNotes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const generateTrackingId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomStr = Math.random().toString(36).substring(2, 11).toUpperCase();
  return `STZ-${timestamp}-${randomStr}`;
};

export const InspectionRequestForm = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [assetType, setAssetType] = useState<"goods" | "vehicle" | "property" | "documents">("goods");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assetType: "goods",
    },
  });

  const onSubmit = async (data: FormData) => {
    // Skip if supabase is not available
    if (!supabase) {
      console.warn('Supabase client not available, skipping submission');
      toast({
        title: "Error",
        description: "Request submission is not available at the moment",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const trackingId = generateTrackingId();
      console.log('Generated tracking ID:', trackingId);
      
      const insertData = {
        customer_name: data.customerName,
        whatsapp: data.whatsapp,
        customer_address: data.customerAddress || null,
        store_name: data.storeName,
        store_location: data.storeLocation,
        product_details: data.productDetails,
        service_tier: data.assetType,
        service_fee: null, // No fee for landing page form
        delivery_notes: data.deliveryNotes || null,
        tracking_id: trackingId,
        user_id: user?.id || null,
      };
      console.log('Insert data:', insertData);

      console.log('About to call supabase insert');
      // Add a timeout to prevent hanging
      const insertPromise = supabase
        .from('inspection_requests')
        .insert(insertData)
        .select();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Insert operation timed out')), 10000)
      );
      
      try {
        const insertResult = await Promise.race([insertPromise, timeoutPromise]) as any;
        console.log('Supabase insert completed, result:', insertResult);

        if (insertResult.error) {
          console.error('Supabase error:', insertResult.error);
          throw insertResult.error;
        }
      } catch (insertError) {
        console.error('Error during Supabase insert:', insertError);
        throw insertError;
      }

      console.log('Request submitted successfully');
      // Set tracking ID and show modal
      setTrackingId(trackingId);
      setShowTrackingModal(true);
      

      
      // Reset form
      reset();
    } catch (error: any) {
      console.error('Error submitting request:', error);
      toast({
        title: "Error",
        description: `Failed to submit request: ${error.message || 'Please try again.'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pre-fill form with user profile data if logged in
  useEffect(() => {
    if (profile) {
      setValue("customerName", profile.full_name || "");
      setValue("whatsapp", profile.phone || "");
      setValue("customerAddress", profile.address || "");
    }
  }, [profile, setValue]);

  return (
    <section id="request" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Request an Inspection
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {user 
              ? "Submit your inspection request - it will be saved to your account"
              : "Fill out the form below and we'll assign a local agent to verify your purchase"
            }
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto"
        >
          <Card variant="elevated" className="shadow-card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                {user ? "Your Inspection Request" : "Guest Inspection Request"}
              </CardTitle>
              <CardDescription>
                {user 
                  ? `Logged in as ${profile?.full_name || user.email}. Request will be tracked.`
                  : "No account needed. We'll contact you via WhatsApp."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Your Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerName">Full Name</Label>
                      <Input
                        id="customerName"
                        placeholder="John Doe"
                        {...register("customerName")}
                      />
                      {errors.customerName && (
                        <p className="text-sm text-red-600">{errors.customerName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp Number</Label>
                      <Input
                        id="whatsapp"
                        placeholder="+265 999 123 456"
                        {...register("whatsapp")}
                      />
                      {errors.whatsapp && (
                        <p className="text-sm text-red-600">{errors.whatsapp.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerAddress">Delivery Address (Optional)</Label>
                    <Input
                      id="customerAddress"
                      placeholder="House number, street, city"
                      {...register("customerAddress")}
                    />
                  </div>
                </div>

                {/* Store Information */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Store className="w-4 h-4 text-primary" />
                    Store Information
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input
                      id="storeName"
                      placeholder="e.g., Samsung Store, Hi-Fi Centre"
                      {...register("storeName")}
                    />
                    {errors.storeName && (
                      <p className="text-sm text-red-600">{errors.storeName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeLocation">Store Location</Label>
                    <Input
                      id="storeLocation"
                      placeholder="City, Area, Landmark"
                      {...register("storeLocation")}
                    />
                    {errors.storeLocation && (
                      <p className="text-sm text-red-600">{errors.storeLocation.message}</p>
                    )}
                  </div>
                </div>

                {/* Product Details */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    Product Details
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="productDetails">Product Description</Label>
                    <Textarea
                      id="productDetails"
                      placeholder="Describe the product, including model, color, specifications, expected price, etc."
                      className="min-h-[100px]"
                      {...register("productDetails")}
                    />
                    {errors.productDetails && (
                      <p className="text-sm text-red-600">{errors.productDetails.message}</p>
                    )}
                  </div>
                </div>

                {/* Asset Type Selection */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="font-semibold text-foreground">What do you want inspected?</h3>
                  <RadioGroup
                    value={assetType}
                    onValueChange={(value) => {
                      setValue("assetType", value as any);
                      setAssetType(value as any);
                    }}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="goods" id="goods" className="peer" />
                      <Label htmlFor="goods" className="flex-1 cursor-pointer peer-checked:text-primary">
                        <div>
                          <p className="font-medium">Goods & Items</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Electronics, furniture, machinery, or any valuable items
                          </p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="vehicle" id="vehicle" className="peer" />
                      <Label htmlFor="vehicle" className="flex-1 cursor-pointer peer-checked:text-primary">
                        <div>
                          <p className="font-medium">Vehicles & Machinery</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Cars, trucks, motorcycles, or industrial equipment
                          </p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="property" id="property" className="peer" />
                      <Label htmlFor="property" className="flex-1 cursor-pointer peer-checked:text-primary">
                        <div>
                          <p className="font-medium">Land & Property</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Real estate, buildings, or land parcels
                          </p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="documents" id="documents" className="peer" />
                      <Label htmlFor="documents" className="flex-1 cursor-pointer peer-checked:text-primary">
                        <div>
                          <p className="font-medium">Documents & Ownership Papers</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Certificates, contracts, or legal documents
                          </p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                  {errors.assetType && (
                    <p className="text-sm text-red-600">{errors.assetType.message}</p>
                  )}
                </div>

                {/* Delivery Notes */}
                <div className="space-y-2">
                  <Label htmlFor="deliveryNotes">Delivery Notes (Optional)</Label>
                  <Textarea
                    id="deliveryNotes"
                    placeholder="Any special delivery instructions..."
                    {...register("deliveryNotes")}
                  />
                </div>



                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Submit Inspection Request
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tracking ID Modal */}
      <Dialog open={showTrackingModal} onOpenChange={setShowTrackingModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              Request Submitted Successfully!
            </DialogTitle>
            <DialogDescription>
              Your inspection request has been received. Please save your tracking ID for future reference.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg w-full">
              <p className="text-sm text-muted-foreground mb-1">Tracking ID</p>
              <p className="font-mono text-lg font-bold break-all">{trackingId}</p>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              You can use this ID to track the status of your request on our tracking page.
            </p>
            <Button 
              onClick={() => {
                navigator.clipboard.writeText(trackingId);
                toast({
                  title: "Copied!",
                  description: "Tracking ID copied to clipboard",
                });
              }}
              variant="outline"
              className="w-full"
            >
              Copy Tracking ID
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};
