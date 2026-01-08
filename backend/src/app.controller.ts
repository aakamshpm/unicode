import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      message: 'Unicode Server is running',
      version: '1.0.0',
      health: '/health',
      api: '/api',
    };
  }
}
