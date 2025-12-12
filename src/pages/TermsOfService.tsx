import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { FileText, Users, CreditCard, Shield, AlertTriangle, Mail, Phone, Scale } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const TermsOfService = () => {
  const sections = [
    { id: "acceptance", title: "Acceptance of Terms", icon: FileText },
    { id: "services", title: "Service Description", icon: Users },
    { id: "eligibility", title: "Eligibility & Account", icon: Users },
    { id: "responsibilities", title: "User Responsibilities", icon: Shield },
    { id: "payments", title: "Payment Terms", icon: CreditCard },
    { id: "liability", title: "Limitation of Liability", icon: Scale },
    { id: "termination", title: "Account Termination", icon: AlertTriangle },
    { id: "contact", title: "Contact Information", icon: Mail }
  ];

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
              className="max-w-4xl mx-auto text-center"
            >
              <Badge variant="secondary" className="mb-4">Legal Agreement</Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                Terms of <span className="text-primary">Service</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                These terms govern your use of Stazama's inspection and verification services.
                Please read them carefully before using our platform.
              </p>
              <Alert className="max-w-2xl mx-auto">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  By using Stazama, you agree to be bound by these terms. If you don't agree,
                  please do not use our services.
                </AlertDescription>
              </Alert>
            </motion.div>
          </div>
        </section>

        {/* Table of Contents */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Agreement Overview</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all duration-200"
                  >
                    <section.icon className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium">{section.title}</span>
                  </a>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Content Sections */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto space-y-16">
              {/* Acceptance of Terms */}
              <motion.div
                id="acceptance"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <FileText className="w-6 h-6 text-primary" />
                      Acceptance of Terms
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      These Terms of Service ("Terms") constitute a legally binding agreement between you and Stazama
                      ("we," "us," or "our") governing your access to and use of our website, mobile application,
                      and inspection services (collectively, the "Services").
                    </p>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-800 text-sm font-medium mb-2">Key Agreement Points:</p>
                      <ul className="text-blue-700 text-sm space-y-1 ml-4">
                        <li>• By accessing our Services, you accept these Terms</li>
                        <li>• If you don't agree, please discontinue use immediately</li>
                        <li>• These Terms may be updated with notice to users</li>
                        <li>• Continued use after updates constitutes acceptance</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Service Description */}
              <motion.div
                id="services"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Users className="w-6 h-6 text-primary" />
                      Service Description
                    </CardTitle>
                    <CardDescription>
                      What we provide and how our services work
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3">Core Services</h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg">
                          <h5 className="font-medium text-primary mb-2">Inspection Only</h5>
                          <p className="text-sm text-muted-foreground">
                            Product verification and authenticity checking by certified local agents.
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h5 className="font-medium text-primary mb-2">Inspection + Payment</h5>
                          <p className="text-sm text-muted-foreground">
                            Full verification plus secure payment facilitation through our escrow system.
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h5 className="font-medium text-primary mb-2">Full Service</h5>
                          <p className="text-sm text-muted-foreground">
                            Complete end-to-end solution including verification, payment, and delivery.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Service Features</h4>
                      <ul className="space-y-2 text-muted-foreground ml-4">
                        <li>• Access to certified, background-checked local agents</li>
                        <li>• Real-time communication and progress updates</li>
                        <li>• Detailed inspection reports with photos and videos</li>
                        <li>• Secure payment processing and escrow services</li>
                        <li>• Quality assurance and satisfaction guarantees</li>
                        <li>• 24/7 customer support and dispute resolution</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Eligibility & Account */}
              <motion.div
                id="eligibility"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Users className="w-6 h-6 text-primary" />
                      Eligibility & Account Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-3">Who Can Use Our Services</h4>
                      <ul className="space-y-2 text-muted-foreground ml-4">
                        <li>• Individuals 18 years of age or older</li>
                        <li>• Legal entities and businesses</li>
                        <li>• Residents of countries where we operate</li>
                        <li>• Users with valid payment methods</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Account Registration</h4>
                      <p className="text-muted-foreground mb-3">
                        While account registration is optional for basic services, creating an account provides:
                      </p>
                      <ul className="space-y-2 text-muted-foreground ml-4">
                        <li>• Order tracking and history</li>
                        <li>• Saved payment methods</li>
                        <li>• Priority customer support</li>
                        <li>• Exclusive promotions and discounts</li>
                      </ul>
                    </div>

                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        You are responsible for maintaining the confidentiality of your account credentials
                        and for all activities that occur under your account.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </motion.div>

              {/* User Responsibilities */}
              <motion.div
                id="responsibilities"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Shield className="w-6 h-6 text-primary" />
                      User Responsibilities & Conduct
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3">Information Accuracy</h4>
                      <ul className="space-y-2 text-muted-foreground ml-4">
                        <li>• Provide accurate and complete information in all requests</li>
                        <li>• Update contact information when it changes</li>
                        <li>• Clearly describe products and requirements</li>
                        <li>• Provide correct location and seller details</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Prohibited Activities</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <ul className="space-y-2 text-muted-foreground">
                          <li>• Fraudulent or illegal transactions</li>
                          <li>• Harassment of agents or staff</li>
                          <li>• Attempting to circumvent our services</li>
                          <li>• Sharing false or misleading information</li>
                        </ul>
                        <ul className="space-y-2 text-muted-foreground">
                          <li>• Using services for prohibited items</li>
                          <li>• Violating intellectual property rights</li>
                          <li>• Interfering with service operations</li>
                          <li>• Creating multiple accounts for abuse</li>
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Agent Interaction</h4>
                      <ul className="space-y-2 text-muted-foreground ml-4">
                        <li>• Treat agents with respect and professionalism</li>
                        <li>• Cooperate fully during inspection processes</li>
                        <li>• Provide access to products as arranged</li>
                        <li>• Honor agreed-upon terms and timelines</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Payment Terms */}
              <motion.div
                id="payments"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <CreditCard className="w-6 h-6 text-primary" />
                      Payment Terms & Billing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3">Service Fees</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-3 font-semibold">Service</th>
                              <th className="text-left p-3 font-semibold">Fee</th>
                              <th className="text-left p-3 font-semibold">Payment Terms</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            <tr>
                              <td className="p-3">Inspection Only</td>
                              <td className="p-3">MWK 7,000</td>
                              <td className="p-3">Due upon request submission</td>
                            </tr>
                            <tr>
                              <td className="p-3">Inspection + Payment</td>
                              <td className="p-3">MWK 10,000</td>
                              <td className="p-3">Due upon request submission</td>
                            </tr>
                            <tr>
                              <td className="p-3">Full Service</td>
                              <td className="p-3">MWK 10,000+</td>
                              <td className="p-3">Base fee + delivery costs</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Payment Methods</h4>
                      <ul className="space-y-2 text-muted-foreground ml-4">
                        <li>• Mobile money (Airtel Money, TNM Mpamba)</li>
                        <li>• Bank transfers and cards (where available)</li>
                        <li>• Cash payments for certain services</li>
                        <li>• All payments processed securely through verified providers</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Refund Policy</h4>
                      <p className="text-muted-foreground">
                        Service fees are non-refundable once an inspection has been completed.
                        See our <a href="/refund-policy" className="text-primary hover:underline">Refund Policy</a> for detailed terms.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Limitation of Liability */}
              <motion.div
                id="liability"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Scale className="w-6 h-6 text-primary" />
                      Limitation of Liability
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Please read this section carefully as it limits our liability to you.
                      </AlertDescription>
                    </Alert>

                    <div>
                      <h4 className="font-semibold mb-3">Service Limitations</h4>
                      <ul className="space-y-2 text-muted-foreground ml-4">
                        <li>• We provide inspection and verification services only</li>
                        <li>• We are not responsible for buyer-seller transactions</li>
                        <li>• We do not guarantee product quality or merchant honesty</li>
                        <li>• Our liability is limited to the service fees you paid</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Maximum Liability</h4>
                      <p className="text-muted-foreground">
                        In no event shall Stazama be liable for any indirect, incidental, special, consequential,
                        or punitive damages arising out of or related to your use of our services, even if we
                        have been advised of the possibility of such damages.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Force Majeure</h4>
                      <p className="text-muted-foreground">
                        We shall not be liable for any failure or delay in performance due to circumstances
                        beyond our reasonable control, including but not limited to acts of God, war,
                        terrorism, or natural disasters.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Account Termination */}
              <motion.div
                id="termination"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <AlertTriangle className="w-6 h-6 text-primary" />
                      Account Termination & Service Changes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3">Termination by User</h4>
                      <p className="text-muted-foreground">
                        You may terminate your account at any time by contacting customer support.
                        Outstanding service fees remain payable.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Termination by Stazama</h4>
                      <ul className="space-y-2 text-muted-foreground ml-4">
                        <li>• For violation of these Terms</li>
                        <li>• For fraudulent or illegal activity</li>
                        <li>• For non-payment of fees</li>
                        <li>• For harassment of staff or agents</li>
                        <li>• At our sole discretion with notice</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Service Changes</h4>
                      <p className="text-muted-foreground">
                        We reserve the right to modify, suspend, or discontinue any service at any time
                        with reasonable notice to users.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Contact */}
              <motion.div
                id="contact"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Mail className="w-6 h-6 text-primary" />
                      Contact Information
                    </CardTitle>
                    <CardDescription>
                      Questions about these Terms? We're here to help.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Legal Inquiries</h4>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>legal@stazama.com</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>+265 800 STAZAMA</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">General Support</h4>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p>Address: Lilongwe, Malawi</p>
                          <p>Business Hours: Mon-Fri 8AM-6PM CAT</p>
                          <p>Response Time: Within 24 hours</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        These Terms were last updated on December 12, 2025. We may update these terms
                        periodically. Continued use of our services after changes constitutes acceptance
                        of the new terms.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;