import { describe, it, expect } from 'vitest';
import { uploadEditedImage } from '../imageService';

describe('uploadEditedImage', () => {
  it('throws when supabase client is null', async () => {
    await expect(
      uploadEditedImage('data:image/png;base64,abc', 'snaps', 'record-1'),
    ).rejects.toThrow('Supabase not configured');
  });
});
