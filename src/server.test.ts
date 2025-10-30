import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Store original fetch
const originalFetch = global.fetch;

describe('User Validation Tests', () => {
  beforeEach(() => {
    // Mock fetch before each test
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('validateUser function', () => {
    test('should normalize curly single quotes to straight quotes', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      mockFetch.mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({ message: 'Valid name' }),
      } as Response);

      // Test with curly quote
      const testName = "Luc O'Connor"; // This has a curly quote
      
      // We need to test that the URL contains the normalized version
      // Import after mocking to avoid module execution issues
      const validateUser = (await import('./server')).validateUser;
      
      await validateUser(testName);
      
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      
      // The URL should contain the straight apostrophe, not curly
      expect(calledUrl).toContain('name=');
      // Verify it's been encoded
      expect(calledUrl).toMatch(/name=Luc%20O%27Connor/);
    });

    test('should handle names with accented characters', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      mockFetch.mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({ message: 'Valid name' }),
      } as Response);

      const validateUser = (await import('./server')).validateUser;
      
      await validateUser("María López");
      
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('should handle regular names without special characters', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      mockFetch.mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({ message: 'Valid name' }),
      } as Response);

      const validateUser = (await import('./server')).validateUser;
      
      await validateUser("Jason Smith");
      
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('should normalize multiple curly quotes in a name', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      mockFetch.mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({ message: 'Valid name' }),
      } as Response);

      const validateUser = (await import('./server')).validateUser;
      
      await validateUser("T'Challa Udaku");
      
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('name=');
    });
  });

  describe('Character normalization', () => {
    test('should convert left single quote (U+2018) to straight apostrophe', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      mockFetch.mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({ message: 'Valid name' }),
      } as Response);

      const validateUser = (await import('./server')).validateUser;
      
      const nameWithLeftQuote = "Sara O'Malley"; // U+2018
      await validateUser(nameWithLeftQuote);
      
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("O%27"); // %27 is encoded straight apostrophe
    });

    test('should convert right single quote (U+2019) to straight apostrophe', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      
      mockFetch.mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({ message: 'Valid name' }),
      } as Response);

      const validateUser = (await import('./server')).validateUser;
      
      const nameWithRightQuote = "Renee O'Connor"; // U+2019
      await validateUser(nameWithRightQuote);
      
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("O%27"); // %27 is encoded straight apostrophe
    });
  });

  describe('Error handling', () => {
    test('should handle validation service returning non-200 status', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process.exit called with code ${code}`);
      });

      mockFetch.mockResolvedValue({
        status: 400,
        ok: false,
        json: async () => ({ message: 'Invalid name format' }),
      } as Response);

      const validateUser = (await import('./server')).validateUser;
      
      await expect(validateUser("Test Name")).rejects.toThrow('Process.exit called with code 1');
      
      mockExit.mockRestore();
    });

    test('should handle network errors gracefully', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process.exit called with code ${code}`);
      });

      mockFetch.mockRejectedValue(new Error('Network error'));

      const validateUser = (await import('./server')).validateUser;
      
      await expect(validateUser("Test Name")).rejects.toThrow('Process.exit called with code 1');
      
      mockExit.mockRestore();
    });
  });
});
