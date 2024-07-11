class ApiResponse {
  constructor(statusCode, info = {}, message = "Success") {
    this.statusCode = statusCode;
    this.info = info;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export { ApiResponse };
