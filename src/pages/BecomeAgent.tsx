import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Users, DollarSign, Shield, Clock, CheckCircle, Phone, Star, TrendingUp, Award, MapPin, Calculator, Briefcase, Heart, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const benefits = [
  {
    icon: DollarSign,
    title: "Earn Extra Income",
    description: "Flexible side hustle with competitive commissions on each inspection",
    value: "MWK 50,000-150,000/month"
  },
  {
    icon: Clock,
    title: "Flexible Schedule",
    description: "Work when it suits you - accept jobs that fit your availability",
    value: "2-8 hours/week"
  },
  {
    icon: Shield,
    title: "Trusted Platform",
    description: "Join a verified network with background checks and training",
    value: "100% secure payments"
  },
  {
    icon: Users,
    title: "Help Your Community",
    description: "Connect local buyers with authentic products and protect against fraud",
    value: "Make a real impact"
  },
];

const requirements = [
  { item: "Valid ID and proof of address", required: true },
  { item: "Smartphone with camera (Android/iOS)", required: true },
  { item: "Reliable transportation", required: true },
  { item: "Good communication skills", required: true },
  { item: "Basic product knowledge", required: false },
  { item: "Commitment to honesty and integrity", required: true },
  { item: "18+ years old", required: true },
  { item: "Clean background check", required: true }
];

const agentTestimonials = [
  {
    name: "James Banda",
    location: "Lilongwe, Malawi",
    rating: 5,
    earnings: "MWK 85,000",
    inspections: 45,
    text: "Being a Stazama agent has been incredible. I work part-time and earn more than my previous full-time job. The flexibility is amazing!",
    avatar: "JB",
    joined: "8 months ago"
  },
  {
    name: "Grace Ndlovu",
    location: "Blantyre, Malawi",
    rating: 5,
    earnings: "MWK 120,000",
    inspections: 67,
    text: "I love helping people make smart purchases. The training was excellent and the support team is always there when needed.",
    avatar: "GN",
    joined: "1 year ago"
  },
  {
    name: "Peter Mwale",
    location: "Mzuzu, Malawi",
    rating: 5,
    earnings: "MWK 95,000",
    inspections: 52,
    text: "Started as a side hustle, now it's my main income. Stazama gives me the freedom to work when I want while helping my community.",
    avatar: "PM",
    joined: "6 months ago"
  }
];

const earningScenarios = [
  {
    level: "Starter Agent",
    inspections: "5-10/month",
    earnings: "MWK 25,000-50,000",
    requirements: "Complete training, first 10 inspections"
  },
  {
    level: "Regular Agent",
    inspections: "15-25/month",
    earnings: "MWK 75,000-125,000",
    requirements: "90%+ rating, consistent performance"
  },
  {
    level: "Top Agent",
    inspections: "30+/month",
    earnings: "MWK 150,000+",
    requirements: "95%+ rating, leadership potential"
  }
];

const BecomeAgent = () => {
  const [showApplication, setShowApplication] = useState(false);
  const [applicationData, setApplicationData] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    experience: '',
    motivation: ''
  });

  const handleApplicationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle application submission
    alert('Application submitted! We\'ll contact you within 24 hours.');
    setShowApplication(false);
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
              <Badge variant="secondary" className="mb-4">Join Our Network</Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                Become a <span className="text-primary">Stazama Agent</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Turn your local knowledge into income. Join our growing network of trusted agents
                and earn money while helping your community make informed purchasing decisions.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">500+</div>
                  <div className="text-sm text-muted-foreground">Active Agents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">50+</div>
                  <div className="text-sm text-muted-foreground">Cities Covered</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">98%</div>
                  <div className="text-sm text-muted-foreground">Agent Satisfaction</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">24/7</div>
                  <div className="text-sm text-muted-foreground">Support Available</div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why Become a Stazama Agent?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                More than just a job - it's an opportunity to build your income and reputation
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                          <benefit.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{benefit.title}</CardTitle>
                          <CardDescription className="mb-3">{benefit.description}</CardDescription>
                          <Badge variant="secondary" className="text-xs">
                            {benefit.value}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Earning Calculator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <Card className="max-w-4xl mx-auto shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Earning Potential Calculator
                  </CardTitle>
                  <CardDescription>
                    See how much you could earn based on different performance levels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    {earningScenarios.map((scenario, index) => (
                      <div key={scenario.level} className="text-center p-6 rounded-lg bg-muted/50">
                        <h3 className="font-bold text-lg mb-2">{scenario.level}</h3>
                        <div className="space-y-3">
                          <div>
                            <div className="text-2xl font-bold text-primary">{scenario.earnings}</div>
                            <div className="text-sm text-muted-foreground">Monthly Earnings</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold">{scenario.inspections}</div>
                            <div className="text-sm text-muted-foreground">Inspections/Month</div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-4">
                            {scenario.requirements}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Requirements & Application */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold text-foreground mb-6">Requirements</h2>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      What You Need to Get Started
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {requirements.map((req, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            req.required ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {req.required ? '●' : '○'}
                          </div>
                          <span className={req.required ? 'text-foreground' : 'text-muted-foreground'}>
                            {req.item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold text-foreground mb-6">Application Process</h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">1</div>
                    <div>
                      <h3 className="font-semibold">Submit Application</h3>
                      <p className="text-muted-foreground text-sm">Fill out our quick application form</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">2</div>
                    <div>
                      <h3 className="font-semibold">Background Check</h3>
                      <p className="text-muted-foreground text-sm">We verify your credentials and background</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">3</div>
                    <div>
                      <h3 className="font-semibold">Training & Onboarding</h3>
                      <p className="text-muted-foreground text-sm">Complete our comprehensive training program</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">4</div>
                    <div>
                      <h3 className="font-semibold">Start Earning</h3>
                      <p className="text-muted-foreground text-sm">Begin accepting inspections and earning commissions</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Agent Testimonials */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Success Stories from Our Agents
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Real agents sharing their experiences and earnings
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {agentTestimonials.map((testimonial, index) => (
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
                        <div className="flex-1">
                          <div className="font-semibold">{testimonial.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {testimonial.location}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {testimonial.joined}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                        <div>
                          <div className="font-bold text-primary">{testimonial.earnings}</div>
                          <div className="text-xs text-muted-foreground">Monthly Earnings</div>
                        </div>
                        <div>
                          <div className="font-bold text-primary">{testimonial.inspections}</div>
                          <div className="text-xs text-muted-foreground">Inspections Done</div>
                        </div>
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

        {/* Application CTA */}
        <section className="py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-4xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Start Your Journey?
              </h2>
              <p className="text-xl opacity-90 mb-8">
                Join hundreds of successful agents who are building their income and reputation with Stazama.
                Applications are reviewed within 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-lg px-8 py-6"
                  onClick={() => setShowApplication(true)}
                >
                  <Briefcase className="w-5 h-5 mr-2" />
                  Apply Now
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Schedule a Call
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Application Modal */}
        {showApplication && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">Apply to Become an Agent</h3>
                <form onSubmit={handleApplicationSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      required
                      value={applicationData.name}
                      onChange={(e) => setApplicationData({...applicationData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={applicationData.phone}
                      onChange={(e) => setApplicationData({...applicationData, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={applicationData.email}
                      onChange={(e) => setApplicationData({...applicationData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">City/Location</Label>
                    <Input
                      id="location"
                      required
                      value={applicationData.location}
                      onChange={(e) => setApplicationData({...applicationData, location: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience">Relevant Experience</Label>
                    <Textarea
                      id="experience"
                      placeholder="Tell us about any relevant experience..."
                      value={applicationData.experience}
                      onChange={(e) => setApplicationData({...applicationData, experience: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="motivation">Why do you want to become an agent?</Label>
                    <Textarea
                      id="motivation"
                      required
                      placeholder="What motivates you to join our network?"
                      value={applicationData.motivation}
                      onChange={(e) => setApplicationData({...applicationData, motivation: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="flex-1">
                      Submit Application
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowApplication(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BecomeAgent;