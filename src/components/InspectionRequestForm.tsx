import { useState } from "react";
import { motion } from "framer-motion";
import { Send, User, MapPin, Store, Package, Phone, MessageCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

export function InspectionRequestForm() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    customerName: "",
    whatsapp: "",
    customerAddress: "",
    storeName: "",
    storeLocation: "",
    productDetails: "",
    serviceTier: "inspection",
    deliveryNotes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Request Submitted!",
      description: "We'll connect you with a local agent shortly.",
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const serviceFees: Record<string, string> = {
    inspection: "$25",
    "inspection-payment": "$40",
    "full-service": "$60+",
  };

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
            Fill out the form below and we'll assign a local agent to verify your purchase
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
                Guest Inspection Request
              </CardTitle>
              <CardDescription>
                No account needed. We'll contact you via WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
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
                        value={formData.customerName}
                        onChange={(e) => handleChange("customerName", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="whatsapp"
                          placeholder="+234 800 000 0000"
                          className="pl-10"
                          value={formData.whatsapp}
                          onChange={(e) => handleChange("whatsapp", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerAddress">Your Address (for delivery)</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Textarea
                        id="customerAddress"
                        placeholder="Enter your full delivery address"
                        className="pl-10 min-h-[80px]"
                        value={formData.customerAddress}
                        onChange={(e) => handleChange("customerAddress", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Seller Information */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Store className="w-4 h-4 text-primary" />
                    Seller Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="storeName">Store/Seller Name</Label>
                      <Input
                        id="storeName"
                        placeholder="TechStore Lagos"
                        value={formData.storeName}
                        onChange={(e) => handleChange("storeName", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="storeLocation">Store Location</Label>
                      <Input
                        id="storeLocation"
                        placeholder="Victoria Island, Lagos"
                        value={formData.storeLocation}
                        onChange={(e) => handleChange("storeLocation", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Product Details */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    Product Details
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="productDetails">What are you buying?</Label>
                    <Textarea
                      id="productDetails"
                      placeholder="Describe the product, including model, color, specifications, expected price, etc."
                      className="min-h-[100px]"
                      value={formData.productDetails}
                      onChange={(e) => handleChange("productDetails", e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Service Selection */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="font-semibold text-foreground">Select Service</h3>
                  <RadioGroup
                    value={formData.serviceTier}
                    onValueChange={(value) => handleChange("serviceTier", value)}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="inspection" id="inspection" />
                      <Label htmlFor="inspection" className="flex-1 cursor-pointer">
                        <span className="font-medium text-foreground">Inspection Only</span>
                        <span className="text-muted-foreground text-sm block">
                          Verify product condition, you arrange delivery
                        </span>
                      </Label>
                      <span className="font-semibold text-primary">$25</span>
                    </div>
                    <div className="flex items-center space-x-3 p-4 rounded-xl border-2 border-secondary bg-secondary/5 cursor-pointer">
                      <RadioGroupItem value="inspection-payment" id="inspection-payment" />
                      <Label htmlFor="inspection-payment" className="flex-1 cursor-pointer">
                        <span className="font-medium text-foreground">Inspection + Payment</span>
                        <span className="text-muted-foreground text-sm block">
                          Verify and pay seller on your behalf
                        </span>
                      </Label>
                      <span className="font-semibold text-secondary">$40</span>
                    </div>
                    <div className="flex items-center space-x-3 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors cursor-pointer">
                      <RadioGroupItem value="full-service" id="full-service" />
                      <Label htmlFor="full-service" className="flex-1 cursor-pointer">
                        <span className="font-medium text-foreground">Full Service</span>
                        <span className="text-muted-foreground text-sm block">
                          Verify, pay, and deliver to you
                        </span>
                      </Label>
                      <span className="font-semibold text-primary">$60+</span>
                    </div>
                  </RadioGroup>
                </div>

                {/* Delivery Notes (shown for full service) */}
                {formData.serviceTier === "full-service" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-2"
                  >
                    <Label htmlFor="deliveryNotes">Delivery Preferences</Label>
                    <Textarea
                      id="deliveryNotes"
                      placeholder="Shipping method preference, urgency, packaging requirements..."
                      value={formData.deliveryNotes}
                      onChange={(e) => handleChange("deliveryNotes", e.target.value)}
                    />
                  </motion.div>
                )}

                {/* Total & Submit */}
                <div className="pt-6 border-t border-border">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-muted-foreground">Service Fee</span>
                    <span className="text-2xl font-bold text-foreground">
                      {serviceFees[formData.serviceTier]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    * Service fees are non-refundable. Additional charges may apply for delivery and special requirements.
                  </p>
                  <Button type="submit" size="xl" className="w-full group">
                    Submit Request
                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
