import { useParams, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft } from 'lucide-react';
import { IconSparkle, IconArrowRight } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { PublicPageMeta } from '@/components/seo/PublicPageMeta';
import { canonicalUrl, LOGO_PATH } from '@/lib/seo';
import { AuthorCard } from '@/components/blog/AuthorCard';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogCtaRoadmap } from '@/components/blog/BlogCtaRoadmap';
import { useLanguage } from '@/contexts/LanguageContext';
import { getPostBySlug, getRelatedPosts } from '@/data/blog-posts';
import { truncateMetaDescription } from '@/data/seo-content';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();

  const post = slug ? getPostBySlug(slug) : undefined;
  const relatedPosts = slug ? getRelatedPosts(slug, 3) : [];

  if (!post) {
    return (
      <Layout>
        <PublicPageMeta
          title="Post Not Found - Shyftcut"
          description="The requested blog post could not be found."
          path="/blog"
          noIndex
        />
        <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold">
              {language === 'ar' ? 'المقال غير موجود' : 'Post Not Found'}
            </h1>
            <Button asChild>
              <Link to="/blog">
                {language === 'ar' ? 'العودة للمدونة' : 'Back to Blog'}
              </Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const title = post.title[language];
  const content = post.content[language];
  const category = post.category[language];
  const path = `/blog/${post.slug}`;
  const publisherLogoUrl = canonicalUrl(LOGO_PATH);
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title.en,
    description: post.excerpt.en,
    image: [post.featuredImage],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: {
      "@type": "Person",
      name: post.author.name,
      ...(post.author.url && { url: post.author.url }),
    },
    publisher: {
      "@type": "Organization",
      name: "Shyftcut",
      url: canonicalUrl("/"),
      logo: {
        "@type": "ImageObject",
        url: publisherLogoUrl,
        width: 512,
        height: 512,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl(path),
    },
  };

  // Simple markdown to HTML conversion for basic formatting
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let inList = false;
    let listItems: string[] = [];

    lines.forEach((line, index) => {
      if (line.startsWith('## ')) {
        if (inList) {
          elements.push(<ul key={`list-${index}`} className="list-disc pl-6 space-y-2 rtl:pl-0 rtl:pr-6">{listItems.map((item, i) => <li key={i}>{item}</li>)}</ul>);
          listItems = [];
          inList = false;
        }
        elements.push(<h2 key={index} className="mt-8 mb-4 text-2xl font-bold">{line.slice(3)}</h2>);
      } else if (line.startsWith('### ')) {
        if (inList) {
          elements.push(<ul key={`list-${index}`} className="list-disc pl-6 space-y-2 rtl:pl-0 rtl:pr-6">{listItems.map((item, i) => <li key={i}>{item}</li>)}</ul>);
          listItems = [];
          inList = false;
        }
        elements.push(<h3 key={index} className="mt-6 mb-3 text-xl font-semibold">{line.slice(4)}</h3>);
      } else if (line.startsWith('- ')) {
        inList = true;
        listItems.push(line.slice(2));
      } else if (line.match(/^\d+\.\s/)) {
        inList = true;
        listItems.push(line.replace(/^\d+\.\s/, ''));
      } else if (line.trim() === '') {
        if (inList) {
          elements.push(<ul key={`list-${index}`} className="list-disc pl-6 space-y-2 my-4 rtl:pl-0 rtl:pr-6">{listItems.map((item, i) => <li key={i}>{item}</li>)}</ul>);
          listItems = [];
          inList = false;
        }
      } else if (line.trim()) {
        if (inList) {
          elements.push(<ul key={`list-${index}`} className="list-disc pl-6 space-y-2 my-4 rtl:pl-0 rtl:pr-6">{listItems.map((item, i) => <li key={i}>{item}</li>)}</ul>);
          listItems = [];
          inList = false;
        }
        // Handle bold text; sanitize to allow only safe tags (XSS hardening)
        const processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        const sanitized = DOMPurify.sanitize(processedLine, { ALLOWED_TAGS: ['strong', 'b'] });
        elements.push(
          <p 
            key={index} 
            className="my-4 leading-relaxed text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: sanitized }}
          />
        );
      }
    });

    if (inList && listItems.length > 0) {
      elements.push(<ul key="final-list" className="list-disc pl-6 space-y-2 my-4 rtl:pl-0 rtl:pr-6">{listItems.map((item, i) => <li key={i}>{item}</li>)}</ul>);
    }

    return elements;
  };

  return (
    <Layout>
      <PublicPageMeta
        title={language === "ar" ? `${post.title.ar} | مدونة Shyftcut` : `${post.title.en} | Shyftcut Blog`}
        description={truncateMetaDescription(language === "ar" ? post.excerpt.ar : post.excerpt.en)}
        path={path}
        image={post.featuredImage}
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(articleJsonLd)}
        </script>
      </Helmet>
      <article className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative">
          <div className="aspect-[21/9] w-full overflow-hidden">
            <img
              src={post.featuredImage}
              alt={title}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
          
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative -mt-32 mx-auto max-w-3xl"
            >
              <Button variant="ghost" asChild className="mb-4">
                <Link to="/blog" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  {language === 'ar' ? 'العودة للمدونة' : 'Back to Blog'}
                </Link>
              </Button>
              
              <Badge className="mb-4">{category}</Badge>
              
              <h1 className="mb-6 text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
                {title}
              </h1>
              
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <AuthorCard
                  author={post.author}
                  publishedAt={post.publishedAt}
                  readingTime={post.readingTime}
                />
                <ShareButtons
                  url={canonicalUrl(path)}
                  title={title}
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-auto max-w-3xl"
            >
              <div className="prose prose-lg dark:prose-invert max-w-none">
                {renderContent(content)}
              </div>

              {/* In-article CTA: roadmap generator */}
              <div className="mt-10 rounded-2xl border border-primary/25 bg-primary/5 p-6 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/20">
                      <IconSparkle className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {language === 'ar' ? 'ابنِ خريطة طريقك المجانية' : 'Build your free career roadmap'}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {language === 'ar'
                          ? 'خطة تعلم مخصصة في ٩٠ ثانية مع Shyftcut.'
                          : 'Get a personalized 12-week learning plan in 90 seconds with Shyftcut.'}
                      </p>
                    </div>
                  </div>
                  <Button asChild className="shrink-0 gap-2" size="lg">
                    <Link to="/wizard">
                      {language === 'ar' ? 'ابدأ الآن' : 'Start now'}
                      <IconArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Tags */}
              <div className="mt-12 flex flex-wrap gap-2 border-t border-border pt-8">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="border-t border-border bg-muted/30 py-16">
            <div className="container mx-auto px-4">
              <h2 className="mb-8 text-center text-2xl font-bold">
                {language === 'ar' ? 'مقالات ذات صلة' : 'Related Articles'}
              </h2>
              <div className="grid gap-6 md:grid-cols-3">
                {relatedPosts.map((relatedPost) => (
                  <BlogCard key={relatedPost.slug} post={relatedPost} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Sticky CTA: try roadmap generator (mobile + desktop) */}
        <BlogCtaRoadmap />
      </article>
    </Layout>
  );
}
