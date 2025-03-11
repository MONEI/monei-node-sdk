import {describe, expect, it} from 'vitest';
import {ApiException} from '..';
import {createErrorResponse} from './test-utils';

describe('ApiException', () => {
  it('should create an instance with all properties', () => {
    const errorResponse = createErrorResponse();

    const exception = new ApiException(errorResponse);

    expect(exception).toBeInstanceOf(Error);
    expect(exception.message).toBe(errorResponse.message);
    expect(exception.status).toBe(errorResponse.status);
    expect(exception.statusCode).toBe(errorResponse.statusCode);
    expect(exception.requestId).toBe(errorResponse.requestId);
    expect(exception.requestTime).toBeInstanceOf(Date);
    expect(exception.requestTime.toISOString()).toBe(errorResponse.requestTime);
  });

  it('should handle missing optional properties', () => {
    const partialErrorResponse = {
      message: 'Error message',
      requestId: 'req_456',
      requestTime: new Date().toISOString()
    } as any; // Type assertion to bypass TypeScript checks

    const exception = new ApiException(partialErrorResponse);

    expect(exception).toBeInstanceOf(Error);
    expect(exception.message).toBe(partialErrorResponse.message);
    expect(exception.requestId).toBe(partialErrorResponse.requestId);
    expect(exception.requestTime).toBeInstanceOf(Date);
    expect(exception.status).toBeUndefined();
    expect(exception.statusCode).toBeUndefined();
  });

  it('should handle invalid date in requestTime', () => {
    const errorWithInvalidDate = createErrorResponse({
      requestTime: 'not-a-valid-date'
    });

    const exception = new ApiException(errorWithInvalidDate);

    expect(exception).toBeInstanceOf(Error);
    expect(exception.requestTime).toBeInstanceOf(Date);
    // Invalid date will result in an invalid Date object
    expect(isNaN(exception.requestTime.getTime())).toBe(true);
  });
});
