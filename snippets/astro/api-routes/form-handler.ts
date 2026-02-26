// src/pages/api/contact.ts
import type { APIRoute } from 'astro';
import { z } from 'zod';

export const prerender = false; // Required for API routes in SSG mode

// Validation schema
const ContactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  honeypot: z.string().optional(), // Spam protection
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    
    // Extract form data
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
      honeypot: formData.get('honeypot'),
    };

    // Check honeypot for spam
    if (data.honeypot) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Spam detected' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate data
    const validatedData = ContactSchema.parse(data);

    // Process the contact form (send email, save to database, etc.)
    await processContactForm(validatedData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Thank you for your message! We\'ll get back to you soon.' 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Contact form error:', error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Validation failed',
          details: error.errors
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'An unexpected error occurred' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

async function processContactForm(data: z.infer<typeof ContactSchema>) {
  // Example: Send email using a service like SendGrid, Nodemailer, etc.
  // Example: Save to database
  // Example: Add to CRM system
  
  console.log('Processing contact form:', data);
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In a real application, you would:
  // 1. Send an email notification
  // 2. Save to database
  // 3. Send confirmation email to user
  // 4. Log the submission
}

// Optional: Handle GET requests to return form schema or status
export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      endpoint: 'Contact Form API',
      methods: ['POST'],
      schema: {
        name: 'string (required, min 2 chars)',
        email: 'string (required, valid email)',
        subject: 'string (required, min 5 chars)',
        message: 'string (required, min 10 chars)',
      }
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};