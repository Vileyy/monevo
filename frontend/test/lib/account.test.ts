import { deleteUserAccount } from '@/lib/account';
import { apiClient } from '@/services/api/client';

jest.mock('@/services/api/client', () => ({
  apiClient: {
    delete: jest.fn(),
  },
}));

const mockedDelete = apiClient.delete as unknown as jest.Mock;

describe('deleteUserAccount', () => {
  beforeEach(() => {
    mockedDelete.mockReset();
  });

  it('calls the account deletion endpoint', async () => {
    mockedDelete.mockResolvedValue({ data: { deleted: true } });

    const result = await deleteUserAccount();

    expect(mockedDelete).toHaveBeenCalledWith('/users/me');
    expect(result).toEqual({ deleted: true });
  });

  it('propagates API errors so the UI can show them', async () => {
    mockedDelete.mockRejectedValue(new Error('network down'));

    await expect(deleteUserAccount()).rejects.toThrow('network down');
  });
});
