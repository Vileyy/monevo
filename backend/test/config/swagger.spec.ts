import { isSwaggerEnabled } from '../../src/config/swagger';

describe('isSwaggerEnabled', () => {
  it('honours an explicit enable', () => {
    expect(
      isSwaggerEnabled({ nodeEnv: 'production', swaggerEnabled: 'true' }),
    ).toBe(true);
  });

  it('honours an explicit disable', () => {
    expect(
      isSwaggerEnabled({ nodeEnv: 'development', swaggerEnabled: 'false' }),
    ).toBe(false);
  });

  it('is disabled by default in production', () => {
    expect(
      isSwaggerEnabled({ nodeEnv: 'production', swaggerEnabled: undefined }),
    ).toBe(false);
  });

  it('stays enabled for local development and tests', () => {
    expect(
      isSwaggerEnabled({ nodeEnv: 'development', swaggerEnabled: undefined }),
    ).toBe(true);
    expect(
      isSwaggerEnabled({ nodeEnv: 'test', swaggerEnabled: undefined }),
    ).toBe(true);
  });
});
