import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, User, MapPin, Store, Package, Phone, MessageCircle, Loader2, Copy, Check, HelpCircle, Lightbulb, TrendingUp, Shield, Clock, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const inspectionRequestSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  whatsapp: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"),
  customerAddress: z.string().optional(),
  storeName: z.string().min(2, "Store name must be at least 2 characters").max(100, "Store name too long"),
  storeLocation: z.string().min(5, "Location must be at least 5 characters").max(200, "Location too long"),
  productDetails: z.string().min(10, "Please provide more details about the product").max(1000, "Description too long"),
  serviceTier: z.enum(["inspection", "inspection-payment", "full-service"]),
  deliveryNotes: z.string().optional(),
  paymentMethod: z.string().optional(),
});

type InspectionRequestFormData = z.infer<typeof inspectionRequestSchema>;

const RequestInspection = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<InspectionRequestFormData>({
    resolver: zodResolver(inspectionRequestSchema),
    defaultValues: {
      customerName: "",
      whatsapp: "",
      customerAddress: "",
      storeName: "",
      storeLocation: "",
      productDetails: "",
      serviceTier: "inspection",
      deliveryNotes: "",
      paymentMethod: "",
    },
  });

  const serviceTier = watch("serviceTier");

  const serviceFees: Record<string, number> = {
    inspection: 7000,
    "inspection-payment": 10000,
    "full-service": 10000,
  };

  const serviceFeeLabels: Record<string, string> = {
    inspection: "MWK 7,000",
    "inspection-payment": "MWK 10,000",
    "full-service": "MWK 10,000+",
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(trackingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onSubmit = async (data: InspectionRequestFormData) => {
    console.log('Form submission started', data);
    try {
      // Generate tracking ID for all users
      const timestamp = Date.now().toString(36).toUpperCase();
      const randomStr = Math.random().toString(36).substring(2, 11).toUpperCase();
      const trackingId = `STZ-${timestamp}-${randomStr}`;
      console.log('Generated tracking ID:', trackingId);

      const insertData = {
        user_id: user?.id || null,
        customer_name: data.customerName,
        whatsapp: data.whatsapp,
        customer_address: data.customerAddress || null,
        store_name: data.storeName,
        store_location: data.storeLocation,
        product_details: data.productDetails,
        service_tier: data.serviceTier,
        service_fee: serviceFees[data.serviceTier],
        delivery_notes: data.deliveryNotes || null,
        payment_method: data.paymentMethod || null,
        tracking_id: trackingId,
      };
      console.log('Insert data:', insertData);

      console.log('About to call supabase insert');
      // Add a timeout to prevent hanging
      const insertPromise = supabase
        .from('inspection_requests')
        .insert(insertData);
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
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Error",
        description: `Failed to submit request: ${error.message || 'Please try again.'}`,
        variant: "destructive",
      });
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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Request an Inspection
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {user
                  ? "Submit your inspection request - it will be saved to your account"
                  : "Fill out the form below and we'll assign a local agent to verify your purchase"
                }
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
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

                    {/* Service Selection */}
                    <div className="space-y-4 pt-4 border-t border-border">
                      <h3 className="font-semibold text-foreground">Select Service</h3>
                      <RadioGroup
                        value={serviceTier}
                        onValueChange={(value) => setValue("serviceTier", value as any)}
                        className="space-y-3"
                      >
                        <div className="flex items-center space-x-3 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors cursor-pointer">
                          <RadioGroupItem value="inspection" id="inspection" />
                          <Label htmlFor="inspection" className="flex-1 cursor-pointer">
                            <span className="font-medium text-foreground">Inspection Only</span>
                            <span className="text-muted-foreground text-sm block">
                              Verify authenticity only
                            </span>
                          </Label>
                          <span className="font-semibold text-primary">MWK 7,000</span>
                        </div>
                        <div className="flex items-center space-x-3 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors cursor-pointer">
                          <RadioGroupItem value="inspection-payment" id="inspection-payment" />
                          <Label htmlFor="inspection-payment" className="flex-1 cursor-pointer">
                            <span className="font-medium text-foreground">Inspection + Payment</span>
                            <span className="text-muted-foreground text-sm block">
                              Verify and pay through us (includes delivery quote)
                            </span>
                          </Label>
                          <span className="font-semibold text-primary">MWK 10,000</span>
                        </div>
                        <div className="flex items-center space-x-3 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors cursor-pointer">
                          <RadioGroupItem value="full-service" id="full-service" />
                          <Label htmlFor="full-service" className="flex-1 cursor-pointer">
                            <span className="font-medium text-foreground">Full Service</span>
                            <span className="text-muted-foreground text-sm block">
                              Verify, pay, and deliver to you (delivery quoted separately)
                            </span>
                          </Label>
                          <span className="font-semibold text-primary">MWK 10,000+</span>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Payment Method (shown for payment services) */}
                    {(serviceTier === "inspection-payment" || serviceTier === "full-service") && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-2 pt-4 border-t border-border"
                      >
                        <Label htmlFor="paymentMethod">Preferred Payment Method</Label>
                        <select
                          id="paymentMethod"
                          className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          {...register("paymentMethod")}
                        >
                          <option value="">Select payment method</option>
                          <option value="airtel_money">Airtel Money</option>
                          <option value="tnm_mpamba">TNM Mpamba</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="cash_delivery">Cash on Delivery</option>
                        </select>
                        <div className="space-y-2">
                          <Label htmlFor="deliveryNotes">Delivery Notes (Optional)</Label>
                          <Textarea
                            id="deliveryNotes"
                            placeholder="Any special delivery instructions..."
                            {...register("deliveryNotes")}
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* Total & Submit */}
                    <div className="pt-6 border-t border-border">
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-muted-foreground">Service Fee</span>
                        <span className="text-2xl font-bold text-foreground">
                          {serviceFeeLabels[serviceTier]}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4">
                        * Service fees are non-refundable. Additional charges may apply for delivery and special requirements.
                      </p>
                      <Button type="submit" size="xl" className="w-full group" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            Submit Request
                            <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </Button>
                    </div>
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
                  Your inspection request has been received. Save this tracking ID for future reference.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <code className="text-lg font-mono">{trackingId}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={copyToClipboard}
                    className="ml-2"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {user
                    ? "You can also track this request in your dashboard."
                    : "We'll contact you via WhatsApp shortly with updates."
                  }
                </p>
                <Button onClick={() => setShowTrackingModal(false)}>
                  Continue
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </section>

        {/* Tips for Better Requests */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Tips for a Successful Inspection
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Follow these guidelines to ensure your inspection request is processed quickly and accurately
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
                      <Package className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>Be Specific About the Product</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Include model number and specifications</li>
                      <li>• Mention brand and expected price range</li>
                      <li>• Describe condition (new/used)</li>
                      <li>• Note any specific concerns</li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>Provide Accurate Location</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Include street address and landmarks</li>
                      <li>• Specify the exact store location</li>
                      <li>• Mention business hours if known</li>
                      <li>• Note parking availability</li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>Choose the Right Service</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Inspection Only: Just verification needed</li>
                      <li>• Inspection + Payment: Maximum security</li>
                      <li>• Full Service: Complete end-to-end solution</li>
                      <li>• Consider your budget and needs</li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Success Stories */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Success Stories
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See how Stazama helped customers avoid costly mistakes
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">Saved MWK 150,000</Badge>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <CardTitle className="text-lg">Counterfeit Laptop Avoided</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4">
                      "I was about to buy a 'brand new' laptop for MWK 200,000. Stazama's agent discovered it was refurbished with a fake serial number. Saved me from a huge loss!"
                    </p>
                    <div className="text-xs text-muted-foreground">
                      - Maria S., Lilongwe
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">Quality Verified</Badge>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <CardTitle className="text-lg">Perfect Car Purchase</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4">
                      "Bought a used car sight unseen. The agent checked everything - engine, transmission, body work. It was exactly as described. Best MWK 10,000 I ever spent!"
                    </p>
                    <div className="text-xs text-muted-foreground">
                      - John M., Blantyre
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Get answers to common questions about requesting inspections
              </p>
            </motion.div>

            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible>
                <AccordionItem value="timing">
                  <AccordionTrigger>How long does an inspection take?</AccordionTrigger>
                  <AccordionContent>
                    Most inspections are completed within 2-4 hours during business hours. Rush inspections (1-2 hours) are available for urgent requests at an additional cost.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="cost">
                  <AccordionTrigger>Are there any hidden fees?</AccordionTrigger>
                  <AccordionContent>
                    No hidden fees. The quoted price includes the inspection service. Additional costs may apply for shipping, rush service, or specialized inspections, but these are clearly communicated upfront.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="cancel">
                  <AccordionTrigger>Can I cancel my request?</AccordionTrigger>
                  <AccordionContent>
                    You can cancel before an agent is assigned at no cost. Once an agent begins the inspection, the service fee becomes non-refundable to compensate for their time and travel.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="multiple">
                  <AccordionTrigger>Can I request multiple inspections?</AccordionTrigger>
                  <AccordionContent>
                    Yes! We offer volume discounts for multiple inspections. Contact our team for bulk pricing and dedicated account management.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="unsatisfied">
                  <AccordionTrigger>What if I'm not satisfied with the inspection?</AccordionTrigger>
                  <AccordionContent>
                    We offer a 100% satisfaction guarantee. If you're not happy with the service quality or findings, we'll either re-inspect at no cost or refund your service fee.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-4xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Ready to Protect Your Purchase?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Don't risk buying sight unseen. Get peace of mind with professional product verification.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 py-6">
                  <Send className="w-5 h-5 mr-2" />
                  Submit Your Request
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                  <HelpCircle className="w-5 h-5 mr-2" />
                  Contact Support
                </Button>
              </div>
              <div className="flex flex-wrap justify-center gap-6 mt-8 text-center">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="text-sm">100% Secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-sm">Fast Response</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span className="text-sm">Money-Back Guarantee</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default RequestInspection;