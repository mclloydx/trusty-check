import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Search, ShieldCheck, CreditCard, Truck, MessageCircle, CheckCircle, Clock, Users, Star, Phone, Mail, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const steps = [
  {
    icon: Search,
    title: "Submit Request",
    description: "Tell us what you want to buy and where the seller is located",
    details: "Provide detailed information about the product, including specifications, expected price range, and seller location. Our system matches you with the best available agent in that area."
  },
  {
    icon: MessageCircle,
    title: "Agent Assignment",
    description: "We connect you with a verified local agent near the seller",
    details: "Within minutes, you'll be connected with a background-checked, trained agent who knows the local market and speaks the local language."
  },
  {
    icon: ShieldCheck,
    title: "Inspection",
    description: "Agent inspects the product and sends you detailed photos & report",
    details: "Your agent conducts a thorough inspection, takes high-quality photos from multiple angles, tests functionality, and provides a comprehensive authenticity report."
  },
  {
    icon: CreditCard,
    title: "Payment Facilitation",
    description: "Optionally, agent handles payment to seller on your behalf",
    details: "For added security, our agent can hold payment in escrow and only release it once you're satisfied with the inspection results."
  },
  {
    icon: Truck,
    title: "Delivery",
    description: "Choose full service and we ship the item directly to you",
    details: "We handle secure packaging, insured shipping, and real-time tracking. Your item arrives safely at your doorstep."
  },
  {
    icon: CheckCircle,
    title: "Confirmation",
    description: "Receive your verified product with complete peace of mind",
    details: "Final confirmation ensures everything meets your expectations. Our satisfaction guarantee protects your purchase."
  },
];

const testimonials = [
  {
    name: "Sarah Johnson",
    location: "Lusaka, Zambia",
    rating: 5,
    text: "Stazama saved me from buying a counterfeit laptop. The agent was professional and thorough. Highly recommend!",
    avatar: "SJ"
  },
  {
    name: "Michael Chen",
    location: "Nairobi, Kenya",
    rating: 5,
    text: "The inspection process was seamless. Got detailed photos and a comprehensive report within hours. Excellent service!",
    avatar: "MC"
  },
  {
    name: "Grace Okafor",
    location: "Lagos, Nigeria",
    rating: 5,
    text: "As a first-time online buyer, I was nervous. Stazama made the whole process stress-free. Will use again!",
    avatar: "GO"
  }
];

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

const stats = [
  { number: "10,000+", label: "Inspections Completed" },
  { number: "98%", label: "Customer Satisfaction" },
  { number: "50+", label: "Cities Covered" },
  { number: "24/7", label: "Platform Availability" }
];

const HowItWorks = () => {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

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
              <Badge variant="secondary" className="mb-4">How It Works</Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                Your Purchase, <span className="text-primary">Verified</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Simple, secure, and transparent process to verify your purchases.
                Connect with trusted local agents who ensure you get exactly what you pay for.
              </p>
              <div className="flex flex-wrap justify-center gap-8 text-center">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="min-w-[120px]"
                  >
                    <div className="text-3xl font-bold text-primary mb-2">{stat.number}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Process Steps */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                The Stazama Process
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Six simple steps to peace of mind
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer"
                        onClick={() => setExpandedStep(expandedStep === index ? null : index)}>
                    <CardHeader className="text-center pb-4">
                      {/* Step Number */}
                      <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-card">
                        {index + 1}
                      </div>

                      {/* Icon */}
                      <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4 mx-auto">
                        <step.icon className="w-8 h-8 text-primary" />
                      </div>

                      {/* Content */}
                      <CardTitle className="text-xl mb-2">{step.title}</CardTitle>
                      <CardDescription className="text-base">{step.description}</CardDescription>
                    </CardHeader>

                    {expandedStep === index && (
                      <CardContent className="pt-0">
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {step.details}
                        </p>
                      </CardContent>
                    )}

                    <div className="absolute bottom-4 right-4">
                      {expandedStep === index ?
                        <ChevronUp className="w-5 h-5 text-muted-foreground" /> :
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      }
                    </div>
                  </Card>

                  {/* Connector Line */}
                  {index < steps.length - 1 && index % 3 !== 2 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 w-8 border-t-2 border-dashed border-border" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                What Our Customers Say
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Real experiences from satisfied customers across Africa
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                          {testimonial.avatar}
                        </div>
                        <div>
                          <div className="font-semibold">{testimonial.name}</div>
                          <div className="text-sm text-muted-foreground">{testimonial.location}</div>
                        </div>
                      </div>
                      <div className="flex mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground italic">"{testimonial.text}"</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
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
                Everything you need to know about our inspection service
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
                Ready to Get Started?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of satisfied customers who trust Stazama for their purchase verification needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 py-6">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Request Inspection
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                  <Phone className="w-5 h-5 mr-2" />
                  Contact Support
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HowItWorks;