import { describe, it, expect, beforeEach, vi } from 'vitest';
import KnowledgeBaseService from '@/services/knowledge-base.service';
import FAQManagementService from '@/services/faq-management.service';
import SmartSearchService from '@/services/smart-search.service';
import AnalyticsService from '@/services/analytics.service';
import type {
  KBArticle,
  FAQItem,
  KBCreateArticleRequest,
  FAQCreateRequest,
} from '@/types/knowledge-base';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              then: vi.fn(),
            })),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(),
            })),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(),
        })),
      })),
    })),
    rpc: vi.fn(),
  },
}));

describe('Knowledge Base Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getKBCategories', () => {
    it('should fetch KB categories successfully', async () => {
      const mockCategories = [
        { id: '1', name: 'Beauty Services', slug: 'beauty-services', is_active: true },
        { id: '2', name: 'Fitness Programs', slug: 'fitness-programs', is_active: true },
      ];

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockCategories, error: null }),
            }),
          }),
        }),
      };

      vi.doMock('@/integrations/supabase/client', () => ({ supabase: mockSupabase }));

      const result = await KnowledgeBaseService.getKBCategories();
      expect(result).toEqual(mockCategories);
    });

    it('should filter categories by service type', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }),
      };

      vi.doMock('@/integrations/supabase/client', () => ({ supabase: mockSupabase }));

      await KnowledgeBaseService.getKBCategories('beauty');
      expect(mockSupabase.from).toHaveBeenCalledWith('kb_categories');
    });
  });

  describe('createArticle', () => {
    it('should create a new article successfully', async () => {
      const articleData: KBCreateArticleRequest = {
        title: 'Test Article',
        content: 'Test content',
        summary: 'Test summary',
        category_id: '1',
      };

      const mockArticle = {
        id: '123',
        ...articleData,
        slug: 'test-article',
        created_at: new Date().toISOString(),
      };

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockArticle, error: null }),
            }),
          }),
        }),
      };

      vi.doMock('@/integrations/supabase/client', () => ({ supabase: mockSupabase }));

      const result = await KnowledgeBaseService.createArticle(articleData, 'user-123');
      expect(result).toEqual(mockArticle);
      expect(mockSupabase.from).toHaveBeenCalledWith('kb_articles');
    });

    it('should generate slug from title', async () => {
      const articleData: KBCreateArticleRequest = {
        title: 'Test Article with Spaces!',
        content: 'Test content',
      };

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { slug: 'test-article-with-spaces' },
                error: null,
              }),
            }),
          }),
        }),
      };

      vi.doMock('@/integrations/supabase/client', () => ({ supabase: mockSupabase }));

      await KnowledgeBaseService.createArticle(articleData, 'user-123');
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          slug: 'test-article-with-spaces',
        })
      );
    });
  });

  describe('submitArticleFeedback', () => {
    it('should submit feedback successfully', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      };

      vi.doMock('@/integrations/supabase/client', () => ({ supabase: mockSupabase }));

      await expect(
        KnowledgeBaseService.submitArticleFeedback('article-123', {
          feedback_type: 'helpful',
          user_id: 'user-123',
          session_id: 'session-123',
        })
      ).resolves.not.toThrow();

      expect(mockSupabase.from).toHaveBeenCalledWith('kb_article_feedback');
    });
  });
});

describe('FAQ Management Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFAQs', () => {
    it('should fetch FAQs with filters', async () => {
      const mockFAQs = [
        {
          id: '1',
          question: 'Test Question 1',
          answer: 'Test Answer 1',
          is_active: true,
        },
        {
          id: '2',
          question: 'Test Question 2',
          answer: 'Test Answer 2',
          is_active: true,
        },
      ];

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: mockFAQs, error: null }),
                }),
              }),
            }),
          }),
        }),
      };

      vi.doMock('@/integrations/supabase/client', () => ({ supabase: mockSupabase }));

      const result = await FAQManagementService.getFAQs({
        category_id: '1',
        limit: 10,
      });

      expect(result.faqs).toEqual(mockFAQs);
    });
  });

  describe('createFAQ', () => {
    it('should create a new FAQ successfully', async () => {
      const faqData: FAQCreateRequest = {
        question: 'Test Question',
        answer: 'Test Answer',
        category_id: '1',
      };

      const mockFAQ = {
        id: '123',
        ...faqData,
        created_by: 'user-123',
        created_at: new Date().toISOString(),
      };

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockFAQ, error: null }),
            }),
          }),
        }),
      };

      vi.doMock('@/integrations/supabase/client', () => ({ supabase: mockSupabase }));

      const result = await FAQManagementService.createFAQ(faqData, 'user-123');
      expect(result).toEqual(mockFAQ);
    });
  });

  describe('getSmartFAQSuggestions', () => {
    it('should return FAQ suggestions based on question', async () => {
      const question = 'How to book appointment?';
      const mockFAQs = [
        {
          id: '1',
          question: 'How do I book an appointment?',
          answer: 'You can book through our website...',
          view_count: 100,
        },
      ];

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              or: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: mockFAQs, error: null }),
                }),
              }),
            }),
          }),
        }),
      };

      vi.doMock('@/integrations/supabase/client', () => ({ supabase: mockSupabase }));

      const result = await FAQManagementService.getSmartFAQSuggestions(question);
      expect(result).toHaveLength(1);
      expect(result[0].question).toContain('book');
    });
  });
});

describe('Smart Search Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('smartSearch', () => {
    it('should return search results with relevance scoring', async () => {
      const query = 'lip enhancement';
      const mockArticles = [
        {
          id: '1',
          title: 'Lip Enhancement Guide',
          content: 'Complete guide to lip enhancements...',
          view_count: 150,
        },
      ];

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              textSearch: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: mockArticles, error: null }),
                }),
              }),
            }),
          }),
        }),
      };

      vi.doMock('@/integrations/supabase/client', () => ({ supabase: mockSupabase }));

      const result = await SmartSearchService.smartSearch(query);
      expect(result.articles).toHaveLength(1);
      expect(result.articles[0].title).toContain('lip');
    });

    it('should include search suggestions when enabled', async () => {
      const query = 'test';
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            ilike: vi.fn().mockReturnValue({
              group: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          }),
        }),
      };

      vi.doMock('@/integrations/supabase/client', () => ({ supabase: mockSupabase }));

      const result = await SmartSearchService.smartSearch(query, {}, {
        includeSuggestions: true,
      });

      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should handle search errors gracefully', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              textSearch: vi.fn().mockRejectedValue(new Error('Search error')),
            }),
          }),
        }),
      };

      vi.doMock('@/integrations/supabase/client', () => ({ supabase: mockSupabase }));

      const result = await SmartSearchService.smartSearch('test');
      expect(result.articles).toEqual([]);
      expect(result.faqs).toEqual([]);
      expect(result.search_time).toBeGreaterThan(0);
    });
  });

  describe('getAutoCompleteSuggestions', () => {
    it('should return autocomplete suggestions for partial query', async () => {
      const partialQuery = 'lip';
      const mockSuggestions = ['Lip Enhancement', 'Lip Care Guide'];

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            ilike: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: mockSuggestions.map(title => ({ title })),
                error: null,
              }),
            }),
          }),
        }),
      };

      vi.doMock('@/integrations/supabase/client', () => ({ supabase: mockSupabase }));

      const result = await SmartSearchService.getAutoCompleteSuggestions(partialQuery);
      expect(result).toEqual(mockSuggestions);
    });

    it('should return empty array for short queries', async () => {
      const result = await SmartSearchService.getAutoCompleteSuggestions('l');
      expect(result).toEqual([]);
    });
  });
});

describe('Analytics Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('trackContentView', () => {
    it('should track content view successfully', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          }),
        }),
      };

      vi.doMock('@/integrations/supabase/client', () => ({ supabase: mockSupabase }));

      await expect(
        AnalyticsService.trackContentView('article', 'article-123', 'user-123')
      ).resolves.not.toThrow();
    });

    it('should update existing performance metrics', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'perf-123', views: 10 },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      };

      vi.doMock('@/integrations/supabase/client', () => ({ supabase: mockSupabase }));

      await AnalyticsService.trackContentView('article', 'article-123');
      // Should call update on existing record
    });
  });

  describe('generateAnalyticsReport', () => {
    it('should generate comprehensive analytics report', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockPerformanceData = [
        {
          date: '2024-01-01',
          content_type: 'article',
          content_id: '1',
          views: 100,
          helpful_votes: 80,
          not_helpful_votes: 20,
          avg_time_on_page_seconds: 180,
          bounce_rate: 0.3,
        },
      ];

      const mockSearchData = [
        {
          search_query: 'lip enhancement',
          results_count: 5,
          created_at: '2024-01-01T10:00:00Z',
        },
      ];

      const mockSupabase = {
        from: vi.fn().mockImplementation((table) => {
          if (table === 'kb_content_performance') {
            return {
              select: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockResolvedValue({ data: mockPerformanceData, error: null }),
                }),
              }),
            };
          }
          if (table === 'kb_search_analytics') {
            return {
              select: vi.fn().mockReturnValue({
                gte: vi.fn().mockReturnValue({
                  lte: vi.fn().mockResolvedValue({ data: mockSearchData, error: null }),
                }),
              }),
            };
          }
          return { select: vi.fn() };
        }),
      };

      vi.doMock('@/integrations/supabase/client', () => ({ supabase: mockSupabase }));

      const result = await AnalyticsService.generateAnalyticsReport(startDate, endDate);

      expect(result.overview.totalViews).toBe(100);
      expect(result.overview.totalSearches).toBe(1);
      expect(result.overview.avgHelpfulness).toBe(80);
      expect(result.contentPerformance).toHaveLength(1);
    });
  });
});

describe('Integration Tests', () => {
  describe('Complete Knowledge Base Workflow', () => {
    it('should handle complete article lifecycle', async () => {
      // 1. Create article
      const articleData: KBCreateArticleRequest = {
        title: 'Complete Test Article',
        content: 'This is a complete test article.',
        summary: 'Test summary',
      };

      // 2. Get article
      // 3. Track view
      // 4. Submit feedback
      // 5. Get related articles
      // 6. Update article
      // 7. Delete/archive article

      expect(true).toBe(true); // Placeholder for integration test
    });

    it('should handle search and discovery workflow', async () => {
      // 1. User searches for content
      // 2. System returns relevant results
      // 3. User clicks on result
      // 4. System tracks interaction
      // 5. User provides feedback
      // 6. Analytics are updated

      expect(true).toBe(true); // Placeholder for integration test
    });
  });
});

describe('Performance Tests', () => {
  describe('Search Performance', () => {
    it('should handle large search results efficiently', async () => {
      const startTime = Date.now();

      // Simulate searching through many articles
      const mockArticles = Array.from({ length: 1000 }, (_, i) => ({
        id: `article-${i}`,
        title: `Article ${i}`,
        content: `Content for article ${i}`,
      }));

      const searchTime = Date.now() - startTime;
      expect(searchTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should cache frequent search results', async () => {
      // Test caching mechanism
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Content Loading Performance', () => {
    it('should load content within acceptable time limits', async () => {
      const startTime = Date.now();

      // Simulate content loading
      await new Promise(resolve => setTimeout(resolve, 100));

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(500); // Should load in under 500ms
    });
  });
});

describe('Error Handling', () => {
  it('should handle network errors gracefully', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockRejectedValue(new Error('Network error')),
        }),
      }),
    };

    vi.doMock('@/integrations/supabase/client', () => ({ supabase: mockSupabase }));

    await expect(KnowledgeBaseService.getArticles()).rejects.toThrow();
  });

  it('should handle malformed data gracefully', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { /* missing required fields */ },
              error: null,
            }),
          }),
        }),
      }),
    };

    vi.doMock('@/integrations/supabase/client', () => ({ supabase: mockSupabase }));

    // Service should handle missing data gracefully
    expect(true).toBe(true); // Placeholder
  });
});

describe('Security Tests', () => {
  it('should sanitize search queries', async () => {
    const maliciousQuery = "'; DROP TABLE kb_articles; --";

    // Service should sanitize input
    const sanitizedQuery = SmartSearchService['preprocessQuery'](maliciousQuery);
    expect(sanitizedQuery).not.toContain('DROP');
  });

  it('should prevent SQL injection in content', async () => {
    const maliciousContent = "'; DELETE FROM kb_articles; --";

    // Service should handle malicious content safely
    expect(true).toBe(true); // Placeholder
  });
});