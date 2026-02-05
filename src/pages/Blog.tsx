import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout } from '@/components/layout/Layout';
import { PublicPageMeta } from '@/components/seo/PublicPageMeta';
import { getSeo } from '@/data/seo-content';
import { BlogCard } from '@/components/blog/BlogCard';
import { NewsletterSignup } from '@/components/footer/NewsletterSignup';
import { IconMagnifyingGlass, IconArrowLeft, IconSparkle } from '@/lib/icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { blogPosts, categories } from '@/data/blog-posts';

export default function Blog() {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredPosts = useMemo(() => {
    return blogPosts.filter(post => {
      const matchesSearch = searchQuery === '' || 
        post.title[language].toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt[language].toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'All' || 
        post.category.en === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, language]);

  const featuredPost = blogPosts.find(post => post.featured);
  const regularPosts = filteredPosts.filter(post => !post.featured || selectedCategory !== 'All' || searchQuery !== '');

  return (
    <Layout>
      <PublicPageMeta
        title={getSeo("/blog", language).title}
        description={getSeo("/blog", language).description}
        path="/blog"
      />
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 md:py-24">
          <div className="absolute inset-0 mesh-gradient opacity-30" />
          <div className="container relative mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-3xl text-center"
            >
              <Button variant="ghost" asChild className="mb-6">
                <Link to="/" className="gap-2">
                  <IconArrowLeft className="h-4 w-4" />
                  {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
                </Link>
              </Button>
              
              <h1 className="mb-4 text-4xl font-bold md:text-5xl">
                {language === 'ar' ? 'مدونة Shyftcut' : 'Shyftcut Blog'}
              </h1>
              
              <p className="mb-8 text-lg text-muted-foreground">
                {language === 'ar'
                  ? 'رؤى وأدلة ونصائح لمساعدتك في مسيرتك المهنية.'
                  : 'Insights, guides, and tips to help you in your career journey.'}
              </p>

              {/* Search */}
              <div className="relative mx-auto max-w-md">
                <IconMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" />
                <Input
                  placeholder={language === 'ar' ? 'ابحث في المقالات...' : 'Search articles...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rtl:pl-0 rtl:pr-10"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Category Filters */}
        <section className="border-b border-border">
          <div className="container mx-auto px-4">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="h-auto flex-wrap justify-start gap-2 bg-transparent p-0 py-4">
                {categories.map((category) => (
                  <TabsTrigger
                    key={category.en}
                    value={category.en}
                    className="rounded-full border border-border bg-background px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {category[language]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </section>

        {/* Featured Post */}
        {featuredPost && selectedCategory === 'All' && searchQuery === '' && (
          <section className="py-12">
            <div className="container mx-auto px-4">
              <BlogCard post={featuredPost} featured />
            </div>
          </section>
        )}

        {/* Posts Grid - masonry-style with newsletter CTA */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {regularPosts.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {regularPosts.map((post) => (
                  <div key={post.slug} className="break-inside-avoid">
                    <BlogCard post={post} />
                  </div>
                ))}
                {/* Newsletter CTA card in grid */}
                <div className="break-inside-avoid">
                  <Card className="h-full border-primary/20 bg-primary/5 transition-all hover:border-primary/40 hover:shadow-lg">
                    <CardContent className="flex flex-col justify-center p-6 md:p-8">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                        <IconSparkle className="h-6 w-6 text-primary" />
                      </div>
                      <NewsletterSignup />
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 text-center"
              >
                <p className="text-lg text-muted-foreground">
                  {language === 'ar' ? 'لم يتم العثور على مقالات.' : 'No articles found.'}
                </p>
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                >
                  {language === 'ar' ? 'مسح الفلاتر' : 'Clear filters'}
                </Button>
              </motion.div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
