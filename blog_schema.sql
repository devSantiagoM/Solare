-- Blog Posts Table
CREATE TABLE public.blog_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT,
    featured_image TEXT,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public read access for active posts
CREATE POLICY "Public view active blog posts" ON public.blog_posts
    FOR SELECT USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins manage blog posts" ON public.blog_posts
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE role IN ('admin', 'staff')
        )
    );
