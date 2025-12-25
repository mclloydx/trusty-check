import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

interface InspectionRequest {
  id: string;
  store_name: string;
  product_details: string;
  service_tier: string;
  service_fee: number;
  status: string;
  created_at: string;
  payment_received: boolean | null;
  payment_method: string | null;
  receipt_number: string | null;
  customer_name: string;
  whatsapp: string;
  customer_address: string | null;
  store_location: string;
  tracking_id: string | null;
  receipt_verification_code?: string | null;
  receipt_issued_at?: string | null;
}

export const generateVerificationCode = async (): Promise<string> => {
  // Generate a unique 8-character alphanumeric code
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  return code;
};

export const generateReceiptData = async (request: InspectionRequest): Promise<{
  pdf: Blob;
  verificationCode: string;
  receiptData: {
    transactionId: string;
    date: string;
    time: string;
    amount: number;
    paymentMethod: string;
    verificationCode: string;
    customerName: string;
    serviceDetails: string;
  };
}> => {
  // Generate verification code if not already present
  let verificationCode = request.receipt_verification_code;
  if (!verificationCode) {
    verificationCode = await generateVerificationCode();
  }

  const now = new Date();
  const date = format(now, 'yyyy-MM-dd');
  const time = format(now, 'HH:mm:ss');

  // Create PDF receipt
  const doc = new jsPDF();

  // Stazama branding
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('STAZAMA', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Professional Inspection Services', 105, 30, { align: 'center' });
  doc.text('Quality Assurance & Trust Verification', 105, 35, { align: 'center' });

  // Receipt header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL PAYMENT RECEIPT', 105, 50, { align: 'center' });

  // Receipt details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  let yPos = 70;

  doc.text(`Receipt Number: ${request.receipt_number}`, 20, yPos);
  yPos += 10;
  doc.text(`Transaction ID: ${request.tracking_id || request.id}`, 20, yPos);
  yPos += 10;
  doc.text(`Date: ${date}`, 20, yPos);
  yPos += 10;
  doc.text(`Time: ${time}`, 20, yPos);
  yPos += 15;

  // Verification code section
  doc.setFont('helvetica', 'bold');
  doc.text('VERIFICATION CODE', 20, yPos);
  yPos += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(verificationCode, 20, yPos);
  yPos += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('This code verifies the authenticity of your receipt', 20, yPos);
  yPos += 15;

  // Customer details
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTOMER DETAILS', 20, yPos);
  yPos += 10;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${request.customer_name}`, 20, yPos);
  yPos += 8;
  doc.text(`Phone: ${request.whatsapp}`, 20, yPos);
  yPos += 8;
  if (request.customer_address) {
    doc.text(`Address: ${request.customer_address}`, 20, yPos);
    yPos += 8;
  }
  yPos += 10;

  // Service details
  doc.setFont('helvetica', 'bold');
  doc.text('SERVICE DETAILS', 20, yPos);
  yPos += 10;
  doc.setFont('helvetica', 'normal');
  doc.text(`Store: ${request.store_name}`, 20, yPos);
  yPos += 8;
  doc.text(`Location: ${request.store_location}`, 20, yPos);
  yPos += 8;
  doc.text(`Service Tier: ${request.service_tier}`, 20, yPos);
  yPos += 8;
  doc.text(`Product: ${request.product_details}`, 20, yPos, { maxWidth: 170 });
  yPos += 15;

  // Payment details
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT DETAILS', 20, yPos);
  yPos += 10;
  doc.setFont('helvetica', 'normal');
  doc.text(`Amount: MWK ${request.service_fee.toLocaleString()}`, 20, yPos);
  yPos += 8;
  doc.text(`Payment Method: ${request.payment_method || 'N/A'}`, 20, yPos);
  yPos += 8;
  doc.text(`Status: ${request.payment_received ? 'PAID' : 'PENDING'}`, 20, yPos);
  yPos += 15;

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for choosing Stazama for your inspection needs.', 105, yPos, { align: 'center' });
  yPos += 5;
  doc.text('This receipt serves as proof of payment and service completion.', 105, yPos, { align: 'center' });
  yPos += 5;
  doc.text('For any inquiries, please contact us at support@stazama.com', 105, yPos, { align: 'center' });
  yPos += 5;
  doc.text('Receipt generated on: ' + now.toLocaleString(), 105, yPos, { align: 'center' });
  yPos += 5;
  doc.text('Verification Code: ' + verificationCode, 105, yPos, { align: 'center' });

  // Convert PDF to blob
  const pdfBlob = doc.output('blob');

  // Create receipt data object
  const receiptData = {
    transactionId: request.tracking_id || request.id,
    date,
    time,
    amount: request.service_fee,
    paymentMethod: request.payment_method || 'N/A',
    verificationCode,
    customerName: request.customer_name,
    serviceDetails: `${request.service_tier} - ${request.product_details}`,
  };

  return { pdf: pdfBlob, verificationCode, receiptData };
};

export const saveReceiptToDatabase = async (requestId: string, verificationCode: string, receiptData: any) => {
  if (!supabase) {
    console.warn('Supabase client not available, skipping database update');
    return;
  }

  try {
    const { error } = await supabase
      .from('inspection_requests')
      .update({
        receipt_verification_code: verificationCode,
        receipt_issued_at: new Date().toISOString(),
        receipt_data: receiptData,
      })
      .eq('id', requestId);

    if (error) {
      console.error('Error saving receipt to database:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in saveReceiptToDatabase:', error);
    throw error;
  }
};

export const downloadReceipt = async (request: InspectionRequest, format: 'pdf' | 'json' = 'pdf') => {
  try {
    const { pdf, verificationCode, receiptData } = await generateReceiptData(request);

    // Save receipt data to database
    if (request.id) {
      await saveReceiptToDatabase(request.id, verificationCode, receiptData);
    }

    if (format === 'pdf') {
      // Create download link for PDF
      const url = URL.createObjectURL(pdf);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stazama-receipt-${request.receipt_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'json') {
      // Create download link for JSON
      const jsonBlob = new Blob([JSON.stringify(receiptData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(jsonBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stazama-receipt-${request.receipt_number}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    return { success: true, verificationCode };
  } catch (error) {
    console.error('Error downloading receipt:', error);
    throw error;
  }
};

export const emailReceipt = async (request: InspectionRequest, email: string) => {
  try {
    const { pdf, verificationCode, receiptData } = await generateReceiptData(request);

    // In a real implementation, this would send an email with the PDF attachment
    // For now, we'll just return the data that would be sent
    console.log('Email receipt functionality would be implemented here');
    console.log('Would send to:', email);
    console.log('Receipt data:', receiptData);

    return { success: true, message: 'Email receipt functionality would be implemented here' };
  } catch (error) {
    console.error('Error emailing receipt:', error);
    throw error;
  }
};

export const requestReceiptReissue = async (requestId: string) => {
  if (!supabase) {
    console.warn('Supabase client not available');
    return { success: false, error: 'Database not available' };
  }

  try {
    // Generate a new verification code
    const newVerificationCode = await generateVerificationCode();

    // Update the database with the new verification code
    const { error } = await supabase
      .from('inspection_requests')
      .update({
        receipt_verification_code: newVerificationCode,
        receipt_issued_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) {
      console.error('Error reissuing receipt:', error);
      throw error;
    }

    return { success: true, newVerificationCode };
  } catch (error) {
    console.error('Error in requestReceiptReissue:', error);
    throw error;
  }
};