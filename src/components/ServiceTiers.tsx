import { motion } from "framer-motion";
import { Search, CreditCard, Truck, Check, Star, Package, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const assetTypes = [
  {
    id: "goods",
    name: "Goods & Items",
    description: "Electronics, furniture, machinery, or any valuable items",
    icon: Package,
    featured: false,
    features: [
      "On-site inspection and verification",
      "Photos & video evidence",
      "Condition and authenticity checks",
      "Detailed inspection reports",
      "Same-day service available",
    ],
    cta: "Request Inspection",
  },
  {
    id: "vehicle",
    name: "Vehicles & Machinery",
    description: "Cars, trucks, motorcycles, or industrial equipment",
    icon: Truck,
    featured: false,
    features: [
      "Physical condition assessment",
      "Engine & body verification",
      "Ownership document checks",
      "Visual proof (photos & videos)",
      "Authenticity verification",
    ],
    cta: "Inspect Vehicle",
  },
  {
    id: "property",
    name: "Land & Property",
    description: "Real estate, buildings, or land parcels",
    icon: Search,
    featured: true,
    badge: "Most Popular",
    features: [
      "Physical property visit",
      "Boundary & location verification",
      "Occupancy & usage status",
      "Photo, video & geo-location proof",
      "Document verification",
    ],
    cta: "Inspect Property",
  },
  {
    id: "documents",
    name: "Documents & Ownership Papers",
    description: "Certificates, contracts, or legal documents",
    icon: FileText,
    featured: false,
    features: [
      "Document authenticity verification",
      "Content validation",
      "Secure custody options",
      "Digital copies & records",
      "Legal document handling",
    ],
    cta: "Verify Documents",
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
            What We Inspect
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stazama inspects anything of value. From small electronics to large machinery, land, and documents - we ensure you get exactly what you pay for.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {assetTypes.map((tier, index) => (
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
