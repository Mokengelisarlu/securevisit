import { useRef, useLayoutEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Phone, HelpCircle, Send, MapPin } from 'lucide-react';
import { toast } from 'sonner';

gsap.registerPlugin(ScrollTrigger);

interface ContactSectionProps {
  className?: string;
}

const ContactSection = ({ className = '' }: ContactSectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const leftCardRef = useRef<HTMLDivElement>(null);
  const rightCardRef = useRef<HTMLDivElement>(null);
  const formFieldsRef = useRef<(HTMLElement | null)[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  });

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Left card animation
      gsap.fromTo(
        leftCardRef.current,
        { x: -40, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: leftCardRef.current,
            start: 'top 80%',
            end: 'top 55%',
            scrub: 1,
          },
        }
      );

      // Right card animation
      gsap.fromTo(
        rightCardRef.current,
        { x: 40, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: rightCardRef.current,
            start: 'top 80%',
            end: 'top 55%',
            scrub: 1,
          },
        }
      );

      // Form fields stagger
      formFieldsRef.current.forEach((field, index) => {
        if (field) {
          gsap.fromTo(
            field,
            { y: 12, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.4,
              delay: index * 0.05,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: field,
                start: 'top 90%',
                end: 'top 70%',
                scrub: 1,
              },
            }
          );
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Message envoyé ! Nous vous répondrons bientôt.');
    setFormData({ name: '', email: '', company: '', message: '' });
  };

  const contactInfo = [
    { icon: Phone, label: '+243 846 050 997', href: 'tel:+243846050997' },
    { icon: MapPin, label: 'Lubumbashi, RD Congo', href: '#' },
    { icon: HelpCircle, label: 'Centre d\'aide', href: '#' },
  ];

  return (
    <section
      ref={sectionRef}
      id="contact"
      className={`section-flowing bg-[#E8EDF2] node-pattern ${className}`}
    >
      <div className="w-full px-6 lg:px-12 py-20 lg:py-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left Info Card */}
          <div
            ref={leftCardRef}
            className="card-white p-8 lg:p-10 flex flex-col justify-center"
          >
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#0E1116] leading-tight tracking-tight mb-4"
              style={{ fontFamily: 'Sora, sans-serif' }}
            >
              Parlons de vos besoins
            </h2>
            <p className="text-base text-[#6B7280] leading-relaxed mb-8">
              Notre équipe est là pour vous aider à sécuriser votre réception et améliorer l'expérience de vos visiteurs.
            </p>

            {/* Contact Info */}
            <div className="space-y-4 mb-8">
              {contactInfo.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className="flex items-center gap-3 text-sm text-[#6B7280] hover:text-[#1E6EE6] transition-colors"
                  ref={(el) => { formFieldsRef.current[index] = el; }}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#1E6EE6]/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-[#1E6EE6]" />
                  </div>
                  {item.label}
                </a>
              ))}
            </div>

            {/* Powered By */}
            <div className="pt-6 border-t border-[#0E1116]/8">
              <p className="text-xs text-[#6B7280] mb-2">Propulsé par</p>
              <p className="text-sm font-medium text-[#0E1116]">
                Mokengeli Sarlu
              </p>
            </div>
          </div>

          {/* Right Contact Form Card */}
          <div
            ref={rightCardRef}
            className="card-white p-8 lg:p-10"
          >
            <h3
              className="text-xl font-semibold text-[#0E1116] mb-6"
              style={{ fontFamily: 'Sora, sans-serif' }}
            >
              Envoyez-nous un message
            </h3>

            {/* Contact Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div
                ref={(el) => { formFieldsRef.current[3] = el; }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <Input
                  placeholder="Nom"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="bg-[#F4F6F8] border-0 rounded-xl px-4 py-3 text-sm"
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="bg-[#F4F6F8] border-0 rounded-xl px-4 py-3 text-sm"
                />
              </div>
              <div ref={(el) => { formFieldsRef.current[4] = el; }}>
                <Input
                  placeholder="Entreprise"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  className="bg-[#F4F6F8] border-0 rounded-xl px-4 py-3 text-sm"
                />
              </div>
              <div ref={(el) => { formFieldsRef.current[5] = el; }}>
                <Textarea
                  placeholder="Message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="bg-[#F4F6F8] border-0 rounded-xl px-4 py-3 text-sm min-h-[100px] resize-none"
                />
              </div>
              <div ref={(el) => { formFieldsRef.current[6] = el; }}>
                <Button
                  type="submit"
                  className="w-full bg-[#1E6EE6] hover:bg-[#1a5fcc] text-white py-3 rounded-full text-sm font-medium"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer le message
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
