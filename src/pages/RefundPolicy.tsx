import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { RefreshCw, Clock, CheckCircle, XCircle, Calculator, MessageCircle, Shield, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const RefundPolicy = () => {
  const refundScenarios = [
    {
      scenario: "Cancellation Before Agent Assignment",
      eligible: true,
      refund: "100% refund",
      conditions: "Request must not have been accepted by an agent",
      timeline: "Within 24 hours of cancellation"
    },
    {
      scenario: "Agent Unable to Complete Inspection",
      eligible: true,
      refund: "100% refund",
      conditions: "Due to circumstances beyond customer's control",
      timeline: "Within 48 hours of notification"
    },
    {
      scenario: "Service Completed Successfully",
      eligible: false,
      refund: "No refund",
      conditions: "Inspection report delivered as promised",
      timeline: "N/A"
    },
    {
      scenario: "Unsatisfactory Service Quality",
      eligible: true,
      refund: "Partial refund or service credit",
      conditions: "Complaint filed within 24 hours, case reviewed",
      timeline: "Within 7 business days of review"
    },
    {
      scenario: "Technical Platform Issues",
      eligible: true,
      refund: "100% refund",
      conditions: "Service disruption caused by our systems",
      timeline: "Immediate upon verification"
    }
  ];

  const processingTimes = [
    { method: "Mobile Money", time: "1-2 business days" },
    { method: "Bank Transfer", time: "3-5 business days" },
    { method: "Card Payment", time: "5-7 business days" },
    { method: "Service Credit", time: "Immediate" }
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
              <Badge variant="secondary" className="mb-4">Refund Policy</Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                Fair & <span className="text-primary">Transparent</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Our refund policy is designed to protect both customers and service quality.
                We stand behind our services with clear terms and fast processing.
              </p>
              <div className="flex flex-wrap justify-center gap-6 text-center">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-sm">Fast Processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="text-sm">100% Transparency</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="text-sm">Clear Terms</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Key Principles */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-6xl mx-auto"
            >
              <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Our Refund Principles</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="text-center">
                    <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                    <CardTitle className="text-lg">Quality Guarantee</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground text-center">
                      We stand behind our service quality. If we don't deliver as promised, you get your money back.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="text-center">
                    <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
                    <CardTitle className="text-lg">Fast Resolution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground text-center">
                      Refund requests are processed quickly with clear timelines for each scenario.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="text-center">
                    <Calculator className="w-8 h-8 text-primary mx-auto mb-2" />
                    <CardTitle className="text-lg">Fair Assessment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground text-center">
                      Each refund request is carefully reviewed to ensure fairness for all parties.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Refund Scenarios */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-6xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-center">
                Refund Eligibility
              </h2>
              <p className="text-lg text-muted-foreground mb-12 text-center max-w-3xl mx-auto">
                Different situations have different refund terms. Here's a clear breakdown of when refunds apply.
              </p>

              <div className="space-y-4">
                {refundScenarios.map((scenario, index) => (
                  <motion.div
                    key={scenario.scenario}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`border-l-4 ${scenario.eligible ? 'border-l-green-500' : 'border-l-red-500'}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-2">{scenario.scenario}</CardTitle>
                            <div className="flex items-center gap-4 mb-3">
                              <Badge variant={scenario.eligible ? "default" : "destructive"}>
                                {scenario.eligible ? "Eligible" : "Not Eligible"}
                              </Badge>
                              {scenario.eligible && (
                                <Badge variant="outline" className="text-green-700">
                                  {scenario.refund}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-muted-foreground">Conditions:</span>
                            <p className="mt-1">{scenario.conditions}</p>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Processing Time:</span>
                            <p className="mt-1">{scenario.timeline}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Processing Times */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-center">
                Refund Processing Times
              </h2>
              <p className="text-lg text-muted-foreground mb-12 text-center">
                Once approved, refunds are processed quickly depending on the payment method.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {processingTimes.map((method, index) => (
                  <motion.div
                    key={method.method}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          {method.method}
                          <Badge variant="secondary">{method.time}</Badge>
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* How to Request Refund */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-center">
                How to Request a Refund
              </h2>

              <div className="grid md:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-xl font-bold mb-6">Step-by-Step Process</h3>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">1</div>
                      <div>
                        <h4 className="font-semibold">Gather Information</h4>
                        <p className="text-sm text-muted-foreground">Collect your tracking ID, order details, and reason for refund.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">2</div>
                      <div>
                        <h4 className="font-semibold">Contact Support</h4>
                        <p className="text-sm text-muted-foreground">Reach out via email, phone, or our support portal.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">3</div>
                      <div>
                        <h4 className="font-semibold">Review Process</h4>
                        <p className="text-sm text-muted-foreground">Our team reviews your request within 24-48 hours.</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">4</div>
                      <div>
                        <h4 className="font-semibold">Refund Processed</h4>
                        <p className="text-sm text-muted-foreground">Approved refunds are processed according to the timeline above.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-6">Required Information</h3>
                  <Card>
                    <CardContent className="pt-6">
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">Tracking ID from your order</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">Detailed reason for refund request</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">Any supporting evidence or photos</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">Your contact information</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Important Notes */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-center">
                Important Notes
              </h2>

              <div className="space-y-6">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Service Fees:</strong> Once an inspection has been completed and a report delivered,
                    service fees are non-refundable as they compensate our agents for their time and expertise.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <RefreshCw className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Service Credits:</strong> In some cases, we may offer service credits instead of cash refunds.
                    These credits can be used for future inspections and never expire.
                  </AlertDescription>
                </Alert>

                <Alert>
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Disputes:</strong> If you disagree with our refund decision, you may escalate to our
                    management team. Final decisions are made at our discretion.
                  </AlertDescription>
                </Alert>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-4xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Need Help with a Refund?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Our support team is here to help you understand your options and process your request.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 py-6">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Contact Support
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Check Refund Status
                </Button>
              </div>
              <div className="mt-8 text-sm text-muted-foreground">
                <p>📧 support@stazama.com | 📞 +265 800 STAZAMA</p>
                <p>Response time: Within 24 hours</p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default RefundPolicy;