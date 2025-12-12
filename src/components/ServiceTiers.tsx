import { motion } from "framer-motion";
import { Search, CreditCard, Truck, Check, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const tiers = [
  {
    id: "inspection",
    name: "Inspection Only",
    description: "Perfect when you just need verification",
    price: "MWK 7,000",
    icon: Search,
    featured: false,
    features: [
      "Product condition verification",
      "Authenticity check",
      "Detailed photo report",
      "Agent-customer chat",
      "Same-day inspection",
    ],
    cta: "Choose Plan",
  },
  {
    id: "inspection-payment",
    name: "Inspection + Payment",
    description: "Most popular for remote buyers",
    price: "MWK 10,000",
    icon: CreditCard,
    featured: true,
    badge: "Most Popular",
    features: [
      "Everything in Inspection Only",
      "Secure payment to seller",
      "Transaction protection",
      "Payment confirmation",
      "Priority support",
    ],
    cta: "Choose Plan",
  },
  {
    id: "full-service",
    name: "Full Service",
    description: "Complete end-to-end solution",
    price: "MWK 10,000+",
    icon: Truck,
    featured: false,
    features: [
      "Everything in Inspection + Payment",
      "Packaging & shipping",
      "Real-time tracking",
      "Delivery confirmation",
      "Insurance coverage",
    ],
    cta: "Choose Plan",
  },
];

export function ServiceTiers() {
  return (
    <section id="services" className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Choose Your Service
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Flexible options to match your needs. All services include our satisfaction guarantee.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
                className="h-full flex flex-col relative"
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
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-foreground">{tier.price}</span>
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          tier.featured ? "text-secondary" : "text-primary"
                        }`} />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button 
                    variant={tier.featured ? "secondary" : "default"}
                    className="w-full"
                    size="lg"
                  >
                    {tier.cta}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
