import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Search, CreditCard, Truck, Check, Star, Shield, Clock, Users, Calculator, Zap, Award, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

const tiers = [
  {
    id: "inspection",
    name: "Inspection Only",
    description: "Perfect when you just need verification",
    price: 7000,
    originalPrice: 7000,
    icon: Search,
    featured: false,
    popular: false,
    features: [
      "Product condition verification",
      "Authenticity check with expert analysis",
      "Detailed photo report (20+ angles)",
      "Agent-customer live chat",
      "Same-day inspection guarantee",
      "Digital inspection certificate",
      "24/7 customer support",
    ],
    limitations: [
      "No payment facilitation",
      "No shipping services",
      "Basic report format"
    ],
    cta: "Choose Plan",
    bestFor: "Budget-conscious buyers who handle payments themselves"
  },
  {
    id: "inspection-payment",
    name: "Inspection + Payment",
    description: "Most popular for remote buyers",
    price: 10000,
    originalPrice: 12000,
    icon: CreditCard,
    featured: true,
    badge: "Most Popular",
    popular: true,
    features: [
      "Everything in Inspection Only",
      "Secure payment to seller (escrow service)",
      "Transaction protection guarantee",
      "Payment confirmation with receipt",
      "Priority support (2-hour response)",
      "Enhanced inspection report",
      "Payment dispute resolution",
      "Multi-currency support"
    ],
    limitations: [
      "No shipping services",
      "Local delivery only if arranged"
    ],
    cta: "Choose Plan",
    bestFor: "Remote buyers seeking maximum security"
  },
  {
    id: "full-service",
    name: "Full Service",
    description: "Complete end-to-end solution",
    price: 10000,
    originalPrice: 15000,
    icon: Truck,
    featured: false,
    popular: false,
    features: [
      "Everything in Inspection + Payment",
      "Professional packaging & shipping",
      "Real-time GPS tracking",
      "Door-to-door delivery",
      "Shipping insurance coverage",
      "Customs clearance assistance",
      "White-glove handling",
      "Delivery confirmation with photos"
    ],
    limitations: [
      "Higher minimum order value",
      "Additional shipping costs apply"
    ],
    cta: "Choose Plan",
    bestFor: "High-value purchases requiring complete logistics"
  },
];

const addons = [
  {
    name: "Rush Inspection",
    price: 2000,
    description: "Get inspection completed within 2 hours",
    icon: Zap
  },
  {
    name: "Expert Authentication",
    price: 3000,
    description: "Specialized verification for luxury items",
    icon: Award
  },
  {
    name: "Extended Warranty",
    price: 1500,
    description: "6-month product warranty coverage",
    icon: Shield
  }
];

const comparisonFeatures = [
  { feature: "Product Verification", inspection: true, payment: true, full: true },
  { feature: "Authenticity Check", inspection: true, payment: true, full: true },
  { feature: "Photo Report", inspection: "Basic (10 photos)", payment: "Enhanced (20+ photos)", full: "Premium (30+ photos)" },
  { feature: "Live Chat Support", inspection: true, payment: true, full: true },
  { feature: "Same-day Service", inspection: true, payment: true, full: true },
  { feature: "Payment Protection", inspection: false, payment: true, full: true },
  { feature: "Escrow Service", inspection: false, payment: true, full: true },
  { feature: "Priority Support", inspection: false, payment: true, full: true },
  { feature: "Packaging Service", inspection: false, payment: false, full: true },
  { feature: "Shipping & Delivery", inspection: false, payment: false, full: true },
  { feature: "Insurance Coverage", inspection: false, payment: false, full: true },
  { feature: "Customs Assistance", inspection: false, payment: false, full: true }
];

const Services = () => {
  const [selectedTier, setSelectedTier] = useState("inspection-payment");
  const [addonsSelected, setAddonsSelected] = useState<string[]>([]);

  const calculateTotal = () => {
    const basePrice = tiers.find(t => t.id === selectedTier)?.price || 0;
    const addonPrice = addons
      .filter(addon => addonsSelected.includes(addon.name))
      .reduce((sum, addon) => sum + addon.price, 0);
    return basePrice + addonPrice;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-24 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-16"
            >
              <Badge variant="secondary" className="mb-4">Our Services</Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                Choose the <span className="text-primary">Perfect Plan</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                From basic verification to complete end-to-end solutions.
                Find the service that matches your needs and budget.
              </p>
              <div className="flex flex-wrap justify-center gap-6 text-center">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="text-sm">100% Satisfaction Guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-sm">Same-day Inspections</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  <span className="text-sm">50+ Cities Covered</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Service Tiers */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Service Packages
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Choose the package that fits your needs. Upgrade or downgrade anytime.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {tiers.map((tier, index) => (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    variant={tier.featured ? "tier-featured" : "tier"}
                    className={`h-full flex flex-col relative cursor-pointer transition-all duration-300 ${
                      selectedTier === tier.id ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-lg'
                    }`}
                    onClick={() => setSelectedTier(tier.id)}
                  >
                    {tier.badge && (
                      <Badge
                        variant="featured"
                        className="absolute -top-3 left-1/2 -translate-x-1/2"
                      >
                        <Star className="w-3 h-3 mr-1" />
                        {tier.badge}
                      </Badge>
                    )}

                    <CardHeader className="text-center pt-8">
                      <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
                        tier.featured
                          ? "bg-amber-gradient shadow-amber"
                          : "bg-accent"
                      }`}>
                        <tier.icon className={`w-8 h-8 ${
                          tier.featured ? "text-secondary-foreground" : "text-primary"
                        }`} />
                      </div>
                      <CardTitle className="text-xl">{tier.name}</CardTitle>
                      <CardDescription className="mb-4">{tier.description}</CardDescription>

                      <div className="space-y-2">
                        <div className="flex items-baseline justify-center gap-2">
                          <span className="text-3xl font-bold text-foreground">
                            MWK {tier.price.toLocaleString()}
                          </span>
                          {tier.originalPrice > tier.price && (
                            <span className="text-sm text-muted-foreground line-through">
                              MWK {tier.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {tier.originalPrice > tier.price && (
                          <Badge variant="secondary" className="text-xs">
                            Save MWK {(tier.originalPrice - tier.price).toLocaleString()}
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mt-2">{tier.bestFor}</p>
                    </CardHeader>

                    <CardContent className="flex-1">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-3 text-green-700">✓ Included Features</h4>
                          <ul className="space-y-2">
                            {tier.features.map((feature) => (
                              <li key={feature} className="flex items-start gap-2">
                                <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                                  tier.featured ? "text-secondary" : "text-primary"
                                }`} />
                                <span className="text-sm text-muted-foreground">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {tier.limitations && tier.limitations.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-3 text-orange-700">⚠ Limitations</h4>
                            <ul className="space-y-2">
                              {tier.limitations.map((limitation) => (
                                <li key={limitation} className="flex items-start gap-2">
                                  <span className="text-sm text-muted-foreground">• {limitation}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter>
                      <Button
                        variant={selectedTier === tier.id ? "default" : tier.featured ? "secondary" : "outline"}
                        className="w-full"
                        size="lg"
                      >
                        {selectedTier === tier.id ? "Selected" : tier.cta}
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Add-ons Section */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Enhance Your Service
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Add premium features to customize your inspection experience
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {addons.map((addon, index) => (
                <motion.div
                  key={addon.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`cursor-pointer transition-all duration-300 ${
                    addonsSelected.includes(addon.name) ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'
                  }`} onClick={() => {
                    setAddonsSelected(prev =>
                      prev.includes(addon.name)
                        ? prev.filter(name => name !== addon.name)
                        : [...prev, addon.name]
                    );
                  }}>
                    <CardHeader className="text-center">
                      <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4 mx-auto">
                        <addon.icon className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{addon.name}</CardTitle>
                      <CardDescription>{addon.description}</CardDescription>
                      <div className="mt-4">
                        <span className="text-2xl font-bold text-primary">
                          +MWK {addon.price.toLocaleString()}
                        </span>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Price Calculator */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Price Calculator
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See exactly what you'll pay with your current selections
              </p>
            </motion.div>

            <div className="max-w-2xl mx-auto">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Your Estimate
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Base Service ({tiers.find(t => t.id === selectedTier)?.name})</span>
                    <span className="font-semibold">
                      MWK {tiers.find(t => t.id === selectedTier)?.price.toLocaleString()}
                    </span>
                  </div>

                  {addonsSelected.map(addonName => {
                    const addon = addons.find(a => a.name === addonName);
                    return (
                      <div key={addonName} className="flex justify-between items-center py-2 border-b">
                        <span>{addon?.name}</span>
                        <span className="font-semibold">
                          +MWK {addon?.price.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}

                  <div className="flex justify-between items-center py-4 border-t-2 border-primary text-lg font-bold">
                    <span>Total Estimated Cost</span>
                    <span className="text-primary">
                      MWK {calculateTotal().toLocaleString()}
                    </span>
                  </div>

                  <Button size="lg" className="w-full mt-6">
                    Proceed with {tiers.find(t => t.id === selectedTier)?.name}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Compare All Features
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Detailed comparison of all service packages
              </p>
            </motion.div>

            <div className="overflow-x-auto">
              <table className="w-full max-w-6xl mx-auto bg-card rounded-lg shadow-lg">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-6 font-semibold">Features</th>
                    <th className="text-center p-6 font-semibold">Inspection Only</th>
                    <th className="text-center p-6 font-semibold bg-primary/5">Inspection + Payment</th>
                    <th className="text-center p-6 font-semibold">Full Service</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((item, index) => (
                    <tr key={item.feature} className={`border-b ${index % 2 === 0 ? 'bg-muted/20' : ''}`}>
                      <td className="p-6 font-medium">{item.feature}</td>
                      <td className="p-6 text-center">
                        {typeof item.inspection === 'boolean' ?
                          (item.inspection ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : '—') :
                          <span className="text-sm text-muted-foreground">{item.inspection}</span>
                        }
                      </td>
                      <td className="p-6 text-center bg-primary/5">
                        {typeof item.payment === 'boolean' ?
                          (item.payment ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : '—') :
                          <span className="text-sm text-muted-foreground">{item.payment}</span>
                        }
                      </td>
                      <td className="p-6 text-center">
                        {typeof item.full === 'boolean' ?
                          (item.full ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : '—') :
                          <span className="text-sm text-muted-foreground">{item.full}</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Service Questions
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Common questions about our service packages
              </p>
            </motion.div>

            <Tabs defaultValue="pricing" className="max-w-4xl mx-auto">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="support">Support</TabsTrigger>
              </TabsList>

              <TabsContent value="pricing" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Are prices negotiable?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Base prices are fixed, but we offer volume discounts for multiple inspections and custom enterprise solutions.</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Do you accept other currencies?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Yes, we accept USD, EUR, and major African currencies. Prices shown are in MWK but we handle conversions automatically.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="services" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Can I upgrade my service mid-process?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Yes, you can upgrade from basic inspection to full service at any time before delivery. Additional costs will be prorated.</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>What if the product doesn't meet expectations?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Our satisfaction guarantee covers all services. If you're not happy, we'll refund the service fee and help resolve the issue.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="support" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>How do I contact support?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Priority customers get 2-hour response time. Standard support responds within 24 hours via chat, email, or phone.</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Do you offer training for businesses?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Yes, we provide enterprise training and API integration for businesses needing bulk inspection services.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Services;