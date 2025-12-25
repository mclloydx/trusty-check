import { motion } from "framer-motion";
import { Search, ShieldCheck, CreditCard, Truck, MessageCircle, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Request a Service",
    description: "Submit your inspection request with asset details and location",
  },
  {
    icon: ShieldCheck,
    title: "Stazama Conducts Inspection",
    description: "Our agent inspects and verifies the asset on-site",
  },
  {
    icon: CheckCircle,
    title: "Receive Proof",
    description: "Get photos, videos, and detailed inspection reports",
  },
  {
    icon: CreditCard,
    title: "Choose Payment & Document Options",
    description: "Select secure payment and document handling preferences",
  },
  {
    icon: CheckCircle,
    title: "Conditions Met → Release",
    description: "Payment and documents released once conditions are satisfied",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How Stazama Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Simple, transparent process to inspect, verify, and protect your transactions.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div className="bg-card rounded-2xl p-6 border border-border shadow-card hover:shadow-card-hover transition-all duration-300 h-full">
                {/* Step Number */}
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-card">
                  {index + 1}
                </div>

                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-4">
                  <step.icon className="w-7 h-7 text-primary" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && index % 3 !== 2 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 border-t-2 border-dashed border-border" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
