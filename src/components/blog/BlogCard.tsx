import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { IconCalendar, IconClock, IconArrowRight } from '@/lib/icons';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import type { BlogPost } from '@/data/blog-posts';

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
  const { language } = useLanguage();
  
  const title = post.title[language];
  const excerpt = post.excerpt[language];
  const category = post.category[language];
  const readingTime = post.readingTime[language];

  if (featured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        data-testid={`blog-card-${post.slug}`}
      >
        <Link to={`/blog/${post.slug}`}>
          <Card className="public-glass-card group overflow-hidden transition-all hover:shadow-xl">
            <div className="grid md:grid-cols-2">
              <div className="relative aspect-video md:aspect-auto overflow-hidden">
                <img
                  src={post.featuredImage}
                  alt={title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent md:bg-gradient-to-r" />
                <Badge className="absolute left-4 top-4 bg-primary/90 text-primary-foreground">
                  {language === 'ar' ? 'مميز' : 'Featured'}
                </Badge>
              </div>
              <CardContent className="flex flex-col justify-center p-6 md:p-8">
                <Badge variant="outline" className="mb-3 w-fit">
                  {category}
                </Badge>
                <h2 className="mb-3 text-2xl font-bold transition-colors group-hover:text-primary md:text-3xl">
                  {title}
                </h2>
                <p className="mb-4 text-muted-foreground line-clamp-2">
                  {excerpt}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <IconCalendar className="h-4 w-4" />
                    {new Date(post.publishedAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="flex items-center gap-1">
                    <IconClock className="h-4 w-4" />
                    {readingTime}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 font-medium text-primary">
                  {language === 'ar' ? 'اقرأ المزيد' : 'Read More'}
                  <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                </div>
              </CardContent>
            </div>
          </Card>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      data-testid={`blog-card-${post.slug}`}
    >
      <Link to={`/blog/${post.slug}`}>
        <Card className="public-glass-card group h-full overflow-hidden transition-all hover:shadow-lg">
          <div className="relative aspect-video overflow-hidden">
            <img
              src={post.featuredImage}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
          </div>
          <CardContent className="p-5">
            <Badge variant="outline" className="mb-3">
              {category}
            </Badge>
            <h3 className="mb-2 text-lg font-semibold transition-colors group-hover:text-primary line-clamp-2">
              {title}
            </h3>
            <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
              {excerpt}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <IconCalendar className="h-3 w-3" />
                {new Date(post.publishedAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
              <div className="flex items-center gap-1">
                <IconClock className="h-3 w-3" />
                {readingTime}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
