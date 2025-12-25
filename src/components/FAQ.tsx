import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const faqs = [
  {
    question: "How quickly can I get an inspection?",
    answer: "Most inspections are completed within 2-4 hours during business hours. Rush inspections are available for urgent needs."
  },
  {
    question: "What areas do you cover?",
    answer: "We currently operate in major cities across East and Southern Africa, with plans to expand to more locations soon."
  },
  {
    question: "Is the service available 24/7?",
    answer: "Our platform is available 24/7, but agent availability depends on local time zones and business hours."
  },
  {
    question: "What if I'm not satisfied with the inspection?",
    answer: "We offer a 100% satisfaction guarantee. If you're not happy with the service, we'll refund your inspection fee."
  },
  {
    question: "How do you ensure agent quality?",
    answer: "All agents undergo background checks, training, and regular quality assessments. We maintain high standards for our network."
  }
];

export function FAQ() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
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
            Learn about our simple and transparent process to inspect, verify, and protect your transactions.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="cursor-pointer hover:shadow-md transition-all"
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-left">{faq.question}</CardTitle>
                    {expandedFaq === index ?
                      <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" /> :
                      <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    }
                  </div>
                </CardHeader>
                {expandedFaq === index && (
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}