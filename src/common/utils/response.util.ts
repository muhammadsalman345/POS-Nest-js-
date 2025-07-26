// src/common/utils/response.util.ts
export function successResponse<T>(data: T, message = 'Success') {
  return {
    status: true,
    message,
    data,
  };
}


export function errorResponse(
  message = 'Something went wrong',
  statusCode = 400,
  error: any = null,
) {
  return {
    status: false,
    message,
    statusCode,
    ...(error && { error }), // error object optional
  };
}