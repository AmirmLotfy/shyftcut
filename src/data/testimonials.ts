export interface Testimonial {
  id: string;
  quote: { en: string; ar: string };
  author: string;
  role: { en: string; ar: string };
  avatar?: string;
  rating: number;
  beforeAfter?: { before: string; after: string };
}

export const testimonials: Testimonial[] = [
  {
    id: '1',
    quote: {
      en: 'Shyftcut gave me a clear 12-week path when I felt completely lost. The AI coach answered my questions at 2 AM. Game changer.',
      ar: 'منحني Shyftcut مساراً واضحاً لـ 12 أسبوعاً عندما شعرت بالضياع التام. المدرب الذكي أجاب على أسئلتي في الثانية صباحاً. تغيير جذري.',
    },
    author: 'Sarah M.',
    role: { en: 'Product Manager → Tech Lead', ar: 'مدير منتج ← قائد تقني' },
    rating: 5,
    beforeAfter: { before: 'Product Manager', after: 'Tech Lead' },
  },
  {
    id: '2',
    quote: {
      en: 'I went from marketing to data analytics in 12 weeks. The roadmap was spot-on and the quizzes kept me accountable.',
      ar: 'انتقلت من التسويق إلى تحليلات البيانات في 12 أسبوعاً. كانت خريطة الطريق دقيقة والاختبارات حافظت على التزامي.',
    },
    author: 'James K.',
    role: { en: 'Marketing → Data Analyst', ar: 'تسويق ← محلل بيانات' },
    rating: 5,
    beforeAfter: { before: 'Marketing', after: 'Data Analyst' },
  },
  {
    id: '3',
    quote: {
      en: 'Finally, career guidance that doesn’t cost a fortune. The course recommendations from 50+ platforms saved me months of research.',
      ar: 'أخيراً، توجيه مهني لا يكلف ثروة. توصيات الدورات من أكثر من 50 منصة وفرت علي أشهراً من البحث.',
    },
    author: 'Layla H.',
    role: { en: 'Career Switcher', ar: 'مغيّر مسار مهني' },
    rating: 5,
  },
  {
    id: '4',
    quote: {
      en: 'The 90-second wizard actually works. I had a full roadmap before my coffee got cold. Unreal.',
      ar: 'معالج الـ 90 ثانية يعمل فعلاً. حصلت على خريطة طريق كاملة قبل أن يبرد قهوتي. لا يصدق.',
    },
    author: 'Omar T.',
    role: { en: 'Software Developer', ar: 'مطور برمجيات' },
    rating: 5,
  },
  {
    id: '5',
    quote: {
      en: 'Best investment I made in my career. Premium is a no-brainer for unlimited roadmaps and 24/7 AI coaching.',
      ar: 'أفضل استثمار قمت به في مسيرتي. بريميوم خيار بديهي لخرائط طريق غير محدودة وتدريب ذكاء اصطناعي على مدار الساعة.',
    },
    author: 'Elena R.',
    role: { en: 'UX Designer', ar: 'مصمم UX' },
    rating: 5,
  },
];
