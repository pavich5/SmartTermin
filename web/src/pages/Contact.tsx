import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from '../hooks/useTranslation';
import SnowFall from 'react-snowfall';
import { useAuth } from '../contexts/AuthContext';
import { ContactForm } from '../components/contact/ContactForm';
import { ContactInfo } from '../components/contact/ContactInfo';
import { FAQSection } from '../components/contact/FAQSection';
import { PageSection } from '../components/ui/PageSection';
import { PageContainer } from '../components/ui/PageContainer';
import { PageHeader } from '../components/ui/PageHeader';
import { apiRequest } from '../services/apiClient';

export function Contact() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prefill form from user data and URL parameters
  useEffect(() => {
    const subject = searchParams.get('subject');
    const message = searchParams.get('message');
    const urlName = searchParams.get('name');
    const urlEmail = searchParams.get('email');
    
    setFormData(prev => ({
      ...prev,
      // Prefill from user if available, otherwise from URL params, otherwise keep existing
      name: user?.fullName || urlName || prev.name || '',
      email: user?.email || urlEmail || prev.email || '',
      subject: subject ? decodeURIComponent(subject) : prev.subject,
      message: message ? decodeURIComponent(message) : prev.message,
    }));
  }, [searchParams, user]);

  const handleChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await apiRequest<{ message: string }>(
        '/contact',
        {
          method: 'POST',
          body: formData,
          auth: false, // Contact form doesn't require authentication
        }
      );

      toast.success(t('toast.messageSent'), {
        description: response.message || t('toast.messageSentDesc'),
      });

      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (error) {
      console.error('Error sending contact form:', error);
      toast.error(t('toast.failedToSendMessage'), {
        description: error instanceof Error ? error.message : t('toast.genericErrorDesc'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    {
      question: t('contact.faq.q1'),
      answer: t('contact.faq.a1'),
    },
    {
      question: t('contact.faq.q2'),
      answer: t('contact.faq.a2'),
    },
    {
      question: t('contact.faq.q3'),
      answer: t('contact.faq.a3'),
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <SnowFall 
        color="white" 
        snowflakeCount={200}
        style={{
          position: 'fixed',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <PageSection background="gradient" className="py-20">
        <PageContainer>
          <PageHeader title={t('contact.title')} subtitle={t('contact.subtitle')} />
        </PageContainer>
      </PageSection>

      <PageSection className="py-20">
        <PageContainer>
          <div className="grid lg:grid-cols-2 gap-12">
            <ContactInfo />
            <ContactForm
              formData={formData}
              isSubmitting={isSubmitting}
              onFieldChange={handleChange}
              onSubmit={handleSubmit}
            />
          </div>
        </PageContainer>
      </PageSection>

      <FAQSection faqs={faqs} />
    </div>
  );
}
