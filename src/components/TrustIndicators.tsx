import { motion } from "framer-motion";
import { Shield, Users, Clock, Globe } from "lucide-react";

const stats = [
  {
    icon: Shield,
    value: "10,000+",
    label: "Inspections Completed",
  },
  {
    icon: Users,
    value: "98%",
    label: "Customer Satisfaction",
  },
  {
    icon: Clock,
    value: "50+",
    label: "Cities Covered",
  },
  {
    icon: Globe,
    value: "24/7",
    label: "Platform Availability",
  },
];

export function TrustIndicators() {
  return (
    <section className="py-16 bg-hero-gradient">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary-foreground/10 flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-primary-foreground mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-primary-foreground/80">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
