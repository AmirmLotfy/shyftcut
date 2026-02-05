import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/LanguageContext';
import type { BlogAuthor } from '@/data/blog-posts';

interface AuthorCardProps {
  author: BlogAuthor;
  publishedAt: string;
  readingTime: { en: string; ar: string };
}

export function AuthorCard({ author, publishedAt, readingTime }: AuthorCardProps) {
  const { language } = useLanguage();
  
  const role = author.role[language];
  const time = readingTime[language];
  const date = new Date(publishedAt).toLocaleDateString(
    language === 'ar' ? 'ar-EG' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  const nameEl = (
    <p className="font-semibold">{author.name}</p>
  );
  const nameWithLink = author.url ? (
    <a
      href={author.url}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
    >
      {author.name}
    </a>
  ) : nameEl;

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-12 w-12 border-2 border-primary/20">
        <AvatarImage src={author.avatar} alt={author.name} />
        <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div>
        {nameWithLink}
        <p className="text-sm text-muted-foreground">{role}</p>
        <p className="text-xs text-muted-foreground">
          {date} · {time}
        </p>
      </div>
    </div>
  );
}
