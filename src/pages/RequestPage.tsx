import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package, MapPin, Phone, User, FileText, Truck, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const RequestPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    whatsapp: profile?.phone || '',
    deliveryAddress: '',
    storeName: '',
    storeLocation: '',
    productDescription: '',
    expectedPrice: '',
    inspectionType: 'goods',
    deliveryNotes: ''
  });

  const totalSteps = 4;

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/dashboard');
    }, 2000);
  };

  const inspectionTypes = [
    {
      id: 'goods',
      title: 'Goods & Items',
      description: 'Electronics, furniture, clothing, and other consumer products',
      icon: Package,
      color: 'bg-blue-500'
    },
    {
      id: 'vehicle',
      title: 'Vehicles & Machinery',
      description: 'Cars, motorcycles, industrial equipment, and heavy machinery',
      icon: Truck,
      color: 'bg-green-500'
    },
    {
      id: 'property',
      title: 'Land & Property',
      description: 'Real estate, land parcels, and property documentation',
      icon: MapPin,
      color: 'bg-purple-500'
    },
    {
      id: 'documents',
      title: 'Documents & Papers',
      description: 'Legal documents, certificates, and ownership papers',
      icon: FileText,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Create Inspection Request</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Request a professional inspection to verify your product before purchase. 
            Our agents will help you buy with confidence.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center max-w-2xl mx-auto">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step <= currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step}
                </div>
                {step < totalSteps && (
                  <div
                    className={`w-16 h-1 mx-2 transition-colors ${
                      step < currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between max-w-2xl mx-auto mt-4">
            <span className="text-sm text-muted-foreground">Your Information</span>
            <span className="text-sm text-muted-foreground">Store Details</span>
            <span className="text-sm text-muted-foreground">Product Info</span>
            <span className="text-sm text-muted-foreground">Review</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          {/* Step 1: Customer Information */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => updateFormData('fullName', e.target.value)}
                    placeholder="John Doe"
                    className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => updateFormData('whatsapp', e.target.value)}
                    placeholder="+265 999 123 456"
                    className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Delivery Address</label>
                  <input
                    type="text"
                    value={formData.deliveryAddress}
                    onChange={(e) => updateFormData('deliveryAddress', e.target.value)}
                    placeholder="House number, street, city"
                    className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Store Information */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Store Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Store Name</label>
                  <input
                    type="text"
                    value={formData.storeName}
                    onChange={(e) => updateFormData('storeName', e.target.value)}
                    placeholder="e.g., Samsung Store, Hi-Fi Centre"
                    className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Store Location</label>
                  <input
                    type="text"
                    value={formData.storeLocation}
                    onChange={(e) => updateFormData('storeLocation', e.target.value)}
                    placeholder="City, Area, Landmark"
                    className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Product Details & Inspection Type */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Product Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Product Description</label>
                    <textarea
                      value={formData.productDescription}
                      onChange={(e) => updateFormData('productDescription', e.target.value)}
                      placeholder="Describe the product, including model, color, specifications, expected price, etc."
                      className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[120px]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Expected Price</label>
                    <input
                      type="text"
                      value={formData.expectedPrice}
                      onChange={(e) => updateFormData('expectedPrice', e.target.value)}
                      placeholder="MWK 50,000"
                      className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Inspection Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {inspectionTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <label
                          key={type.id}
                          className="flex items-center space-x-4 p-4 border-2 border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
                        >
                          <input
                            type="radio"
                            name="inspectionType"
                            value={type.id}
                            checked={formData.inspectionType === type.id}
                            onChange={(e) => updateFormData('inspectionType', e.target.value)}
                            className="w-4 h-4 text-primary"
                          />
                          <div className="flex items-center space-x-3 flex-1">
                            <div className={`w-10 h-10 rounded-lg ${type.color} flex items-center justify-center`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium">{type.title}</p>
                              <p className="text-sm text-muted-foreground">{type.description}</p>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Delivery Notes (Optional)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={formData.deliveryNotes}
                    onChange={(e) => updateFormData('deliveryNotes', e.target.value)}
                    placeholder="Any special delivery instructions..."
                    className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Review Your Request</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-2">Your Information</h3>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Name:</span> {formData.fullName}</p>
                        <p><span className="text-muted-foreground">WhatsApp:</span> {formData.whatsapp}</p>
                        <p><span className="text-muted-foreground">Address:</span> {formData.deliveryAddress}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Store Information</h3>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Store:</span> {formData.storeName}</p>
                        <p><span className="text-muted-foreground">Location:</span> {formData.storeLocation}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Product Details</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Description:</span> {formData.productDescription}</p>
                      <p><span className="text-muted-foreground">Expected Price:</span> {formData.expectedPrice}</p>
                      <p><span className="text-muted-foreground">Inspection Type:</span> {inspectionTypes.find(t => t.id === formData.inspectionType)?.title}</p>
                      {formData.deliveryNotes && (
                        <p><span className="text-muted-foreground">Delivery Notes:</span> {formData.deliveryNotes}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 text-lg"
              >
                {isSubmitting ? 'Creating Request...' : 'Create Inspection Request'}
              </Button>
            )}
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
};

export default RequestPage;
