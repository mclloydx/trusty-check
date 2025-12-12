import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Shield, Eye, Lock, Users, Database, Mail, Phone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PrivacyPolicy = () => {
  const sections = [
    { id: "collection", title: "Information We Collect", icon: Database },
    { id: "usage", title: "How We Use Your Information", icon: Eye },
    { id: "sharing", title: "Information Sharing & Disclosure", icon: Users },
    { id: "security", title: "Data Security & Protection", icon: Shield },
    { id: "rights", title: "Your Rights & Choices", icon: Lock },
    { id: "retention", title: "Data Retention", icon: Database },
    { id: "cookies", title: "Cookies & Tracking", icon: Eye },
    { id: "contact", title: "Contact Us", icon: Mail }
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
              <Badge variant="secondary" className="mb-4">Legal</Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                Privacy <span className="text-primary">Policy</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
              </p>
              <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <div>Last updated: December 12, 2025</div>
                <div>Effective: December 12, 2025</div>
                <div>Version: 1.0</div>
              </div>
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
              <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Table of Contents</h2>
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
              {/* Information We Collect */}
              <motion.div
                id="collection"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Database className="w-6 h-6 text-primary" />
                      Information We Collect
                    </CardTitle>
                    <CardDescription>
                      We collect information in various ways to provide our services effectively
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3">Information You Provide Directly</h4>
                      <ul className="space-y-2 text-muted-foreground ml-4">
                        <li>• Account registration details (name, email, phone)</li>
                        <li>• Inspection request information (product details, location)</li>
                        <li>• Payment information for service fees</li>
                        <li>• Communication preferences and feedback</li>
                        <li>• Support requests and customer service interactions</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Information Collected Automatically</h4>
                      <ul className="space-y-2 text-muted-foreground ml-4">
                        <li>• Device information (IP address, browser type, operating system)</li>
                        <li>• Usage data (pages visited, time spent, features used)</li>
                        <li>• Location data (approximate location for service matching)</li>
                        <li>• Cookies and similar tracking technologies</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Information from Third Parties</h4>
                      <ul className="space-y-2 text-muted-foreground ml-4">
                        <li>• Payment processors for transaction verification</li>
                        <li>• Background check services for agent verification</li>
                        <li>• Analytics providers for service improvement</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* How We Use Your Information */}
              <motion.div
                id="usage"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Eye className="w-6 h-6 text-primary" />
                      How We Use Your Information
                    </CardTitle>
                    <CardDescription>
                      Your data helps us provide better services and maintain platform security
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Service Delivery</h4>
                        <ul className="space-y-2 text-muted-foreground text-sm">
                          <li>• Process inspection requests</li>
                          <li>• Connect you with agents</li>
                          <li>• Facilitate secure payments</li>
                          <li>• Provide customer support</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Platform Improvement</h4>
                        <ul className="space-y-2 text-muted-foreground text-sm">
                          <li>• Analyze usage patterns</li>
                          <li>• Improve service quality</li>
                          <li>• Develop new features</li>
                          <li>• Personalize experiences</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Security & Compliance</h4>
                        <ul className="space-y-2 text-muted-foreground text-sm">
                          <li>• Prevent fraud and abuse</li>
                          <li>• Verify agent backgrounds</li>
                          <li>• Meet legal requirements</li>
                          <li>• Protect user accounts</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Communication</h4>
                        <ul className="space-y-2 text-muted-foreground text-sm">
                          <li>• Send service updates</li>
                          <li>• Provide transaction receipts</li>
                          <li>• Share important notices</li>
                          <li>• Respond to inquiries</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Information Sharing */}
              <motion.div
                id="sharing"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Users className="w-6 h-6 text-primary" />
                      Information Sharing & Disclosure
                    </CardTitle>
                    <CardDescription>
                      We only share your information when necessary and with appropriate safeguards
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">We DO NOT:</h4>
                      <ul className="text-green-700 text-sm space-y-1">
                        <li>• Sell your personal information to third parties</li>
                        <li>• Share data for marketing without consent</li>
                        <li>• Rent or lease your data to others</li>
                        <li>• Use data for unrelated business purposes</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">We MAY share information:</h4>
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <strong>With Service Providers:</strong> Payment processors, background check services, and IT infrastructure providers who help us operate the platform.
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <strong>With Agents:</strong> Limited information necessary to complete inspections (never full contact details or payment information).
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <strong>For Legal Compliance:</strong> When required by law, court order, or to protect our rights and safety.
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <strong>With Your Consent:</strong> Only when you explicitly agree to information sharing.
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Data Security */}
              <motion.div
                id="security"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Shield className="w-6 h-6 text-primary" />
                      Data Security & Protection
                    </CardTitle>
                    <CardDescription>
                      We employ industry-standard security measures to protect your data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Technical Security</h4>
                        <ul className="space-y-2 text-muted-foreground text-sm">
                          <li>• SSL/TLS encryption for all data transmission</li>
                          <li>• Secure cloud infrastructure with redundancy</li>
                          <li>• Regular security audits and penetration testing</li>
                          <li>• Multi-factor authentication for admin access</li>
                          <li>• Automated threat detection systems</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Operational Security</h4>
                        <ul className="space-y-2 text-muted-foreground text-sm">
                          <li>• Employee background checks and training</li>
                          <li>• Access controls and role-based permissions</li>
                          <li>• Regular security awareness training</li>
                          <li>• Incident response and breach notification plans</li>
                          <li>• Data minimization and retention policies</li>
                        </ul>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-800 text-sm">
                        <strong>Important:</strong> While we implement robust security measures, no system is 100% secure.
                        We encourage you to use strong passwords and enable two-factor authentication where available.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Your Rights */}
              <motion.div
                id="rights"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Lock className="w-6 h-6 text-primary" />
                      Your Rights & Choices
                    </CardTitle>
                    <CardDescription>
                      You have control over your personal information and how it's used
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3 text-green-700">Your Rights Include:</h4>
                        <ul className="space-y-3 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold">•</span>
                            <span><strong>Access:</strong> Request a copy of your personal data</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold">•</span>
                            <span><strong>Correction:</strong> Update inaccurate or incomplete data</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold">•</span>
                            <span><strong>Deletion:</strong> Request removal of your data</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold">•</span>
                            <span><strong>Portability:</strong> Receive your data in a portable format</span>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3 text-blue-700">Additional Rights:</h4>
                        <ul className="space-y-3 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold">•</span>
                            <span><strong>Opt-out:</strong> Unsubscribe from marketing communications</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold">•</span>
                            <span><strong>Restriction:</strong> Limit how we process your data</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold">•</span>
                            <span><strong>Objection:</strong> Object to certain data processing</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold">•</span>
                            <span><strong>Withdraw Consent:</strong> Revoke previously given permissions</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        To exercise any of these rights, please contact us at privacy@stazama.com with your request.
                        We'll respond within 30 days and may require verification of your identity.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Data Retention */}
              <motion.div
                id="retention"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Database className="w-6 h-6 text-primary" />
                      Data Retention
                    </CardTitle>
                    <CardDescription>
                      We retain your information only as long as necessary for our legitimate business purposes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-3 font-semibold">Data Type</th>
                              <th className="text-left p-3 font-semibold">Retention Period</th>
                              <th className="text-left p-3 font-semibold">Reason</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            <tr>
                              <td className="p-3">Account Information</td>
                              <td className="p-3">Account active + 3 years</td>
                              <td className="p-3">Service provision, legal compliance</td>
                            </tr>
                            <tr>
                              <td className="p-3">Inspection Records</td>
                              <td className="p-3">7 years</td>
                              <td className="p-3">Legal requirements, dispute resolution</td>
                            </tr>
                            <tr>
                              <td className="p-3">Payment Data</td>
                              <td className="p-3">7 years</td>
                              <td className="p-3">Financial regulations, tax compliance</td>
                            </tr>
                            <tr>
                              <td className="p-3">Communication Logs</td>
                              <td className="p-3">2 years</td>
                              <td className="p-3">Customer service, quality improvement</td>
                            </tr>
                            <tr>
                              <td className="p-3">Analytics Data</td>
                              <td className="p-3">2 years</td>
                              <td className="p-3">Service optimization, aggregated reporting</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Cookies */}
              <motion.div
                id="cookies"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Eye className="w-6 h-6 text-primary" />
                      Cookies & Tracking Technologies
                    </CardTitle>
                    <CardDescription>
                      We use cookies and similar technologies to enhance your experience
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-3">Types of Cookies We Use:</h4>
                      <div className="space-y-4">
                        <div className="p-4 border rounded-lg">
                          <h5 className="font-medium text-green-700">Essential Cookies</h5>
                          <p className="text-sm text-muted-foreground mt-1">
                            Required for basic website functionality, authentication, and security. Cannot be disabled.
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h5 className="font-medium text-blue-700">Functional Cookies</h5>
                          <p className="text-sm text-muted-foreground mt-1">
                            Remember your preferences and improve your experience on our platform.
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h5 className="font-medium text-orange-700">Analytics Cookies</h5>
                          <p className="text-sm text-muted-foreground mt-1">
                            Help us understand how visitors use our website to improve services.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 text-sm">
                        You can control cookie preferences through your browser settings. However, disabling certain cookies may affect website functionality.
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
                      Contact Us About Privacy
                    </CardTitle>
                    <CardDescription>
                      We're here to help with any privacy-related questions or concerns
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Privacy Inquiries</h4>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>privacy@stazama.com</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <span>+265 800 STAZAMA</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Data Protection Officer</h4>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p>For formal privacy requests or complaints</p>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>dpo@stazama.com</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-800 text-sm">
                        <strong>Response Time:</strong> We aim to respond to all privacy inquiries within 30 days.
                        For urgent privacy concerns, please call us directly.
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

export default PrivacyPolicy;