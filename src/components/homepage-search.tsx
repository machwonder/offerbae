
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Search, Share2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  query: z.string(),
});

interface HomepageSearchProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  initialQuery?: string;
}

export default function HomepageSearch({ onSearch, isLoading, initialQuery = '' }: HomepageSearchProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: initialQuery,
    },
  });

  React.useEffect(() => {
    form.reset({ query: initialQuery });
  }, [initialQuery, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    onSearch(values.query.trim());
  }

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied!",
      description: "A shareable link has been copied to your clipboard.",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mb-8">
        <FormField
          control={form.control}
          name="query"
          render={({ field }) => (
            <FormItem>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Search for Products"
                    className="pl-12 pr-44 text-base h-14 bg-card border-purple-200 hover:border-purple-600 focus-visible:ring-purple-400 transition-colors"
                    disabled={isLoading}
                  />
                </FormControl>
                {initialQuery && (
                   <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={handleShare}
                    disabled={isLoading}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Search
                  </Button>
                )}
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" className="sr-only" disabled={isLoading}>Search</Button>
      </form>
    </Form>
  );
}
