import { AppModule } from './app.module';

export function bootstrap() {
  return new AppModule();
}

export const appModule = bootstrap();
export const app = appModule.app;
